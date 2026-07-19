import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
const BN = anchor.BN;
import {
  Connection,
  Keypair,
  PublicKey,
  type ConfirmOptions,
} from "@solana/web3.js";
import type { SkylineOracle } from "./idl-types.js";
import idl from "./idl.json" with { type: "json" };
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

const PUBLISHER_SEED = Buffer.from("publisher");
const MARKET_SEED = Buffer.from("market");

export interface PublisherClientOptions {
  rpcUrl: string;
  walletKeypairPath: string;
  programId?: string;
  commitment?: ConfirmOptions["commitment"];
}

export function loadKeypair(path: string): Keypair {
  const raw = JSON.parse(readFileSync(path, "utf8")) as number[];
  return Keypair.fromSecretKey(Uint8Array.from(raw));
}

export class OraclePublisher {
  readonly program: Program<SkylineOracle>;
  readonly provider: AnchorProvider;
  readonly wallet: Keypair;

  constructor(opts: PublisherClientOptions) {
    const connection = new Connection(opts.rpcUrl, opts.commitment ?? "confirmed");
    this.wallet = loadKeypair(opts.walletKeypairPath);
    this.provider = new AnchorProvider(
      connection,
      new Wallet(this.wallet),
      AnchorProvider.defaultOptions(),
    );
    anchor.setProvider(this.provider);

    const overrideId = opts.programId ? new PublicKey(opts.programId) : undefined;
    if (overrideId) {
      const withOverride = { ...(idl as unknown as SkylineOracle), address: overrideId.toBase58() };
      this.program = new Program<SkylineOracle>(withOverride, this.provider);
    } else {
      this.program = new Program<SkylineOracle>(idl as SkylineOracle, this.provider);
    }
  }

  publisherPda(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync([PUBLISHER_SEED], this.program.programId);
  }

  marketPda(marketIdBytes32: Uint8Array): [PublicKey, number] {
    if (marketIdBytes32.length !== 32) {
      throw new Error(`market_id must be 32 bytes, got ${marketIdBytes32.length}`);
    }
    return PublicKey.findProgramAddressSync(
      [MARKET_SEED, Buffer.from(marketIdBytes32)],
      this.program.programId,
    );
  }

  async ensurePublisher(name: string): Promise<PublicKey> {
    const [pda] = this.publisherPda();
    const existing = await this.program.account.publisherRegistry.fetchNullable(pda);
    if (existing) return pda;
    await this.program.methods
      .initializePublisher(name)
      .accountsPartial({ authority: this.wallet.publicKey })
      .signers([this.wallet])
      .rpc();
    return pda;
  }

  async ensureMarket(input: {
    marketIdBytes32: Uint8Array;
    fixtureId: bigint | number;
    home: string;
    away: string;
    kickoffTs: bigint | number;
  }): Promise<PublicKey> {
    const [marketPda] = this.marketPda(input.marketIdBytes32);
    const existing = await this.program.account.marketAccount.fetchNullable(marketPda);
    if (existing) return marketPda;

    await this.program.methods
      .initializeMarket(
        Array.from(input.marketIdBytes32) as unknown as number[],
        new BN(input.fixtureId.toString()),
        input.home,
        input.away,
        new BN(input.kickoffTs.toString()),
      )
      .accountsPartial({ authority: this.wallet.publicKey })
      .signers([this.wallet])
      .rpc();
    return marketPda;
  }

  async publishUpdate(input: {
    marketIdBytes32: Uint8Array;
    probabilitiesBps: [number, number, number];
    confHalfWidthsBps: [number, number, number];
    txlineProofRefBytes32: Uint8Array;
  }): Promise<string> {
    if (input.txlineProofRefBytes32.length !== 32) {
      throw new Error("txline_proof_ref must be exactly 32 bytes");
    }
    const [marketPda] = this.marketPda(input.marketIdBytes32);
    return this.program.methods
      .publishUpdate(
        input.probabilitiesBps,
        input.confHalfWidthsBps,
        Array.from(input.txlineProofRefBytes32) as unknown as number[],
      )
      .accountsPartial({ authority: this.wallet.publicKey, market: marketPda })
      .signers([this.wallet])
      .rpc();
  }

  async fetchMarket(marketIdBytes32: Uint8Array) {
    const [pda] = this.marketPda(marketIdBytes32);
    return this.program.account.marketAccount.fetchNullable(pda);
  }
}

/** Deterministic 32-byte market_id derived from fixture_id + market_type. */
export function marketIdFromFixture(
  fixtureId: number | bigint,
  marketType: string,
): Uint8Array {
  return sha256_32(`${fixtureId.toString()}::${marketType}`);
}

export function sha256_32(src: string | Uint8Array): Uint8Array {
  return new Uint8Array(
    createHash("sha256")
      .update(typeof src === "string" ? src : Buffer.from(src))
      .digest(),
  );
}
