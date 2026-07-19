import { readOracleState } from "./oracle-server";

const PROGRAM_ID =
  process.env.NEXT_PUBLIC_ORACLE_PROGRAM_ID ??
  "GfqqReCNqXhF23RpijJEV9TKu2tVGbK1ucmmmicTK5c6";
const RPC_URL = process.env.ORACLE_RPC_URL ?? "https://api.devnet.solana.com";
const DEFAULT_PUBLISHER = "FVRAimDVygUaiUxSuUAJfrpwkm2xXukW7tykJbUXD7Hp";

export interface DashboardMarket {
  fixture: string;
  home: string;
  away: string;
  kickoffTs: number;
  fairHome: number;
  fairDraw: number;
  fairAway: number;
  updateCount: number;
  lastPublishedMs: number;
  txlineProofRefHex: string;
  marketPubkey: string;
}

export interface DashboardSnapshot {
  publisher: string;
  programPubkey: string;
  publisherPubkey: string | null;
  status: "live" | "warn" | "offline";
  statusLabel: string;
  markets: DashboardMarket[];
  updatesPublished: number;
  lastPublishAgoMs: number | null;
  degraded?: string;
}

export async function buildSnapshot(): Promise<DashboardSnapshot> {
  const oracle = await readOracleState({ rpcUrl: RPC_URL, programId: PROGRAM_ID });

  const markets: DashboardMarket[] = oracle.markets
    .map((m) => ({
      fixture: m.fixtureId,
      home: m.home,
      away: m.away,
      kickoffTs: m.kickoffTs,
      fairHome: m.fairHomePct,
      fairDraw: m.fairDrawPct,
      fairAway: m.fairAwayPct,
      updateCount: m.updateCount,
      lastPublishedMs: m.lastPublishedAt,
      txlineProofRefHex: m.txlineProofRefHex,
      marketPubkey: m.marketPubkey,
    }))
    .sort((a, b) => a.kickoffTs - b.kickoffTs);

  const lastPublishedMs = markets.length
    ? Math.max(...markets.map((m) => m.lastPublishedMs))
    : null;
  const lastPublishAgoMs = lastPublishedMs ? Date.now() - lastPublishedMs : null;

  let status: DashboardSnapshot["status"] = "warn";
  let statusLabel = "no markets published";
  if (oracle.degraded) {
    status = "offline";
    statusLabel = "rpc degraded";
  } else if (markets.length > 0) {
    const ageSec = lastPublishAgoMs ? lastPublishAgoMs / 1000 : Number.POSITIVE_INFINITY;
    if (ageSec < 300) {
      status = "live";
      statusLabel = `oracle live · ${Math.round(ageSec)}s ago`;
    } else if (ageSec < 3600) {
      status = "warn";
      statusLabel = `oracle idle · ${Math.round(ageSec / 60)}m ago`;
    } else {
      status = "warn";
      statusLabel = `oracle idle · ${Math.round(ageSec / 3600)}h ago`;
    }
  }

  return {
    publisher: oracle.publisherAuthority ?? DEFAULT_PUBLISHER,
    programPubkey: oracle.programId,
    publisherPubkey: oracle.publisherPubkey,
    status,
    statusLabel,
    markets,
    updatesPublished: oracle.publishedCount,
    lastPublishAgoMs,
    degraded: oracle.degraded,
  };
}
