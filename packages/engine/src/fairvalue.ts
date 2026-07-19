import type {
  BookmakerPrice,
  BookmakerId,
  FairValue,
  OutcomeSide,
} from "@skyline/shared";
import { math } from "@skyline/shared";

const { removeVigShin, weightedConsensus, confidenceHalfWidth, decimalToImplied } = math;

/** Per-book fair-value quote (already vig-removed by upstream, e.g. TxLINE StablePrice). */
export interface BookProbabilityQuote {
  bookmakerId: BookmakerId;
  probabilities: Record<OutcomeSide, number>;
  updatedAt: number;
}

/**
 * Rolling per-market aggregator. Consumes bookmaker odds updates as they stream
 * from TxLINE and emits fresh fair-value snapshots on demand.
 *
 * Only match-result (1x2) is handled here. Additional market types can be
 * layered on top with their own aggregators.
 */
export class MarketAggregator {
  private readonly latest = new Map<BookmakerId, BookmakerPrice>();
  private readonly latestProbs = new Map<BookmakerId, BookProbabilityQuote>();

  constructor(
    public readonly fixtureId: string,
    public readonly marketId: string,
  ) {}

  upsert(price: BookmakerPrice): void {
    const existing = this.latest.get(price.bookmakerId);
    if (existing && existing.updatedAt >= price.updatedAt) return;
    this.latest.set(price.bookmakerId, price);
  }

  /**
   * Ingest a per-book quote that is *already* vig-free (e.g. TxLINE StablePrice).
   * Skips the Shin removal step and feeds the consensus directly.
   */
  upsertProbability(q: BookProbabilityQuote): void {
    const existing = this.latestProbs.get(q.bookmakerId);
    if (existing && existing.updatedAt >= q.updatedAt) return;
    this.latestProbs.set(q.bookmakerId, q);
  }

  bookCount(): number {
    return this.latest.size + this.latestProbs.size;
  }

  /** Prune quotes older than staleMs to avoid stale-price pollution. */
  prune(staleMs: number, now: number = Date.now()): number {
    let removed = 0;
    for (const [id, p] of this.latest) {
      if (now - p.updatedAt > staleMs) {
        this.latest.delete(id);
        removed++;
      }
    }
    for (const [id, q] of this.latestProbs) {
      if (now - q.updatedAt > staleMs) {
        this.latestProbs.delete(id);
        removed++;
      }
    }
    return removed;
  }

  computeFairValue(minBooks = 3, txlineProofRef?: string): FairValue | null {
    const bookProbs: { bookmakerId: BookmakerId; probabilities: Record<OutcomeSide, number> }[] = [];

    for (const price of this.latest.values()) {
      const implied: Record<OutcomeSide, number> = {
        home: decimalToImplied(price.decimalOdds.home),
        draw: decimalToImplied(price.decimalOdds.draw),
        away: decimalToImplied(price.decimalOdds.away),
      };
      const { probabilities } = removeVigShin(implied);
      bookProbs.push({ bookmakerId: price.bookmakerId, probabilities });
    }

    for (const q of this.latestProbs.values()) {
      bookProbs.push({ bookmakerId: q.bookmakerId, probabilities: q.probabilities });
    }

    if (bookProbs.length < minBooks) return null;

    const { consensus } = weightedConsensus(bookProbs);
    const conf = confidenceHalfWidth(bookProbs, consensus);

    return {
      marketId: this.marketId,
      fixtureId: this.fixtureId,
      probabilities: consensus,
      confidenceHalfWidth: conf,
      contributingBooks: bookProbs.map((b) => b.bookmakerId),
      computedAt: Date.now(),
      txlineProofRef,
    };
  }
}

/**
 * Convert a FairValue's floating-point probabilities to basis-point integers
 * suitable for the Skyline Oracle publish_update instruction.
 * Guarantees the three probability bps sum to 10000 (rounding remainder goes
 * to the largest outcome) so the on-chain PROB_SUM_TOLERANCE check passes.
 */
export function fairValueToBps(fv: FairValue): {
  probabilities: [number, number, number];
  confHalfWidths: [number, number, number];
} {
  const rawProbs = [
    Math.round(fv.probabilities.home * 10000),
    Math.round(fv.probabilities.draw * 10000),
    Math.round(fv.probabilities.away * 10000),
  ];
  const diff = 10000 - (rawProbs[0]! + rawProbs[1]! + rawProbs[2]!);
  if (diff !== 0) {
    const largestIdx = rawProbs.indexOf(Math.max(...rawProbs));
    rawProbs[largestIdx] = rawProbs[largestIdx]! + diff;
  }
  return {
    probabilities: rawProbs as [number, number, number],
    confHalfWidths: [
      Math.min(10000, Math.round(fv.confidenceHalfWidth.home * 10000)),
      Math.min(10000, Math.round(fv.confidenceHalfWidth.draw * 10000)),
      Math.min(10000, Math.round(fv.confidenceHalfWidth.away * 10000)),
    ],
  };
}
