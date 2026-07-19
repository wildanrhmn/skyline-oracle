import type { OutcomeSide } from "../types.js";

const OUTCOMES: readonly OutcomeSide[] = ["home", "draw", "away"] as const;

export function decimalToImplied(decimalOdds: number): number {
  if (!isFinite(decimalOdds) || decimalOdds <= 1) {
    throw new Error(`invalid decimal odds: ${decimalOdds}`);
  }
  return 1 / decimalOdds;
}

export function bookVig(implied: Record<OutcomeSide, number>): number {
  const sum = OUTCOMES.reduce((acc, k) => acc + implied[k], 0);
  return sum - 1;
}

export function removeVigProportional(
  implied: Record<OutcomeSide, number>,
): Record<OutcomeSide, number> {
  const sum = OUTCOMES.reduce((acc, k) => acc + implied[k], 0);
  return {
    home: implied.home / sum,
    draw: implied.draw / sum,
    away: implied.away / sum,
  };
}

/**
 * Shin (1993) model: solves for z (proportion of informed money) such that
 * true_i = (sqrt(z^2 + 4*(1-z) * (implied_i^2 / sum(implied))) - z) / (2*(1-z))
 * The overround is treated as bookmaker insurance against informed bettors.
 * More accurate than proportional removal for heavy favorites and longshots.
 * Reference: Shin, H.S. (1993) "Measuring the Incidence of Insider Trading in a Market for State-Contingent Claims"
 */
export function removeVigShin(
  implied: Record<OutcomeSide, number>,
): { probabilities: Record<OutcomeSide, number>; z: number } {
  const sumImplied = OUTCOMES.reduce((a, k) => a + implied[k], 0);
  if (sumImplied <= 1) {
    return { probabilities: { ...implied }, z: 0 };
  }

  const solveForZ = (): number => {
    const trueProbsGivenZ = (z: number) =>
      OUTCOMES.map((k) => {
        const pi = implied[k];
        const inside = z * z + 4 * (1 - z) * ((pi * pi) / sumImplied);
        return (Math.sqrt(inside) - z) / (2 * (1 - z));
      });

    let lo = 0;
    let hi = 0.5;
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      const probs = trueProbsGivenZ(mid);
      const sum = probs.reduce((a, b) => a + b, 0);
      if (sum > 1) {
        lo = mid;
      } else {
        hi = mid;
      }
    }
    return (lo + hi) / 2;
  };

  const z = solveForZ();
  const trueProbs = OUTCOMES.map((k) => {
    const pi = implied[k];
    const inside = z * z + 4 * (1 - z) * ((pi * pi) / sumImplied);
    return (Math.sqrt(inside) - z) / (2 * (1 - z));
  });
  const sum = trueProbs.reduce((a, b) => a + b, 0);
  const normalized = trueProbs.map((p) => p / sum);

  return {
    probabilities: {
      home: normalized[0]!,
      draw: normalized[1]!,
      away: normalized[2]!,
    },
    z,
  };
}
