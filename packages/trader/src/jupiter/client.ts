import { fetch } from "undici";

export interface JupiterMarket {
  provider: string;
  marketId: string;
  status: "open" | "closed" | "resolved" | string;
  title: string;
  openTime: number;
  closeTime: number;
  pricing: {
    buyYesPriceUsd: number;
    sellYesPriceUsd: number;
    buyNoPriceUsd: number;
    sellNoPriceUsd: number;
    volume: number;
  };
  outcomes: string[];
  team?: string | null;
  sportsMarketType?: string | null;
}

export interface JupiterEvent {
  eventId: string;
  isActive: boolean;
  isLive: boolean;
  category: string;
  subcategory: string;
  tags: string[];
  metadata: {
    slug: string;
    title: string;
    imageUrl?: string;
    closeTime?: string;
  };
  volumeUsd?: string;
  volume24hr?: number | string;
  markets: JupiterMarket[];
}

export interface CreateOrderInput {
  ownerPubkey: string;
  marketId: string;
  isYes: boolean;
  isBuy: boolean;
  depositAmountUsdMicro: string;
  depositMint: string;
}

export interface CreateOrderResponse {
  transactionBase64: string;
  orderPubkey: string;
  positionPubkey?: string;
  expectedFillPrice?: number;
  [k: string]: unknown;
}

export interface JupiterPosition {
  positionPubkey: string;
  marketId: string;
  isYes: boolean;
  contractQty: number;
  costUsd: number;
  currentValueUsd: number;
  claimable?: boolean;
  [k: string]: unknown;
}

export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

export interface JupiterClientOptions {
  baseUrl: string;
  apiKey: string;
}

export function jupiterClient(opts: JupiterClientOptions) {
  async function req<T>(pathname: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${opts.baseUrl}${pathname}`, {
      ...init,
      headers: {
        "x-api-key": opts.apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(init?.headers ?? {}),
      },
    } as never);
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`Jupiter ${pathname} ${res.status}: ${text.slice(0, 500)}`);
    }
    return text ? (JSON.parse(text) as T) : (undefined as unknown as T);
  }

  return {
    async listSportsEvents(limit = 50): Promise<JupiterEvent[]> {
      const body = await req<{ data: JupiterEvent[] }>(
        `/events?category=sports&includeMarkets=true&limit=${limit}`,
      );
      return body.data;
    },

    async searchEvents(query: string): Promise<JupiterEvent[]> {
      const body = await req<{ data: JupiterEvent[] }>(
        `/events/search?query=${encodeURIComponent(query)}`,
      );
      return body.data;
    },

    async getEvent(eventId: string): Promise<JupiterEvent> {
      const body = await req<JupiterEvent | { data: JupiterEvent }>(
        `/events/${eventId}?includeMarkets=true`,
      );
      return "data" in body ? body.data : body;
    },

    async getMarket(marketId: string): Promise<JupiterMarket> {
      const body = await req<JupiterMarket | { data: JupiterMarket }>(
        `/markets/${marketId}`,
      );
      return "data" in body ? body.data : body;
    },

    async createOrder(input: CreateOrderInput): Promise<CreateOrderResponse> {
      return req<CreateOrderResponse>(`/orders`, {
        method: "POST",
        body: JSON.stringify({
          ownerPubkey: input.ownerPubkey,
          marketId: input.marketId,
          isYes: input.isYes,
          isBuy: input.isBuy,
          depositAmount: input.depositAmountUsdMicro,
          depositMint: input.depositMint,
        }),
      });
    },

    async listPositions(ownerPubkey: string): Promise<JupiterPosition[]> {
      const body = await req<{ data: JupiterPosition[] } | JupiterPosition[]>(
        `/positions?ownerPubkey=${ownerPubkey}`,
      );
      return Array.isArray(body) ? body : body.data;
    },

    async claim(positionPubkey: string): Promise<CreateOrderResponse> {
      return req<CreateOrderResponse>(
        `/positions/${positionPubkey}/claim`,
        { method: "POST" },
      );
    },
  };
}

/** Convert a raw Jupiter buyYesPriceUsd (micro-USD scale) to a 0-1 probability. */
export function jupiterMicroPriceToProb(microPrice: number): number {
  return microPrice / 1_000_000;
}
