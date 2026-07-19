// Skyline Fair-Value Engine — Layer 2 entrypoint.
// TxLINE SSE odds stream → per-market aggregator → Shin-consensus fair value →
// Skyline Oracle publish on meaningful updates.

import { env } from "./env.js";
import { logger } from "./logger.js";
import { createHash } from "node:crypto";
import {
  WORLD_CUP_COMPETITION_ID,
  fetchGuestJwt,
  txlineClient,
  TxLineStream,
} from "./txline/index.js";
import type { OddsPayload } from "./txline/rest.js";
import { MarketAggregator, fairValueToBps } from "./fairvalue.js";
import { OraclePublisher, marketIdFromFixture } from "./oracle/publisher.js";
import type { OutcomeSide } from "@skyline/shared";

const MIN_BOOKS_FOR_PUBLISH = 3;
const PUBLISH_MIN_INTERVAL_MS = 20_000;
const STALE_QUOTE_MS = 5 * 60_000;

interface MarketState {
  aggregator: MarketAggregator;
  marketIdBytes: Uint8Array;
  fixtureId: number;
  home: string;
  away: string;
  kickoffTs: number;
  initialized: boolean;
  lastPublishAt: number;
  lastPublishedProbs?: [number, number, number];
}

async function main(): Promise<void> {
  logger.info(
    {
      txlineBase: env.TXLINE_BASE_URL,
      hasApiToken: Boolean(env.TXLINE_API_TOKEN),
      oracleProgram: env.SKYLINE_ORACLE_PROGRAM_ID,
      oracleRpc: env.SOLANA_RPC_URL,
    },
    "engine boot",
  );

  if (!env.TXLINE_API_TOKEN) {
    logger.error("TXLINE_API_TOKEN missing — run scripts/activate-txline.ts");
    process.exit(1);
  }
  if (!env.SKYLINE_ORACLE_PROGRAM_ID) {
    logger.error("SKYLINE_ORACLE_PROGRAM_ID missing — deploy the program first");
    process.exit(1);
  }

  const jwt = env.TXLINE_JWT ?? (await fetchGuestJwt({ baseUrl: env.TXLINE_BASE_URL }));
  logger.info("guest JWT ready");

  const client = txlineClient({
    baseUrl: env.TXLINE_BASE_URL,
    jwt,
    apiToken: env.TXLINE_API_TOKEN,
  });

  const publisher = new OraclePublisher({
    rpcUrl: env.SOLANA_RPC_URL,
    walletKeypairPath: env.ANCHOR_WALLET,
    programId: env.SKYLINE_ORACLE_PROGRAM_ID,
  });
  const pubPda = await publisher.ensurePublisher("skyline-engine");
  logger.info({ publisherPda: pubPda.toBase58() }, "publisher registered");

  logger.info("fetching World Cup fixtures…");
  const fixtures = await client.fixturesSnapshot({
    competitionId: WORLD_CUP_COMPETITION_ID,
  });
  logger.info({ count: fixtures.length }, "fixtures loaded");

  const now = Date.now();
  const upcoming = fixtures
    .filter((f) => f.StartTime > now)
    .sort((a, b) => a.StartTime - b.StartTime);
  logger.info({ count: upcoming.length }, "upcoming fixtures");

  const state = new Map<number, MarketState>();
  for (const f of upcoming) {
    const marketIdBytes = marketIdFromFixture(f.FixtureId, "match_result");
    state.set(f.FixtureId, {
      aggregator: new MarketAggregator(String(f.FixtureId), bytesToHex(marketIdBytes)),
      marketIdBytes,
      fixtureId: f.FixtureId,
      home: (f.Participant1IsHome ? f.Participant1 : f.Participant2).slice(0, 60),
      away: (f.Participant1IsHome ? f.Participant2 : f.Participant1).slice(0, 60),
      kickoffTs: Math.floor(f.StartTime / 1000),
      initialized: false,
      lastPublishAt: 0,
    });
  }
  logger.info({ tracked: state.size }, "market states allocated");

  const stream = new TxLineStream({
    baseUrl: env.TXLINE_BASE_URL,
    jwt,
    apiToken: env.TXLINE_API_TOKEN,
    path: "/api/odds/stream",
    onReauth: () => fetchGuestJwt({ baseUrl: env.TXLINE_BASE_URL }),
  });

  stream.on("data", async (evt: { data: OddsPayload | OddsPayload[] }) => {
    const payloads = Array.isArray(evt.data) ? evt.data : [evt.data];
    for (const payload of payloads) {
      await ingest(payload, state, publisher);
    }
  });

  stream.on("heartbeat", () => logger.debug("SSE heartbeat"));

  process.on("SIGINT", () => {
    logger.info("SIGINT — closing stream");
    stream.close();
    process.exit(0);
  });

  logger.info("SSE stream starting — ingesting odds…");
  await stream.start();
}

async function ingest(
  payload: OddsPayload,
  state: Map<number, MarketState>,
  publisher: OraclePublisher,
): Promise<void> {
  const ms = state.get(payload.FixtureId);
  if (!ms) return;

  // TxLINE StablePrice Pct — three per-outcome values (home / draw / away).
  // If any is "NA" the market is not a 1x2; skip.
  const pct = payload.Pct;
  if (!Array.isArray(pct) || pct.length < 3) return;
  if (pct.some((v) => v === "NA" || typeof v !== "number")) return;

  const probs: Record<OutcomeSide, number> = {
    home: pct[0] as number,
    draw: pct[1] as number,
    away: pct[2] as number,
  };
  const total = probs.home + probs.draw + probs.away;
  if (total <= 0 || total > 1.5) return;

  ms.aggregator.upsertProbability({
    bookmakerId: payload.BookmakerId ?? "unknown",
    probabilities: probs,
    updatedAt: payload.Ts,
  });
  ms.aggregator.prune(STALE_QUOTE_MS);

  const fv = ms.aggregator.computeFairValue(MIN_BOOKS_FOR_PUBLISH);
  if (!fv) return;

  const now = Date.now();
  const bps = fairValueToBps(fv);
  if (
    ms.lastPublishedProbs &&
    now - ms.lastPublishAt < PUBLISH_MIN_INTERVAL_MS &&
    Math.abs(bps.probabilities[0] - ms.lastPublishedProbs[0]) < 50
  ) {
    return;
  }

  try {
    if (!ms.initialized) {
      await publisher.ensureMarket({
        marketIdBytes32: ms.marketIdBytes,
        fixtureId: BigInt(ms.fixtureId),
        home: ms.home,
        away: ms.away,
        kickoffTs: BigInt(ms.kickoffTs),
      });
      ms.initialized = true;
      logger.info(
        { fixture: ms.fixtureId, home: ms.home, away: ms.away },
        "market initialized on-chain",
      );
    }

    const proofRef = sha256_32(
      `${ms.fixtureId}::${fv.computedAt}::${bps.probabilities.join(",")}`,
    );
    const sig = await publisher.publishUpdate({
      marketIdBytes32: ms.marketIdBytes,
      probabilitiesBps: bps.probabilities,
      confHalfWidthsBps: bps.confHalfWidths,
      txlineProofRefBytes32: proofRef,
    });
    ms.lastPublishAt = now;
    ms.lastPublishedProbs = bps.probabilities;
    logger.info(
      {
        fixture: ms.fixtureId,
        probs_bps: bps.probabilities,
        books: fv.contributingBooks.length,
        sig,
      },
      "oracle updated",
    );
  } catch (err) {
    logger.warn({ err, fixture: ms.fixtureId }, "publish failed");
  }
}

function sha256_32(src: string): Uint8Array {
  return new Uint8Array(createHash("sha256").update(src).digest());
}

function bytesToHex(b: Uint8Array): string {
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
}

main().catch((err) => {
  logger.error({ err }, "engine crashed");
  process.exit(1);
});
