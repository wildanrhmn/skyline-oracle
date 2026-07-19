import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

const MARKET_SEED = Buffer.from("market");

/** Basis-point encoded fair-value fetched from the Skyline Oracle. */
export interface OracleFairValue {
  marketId: Buffer;
  fixtureId: bigint;
  home: string;
  away: string;
  homeProbBps: number;
  drawProbBps: number;
  awayProbBps: number;
  homeConfBps: number;
  drawConfBps: number;
  awayConfBps: number;
  publishedAt: number;
  updateCount: number;
  txlineProofRef: Buffer;
}

export interface OracleReaderOptions {
  rpcUrl: string;
  programId: string;
  idl: unknown;
  walletKeypairPath: string;
}

export class OracleReader {
  private readonly program: Program;
  private readonly programId: PublicKey;

  constructor(opts: OracleReaderOptions) {
    const wallet = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(readFileSync(opts.walletKeypairPath, "utf8"))),
    );
    const conn = new Connection(opts.rpcUrl, "confirmed");
    const provider = new AnchorProvider(conn, new Wallet(wallet), {
      commitment: "confirmed",
    });
    this.programId = new PublicKey(opts.programId);
    const idlWithAddress = { ...(opts.idl as { address?: string }), address: this.programId.toBase58() };
    this.program = new Program(idlWithAddress as never, provider);
  }

  marketPda(marketIdBytes32: Uint8Array): PublicKey {
    if (marketIdBytes32.length !== 32) {
      throw new Error(`market_id must be 32 bytes`);
    }
    return PublicKey.findProgramAddressSync(
      [MARKET_SEED, Buffer.from(marketIdBytes32)],
      this.programId,
    )[0];
  }

  async fetch(marketIdBytes32: Uint8Array): Promise<OracleFairValue | null> {
    const pda = this.marketPda(marketIdBytes32);
    const raw = await (
      this.program.account as unknown as {
        marketAccount: { fetchNullable: (pk: PublicKey) => Promise<unknown> };
      }
    ).marketAccount.fetchNullable(pda);
    if (!raw) return null;
    const r = raw as {
      marketId: number[];
      fixtureId: { toString: () => string };
      home: string;
      away: string;
      current: {
        homeProbBps: number;
        drawProbBps: number;
        awayProbBps: number;
        homeConfBps: number;
        drawConfBps: number;
        awayConfBps: number;
        publishedAt: { toString: () => string } | number;
        txlineProofRef: number[];
      };
      updateCount: { toString: () => string };
    };
    return {
      marketId: Buffer.from(r.marketId),
      fixtureId: BigInt(r.fixtureId.toString()),
      home: r.home,
      away: r.away,
      homeProbBps: r.current.homeProbBps,
      drawProbBps: r.current.drawProbBps,
      awayProbBps: r.current.awayProbBps,
      homeConfBps: r.current.homeConfBps,
      drawConfBps: r.current.drawConfBps,
      awayConfBps: r.current.awayConfBps,
      publishedAt:
        typeof r.current.publishedAt === "number"
          ? r.current.publishedAt
          : Number(r.current.publishedAt.toString()),
      updateCount: Number(r.updateCount.toString()),
      txlineProofRef: Buffer.from(r.current.txlineProofRef),
    };
  }
}

/** Deterministic 32-byte market_id (same derivation as the engine publisher). */
export function marketIdFromFixture(
  fixtureId: number | bigint,
  marketType: string,
): Uint8Array {
  return new Uint8Array(
    createHash("sha256")
      .update(`${fixtureId.toString()}::${marketType}`)
      .digest(),
  );
}
