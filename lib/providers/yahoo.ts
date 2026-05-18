import YahooFinance from "yahoo-finance2";
import type {
  ChartRange,
  CompanyProfile,
  OHLC,
  Quote,
  SymbolSearchResult,
} from "@/lib/types";
import {
  DEMO_SYMBOLS,
  demoChart,
  demoProfile,
  demoQuote,
  demoSearch,
} from "@/lib/providers/demoData";

const yahooFinance = new YahooFinance({
  validation: { logErrors: false },
});

function shouldUseDemoFallback(symbol?: string): boolean {
  if (process.env.DEMO_MODE === "true") return true;
  if (!process.env.ANTHROPIC_API_KEY && symbol) {
    return DEMO_SYMBOLS.includes(symbol.toUpperCase());
  }
  return false;
}

export async function fetchQuote(symbolRaw: string): Promise<Quote> {
  const symbol = symbolRaw.toUpperCase();
  if (shouldUseDemoFallback(symbol)) {
    const d = demoQuote(symbol);
    if (d) return d;
  }
  try {
    const q = await yahooFinance.quote(symbol);
    const spark = await fetchChart(symbol, "1D").catch(() => [] as OHLC[]);
    const price = q.regularMarketPrice ?? q.postMarketPrice ?? 0;
    const prev = q.regularMarketPreviousClose ?? price;
    return {
      symbol: q.symbol ?? symbol,
      name: q.longName ?? q.shortName ?? symbol,
      price,
      change: q.regularMarketChange ?? price - prev,
      changePercent: q.regularMarketChangePercent ?? 0,
      open: q.regularMarketOpen ?? prev,
      dayHigh: q.regularMarketDayHigh ?? price,
      dayLow: q.regularMarketDayLow ?? price,
      volume: q.regularMarketVolume ?? 0,
      marketState: q.marketState ?? "REGULAR",
      currency: q.currency ?? "USD",
      previousClose: prev,
      sparkline: spark.map((c) => c.close),
    };
  } catch (err) {
    const d = demoQuote(symbol);
    if (d) return d;
    throw err;
  }
}

function rangeToYahooParams(range: ChartRange) {
  const now = new Date();
  const start = new Date(now);
  let interval: "5m" | "30m" | "1d" | "1wk" = "1d";
  switch (range) {
    case "1D":
      start.setDate(now.getDate() - 2);
      interval = "5m";
      break;
    case "5D":
      start.setDate(now.getDate() - 7);
      interval = "30m";
      break;
    case "1M":
      start.setMonth(now.getMonth() - 1);
      interval = "1d";
      break;
    case "6M":
      start.setMonth(now.getMonth() - 6);
      interval = "1d";
      break;
    case "1Y":
      start.setFullYear(now.getFullYear() - 1);
      interval = "1d";
      break;
    case "5Y":
      start.setFullYear(now.getFullYear() - 5);
      interval = "1wk";
      break;
  }
  return { period1: start, period2: now, interval };
}

export async function fetchChart(
  symbolRaw: string,
  range: ChartRange,
): Promise<OHLC[]> {
  const symbol = symbolRaw.toUpperCase();
  if (shouldUseDemoFallback(symbol)) {
    return demoChart(symbol, range);
  }
  try {
    const { period1, period2, interval } = rangeToYahooParams(range);
    const res = await yahooFinance.chart(symbol, {
      period1,
      period2,
      interval,
    });
    const quotes = res.quotes ?? [];
    return quotes
      .filter((q) => q.close != null && q.open != null)
      .map((q) => ({
        date: (q.date instanceof Date
          ? q.date
          : new Date(q.date as string | number)
        ).toISOString(),
        open: q.open as number,
        high: (q.high ?? q.close) as number,
        low: (q.low ?? q.close) as number,
        close: q.close as number,
        volume: (q.volume ?? 0) as number,
      }));
  } catch (err) {
    if (DEMO_SYMBOLS.includes(symbol)) return demoChart(symbol, range);
    throw err;
  }
}

export async function fetchProfile(
  symbolRaw: string,
): Promise<CompanyProfile> {
  const symbol = symbolRaw.toUpperCase();
  if (shouldUseDemoFallback(symbol)) {
    const d = demoProfile(symbol);
    if (d) return d;
  }
  try {
    const summary = await yahooFinance.quoteSummary(symbol, {
      modules: [
        "assetProfile",
        "summaryDetail",
        "defaultKeyStatistics",
        "price",
      ],
    });
    const ap = summary.assetProfile;
    const sd = summary.summaryDetail;
    const ks = summary.defaultKeyStatistics;
    const p = summary.price;
    return {
      symbol,
      name: p?.longName ?? p?.shortName ?? symbol,
      sector: ap?.sector ?? "—",
      industry: ap?.industry ?? "—",
      marketCap: Number(p?.marketCap ?? sd?.marketCap ?? 0),
      peRatio: Number(sd?.trailingPE ?? ks?.forwardPE ?? NaN) || null,
      dividendYield: Number(sd?.dividendYield ?? NaN) || null,
      summary: ap?.longBusinessSummary ?? "No summary available.",
      website: ap?.website ?? "",
      employees: ap?.fullTimeEmployees ?? null,
      country: ap?.country ?? "—",
      exchange: p?.exchangeName ?? "—",
    };
  } catch (err) {
    const d = demoProfile(symbol);
    if (d) return d;
    throw err;
  }
}

export async function searchSymbols(
  q: string,
): Promise<SymbolSearchResult[]> {
  if (!q.trim()) return [];
  if (shouldUseDemoFallback()) return demoSearch(q);
  try {
    const res = await yahooFinance.search(q, { quotesCount: 8 });
    return (res.quotes ?? [])
      .filter((x): boolean =>
        typeof (x as { symbol?: string }).symbol === "string",
      )
      .map((x) => {
        const r = x as Record<string, unknown>;
        return {
          symbol: r.symbol as string,
          name: (r.shortname ?? r.longname ?? r.symbol) as string,
          exchange: r.exchange as string | undefined,
          type: r.quoteType as string | undefined,
        };
      });
  } catch {
    return demoSearch(q);
  }
}
