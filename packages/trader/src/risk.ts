/**
 * Portfolio-level risk manager. Tracks realized + unrealized P&L, per-match
 * exposure, and enforces a drawdown circuit breaker.
 */
export interface RiskManagerOptions {
  bankrollUsd: number;
  maxPerMatchPct: number;
  drawdownHaltPct: number;
  minOrderUsd: number;
}

export interface ExposureView {
  bankrollRemaining: number;
  totalStaked: number;
  totalPnlRealized: number;
  drawdownPct: number;
  halted: boolean;
  perMatch: Record<string, number>;
}

export class RiskManager {
  private staked = 0;
  private realizedPnl = 0;
  private readonly matchStake = new Map<string, number>();
  private halted = false;
  private readonly initialBankroll: number;

  constructor(private readonly opts: RiskManagerOptions) {
    this.initialBankroll = opts.bankrollUsd;
  }

  canTake(matchKey: string, stakeUsd: number): { ok: boolean; reason?: string } {
    if (this.halted) return { ok: false, reason: "drawdown-halted" };
    if (stakeUsd < this.opts.minOrderUsd) {
      return { ok: false, reason: `stake ${stakeUsd.toFixed(2)} < min ${this.opts.minOrderUsd}` };
    }
    if (this.staked + stakeUsd > this.opts.bankrollUsd) {
      return { ok: false, reason: "insufficient bankroll" };
    }
    const matchCurrent = this.matchStake.get(matchKey) ?? 0;
    const matchCap = (this.opts.maxPerMatchPct / 100) * this.initialBankroll;
    if (matchCurrent + stakeUsd > matchCap) {
      return { ok: false, reason: `per-match cap ${matchCap.toFixed(2)} exceeded` };
    }
    return { ok: true };
  }

  recordPlaced(matchKey: string, stakeUsd: number): void {
    this.staked += stakeUsd;
    this.matchStake.set(matchKey, (this.matchStake.get(matchKey) ?? 0) + stakeUsd);
    this.checkDrawdown();
  }

  recordSettled(matchKey: string, stakeUsd: number, pnlUsd: number): void {
    this.staked = Math.max(0, this.staked - stakeUsd);
    this.realizedPnl += pnlUsd;
    const cur = this.matchStake.get(matchKey) ?? 0;
    this.matchStake.set(matchKey, Math.max(0, cur - stakeUsd));
    this.checkDrawdown();
  }

  view(): ExposureView {
    return {
      bankrollRemaining: this.opts.bankrollUsd - this.staked + this.realizedPnl,
      totalStaked: this.staked,
      totalPnlRealized: this.realizedPnl,
      drawdownPct: this.drawdownPct(),
      halted: this.halted,
      perMatch: Object.fromEntries(this.matchStake),
    };
  }

  private drawdownPct(): number {
    if (this.realizedPnl >= 0) return 0;
    return -(this.realizedPnl / this.initialBankroll) * 100;
  }

  private checkDrawdown(): void {
    if (this.drawdownPct() >= this.opts.drawdownHaltPct) {
      this.halted = true;
    }
  }
}
