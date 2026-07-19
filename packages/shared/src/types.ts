export type OutcomeSide = "home" | "draw" | "away";

export type BookmakerId = string;

export interface BookmakerPrice {
  bookmakerId: BookmakerId;
  decimalOdds: Record<OutcomeSide, number>;
  updatedAt: number;
}

export interface FairValue {
  marketId: string;
  fixtureId: string;
  probabilities: Record<OutcomeSide, number>;
  confidenceHalfWidth: Record<OutcomeSide, number>;
  contributingBooks: BookmakerId[];
  computedAt: number;
  txlineProofRef?: string;
}

export interface JupiterMarketPrice {
  marketId: string;
  yesPrice: number;
  noPrice: number;
  updatedAt: number;
}

export interface EdgeSignal {
  marketId: string;
  outcome: OutcomeSide;
  isYes: boolean;
  fairProbability: number;
  marketPrice: number;
  edgePct: number;
  suggestedStakeUsd: number;
  detectedAt: number;
}
