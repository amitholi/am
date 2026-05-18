export type ChartRange = "1D" | "5D" | "1M" | "6M" | "1Y" | "5Y";

export interface Quote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  marketState: string;
  currency: string;
  previousClose: number;
  sparkline?: number[];
}

export interface OHLC {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CompanyProfile {
  symbol: string;
  name: string;
  sector: string;
  industry: string;
  marketCap: number;
  peRatio: number | null;
  dividendYield: number | null;
  summary: string;
  website: string;
  employees: number | null;
  country: string;
  exchange: string;
}

export interface NewsItem {
  id: string;
  headline: string;
  source: string;
  url: string;
  publishedAt: string;
  summary?: string;
  image?: string;
  sentiment?: "positive" | "neutral" | "negative";
}

export interface ComparisonRow {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  marketCap: number;
  peRatio: number | null;
  dividendYield: number | null;
}

export interface SymbolSearchResult {
  symbol: string;
  name: string;
  exchange?: string;
  type?: string;
}
