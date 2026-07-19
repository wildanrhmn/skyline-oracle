import { Connection } from "@solana/web3.js";
import { env } from "./env.js";
import { logger } from "./logger.js";
import { jupiterClient } from "./jupiter/client.js";
import { SimulatedExecutor } from "./executors/sim.js";
import { JupiterExecutor } from "./executors/jupiter.js";
import { RiskManager } from "./risk.js";
import { Journal } from "./journal.js";
import { evaluateMarket, type EdgeConfig } from "./edge.js";
import type { TraderExecutor } from "./executor.js";
import { OracleReader, marketIdFromFixture } from "./oracle-reader.js";
import oracleIdl from "@skyline/shared/oracle-idl" with { type: "json" };

/**
 * Skyline autonomous trader — Layer 3.
 * Loop: fetch Jupiter sports events → for each market, look up matching fair value
 * on the Skyline Oracle → evaluate edge → size via Kelly → route through
 * RiskManager → execute via the selected executor (sim | real).
 */
async function main(): Promise<void> {
  logger.info(
    {
      mode: env.TRADER_MODE,
      bankroll: env.TRADER_BANKROLL_USDC,
      edgeThresholdPct: env.TRADER_EDGE_THRESHOLD_PCT,
      pollMs: env.TRADER_POLL_INTERVAL_MS,
      oracleProgram: env.SKYLINE_ORACLE_PROGRAM_ID,
      oracleRpc: env.ORACLE_RPC_URL,
    },
    "trader boot",
  );

  const jupiter = jupiterClient({
    baseUrl: env.JUPITER_API_BASE_URL,
    apiKey: env.JUPITER_API_KEY,
  });

  const oracle = new OracleReader({
    rpcUrl: env.ORACLE_RPC_URL,
    programId: env.SKYLINE_ORACLE_PROGRAM_ID,
    idl: oracleIdl,
    walletKeypairPath: env.ANCHOR_WALLET,
  });

  const risk = new RiskManager({
    bankrollUsd: env.TRADER_BANKROLL_USDC,
    maxPerMatchPct: env.TRADER_MAX_PER_MATCH_PCT,
    drawdownHaltPct: env.TRADER_DRAWDOWN_HALT_PCT,
    minOrderUsd: env.TRADER_MIN_ORDER_USD,
  });

  const journal = new Journal(`${process.env.HOME}/skyline/data/trader.sqlite`);

  const executor: TraderExecutor =
    env.TRADER_MODE === "real"
      ? new JupiterExecutor({
          jupiter,
          connection: new Connection(env.SOLANA_RPC_URL, "confirmed"),
          walletKeypairPath: env.ANCHOR_WALLET,
        })
      : new SimulatedExecutor();
  logger.info({ mode: executor.mode }, "executor ready");

  const edgeCfg: EdgeConfig = {
    bankrollUsd: env.TRADER_BANKROLL_USDC,
    kellyFraction: env.TRADER_KELLY_FRACTION,
    maxFractionOfBankroll: env.TRADER_MAX_PER_MATCH_PCT / 100,
    edgeThresholdPct: env.TRADER_EDGE_THRESHOLD_PCT,
    minOrderUsd: env.TRADER_MIN_ORDER_USD,
  };

  let running = true;
  process.on("SIGINT", () => {
    logger.info("SIGINT — shutting down");
    running = false;
    journal.close();
    process.exit(0);
  });

  while (running) {
    try {
      await tick(jupiter, oracle, executor, risk, edgeCfg, journal);
    } catch (err) {
      logger.error({ err }, "tick failed");
    }
    await sleep(env.TRADER_POLL_INTERVAL_MS);
  }
}

async function tick(
  jupiter: ReturnType<typeof jupiterClient>,
  oracle: OracleReader,
  executor: TraderExecutor,
  risk: RiskManager,
  edgeCfg: EdgeConfig,
  journal: Journal,
): Promise<void> {
  const events = await jupiter.listSportsEvents(50);
  const soccerEvents = events.filter((e) =>
    e.tags.some((t) => ["soccer", "fifa-world-cup", "2026-fifa-world-cup"].includes(t)),
  );
  logger.info(
    { total: events.length, soccer: soccerEvents.length },
    "sports events fetched",
  );

  for (const event of soccerEvents) {
    for (const market of event.markets) {
      if (market.status !== "open") continue;

      const fixtureId = tryDeriveFixtureId(event, market);
      if (!fixtureId) continue;
      const marketIdBytes = marketIdFromFixture(fixtureId, "match_result");
      const fv = await oracle.fetch(marketIdBytes);
      if (!fv) {
        continue;
      }

      const fairYes = fv.homeProbBps / 10_000;
      const eval_ = evaluateMarket(market, fairYes, edgeCfg);
      if (!eval_.intent) {
        logger.debug(
          { marketId: market.marketId, reason: eval_.skipReason },
          "skip",
        );
        continue;
      }

      const gate = risk.canTake(market.marketId, eval_.intent.stakeUsd);
      if (!gate.ok) {
        logger.info({ marketId: market.marketId, reason: gate.reason }, "risk gate blocked");
        continue;
      }

      logger.info(
        {
          market: market.title,
          edgePct: eval_.intent.edgePct.toFixed(2),
          stake: eval_.intent.stakeUsd,
          side: eval_.intent.isYes ? "YES" : "NO",
        },
        "executing intent",
      );
      const receipt = await executor.execute(eval_.intent, market);
      journal.record(receipt);
      if (receipt.status === "placed" || receipt.status === "simulated") {
        risk.recordPlaced(market.marketId, eval_.intent.stakeUsd);
      }
    }
  }

  const view = risk.view();
  logger.info(
    {
      staked: view.totalStaked.toFixed(2),
      pnl: view.totalPnlRealized.toFixed(2),
      halted: view.halted,
    },
    "tick complete",
  );
}

/**
 * Very rough mapping: extract a numeric fixture id from event/market metadata.
 * TODO: replace with an authoritative Jupiter-market ↔ TxLINE-fixture map when
 * the mapping approach is finalized (per-match markets vs tournament markets).
 */
function tryDeriveFixtureId(
  event: { metadata: { slug?: string }; tags: string[] },
  market: { title?: string; marketId?: string },
): bigint | null {
  const slug = event.metadata.slug ?? "";
  const m = slug.match(/(\d{6,})/);
  if (m) return BigInt(m[1]!);
  const midMatch = (market.marketId ?? "").match(/(\d{6,})/);
  if (midMatch) return BigInt(midMatch[1]!);
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

main().catch((err) => {
  logger.error({ err }, "trader crashed");
  process.exit(1);
});
