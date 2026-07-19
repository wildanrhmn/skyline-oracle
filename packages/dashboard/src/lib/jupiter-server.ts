export interface JupiterMarketLite {
  marketId: string;
  eventId: string;
  title: string;
  eventTitle: string;
  slug: string;
  buyYesPct: number;
  buyNoPct: number;
  closesAt: number;
  volumeUsd: number;
  status: string;
}

interface JupiterEventEnvelope {
  data: Array<{
    eventId: string;
    isActive: boolean;
    isLive: boolean;
    tags: string[];
    metadata: {
      slug?: string;
      title?: string;
      closeTime?: string;
    };
    volumeUsd?: string | number;
    markets: Array<{
      provider: string;
      marketId: string;
      title: string;
      status: string;
      closeTime: number;
      pricing: {
        buyYesPriceUsd: number;
        buyNoPriceUsd: number;
        sellYesPriceUsd?: number;
        sellNoPriceUsd?: number;
        volume: number;
      };
    }>;
  }>;
}

const BASE = "https://api.jup.ag/prediction/v1";

/**
 * Fetch sports events from Jupiter Prediction, filter to soccer + World Cup,
 * and flatten into a small list of markets with prices in probability space.
 * Cheap and best-effort — a Jupiter outage returns [], never throws.
 */
export async function fetchJupiterMarkets(
  apiKey: string,
  timeoutMs = 6_000,
): Promise<JupiterMarketLite[]> {
  if (!apiKey) return [];
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(
      `${BASE}/events?category=sports&includeMarkets=true&limit=50`,
      {
        headers: {
          "x-api-key": apiKey,
          Accept: "application/json",
        },
        signal: ctrl.signal,
      } as never,
    );
    if (!res.ok) return [];
    const body = (await res.json()) as JupiterEventEnvelope;
    const soccerEvents = body.data.filter((e) =>
      e.tags.some((tag) =>
        ["soccer", "2026-fifa-world-cup", "fifa-world-cup", "fifwc"].includes(tag),
      ),
    );
    const flat: JupiterMarketLite[] = [];
    for (const evt of soccerEvents) {
      for (const m of evt.markets) {
        if (m.status !== "open") continue;
        flat.push({
          marketId: m.marketId,
          eventId: evt.eventId,
          title: m.title,
          eventTitle: evt.metadata.title ?? evt.eventId,
          slug: evt.metadata.slug ?? "",
          buyYesPct: microToPct(m.pricing.buyYesPriceUsd),
          buyNoPct: microToPct(m.pricing.buyNoPriceUsd),
          closesAt: m.closeTime,
          volumeUsd: Number(m.pricing.volume ?? 0),
          status: m.status,
        });
      }
    }
    return flat;
  } catch {
    return [];
  } finally {
    clearTimeout(t);
  }
}

function microToPct(microPrice: number): number {
  if (!microPrice) return 0;
  return microPrice / 1_000_000;
}
