#!/usr/bin/env tsx
/**
 * Populate the trader journal SQLite from real on-chain oracle markets.
 *
 * For every market Skyline Oracle currently publishes, this script synthesizes
 * a matching prediction-market price (with a realistic 3-8% bias representing
 * the gap between sharp consensus and a slower consumer market like Jupiter
 * Prediction), runs the same edge-detection + fractional-Kelly sizing the live
 * trader would run, then journals the intent via SimulatedExecutor.
 *
 * All intents recorded with mode="sim" and clearly labeled — this is not fake
 * data, it's the trader's actual math executed against a synthesized market
 * that we're transparent about. When a real Jupiter per-match market lands
 * for these fixtures, the same code path will trade it live.
 */
import { config as loadEnv } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.resolve(__dirname, "..", ".env") });

import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { readFileSync } from "node:fs";

import { evaluateMarket, type EdgeConfig } from "../packages/trader/src/edge.js";
import { RiskManager } from "../packages/trader/src/risk.js";
import { SimulatedExecutor } from "../packages/trader/src/executors/sim.js";
import { Journal } from "../packages/trader/src/journal.js";
import type { JupiterMarket } from "../packages/trader/src/jupiter/client.js";

import idl from "../packages/dashboard/src/oracle-idl/idl.json" with { type: "json" };

const PROGRAM = process.env.SKYLINE_ORACLE_PROGRAM_ID ?? "GfqqReCNqXhF23RpijJEV9TKu2tVGbK1ucmmmicTK5c6";
const RPC = process.env.ORACLE_RPC_URL ?? "https://api.devnet.solana.com";
const WALLET = process.env.ANCHOR_WALLET ?? `${process.env.HOME}/.config/solana/id.json`;
const DB = process.env.TRADER_DB_PATH ?? `${process.env.HOME}/skyline/data/trader.sqlite`;

const BANKROLL = Number(process.env.TRADER_BANKROLL_USDC ?? 100);
const KELLY = Number(process.env.TRADER_KELLY_FRACTION ?? 0.25);
const MIN_ORDER = Number(process.env.TRADER_MIN_ORDER_USD ?? 5);
const MAX_PER_MATCH_PCT = Number(process.env.TRADER_MAX_PER_MATCH_PCT ?? 30);
const EDGE_THRESHOLD = Number(process.env.TRADER_EDGE_THRESHOLD_PCT ?? 3);

class ReadOnlyWallet {
  constructor(readonly payer: Keypair) {}
  get publicKey(): PublicKey {
    return this.payer.publicKey;
  }
  signTransaction<T>(_: T): Promise<T> {
    return Promise.reject(new Error("read-only"));
  }
  signAllTransactions<T>(_: T[]): Promise<T[]> {
    return Promise.reject(new Error("read-only"));
  }
}

interface OracleMarket {
  publicKey: string;
  fixtureId: string;
  home: string;
  away: string;
  homeProb: number;
  drawProb: number;
  awayProb: number;
}

async function loadOracleMarkets(): Promise<OracleMarket[]> {
  const wallet = new ReadOnlyWallet(Keypair.generate());
  const conn = new Connection(RPC, "confirmed");
  const provider = new AnchorProvider(conn, wallet as never, { commitment: "confirmed" });
  const programId = new PublicKey(PROGRAM);
  const withAddr = { ...(idl as { address?: string }), address: programId.toBase58() };
  const program = new Program(withAddr as never, provider) as unknown as {
    account: {
      marketAccount: {
        all: () => Promise<Array<{
          publicKey: PublicKey;
          account: {
            fixtureId: { toString(): string };
            home: string;
            away: string;
            current: {
              homeProbBps: number;
              drawProbBps: number;
              awayProbBps: number;
            };
          };
        }>>;
      };
    };
  };
  const all = await program.account.marketAccount.all();
  return all.map((entry) => ({
    publicKey: entry.publicKey.toBase58(),
    fixtureId: entry.account.fixtureId.toString(),
    home: entry.account.home,
    away: entry.account.away,
    homeProb: entry.account.current.homeProbBps / 10_000,
    drawProb: entry.account.current.drawProbBps / 10_000,
    awayProb: entry.account.current.awayProbBps / 10_000,
  }));
}

/**
 * Synthesize a JupiterMarket for each of the three outcomes of an oracle
 * market. Bias each price by ±3-8% from fair to guarantee we exercise the
 * edge-detection path. Micro-USD price scale (1e6 = $1.00).
 */
function synthesizeMarkets(m: OracleMarket): Array<{ jm: JupiterMarket; outcome: string; fairYes: number }> {
  const outcomes = [
    { side: "home", team: m.home, fair: m.homeProb },
    { side: "draw", team: "Draw", fair: m.drawProb },
    { side: "away", team: m.away, fair: m.awayProb },
  ];
  const now = Math.floor(Date.now() / 1000);
  return outcomes.map((o, i) => {
    // Bias: market is slower to reach sharp price, so it lags. Sign alternates.
    const bias = (i === 0 ? -0.055 : i === 1 ? 0.045 : -0.038);
    const buyYesPct = Math.max(0.02, Math.min(0.98, o.fair + bias));
    const buyNoPct = 1 - buyYesPct - 0.02; // 2% market spread
    return {
      outcome: o.side,
      fairYes: o.fair,
      jm: {
        provider: "polymarket-sim",
        marketId: `SIM-${m.fixtureId}-${o.side.toUpperCase()}`,
        status: "open",
        title: `${o.team} — ${m.home} vs ${m.away}`,
        openTime: now,
        closeTime: now + 3600 * 24,
        pricing: {
          buyYesPriceUsd: Math.round(buyYesPct * 1_000_000),
          sellYesPriceUsd: Math.round((buyYesPct - 0.01) * 1_000_000),
          buyNoPriceUsd: Math.round(Math.max(0.01, buyNoPct) * 1_000_000),
          sellNoPriceUsd: Math.round(Math.max(0.005, buyNoPct - 0.01) * 1_000_000),
          volume: Math.round(50_000 + Math.random() * 200_000),
        },
        outcomes: ["Yes", "No"],
      },
    };
  });
}

async function main(): Promise<void> {
  console.log(`→ Reading oracle @ ${PROGRAM} on ${RPC}`);
  const markets = await loadOracleMarkets();
  console.log(`✓ ${markets.length} market(s) on-chain`);

  if (markets.length === 0) {
    console.error("No oracle markets — run scripts/populate-oracle.ts first.");
    process.exit(1);
  }

  console.log(`→ Journal path: ${DB}`);
  const journal = new Journal(DB);

  const risk = new RiskManager({
    bankrollUsd: BANKROLL,
    maxPerMatchPct: MAX_PER_MATCH_PCT,
    drawdownHaltPct: 10,
    minOrderUsd: MIN_ORDER,
  });

  const executor = new SimulatedExecutor();
  const edgeCfg: EdgeConfig = {
    bankrollUsd: BANKROLL,
    kellyFraction: KELLY,
    maxFractionOfBankroll: MAX_PER_MATCH_PCT / 100,
    edgeThresholdPct: EDGE_THRESHOLD,
    minOrderUsd: MIN_ORDER,
  };

  let placed = 0;
  for (const m of markets) {
    console.log(`\n→ ${m.home} vs ${m.away} · fixture #${m.fixtureId}`);
    console.log(`  fair home ${(m.homeProb * 100).toFixed(1)}%  draw ${(m.drawProb * 100).toFixed(1)}%  away ${(m.awayProb * 100).toFixed(1)}%`);
    const synth = synthesizeMarkets(m);
    for (const s of synth) {
      const ev = evaluateMarket(s.jm, s.fairYes, edgeCfg);
      if (!ev.intent) {
        console.log(`  [${s.outcome.padEnd(5)}] skip — ${ev.skipReason}`);
        continue;
      }
      const gate = risk.canTake(s.jm.marketId, ev.intent.stakeUsd);
      if (!gate.ok) {
        console.log(`  [${s.outcome.padEnd(5)}] risk-blocked — ${gate.reason}`);
        continue;
      }
      const receipt = await executor.execute(ev.intent, s.jm);
      journal.record(receipt);
      risk.recordPlaced(s.jm.marketId, ev.intent.stakeUsd);
      placed++;
      console.log(
        `  [${s.outcome.padEnd(5)}] intent · ${ev.intent.isYes ? "YES" : "NO"} @ ${(ev.intent.expectedPrice * 100).toFixed(1)}¢ · $${ev.intent.stakeUsd.toFixed(2)} · edge +${ev.intent.edgePct.toFixed(2)}%`,
      );
    }
  }

  const view = risk.view();
  console.log(`\n✓ done — ${placed} intent(s) written to journal`);
  console.log(`  bankroll left: $${view.bankrollRemaining.toFixed(2)} · staked: $${view.totalStaked.toFixed(2)}`);
  console.log("  recent journal:");
  for (const row of journal.recent(5) as Array<{ market_title: string; expected_price: number; stake_usd: number; edge_pct: number }>) {
    console.log(`    · ${row.market_title.slice(0, 60)} @ ${(row.expected_price * 100).toFixed(1)}¢ · $${row.stake_usd.toFixed(2)} · +${row.edge_pct.toFixed(2)}%`);
  }
  journal.close();

  const walletJson = readFileSync(WALLET, "utf8").length; // touch to prove wallet is readable
  void walletJson;
}

main().catch((err) => {
  console.error("✗ populate-journal failed:", err);
  process.exit(1);
});
