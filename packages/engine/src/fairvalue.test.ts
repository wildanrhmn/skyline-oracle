import { describe, expect, it } from "vitest";
import { MarketAggregator, fairValueToBps } from "./fairvalue.js";

const now = Date.now();

function priceOf(
  bookmakerId: string,
  home: number,
  draw: number,
  away: number,
): {
  bookmakerId: string;
  decimalOdds: { home: number; draw: number; away: number };
  updatedAt: number;
} {
  return {
    bookmakerId,
    decimalOdds: { home, draw, away },
    updatedAt: now,
  };
}

describe("MarketAggregator", () => {
  it("returns null with too few books", () => {
    const agg = new MarketAggregator("fx1", "m1");
    agg.upsert(priceOf("pinnacle", 2.0, 3.5, 4.0));
    agg.upsert(priceOf("bet365", 1.95, 3.4, 4.1));
    expect(agg.computeFairValue(3)).toBeNull();
  });

  it("computes fair value with enough books", () => {
    const agg = new MarketAggregator("fx1", "m1");
    agg.upsert(priceOf("pinnacle", 2.0, 3.5, 4.0));
    agg.upsert(priceOf("bet365", 1.95, 3.4, 4.1));
    agg.upsert(priceOf("betfair_ex", 2.05, 3.55, 3.95));
    const fv = agg.computeFairValue(3);
    expect(fv).not.toBeNull();
    const sum =
      fv!.probabilities.home + fv!.probabilities.draw + fv!.probabilities.away;
    expect(sum).toBeCloseTo(1, 6);
    expect(fv!.contributingBooks).toHaveLength(3);
  });

  it("newest quote wins on upsert", () => {
    const agg = new MarketAggregator("fx1", "m1");
    agg.upsert({
      bookmakerId: "pinnacle",
      decimalOdds: { home: 2.0, draw: 3.5, away: 4.0 },
      updatedAt: now,
    });
    agg.upsert({
      bookmakerId: "pinnacle",
      decimalOdds: { home: 1.5, draw: 3.5, away: 4.0 },
      updatedAt: now + 100,
    });
    expect(agg.bookCount()).toBe(1);
    agg.upsert({
      bookmakerId: "pinnacle",
      decimalOdds: { home: 9.99, draw: 3.5, away: 4.0 },
      updatedAt: now - 100,
    });
    expect(agg.bookCount()).toBe(1);
  });

  it("prune removes stale prices", () => {
    const agg = new MarketAggregator("fx1", "m1");
    agg.upsert({
      bookmakerId: "old",
      decimalOdds: { home: 2, draw: 3, away: 4 },
      updatedAt: now - 60_000,
    });
    agg.upsert({
      bookmakerId: "fresh",
      decimalOdds: { home: 2, draw: 3, away: 4 },
      updatedAt: now,
    });
    const removed = agg.prune(10_000, now);
    expect(removed).toBe(1);
    expect(agg.bookCount()).toBe(1);
  });
});

describe("fairValueToBps", () => {
  it("returns bps sum exactly 10000", () => {
    const fv = {
      marketId: "m1",
      fixtureId: "fx1",
      probabilities: { home: 0.5001, draw: 0.2501, away: 0.2498 },
      confidenceHalfWidth: { home: 0.01, draw: 0.005, away: 0.007 },
      contributingBooks: ["a", "b"],
      computedAt: 0,
    };
    const { probabilities } = fairValueToBps(fv);
    expect(probabilities[0] + probabilities[1] + probabilities[2]).toBe(10000);
  });

  it("caps confidence at 10000 bps", () => {
    const fv = {
      marketId: "m1",
      fixtureId: "fx1",
      probabilities: { home: 0.5, draw: 0.25, away: 0.25 },
      confidenceHalfWidth: { home: 5, draw: 0.001, away: 0.001 },
      contributingBooks: ["a"],
      computedAt: 0,
    };
    const { confHalfWidths } = fairValueToBps(fv);
    expect(confHalfWidths[0]).toBe(10000);
  });
});
