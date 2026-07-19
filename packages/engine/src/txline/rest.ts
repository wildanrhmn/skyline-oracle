import { fetch } from "undici";

export interface TxLineClientOptions {
  baseUrl: string;
  jwt: string;
  apiToken: string;
}

/** TxLINE Fixture — actual wire shape uses PascalCase field names. */
export interface Fixture {
  Ts: number;
  StartTime: number;
  Competition: string;
  CompetitionId: number;
  FixtureGroupId: number;
  Participant1Id: number;
  Participant1: string;
  Participant2Id: number;
  Participant2: string;
  FixtureId: number;
  Participant1IsHome: boolean;
  GameState?: number;
  [k: string]: unknown;
}

/** TxLINE Odds StablePrice payload — Pct is per-outcome fair-prob (0-1) or "NA". */
export interface OddsPayload {
  FixtureId: number;
  MarketType?: string;
  Line?: number;
  Pct: (number | "NA")[];
  BookmakerId?: string;
  Ts: number;
  [k: string]: unknown;
}

export interface ScoreSnapshot {
  FixtureId: number;
  Seq: number;
  Ts: number;
  HomeScore?: number;
  AwayScore?: number;
  Minute?: number;
  Events?: unknown[];
  [k: string]: unknown;
}

/** TxLINE competition ID for the 2026 FIFA World Cup (empirically confirmed). */
export const WORLD_CUP_COMPETITION_ID = 72;
/** TxLINE competition ID for International Friendlies (also in free tier). */
export const INT_FRIENDLIES_COMPETITION_ID = 430;

async function request<T>(
  opts: TxLineClientOptions,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = `${opts.baseUrl}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${opts.jwt}`,
      "X-Api-Token": opts.apiToken,
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  } as never);
  if (!res.ok) {
    throw new Error(`TxLINE ${path}: HTTP ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as T;
}

export function txlineClient(opts: TxLineClientOptions) {
  return {
    /**
     * Retrieve the latest fixture snapshot, optionally filtered by competition.
     * Reference: GET /api/fixtures/snapshot
     */
    fixturesSnapshot(params?: {
      startEpochDay?: number;
      competitionId?: number;
    }): Promise<Fixture[]> {
      const q = new URLSearchParams();
      if (params?.startEpochDay !== undefined)
        q.set("startEpochDay", String(params.startEpochDay));
      if (params?.competitionId !== undefined)
        q.set("competitionId", String(params.competitionId));
      const qs = q.toString();
      return request<Fixture[]>(
        opts,
        `/api/fixtures/snapshot${qs ? `?${qs}` : ""}`,
      );
    },

    /**
     * Latest odds snapshot for each unique market line of a fixture.
     * Reference: GET /api/odds/snapshot/{fixtureId}
     */
    oddsSnapshot(fixtureId: number, asOf?: number): Promise<OddsPayload[]> {
      const qs = asOf ? `?asOf=${asOf}` : "";
      return request<OddsPayload[]>(
        opts,
        `/api/odds/snapshot/${fixtureId}${qs}`,
      );
    },

    /**
     * All currently live odds updates from the 5-minute cache.
     * Reference: GET /api/odds/updates/{fixtureId}
     */
    oddsLiveUpdates(fixtureId: number): Promise<OddsPayload[]> {
      return request<OddsPayload[]>(opts, `/api/odds/updates/${fixtureId}`);
    },

    /**
     * Latest score snapshot (may include live in-play data).
     * Reference: GET /api/scores/snapshot/{fixtureId}
     */
    scoresSnapshot(fixtureId: number, asOf?: number): Promise<ScoreSnapshot[]> {
      const qs = asOf ? `?asOf=${asOf}` : "";
      return request<ScoreSnapshot[]>(
        opts,
        `/api/scores/snapshot/${fixtureId}${qs}`,
      );
    },

    /**
     * Merkle validation proof for a specific odds message — feed to on-chain
     * validate_odds instruction.
     * Reference: GET /api/odds/validation
     */
    oddsValidation(messageId: string, ts: number): Promise<unknown> {
      return request(
        opts,
        `/api/odds/validation?messageId=${encodeURIComponent(messageId)}&ts=${ts}`,
      );
    },
  };
}
