import { describe, expect, it } from "vitest";
import { edgePct, kellyStake } from "./kelly.js";

describe("kellyStake", () => {
  it("zero stake when no edge", () => {
    expect(
      kellyStake({
        trueProbability: 0.5,
        marketPrice: 0.5,
        bankrollUsd: 100,
      }),
    ).toBe(0);
  });

  it("zero stake when negative edge", () => {
    expect(
      kellyStake({
        trueProbability: 0.4,
        marketPrice: 0.5,
        bankrollUsd: 100,
      }),
    ).toBe(0);
  });

  it("positive stake with clear edge", () => {
    const s = kellyStake({
      trueProbability: 0.6,
      marketPrice: 0.5,
      bankrollUsd: 100,
      fraction: 1,
      maxFractionOfBankroll: 1,
    });
    // full Kelly at p=0.6, c=0.5 → f = (0.6*0.5 - 0.4*0.5) / (0.5*0.5) = 0.1/0.25 = 0.4
    expect(s).toBeCloseTo(40, 6);
  });

  it("fractional Kelly reduces stake", () => {
    const s = kellyStake({
      trueProbability: 0.6,
      marketPrice: 0.5,
      bankrollUsd: 100,
      fraction: 0.25,
      maxFractionOfBankroll: 1,
    });
    expect(s).toBeCloseTo(10, 6);
  });

  it("respects max-fraction cap", () => {
    const s = kellyStake({
      trueProbability: 0.9,
      marketPrice: 0.5,
      bankrollUsd: 1000,
      fraction: 1,
      maxFractionOfBankroll: 0.05,
    });
    expect(s).toBeCloseTo(50, 6);
  });

  it("rejects invalid inputs", () => {
    expect(
      kellyStake({ trueProbability: -0.1, marketPrice: 0.5, bankrollUsd: 100 }),
    ).toBe(0);
    expect(
      kellyStake({ trueProbability: 0.5, marketPrice: 1.1, bankrollUsd: 100 }),
    ).toBe(0);
  });
});

describe("edgePct", () => {
  it("computes signed edge", () => {
    expect(edgePct(0.6, 0.5)).toBeCloseTo(0.2, 10);
    expect(edgePct(0.4, 0.5)).toBeCloseTo(-0.2, 10);
  });
});
