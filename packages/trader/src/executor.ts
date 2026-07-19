import type { JupiterMarket } from "./jupiter/client.js";

export interface OrderIntent {
  marketId: string;
  marketTitle: string;
  isYes: boolean;
  isBuy: boolean;
  stakeUsd: number;
  expectedPrice: number;
  fairProbability: number;
  edgePct: number;
  decidedAt: number;
}

export interface OrderReceipt {
  intent: OrderIntent;
  mode: "sim" | "real";
  orderRef: string;
  status: "placed" | "filled" | "rejected" | "simulated";
  txSignature?: string;
  reason?: string;
  timestamp: number;
}

export interface TraderExecutor {
  readonly mode: "sim" | "real";
  execute(intent: OrderIntent, market: JupiterMarket): Promise<OrderReceipt>;
}
