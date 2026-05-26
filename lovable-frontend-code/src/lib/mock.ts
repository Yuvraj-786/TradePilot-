export type Stock = {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  change: number; // percent
};

export const STOCKS: Stock[] = [
  { symbol: "RELIANCE", name: "Reliance Industries", sector: "Energy", price: 2845.3, change: 1.15 },
  { symbol: "TCS", name: "Tata Consultancy", sector: "Technology", price: 3920.1, change: -0.46 },
  { symbol: "INFY", name: "Infosys Ltd.", sector: "Technology", price: 1785.5, change: 0.71 },
  { symbol: "HDFCBANK", name: "HDFC Bank", sector: "Financials", price: 1672.8, change: 0.34 },
  { symbol: "ICICIBANK", name: "ICICI Bank", sector: "Financials", price: 1184.2, change: 1.02 },
  { symbol: "AAPL", name: "Apple Inc.", sector: "Technology", price: 189.84, change: 0.66 },
  { symbol: "MSFT", name: "Microsoft Corp.", sector: "Technology", price: 415.22, change: 0.75 },
  { symbol: "NVDA", name: "NVIDIA Corp.", sector: "Technology", price: 875.4, change: 2.19 },
  { symbol: "TSLA", name: "Tesla Inc.", sector: "Automotive", price: 242.6, change: -2.14 },
  { symbol: "AMZN", name: "Amazon.com Inc.", sector: "Consumer", price: 185.07, change: -0.99 },
  { symbol: "GOOGL", name: "Alphabet Inc.", sector: "Technology", price: 165.4, change: 1.41 },
  { symbol: "META", name: "Meta Platforms", sector: "Technology", price: 508.9, change: 1.48 },
];

export type Holding = {
  symbol: string;
  name: string;
  qty: number;
  avg: number;
  ltp: number;
  sector: string;
};

export const HOLDINGS: Holding[] = [
  { symbol: "AAPL", name: "Apple Inc.", qty: 10, avg: 175, ltp: 189.84, sector: "Technology" },
  { symbol: "NVDA", name: "NVIDIA Corp.", qty: 5, avg: 820, ltp: 875.4, sector: "Technology" },
  { symbol: "TSLA", name: "Tesla Inc.", qty: 8, avg: 260, ltp: 242.6, sector: "Automotive" },
  { symbol: "MSFT", name: "Microsoft Corp.", qty: 12, avg: 400, ltp: 415.22, sector: "Technology" },
  { symbol: "RELIANCE", name: "Reliance Ind.", qty: 4, avg: 2780, ltp: 2845.3, sector: "Energy" },
];

export const PORTFOLIO_GROWTH = Array.from({ length: 30 }, (_, i) => {
  const base = 100000;
  const trend = i * 800;
  const noise = Math.sin(i / 2.3) * 1500 + Math.cos(i / 1.5) * 900;
  return {
    day: `D${i + 1}`,
    value: Math.round(base + trend + noise),
  };
});

export const SECTOR_ALLOCATION = [
  { name: "Technology", value: 62, color: "var(--chart-1)" },
  { name: "Automotive", value: 14, color: "var(--chart-3)" },
  { name: "Energy", value: 12, color: "var(--chart-2)" },
  { name: "Financials", value: 8, color: "var(--chart-5)" },
  { name: "Consumer", value: 4, color: "var(--chart-4)" },
];

export const TRADES = [
  { id: 1, time: "10:32", symbol: "AAPL", side: "BUY", qty: 5, price: 189.2, status: "EXECUTED" },
  { id: 2, time: "11:05", symbol: "NVDA", side: "BUY", qty: 2, price: 870.1, status: "EXECUTED" },
  { id: 3, time: "12:18", symbol: "TSLA", side: "SELL", qty: 3, price: 245.4, status: "EXECUTED" },
  { id: 4, time: "13:42", symbol: "MSFT", side: "BUY", qty: 4, price: 412.8, status: "EXECUTED" },
  { id: 5, time: "14:55", symbol: "RELIANCE", side: "BUY", qty: 2, price: 2832, status: "EXECUTED" },
];

export const AI_INSIGHTS = [
  {
    tone: "warning" as const,
    title: "Sector concentration",
    body: "You have 62% capital in Technology. Consider diversifying to reduce concentration risk.",
  },
  {
    tone: "info" as const,
    title: "TSLA position",
    body: "Your TSLA position shows a paper loss. Avoid panic-selling — within normal volatility range.",
  },
  {
    tone: "bull" as const,
    title: "NVDA entry",
    body: "Well-timed entry on NVDA — pullback from 30-day high with solid risk/reward setup.",
  },
];

export const BEHAVIOR = [
  { label: "Overtrading", value: 25, tone: "bull" as const },
  { label: "Emotional Trading", value: 40, tone: "bull" as const },
  { label: "Concentration Risk", value: 68, tone: "warning" as const },
  { label: "Stop-loss Usage", value: 20, tone: "bear" as const },
];
