#!/usr/bin/env tsx
/**
 * Force-populate the Skyline Oracle by pulling live TxLINE 1x2 snapshots and
 * publishing sharp-consensus fair-values for every upcoming World Cup /
 * International Friendlies fixture.
 *
 * TxLINE's free-tier feed exposes the aggregated `TXLineStablePriceDemargined`
 * quote per fixture (BookmakerId 10021) — vig already removed and cross-book
 * consensus already synthesised upstream. We use it directly as the fair-value
 * signal; our Shin/weighting math kicks in only when we get raw per-book quotes
 * from paid tiers.
 */
import { config as loadEnv } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.resolve(__dirname, "..", ".env") });

import {
  fetchGuestJwt,
  txlineClient,
  WORLD_CUP_COMPETITION_ID,
  INT_FRIENDLIES_COMPETITION_ID,
} from "../packages/engine/src/txline/index.js";
import type { Fixture } from "../packages/engine/src/txline/rest.js";
import {
  OraclePublisher,
  marketIdFromFixture,
} from "../packages/engine/src/oracle/publisher.js";

const TXLINE_BASE = process.env.TXLINE_BASE_URL ?? "https://txline-dev.txodds.com";
const RPC_URL = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const WALLET = process.env.ANCHOR_WALLET ?? `${process.env.HOME}/.config/solana/id.json`;
const PROGRAM = process.env.SKYLINE_ORACLE_PROGRAM_ID ?? "GfqqReCNqXhF23RpijJEV9TKu2tVGbK1ucmmmicTK5c6";

const TXLINE_STABLEPRICE_BOOK_ID = 10021;

if (!process.env.TXLINE_API_TOKEN) {
  console.error("TXLINE_API_TOKEN missing");
  process.exit(1);
}

interface RawOddsPayload {
  FixtureId: number;
  Ts: number;
  BookmakerId: number;
  Bookmaker: string;
  SuperOddsType: string;
  Pct: (string | number)[];
  PriceNames?: string[];
}

async function main(): Promise<void> {
  console.log(`→ TxLINE base   : ${TXLINE_BASE}`);
  console.log(`→ Oracle RPC    : ${RPC_URL}`);
  console.log(`→ Oracle program: ${PROGRAM}`);

  const jwt = process.env.TXLINE_JWT ?? (await fetchGuestJwt({ baseUrl: TXLINE_BASE }));
  const tx = txlineClient({ baseUrl: TXLINE_BASE, jwt, apiToken: process.env.TXLINE_API_TOKEN! });

  const publisher = new OraclePublisher({
    rpcUrl: RPC_URL,
    walletKeypairPath: WALLET,
    programId: PROGRAM,
  });
  const pubPda = await publisher.ensurePublisher("skyline-engine");
  console.log(`✓ publisher PDA : ${pubPda.toBase58()}`);

  const fixtures: Fixture[] = [];
  for (const cid of [WORLD_CUP_COMPETITION_ID, INT_FRIENDLIES_COMPETITION_ID]) {
    try {
      const f = await tx.fixturesSnapshot({ competitionId: cid });
      fixtures.push(...f);
    } catch (err) {
      console.warn(`  fixture fetch failed for competition ${cid}:`, (err as Error).message);
    }
  }
  console.log(`✓ fixtures      : ${fixtures.length} total`);

  const now = Date.now();
  const upcoming = fixtures
    .filter((f) => f.StartTime > now - 3 * 3600_000)
    .sort((a, b) => a.StartTime - b.StartTime)
    .slice(0, 6);
  console.log(`✓ target set    : ${upcoming.length} fixtures`);

  let published = 0;
  for (const f of upcoming) {
    console.log(`\n→ fixture #${f.FixtureId}: ${f.Participant1} vs ${f.Participant2}`);
    let odds: RawOddsPayload[];
    try {
      odds = (await tx.oddsSnapshot(f.FixtureId)) as unknown as RawOddsPayload[];
    } catch (err) {
      console.warn(`  odds snapshot failed: ${(err as Error).message}`);
      continue;
    }

    const match = odds.find(
      (o) =>
        o.SuperOddsType === "1X2_PARTICIPANT_RESULT" &&
        o.BookmakerId === TXLINE_STABLEPRICE_BOOK_ID &&
        Array.isArray(o.Pct) &&
        o.Pct.length === 3,
    );
    if (!match) {
      console.log("  no TxLINE StablePrice 1X2 quote for this fixture");
      continue;
    }

    const probs = match.Pct.map((v) => (typeof v === "number" ? v : parseFloat(v))).map(
      (n) => n / 100,
    );
    if (probs.some((p) => !isFinite(p) || p <= 0)) {
      console.log("  invalid Pct values, skipping");
      continue;
    }

    // The demargined feed sums exactly to 100% but round-trip through the
    // bps encoder anyway so we hit the on-chain tolerance check.
    const bpsHome = Math.round(probs[0]! * 10_000);
    const bpsDraw = Math.round(probs[1]! * 10_000);
    let bpsAway = Math.round(probs[2]! * 10_000);
    const drift = 10_000 - (bpsHome + bpsDraw + bpsAway);
    bpsAway += drift;

    const marketIdBytes = marketIdFromFixture(f.FixtureId, "match_result");
    const home = (f.Participant1IsHome ? f.Participant1 : f.Participant2).slice(0, 60);
    const away = (f.Participant1IsHome ? f.Participant2 : f.Participant1).slice(0, 60);
    const kickoffSec = Math.floor(f.StartTime / 1000);
    const safeKickoff = kickoffSec > Math.floor(Date.now() / 1000)
      ? kickoffSec
      : Math.floor(Date.now() / 1000) + 3600;

    try {
      await publisher.ensureMarket({
        marketIdBytes32: marketIdBytes,
        fixtureId: BigInt(f.FixtureId),
        home,
        away,
        kickoffTs: BigInt(safeKickoff),
      });
      console.log(`  ✓ market on-chain (init or already there)`);
    } catch (err) {
      const msg = (err as Error).message;
      if (!msg.includes("already in use")) {
        console.warn(`  init failed: ${msg.slice(0, 200)}`);
        continue;
      }
    }

    const proofRef = sha256_32(
      `${f.FixtureId}::${match.Ts}::${bpsHome},${bpsDraw},${bpsAway}`,
    );
    try {
      const sig = await publisher.publishUpdate({
        marketIdBytes32: marketIdBytes,
        probabilitiesBps: [bpsHome, bpsDraw, bpsAway],
        confHalfWidthsBps: [30, 30, 30], // demargined consensus is tight — ±0.3% placeholder
        txlineProofRefBytes32: proofRef,
      });
      console.log(
        `  ✓ published  ${(bpsHome / 100).toFixed(2)}% / ${(bpsDraw / 100).toFixed(2)}% / ${(bpsAway / 100).toFixed(2)}%  tx=${sig.slice(0, 12)}…`,
      );
      published++;
    } catch (err) {
      console.warn(`  publish failed: ${(err as Error).message.slice(0, 200)}`);
    }
  }

  console.log(`\n✓ done — ${published} publish(es) landed on-chain`);
}

function sha256_32(src: string): Uint8Array {
  return new Uint8Array(createHash("sha256").update(src).digest());
}

main().catch((err) => {
  console.error("✗ populate-oracle failed:", err);
  process.exit(1);
});
