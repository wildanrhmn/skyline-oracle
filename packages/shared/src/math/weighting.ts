import type { BookmakerId, OutcomeSide } from "../types.js";

/**
 * Sharpness weights for bookmakers.
 * Pinnacle is the sharpest mainstream book (2-3% vig, no-limit policy for winning bettors,
 * high volume of professional money). Betfair Exchange reflects true market. Circa is sharp
 * for US markets. Everything else weighted lower to reduce influence of soft/recreational lines.
 * Values are relative; will be normalized before use.
 */
const DEFAULT_SHARPNESS: Record<string, number> = {
  pinnacle: 10,
  circa: 7,
  betfair_ex: 6,
  bookmaker_eu: 5,
  matchbook: 5,
  smarkets: 4,
  bet365: 3,
  williamhill: 2,
  bwin: 2,
  ladbrokes: 2,
};

const UNKNOWN_BOOK_WEIGHT = 1;

export function sharpnessWeight(bookmakerId: BookmakerId): number {
  const key = bookmakerId.toLowerCase();
  return DEFAULT_SHARPNESS[key] ?? UNKNOWN_BOOK_WEIGHT;
}

export interface BookProb {
  bookmakerId: BookmakerId;
  probabilities: Record<OutcomeSide, number>;
}

export function weightedConsensus(
  books: BookProb[],
): { consensus: Record<OutcomeSide, number>; totalWeight: number } {
  if (books.length === 0) {
    throw new Error("cannot compute consensus with zero books");
  }

  const totalWeight = books.reduce(
    (acc, b) => acc + sharpnessWeight(b.bookmakerId),
    0,
  );

  const acc: Record<OutcomeSide, number> = { home: 0, draw: 0, away: 0 };
  for (const book of books) {
    const w = sharpnessWeight(book.bookmakerId);
    acc.home += (book.probabilities.home * w) / totalWeight;
    acc.draw += (book.probabilities.draw * w) / totalWeight;
    acc.away += (book.probabilities.away * w) / totalWeight;
  }

  const sum = acc.home + acc.draw + acc.away;
  return {
    consensus: {
      home: acc.home / sum,
      draw: acc.draw / sum,
      away: acc.away / sum,
    },
    totalWeight,
  };
}

export function confidenceHalfWidth(
  books: BookProb[],
  consensus: Record<OutcomeSide, number>,
): Record<OutcomeSide, number> {
  const n = books.length;
  if (n < 2) {
    return { home: 0.5, draw: 0.5, away: 0.5 };
  }

  const outcomes: OutcomeSide[] = ["home", "draw", "away"];
  const halfWidths = {} as Record<OutcomeSide, number>;

  for (const o of outcomes) {
    const mean = consensus[o];
    const variance =
      books.reduce((acc, b) => acc + (b.probabilities[o] - mean) ** 2, 0) /
      (n - 1);
    const stdErr = Math.sqrt(variance / n);
    halfWidths[o] = 1.96 * stdErr;
  }
  return halfWidths;
}
