import { describe, expect, it } from "vitest";
import { evaluateMarket, type EdgeConfig } from "./edge.js";
import type { JupiterMarket } from "./jupiter/client.js";

const cfg: EdgeConfig = {
  bankrollUsd: 100,
  kellyFraction: 0.25,
  maxFractionOfBankroll: 0.3,
  edgeThresholdPct: 3,
  minOrderUsd: 5,
};

function mkMarket(buyYes: number, buyNo: number, status = "open"): JupiterMarket {
  return {
    provider: "polymarket",
    marketId: "POLY-1",
    status,
    title: "Test",
    openTime: 0,
    closeTime: 0,
    pricing: {
      buyYesPriceUsd: buyYes,
      sellYesPriceUsd: buyYes - 1000,
      buyNoPriceUsd: buyNo,
      sellNoPriceUsd: buyNo - 1000,
      volume: 0,
    },
    outcomes: ["Yes", "No"],
  };
}

describe("evaluateMarket", () => {
  it("skips closed markets", () => {
    const r = evaluateMarket(mkMarket(500_000, 500_000, "closed"), 0.6, cfg);
    expect(r.intent).toBeUndefined();
    expect(r.skipReason).toMatch(/status/);
  });

  it("emits intent when YES edge exceeds threshold", () => {
    // Market YES = $0.50, fair prob 0.60 → edge = 20%
    const r = evaluateMarket(mkMarket(500_000, 500_000), 0.6, cfg);
    expect(r.intent).toBeDefined();
    expect(r.intent!.isYes).toBe(true);
    expect(r.intent!.edgePct).toBeGreaterThan(3);
    expect(r.intent!.stakeUsd).toBeGreaterThan(0);
  });

  it("emits intent on NO side when NO edge is bigger", () => {
    // Market YES = $0.60 buy, NO = $0.30 buy → true prob YES = 0.4 → NO edge (0.6 vs 0.3) larger
    const r = evaluateMarket(mkMarket(600_000, 300_000), 0.4, cfg);
    expect(r.intent).toBeDefined();
    expect(r.intent!.isYes).toBe(false);
  });

  it("skips when both edges below threshold", () => {
    const r = evaluateMarket(mkMarket(500_000, 500_000), 0.505, cfg);
    expect(r.intent).toBeUndefined();
  });
});
