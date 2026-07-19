import * as anchor from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, type Transaction, type VersionedTransaction } from "@solana/web3.js";
import oracleIdl from "../oracle-idl/idl.json" with { type: "json" };

const AnchorProvider = anchor.AnchorProvider;
const Program = anchor.Program;

/**
 * Minimal read-only wallet stub — Anchor's Provider requires a Wallet object,
 * but the read paths we use (`account.marketAccount.all`, `fetchNullable`)
 * never actually sign anything. Constructing anchor.Wallet directly triggers
 * a Turbopack static-analysis failure in the Node ESM bundle; this stub avoids
 * the problem entirely.
 */
class ReadOnlyWallet {
  constructor(readonly payer: Keypair) {}
  get publicKey(): PublicKey {
    return this.payer.publicKey;
  }
  signTransaction<T extends Transaction | VersionedTransaction>(_tx: T): Promise<T> {
    return Promise.reject(new Error("read-only wallet cannot sign"));
  }
  signAllTransactions<T extends Transaction | VersionedTransaction>(
    _txs: T[],
  ): Promise<T[]> {
    return Promise.reject(new Error("read-only wallet cannot sign"));
  }
}

const PUBLISHER_SEED = Buffer.from("publisher");

export interface OnChainMarket {
  marketPubkey: string;
  marketId: string;
  fixtureId: string;
  home: string;
  away: string;
  kickoffTs: number;
  fairHomePct: number;
  fairDrawPct: number;
  fairAwayPct: number;
  confHomeBps: number;
  confDrawBps: number;
  confAwayBps: number;
  lastPublishedAt: number;
  updateCount: number;
  txlineProofRefHex: string;
}

export interface OnChainOracleState {
  programId: string;
  publisherPubkey: string | null;
  publisherAuthority: string | null;
  publisherName: string | null;
  publishedCount: number;
  markets: OnChainMarket[];
  fetchedAt: number;
  degraded?: string;
}

/**
 * Read-only, server-side. Uses a throwaway keypair as an Anchor wallet since
 * we only ever call view methods (`account.marketAccount.all()`).
 */
export async function readOracleState(opts: {
  rpcUrl: string;
  programId: string;
  timeoutMs?: number;
}): Promise<OnChainOracleState> {
  const timeoutMs = opts.timeoutMs ?? 8_000;
  const dummy = Keypair.generate();
  const connection = new Connection(opts.rpcUrl, "confirmed");
  const wallet = new ReadOnlyWallet(dummy);
  const provider = new AnchorProvider(connection, wallet as never, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);
  const programId = new PublicKey(opts.programId);

  const idlWithAddress = {
    ...(oracleIdl as { address?: string }),
    address: programId.toBase58(),
  };
  const program = new Program(idlWithAddress as never, provider) as unknown as {
    account: {
      marketAccount: {
        all: () => Promise<
          Array<{
            publicKey: PublicKey;
            account: RawMarket;
          }>
        >;
      };
      publisherRegistry: {
        fetchNullable: (pk: PublicKey) => Promise<RawPublisher | null>;
      };
    };
  };

  const [publisherPda] = PublicKey.findProgramAddressSync(
    [PUBLISHER_SEED],
    programId,
  );

  const withTimeout = <T>(p: Promise<T>): Promise<T> =>
    Promise.race([
      p,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error("oracle-read timeout")), timeoutMs),
      ),
    ]);

  try {
    const [publisher, markets] = await Promise.all([
      withTimeout(program.account.publisherRegistry.fetchNullable(publisherPda)),
      withTimeout(program.account.marketAccount.all()),
    ]);

    return {
      programId: programId.toBase58(),
      publisherPubkey: publisher ? publisherPda.toBase58() : null,
      publisherAuthority: publisher
        ? new PublicKey(publisher.authority).toBase58()
        : null,
      publisherName: publisher?.name ?? null,
      publishedCount: publisher
        ? Number(bnToBigInt(publisher.publishedCount).toString())
        : 0,
      markets: markets.map((entry) => decodeMarket(entry.publicKey, entry.account)),
      fetchedAt: Date.now(),
    };
  } catch (err) {
    return {
      programId: programId.toBase58(),
      publisherPubkey: null,
      publisherAuthority: null,
      publisherName: null,
      publishedCount: 0,
      markets: [],
      fetchedAt: Date.now(),
      degraded:
        err instanceof Error ? err.message : "unknown oracle-read failure",
    };
  }
}

interface RawMarket {
  marketId: number[];
  fixtureId: BnLike;
  home: string;
  away: string;
  kickoffTs: BnLike;
  current: {
    homeProbBps: number;
    drawProbBps: number;
    awayProbBps: number;
    homeConfBps: number;
    drawConfBps: number;
    awayConfBps: number;
    txlineProofRef: number[];
    publishedAt: BnLike;
  };
  lastUpdatedTs: BnLike;
  updateCount: BnLike;
  publisher: number[] | PublicKey;
  bump: number;
}

interface RawPublisher {
  authority: number[] | PublicKey;
  name: string;
  publishedCount: BnLike;
  createdAt: BnLike;
  bump: number;
}

type BnLike = { toString(): string } | number | bigint;

function bnToBigInt(v: BnLike): bigint {
  if (typeof v === "bigint") return v;
  if (typeof v === "number") return BigInt(v);
  return BigInt(v.toString());
}

function decodeMarket(pubkey: PublicKey, m: RawMarket): OnChainMarket {
  return {
    marketPubkey: pubkey.toBase58(),
    marketId: bytesToHex(m.marketId),
    fixtureId: bnToBigInt(m.fixtureId).toString(),
    home: m.home,
    away: m.away,
    kickoffTs: Number(bnToBigInt(m.kickoffTs).toString()),
    fairHomePct: m.current.homeProbBps / 10_000,
    fairDrawPct: m.current.drawProbBps / 10_000,
    fairAwayPct: m.current.awayProbBps / 10_000,
    confHomeBps: m.current.homeConfBps,
    confDrawBps: m.current.drawConfBps,
    confAwayBps: m.current.awayConfBps,
    lastPublishedAt: Number(bnToBigInt(m.current.publishedAt).toString()) * 1000,
    updateCount: Number(bnToBigInt(m.updateCount).toString()),
    txlineProofRefHex: bytesToHex(m.current.txlineProofRef),
  };
}

function bytesToHex(bytes: number[]): string {
  return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}
