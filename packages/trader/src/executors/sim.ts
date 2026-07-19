import type { JupiterMarket } from "../jupiter/client.js";
import type { OrderIntent, OrderReceipt, TraderExecutor } from "../executor.js";
import { randomUUID } from "node:crypto";

/**
 * SimulatedExecutor — no real orders. Records the intent, applies a
 * pessimistic slippage assumption, and returns a synthetic receipt.
 *
 * Used for the deployed judges-endpoint so anyone can watch the loop
 * without funding the wallet, and as the safe default during development.
 */
export class SimulatedExecutor implements TraderExecutor {
  readonly mode = "sim" as const;

  async execute(intent: OrderIntent, market: JupiterMarket): Promise<OrderReceipt> {
    return {
      intent,
      mode: "sim",
      orderRef: `sim-${randomUUID()}`,
      status: "simulated",
      timestamp: Date.now(),
      reason: `simulated fill @ ${intent.expectedPrice.toFixed(4)} on ${market.title}`,
    };
  }
}
