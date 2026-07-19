import { math } from "@skyline/shared";
import type { JupiterMarket } from "./jupiter/client.js";
import type { OrderIntent } from "./executor.js";
import { jupiterMicroPriceToProb } from "./jupiter/client.js";

const { edgePct, kellyStake } = math;

export interface EdgeConfig {
  bankrollUsd: number;
  kellyFraction: number;
  maxFractionOfBankroll: number;
  edgeThresholdPct: number;
  minOrderUsd: number;
}

export interface EvaluatedMarket {
  market: JupiterMarket;
  fairYesProbability: number;
  intent?: OrderIntent;
  skipReason?: string;
}

export function evaluateMarket(
  market: JupiterMarket,
  fairYesProbability: number,
  cfg: EdgeConfig,
): EvaluatedMarket {
  if (market.status !== "open") {
    return { market, fairYesProbability, skipReason: `market status=${market.status}` };
  }
  const buyYesPrice = jupiterMicroPriceToProb(market.pricing.buyYesPriceUsd);
  const buyNoPrice = jupiterMicroPriceToProb(market.pricing.buyNoPriceUsd);
  if (buyYesPrice <= 0 || buyNoPrice <= 0) {
    return { market, fairYesProbability, skipReason: "invalid pricing" };
  }

  const yesEdge = edgePct(fairYesProbability, buyYesPrice);
  const noEdge = edgePct(1 - fairYesProbability, buyNoPrice);

  const [side, edge, price, prob, isYes] =
    yesEdge >= noEdge
      ? ["YES", yesEdge, buyYesPrice, fairYesProbability, true]
      : ["NO", noEdge, buyNoPrice, 1 - fairYesProbability, false];

  const edgePctVal = (edge as number) * 100;
  if (edgePctVal < cfg.edgeThresholdPct) {
    return {
      market,
      fairYesProbability,
      skipReason: `${side} edge ${edgePctVal.toFixed(2)}% < threshold ${cfg.edgeThresholdPct}%`,
    };
  }

  const stake = kellyStake({
    trueProbability: prob as number,
    marketPrice: price as number,
    bankrollUsd: cfg.bankrollUsd,
    fraction: cfg.kellyFraction,
    maxFractionOfBankroll: cfg.maxFractionOfBankroll,
  });

  if (stake < cfg.minOrderUsd) {
    return {
      market,
      fairYesProbability,
      skipReason: `Kelly stake ${stake.toFixed(2)} < min ${cfg.minOrderUsd}`,
    };
  }

  return {
    market,
    fairYesProbability,
    intent: {
      marketId: market.marketId,
      marketTitle: market.title,
      isYes: isYes as boolean,
      isBuy: true,
      stakeUsd: Number(stake.toFixed(2)),
      expectedPrice: price as number,
      fairProbability: prob as number,
      edgePct: edgePctVal,
      decidedAt: Date.now(),
    },
  };
}
