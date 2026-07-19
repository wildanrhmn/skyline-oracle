import { Connection, Keypair, VersionedTransaction } from "@solana/web3.js";
import { readFileSync } from "node:fs";
import type {
  JupiterMarket,
  jupiterClient as JupiterClientFactory,
} from "../jupiter/client.js";
import { USDC_MINT } from "../jupiter/client.js";
import type { OrderIntent, OrderReceipt, TraderExecutor } from "../executor.js";
import { logger } from "../logger.js";

type JupiterClient = ReturnType<typeof JupiterClientFactory>;

export interface JupiterExecutorOptions {
  jupiter: JupiterClient;
  connection: Connection;
  walletKeypairPath: string;
}

/**
 * JupiterExecutor — places real orders on Jupiter Prediction (Polymarket + Kalshi
 * aggregated) on Solana mainnet. Signs unsigned tx returned by the API and
 * submits to the network.
 */
export class JupiterExecutor implements TraderExecutor {
  readonly mode = "real" as const;
  private readonly wallet: Keypair;

  constructor(private readonly opts: JupiterExecutorOptions) {
    this.wallet = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(readFileSync(opts.walletKeypairPath, "utf8"))),
    );
  }

  async execute(intent: OrderIntent, market: JupiterMarket): Promise<OrderReceipt> {
    const depositAmountUsdMicro = Math.round(intent.stakeUsd * 1_000_000).toString();
    try {
      const created = await this.opts.jupiter.createOrder({
        ownerPubkey: this.wallet.publicKey.toBase58(),
        marketId: intent.marketId,
        isYes: intent.isYes,
        isBuy: intent.isBuy,
        depositAmountUsdMicro,
        depositMint: USDC_MINT,
      });

      const tx = VersionedTransaction.deserialize(
        Buffer.from(created.transactionBase64, "base64"),
      );
      tx.sign([this.wallet]);
      const sig = await this.opts.connection.sendTransaction(tx, {
        skipPreflight: false,
        maxRetries: 3,
      });
      logger.info({ sig, marketId: intent.marketId }, "order submitted");
      await this.opts.connection.confirmTransaction(sig, "confirmed");

      return {
        intent,
        mode: "real",
        orderRef: created.orderPubkey,
        status: "placed",
        txSignature: sig,
        timestamp: Date.now(),
      };
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      logger.warn({ err, marketId: intent.marketId }, "order rejected");
      return {
        intent,
        mode: "real",
        orderRef: "",
        status: "rejected",
        reason,
        timestamp: Date.now(),
      };
    }
  }
}
