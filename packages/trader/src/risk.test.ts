import { describe, expect, it } from "vitest";
import { RiskManager } from "./risk.js";

const opts = {
  bankrollUsd: 100,
  maxPerMatchPct: 30,
  drawdownHaltPct: 10,
  minOrderUsd: 5,
};

describe("RiskManager", () => {
  it("rejects sub-minimum orders", () => {
    const r = new RiskManager(opts);
    expect(r.canTake("m1", 4.99).ok).toBe(false);
  });

  it("accepts valid orders", () => {
    const r = new RiskManager(opts);
    expect(r.canTake("m1", 10).ok).toBe(true);
  });

  it("enforces per-match cap", () => {
    const r = new RiskManager(opts);
    r.recordPlaced("m1", 25);
    expect(r.canTake("m1", 10).ok).toBe(false);
    expect(r.canTake("m2", 10).ok).toBe(true);
  });

  it("enforces bankroll cap", () => {
    const r = new RiskManager({ ...opts, maxPerMatchPct: 100 });
    r.recordPlaced("m1", 90);
    expect(r.canTake("m2", 20).ok).toBe(false);
  });

  it("halts on drawdown", () => {
    const r = new RiskManager(opts);
    r.recordPlaced("m1", 20);
    r.recordSettled("m1", 20, -15);
    expect(r.canTake("m2", 5).ok).toBe(false);
    expect(r.view().halted).toBe(true);
  });

  it("view reflects state", () => {
    const r = new RiskManager(opts);
    r.recordPlaced("m1", 10);
    r.recordPlaced("m2", 15);
    const v = r.view();
    expect(v.totalStaked).toBe(25);
    expect(v.perMatch).toEqual({ m1: 10, m2: 15 });
  });
});
