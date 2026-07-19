/**
 * Kelly criterion for binary bets on prediction markets.
 * Given true probability p of YES resolving, and market YES price c (0 < c < 1),
 * the payoff for buying 1 YES contract is (1 - c) if YES resolves and (-c) if NO resolves.
 * Full Kelly fraction of bankroll to stake:
 *   f* = (p * (1 - c) - (1 - p) * c) / ((1 - c) * c)  when there is edge, else 0.
 * We use fractional Kelly (default 1/4) for real-desk safety.
 */
export interface KellyInput {
  trueProbability: number;
  marketPrice: number;
  bankrollUsd: number;
  fraction?: number;
  maxFractionOfBankroll?: number;
}

export function kellyStake(input: KellyInput): number {
  const {
    trueProbability: p,
    marketPrice: c,
    bankrollUsd,
    fraction = 0.25,
    maxFractionOfBankroll = 0.05,
  } = input;

  if (p <= 0 || p >= 1 || c <= 0 || c >= 1) return 0;

  const edge = p * (1 - c) - (1 - p) * c;
  if (edge <= 0) return 0;

  const fullKelly = edge / ((1 - c) * c);
  const scaled = fullKelly * fraction;
  const capped = Math.min(scaled, maxFractionOfBankroll);
  return Math.max(0, capped * bankrollUsd);
}

export function edgePct(
  trueProbability: number,
  marketPrice: number,
): number {
  return (trueProbability - marketPrice) / marketPrice;
}
