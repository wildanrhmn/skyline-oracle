import { describe, expect, it } from "vitest";
import {
  bookVig,
  decimalToImplied,
  removeVigProportional,
  removeVigShin,
} from "./vig.js";

describe("decimalToImplied", () => {
  it("converts even money", () => {
    expect(decimalToImplied(2.0)).toBeCloseTo(0.5, 10);
  });
  it("converts fair odds", () => {
    expect(decimalToImplied(4.0)).toBeCloseTo(0.25, 10);
  });
  it("rejects invalid odds", () => {
    expect(() => decimalToImplied(1.0)).toThrow();
    expect(() => decimalToImplied(0)).toThrow();
  });
});

describe("bookVig", () => {
  it("computes overround", () => {
    expect(
      bookVig({ home: 0.55, draw: 0.3, away: 0.2 }),
    ).toBeCloseTo(0.05, 10);
  });
  it("zero for fair book", () => {
    expect(
      bookVig({ home: 0.5, draw: 0.25, away: 0.25 }),
    ).toBeCloseTo(0, 10);
  });
});

describe("removeVigProportional", () => {
  it("sums to 1", () => {
    const out = removeVigProportional({ home: 0.55, draw: 0.3, away: 0.2 });
    expect(out.home + out.draw + out.away).toBeCloseTo(1, 10);
  });
  it("preserves ranking", () => {
    const out = removeVigProportional({ home: 0.55, draw: 0.3, away: 0.2 });
    expect(out.home).toBeGreaterThan(out.draw);
    expect(out.draw).toBeGreaterThan(out.away);
  });
});

describe("removeVigShin", () => {
  it("sums to 1", () => {
    const { probabilities } = removeVigShin({
      home: 0.55,
      draw: 0.3,
      away: 0.2,
    });
    expect(
      probabilities.home + probabilities.draw + probabilities.away,
    ).toBeCloseTo(1, 6);
  });

  it("produces z in [0, 0.5)", () => {
    const { z } = removeVigShin({ home: 0.55, draw: 0.3, away: 0.2 });
    expect(z).toBeGreaterThanOrEqual(0);
    expect(z).toBeLessThan(0.5);
  });

  it("Shin gives distinct result from proportional removal", () => {
    const implied = { home: 0.55, draw: 0.3, away: 0.2 };
    const prop = removeVigProportional(implied);
    const shin = removeVigShin(implied).probabilities;
    const diff =
      Math.abs(shin.home - prop.home) +
      Math.abs(shin.draw - prop.draw) +
      Math.abs(shin.away - prop.away);
    expect(diff).toBeGreaterThan(0.001);
  });

  it("Shin preserves outcome ranking", () => {
    const implied = { home: 0.55, draw: 0.3, away: 0.2 };
    const shin = removeVigShin(implied).probabilities;
    expect(shin.home).toBeGreaterThan(shin.draw);
    expect(shin.draw).toBeGreaterThan(shin.away);
  });

  it("returns zero-vig input unchanged", () => {
    const fair = { home: 0.5, draw: 0.25, away: 0.25 };
    const { probabilities, z } = removeVigShin(fair);
    expect(z).toBeCloseTo(0, 6);
    expect(probabilities.home).toBeCloseTo(0.5, 6);
    expect(probabilities.draw).toBeCloseTo(0.25, 6);
    expect(probabilities.away).toBeCloseTo(0.25, 6);
  });
});
