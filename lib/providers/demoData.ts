import type {
  CompanyProfile,
  NewsItem,
  OHLC,
  Quote,
  ChartRange,
} from "@/lib/types";

const DEMO_QUOTES: Record<string, Omit<Quote, "sparkline">> = {
  AAPL: {
    symbol: "AAPL",
    name: "Apple Inc.",
    price: 232.47,
    change: 1.83,
    changePercent: 0.79,
    open: 230.7,
    dayHigh: 233.12,
    dayLow: 229.4,
    volume: 48_321_500,
    marketState: "REGULAR",
    currency: "USD",
    previousClose: 230.64,
  },
  MSFT: {
    symbol: "MSFT",
    name: "Microsoft Corporation",
    price: 416.22,
    change: -2.47,
    changePercent: -0.59,
    open: 419.0,
    dayHigh: 420.1,
    dayLow: 415.05,
    volume: 18_245_000,
    marketState: "REGULAR",
    currency: "USD",
    previousClose: 418.69,
  },
  NVDA: {
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    price: 141.95,
    change: 3.42,
    changePercent: 2.47,
    open: 138.9,
    dayHigh: 142.5,
    dayLow: 138.75,
    volume: 220_135_000,
    marketState: "REGULAR",
    currency: "USD",
    previousClose: 138.53,
  },
  TSLA: {
    symbol: "TSLA",
    name: "Tesla, Inc.",
    price: 248.5,
    change: -4.12,
    changePercent: -1.63,
    open: 252.0,
    dayHigh: 253.8,
    dayLow: 247.65,
    volume: 89_124_000,
    marketState: "REGULAR",
    currency: "USD",
    previousClose: 252.62,
  },
  GOOGL: {
    symbol: "GOOGL",
    name: "Alphabet Inc.",
    price: 175.32,
    change: 0.92,
    changePercent: 0.53,
    open: 174.5,
    dayHigh: 176.0,
    dayLow: 173.85,
    volume: 24_678_000,
    marketState: "REGULAR",
    currency: "USD",
    previousClose: 174.4,
  },
};

const DEMO_PROFILES: Record<string, CompanyProfile> = {
  AAPL: {
    symbol: "AAPL",
    name: "Apple Inc.",
    sector: "Technology",
    industry: "Consumer Electronics",
    marketCap: 3_540_000_000_000,
    peRatio: 31.4,
    dividendYield: 0.0045,
    summary:
      "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.",
    website: "https://www.apple.com",
    employees: 164_000,
    country: "United States",
    exchange: "NASDAQ",
  },
  MSFT: {
    symbol: "MSFT",
    name: "Microsoft Corporation",
    sector: "Technology",
    industry: "Software—Infrastructure",
    marketCap: 3_100_000_000_000,
    peRatio: 35.1,
    dividendYield: 0.0072,
    summary:
      "Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide.",
    website: "https://www.microsoft.com",
    employees: 228_000,
    country: "United States",
    exchange: "NASDAQ",
  },
  NVDA: {
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    sector: "Technology",
    industry: "Semiconductors",
    marketCap: 3_480_000_000_000,
    peRatio: 65.3,
    dividendYield: 0.0003,
    summary:
      "NVIDIA Corporation provides graphics and compute and networking solutions. Its products power AI, gaming, and professional visualization.",
    website: "https://www.nvidia.com",
    employees: 29_600,
    country: "United States",
    exchange: "NASDAQ",
  },
  TSLA: {
    symbol: "TSLA",
    name: "Tesla, Inc.",
    sector: "Consumer Cyclical",
    industry: "Auto Manufacturers",
    marketCap: 795_000_000_000,
    peRatio: 78.2,
    dividendYield: null,
    summary:
      "Tesla, Inc. designs, develops, manufactures, leases, and sells electric vehicles, and energy generation and storage systems.",
    website: "https://www.tesla.com",
    employees: 140_473,
    country: "United States",
    exchange: "NASDAQ",
  },
  GOOGL: {
    symbol: "GOOGL",
    name: "Alphabet Inc.",
    sector: "Communication Services",
    industry: "Internet Content & Information",
    marketCap: 2_180_000_000_000,
    peRatio: 26.8,
    dividendYield: 0.0046,
    summary:
      "Alphabet Inc. provides various products and platforms, including Search, YouTube, Android, Google Cloud, and Workspace.",
    website: "https://abc.xyz",
    employees: 182_502,
    country: "United States",
    exchange: "NASDAQ",
  },
};

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function rangeToParams(range: ChartRange): {
  points: number;
  stepMs: number;
} {
  switch (range) {
    case "1D":
      return { points: 78, stepMs: 5 * 60 * 1000 };
    case "5D":
      return { points: 5 * 78, stepMs: 5 * 60 * 1000 };
    case "1M":
      return { points: 22, stepMs: 24 * 60 * 60 * 1000 };
    case "6M":
      return { points: 130, stepMs: 24 * 60 * 60 * 1000 };
    case "1Y":
      return { points: 252, stepMs: 24 * 60 * 60 * 1000 };
    case "5Y":
      return { points: 5 * 52, stepMs: 7 * 24 * 60 * 60 * 1000 };
  }
}

export function demoChart(symbol: string, range: ChartRange): OHLC[] {
  const base = DEMO_QUOTES[symbol]?.price ?? 100;
  const { points, stepMs } = rangeToParams(range);
  const rand = seededRandom(
    symbol
      .split("")
      .reduce((acc, c) => acc + c.charCodeAt(0), 0) + points,
  );
  const out: OHLC[] = [];
  let price = base * 0.85;
  const drift = (base - price) / points;
  const now = Date.now();
  for (let i = 0; i < points; i++) {
    const date = new Date(now - (points - 1 - i) * stepMs);
    const open = price;
    const vol = base * 0.015 * (rand() + 0.3);
    const close = Math.max(0.01, open + drift + (rand() - 0.5) * vol);
    const high = Math.max(open, close) + rand() * vol * 0.4;
    const low = Math.min(open, close) - rand() * vol * 0.4;
    out.push({
      date: date.toISOString(),
      open: +open.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      close: +close.toFixed(2),
      volume: Math.floor(1_000_000 + rand() * 50_000_000),
    });
    price = close;
  }
  return out;
}

export function demoQuote(symbol: string): Quote | null {
  const q = DEMO_QUOTES[symbol];
  if (!q) return null;
  const series = demoChart(symbol, "1D").map((c) => c.close);
  return { ...q, sparkline: series };
}

export function demoProfile(symbol: string): CompanyProfile | null {
  return DEMO_PROFILES[symbol] ?? null;
}

const DEMO_NEWS_TEMPLATES = [
  {
    headline: "{name} beats Q4 expectations on strong product demand",
    source: "Reuters",
    sentiment: "positive" as const,
  },
  {
    headline: "Analysts raise price target on {name} following guidance",
    source: "Bloomberg",
    sentiment: "positive" as const,
  },
  {
    headline: "{name} announces expansion into new markets",
    source: "CNBC",
    sentiment: "neutral" as const,
  },
  {
    headline: "{name} faces regulatory scrutiny over recent practices",
    source: "WSJ",
    sentiment: "negative" as const,
  },
  {
    headline: "{name} unveils new partnership at industry conference",
    source: "TechCrunch",
    sentiment: "positive" as const,
  },
];

export function demoNews(symbol: string, days = 7): NewsItem[] {
  const profile = DEMO_PROFILES[symbol];
  if (!profile) return [];
  const now = Date.now();
  return DEMO_NEWS_TEMPLATES.map((t, i) => ({
    id: `${symbol}-demo-${i}`,
    headline: t.headline.replace("{name}", profile.name),
    source: t.source,
    url: `https://example.com/news/${symbol.toLowerCase()}/${i}`,
    publishedAt: new Date(
      now - Math.floor(((i + 1) / 5) * days * 24 * 3600 * 1000),
    ).toISOString(),
    summary: `${profile.name} continues to make headlines as the market digests recent developments in the ${profile.sector.toLowerCase()} sector.`,
    sentiment: t.sentiment,
  }));
}

export const DEMO_SYMBOLS = Object.keys(DEMO_QUOTES);

export function demoSearch(q: string) {
  const query = q.toUpperCase();
  return Object.values(DEMO_PROFILES)
    .filter(
      (p) =>
        p.symbol.startsWith(query) ||
        p.name.toUpperCase().includes(query),
    )
    .map((p) => ({
      symbol: p.symbol,
      name: p.name,
      exchange: p.exchange,
      type: "EQUITY",
    }));
}
