import { getToken } from "@/lib/auth";
import type { AuthUser } from "@/lib/auth";
import type { Stock } from "@/lib/mock";

export type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data?: T;
  token?: string;
  user?: AuthUser;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

export type ProfileResponse = {
  success: boolean;
  message?: string;
  user: AuthUser;
};

export type UpdateProfilePayload = Partial<{
  name: string;
  email: string;
  balance: number;
  defaultOrderType: string;
}>;

export type MarketQuote = Stock & {
  volume?: number;
  lastUpdated?: string;
};

export type MarketSnapshot = {
  marketStatus: string;
  overallChange: number;
  quotes: MarketQuote[];
  generatedAt: string;
};

export type MarketCandle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type MarketHistory = {
  symbol: string;
  resolution: string;
  candles: MarketCandle[];
  generatedAt: string;
};

export type MarketSocketMessage =
  | { type: "market:init"; data: MarketSnapshot }
  | { type: "market:update"; data: MarketSnapshot };

export type MarketSymbol = {
  symbol: string;
  name: string;
  exchange: string;
  description?: string;
  type?: string;
};

export type PortfolioHolding = {
  symbol: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
};

export type PortfolioData = {
  cashBalance: number;
  totalInvested: number;
  totalValue: number;
  totalPnL: number;
  holdings: PortfolioHolding[];
};

export type WatchlistData = {
  symbols: string[];
  quotes: MarketQuote[];
};

export type TradeOrderRow = {
  id: number;
  user_id?: number;
  symbol: string;
  order_type: string;
  quantity: number;
  price: number;
  total_amount: number;
  status: string;
  created_at?: string;
};

export type TradeSubmitPayload = {
  symbol: string;
  quantity: number;
  stockPrice: number;
};

export type TradeSubmitResponse = {
  symbol: string;
  quantity: number;
  price: number;
  totalCost?: number;
  totalAmount?: number;
  remainingBalance: number;
  ai?: unknown;
};

export type BacktestPayload = {
  symbol: string;
  strategy: string;
  initialCapital: number;
};

export type BacktestPoint = {
  day: string;
  strategy: number;
  benchmark: number;
};

export type BacktestResult = {
  symbol: string;
  strategy: string;
  initialCapital: number;
  totalReturnPct: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  equityCurve: BacktestPoint[];
};

export type AiInsightData = {
  behavior: {
    flags: string[];
    summary: string;
    riskLevel: string;
    riskScore: number;
  };
  risk: {
    riskScore: number;
    riskLevel: string;
    summary: string;
    recommendation: string;
  };
};

const DEFAULT_BASE_URL = "http://localhost:5000/api";

function getApiBaseUrl() {
  const envBase = import.meta.env.VITE_API_BASE_URL;
  return (envBase || DEFAULT_BASE_URL).replace(/\/$/, "");
}

function getMarketWebSocketUrl() {
  const baseUrl = getApiBaseUrl();
  const normalizedBase = baseUrl.replace(/\/api$/, "");
  const protocol = normalizedBase.startsWith("https://") ? "wss://" : "ws://";
  const host = normalizedBase.replace(/^https?:\/\//i, "");

  return `${protocol}${host}/ws/market`;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<ApiEnvelope<T>> {
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const token = getToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    headers,
  });

  const payload = (await response.json().catch(() => ({}))) as ApiEnvelope<T> | { message?: string };

  if (!response.ok) {
    throw new Error("message" in payload && payload.message ? payload.message : `Request failed with status ${response.status}`);
  }

  if (payload && typeof payload === "object" && "success" in payload && payload.success === false) {
    throw new Error("message" in payload && payload.message ? payload.message : "Request failed");
  }

  return payload as ApiEnvelope<T>;
}

export function toStock(quote: MarketQuote): Stock {
  return {
    symbol: quote.symbol,
    name: quote.name || quote.symbol,
    sector: quote.sector || "Unknown",
    price: Number(quote.price) || 0,
    change: Number(quote.change) || 0,
  };
}

export const authApi = {
  async login(payload: LoginPayload) {
    return request<{ token?: string; user?: AuthUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async register(payload: RegisterPayload) {
    return request<{ token?: string; user?: AuthUser }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async demo() {
    return request<{ token?: string; user?: AuthUser }>("/auth/demo", {
      method: "POST",
    });
  },

  async getProfile() {
    const response = await request<AuthUser>("/auth/profile");
    const user = response.user ?? response.data;

    if (!user) {
      throw new Error("Profile response did not include a user.");
    }

    return {
      success: response.success,
      user,
    } satisfies ProfileResponse;
  },

  async updateProfile(payload: UpdateProfilePayload) {
    const response = await request<AuthUser>("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    const user = response.user ?? response.data;

    if (!user) {
      throw new Error("Profile response did not include a user.");
    }

    return {
      success: response.success,
      message: response.message,
      user,
    } satisfies ProfileResponse;
  },
};

export function subscribeToMarketUpdates(onMessage: (message: MarketSocketMessage) => void, onError?: (error: Error) => void) {
  if (typeof WebSocket === "undefined") {
    const error = new Error("WebSocket is not available in this browser.");
    onError?.(error);
    return () => {};
  }

  const socket = new WebSocket(getMarketWebSocketUrl());

  socket.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data) as MarketSocketMessage;
      onMessage(payload);
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error("Invalid market WebSocket payload."));
    }
  };

  socket.onerror = () => {
    onError?.(new Error("Failed to connect to the market WebSocket."));
  };

  return () => {
    if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
      socket.close();
    }
  };
}

export const marketApi = {
  getSnapshot() {
    return request<MarketSnapshot>("/market/snapshot");
  },

  getQuote(symbol: string) {
    return request<MarketQuote>(`/market/quote/${encodeURIComponent(symbol)}`);
  },

  getQuotes(symbols: string[]) {
    return request<MarketQuote[]>(`/market/quotes?symbols=${encodeURIComponent(symbols.join(","))}`);
  },

  getHistory(symbol: string, timeframe: string = "1H") {
    return request<MarketHistory>(`/market/history/${encodeURIComponent(symbol)}?resolution=${encodeURIComponent(timeframe)}`);
  },

  getAllStockSymbols(exchange: string = "US") {
    return request<MarketSymbol[]>(`/market/symbols/${encodeURIComponent(exchange)}`);
  },

  searchStocks(query: string) {
    return request<MarketSymbol[]>(`/market/search?query=${encodeURIComponent(query)}`);
  },

  getPopularStocks() {
    return request<MarketSymbol[]>("/market/popular");
  },
};

export const portfolioApi = {
  getPortfolio() {
    return request<PortfolioData>("/portfolio");
  },
};

export const watchlistApi = {
  getWatchlist() {
    return request<WatchlistData>("/watchlist");
  },

  addToWatchlist(symbol: string) {
    return request<WatchlistData>("/watchlist", {
      method: "POST",
      body: JSON.stringify({ symbol }),
    });
  },

  removeFromWatchlist(symbol: string) {
    return request<WatchlistData>(`/watchlist/${encodeURIComponent(symbol)}`, {
      method: "DELETE",
    });
  },
};

export const tradeApi = {
  buy(payload: TradeSubmitPayload) {
    return request<TradeSubmitResponse>("/trade/buy", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  sell(payload: TradeSubmitPayload) {
    return request<TradeSubmitResponse>("/trade/sell", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getTrades() {
    return request<TradeOrderRow[]>("/trade/history");
  },
};

export const backtestingApi = {
  run(payload: BacktestPayload) {
    return request<BacktestResult>("/backtesting", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};

export const aiApi = {
  getInsights() {
    return request<AiInsightData>("/ai");
  },
};
