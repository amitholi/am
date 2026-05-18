import { tool } from "ai";
import { z } from "zod";
import { fetchChart, fetchProfile, fetchQuote } from "@/lib/providers/yahoo";
import { fetchNews } from "@/lib/providers/finnhub";
import { watchlistRepo } from "@/lib/db";
import type { ChartRange, ComparisonRow } from "@/lib/types";

const SYMBOL_DESC =
  "Ticker symbol (e.g. AAPL, MSFT, BRK-B). Always uppercase. If the user says a company name, resolve it to its primary ticker first.";

export const tools = {
  getQuote: tool({
    description:
      "Get the current quote for a stock: price, change, day range, volume, and a 1-day sparkline. Use this for any 'price of X', 'what is X at', 'how is X doing today'.",
    inputSchema: z.object({ symbol: z.string().describe(SYMBOL_DESC) }),
    execute: async ({ symbol }) => {
      return await fetchQuote(symbol);
    },
  }),

  getChart: tool({
    description:
      "Get OHLC candles for a chart. Use for any chart/graph request or when the user asks about performance over a time period.",
    inputSchema: z.object({
      symbol: z.string().describe(SYMBOL_DESC),
      range: z
        .enum(["1D", "5D", "1M", "6M", "1Y", "5Y"])
        .describe(
          "Time range. 1D=intraday, 5D=this week, 1M=one month, 6M=six months, 1Y=one year, 5Y=five years.",
        ),
    }),
    execute: async ({ symbol, range }) => {
      const candles = await fetchChart(symbol, range as ChartRange);
      return { symbol: symbol.toUpperCase(), range, candles };
    },
  }),

  getCompany: tool({
    description:
      "Get company profile: sector, industry, market cap, P/E, business summary. Use for 'what does X do', 'about X', fundamentals questions.",
    inputSchema: z.object({ symbol: z.string().describe(SYMBOL_DESC) }),
    execute: async ({ symbol }) => {
      return await fetchProfile(symbol);
    },
  }),

  getNews: tool({
    description:
      "Get recent news headlines for a stock with sentiment. Use for 'what's happening with X', 'news on X', 'why is X moving'.",
    inputSchema: z.object({
      symbol: z.string().describe(SYMBOL_DESC),
      days: z
        .number()
        .int()
        .min(1)
        .max(30)
        .default(7)
        .describe("How many days of news to fetch."),
    }),
    execute: async ({ symbol, days }) => {
      const items = await fetchNews(symbol, days);
      return { symbol: symbol.toUpperCase(), days, items };
    },
  }),

  compareStocks: tool({
    description:
      "Compare 2–6 stocks side by side. Returns a metrics table with price, change, market cap, P/E, dividend yield.",
    inputSchema: z.object({
      symbols: z
        .array(z.string())
        .min(2)
        .max(6)
        .describe("Tickers to compare, 2 to 6."),
    }),
    execute: async ({ symbols }) => {
      const rows: ComparisonRow[] = await Promise.all(
        symbols.map(async (sym) => {
          const [q, p] = await Promise.all([
            fetchQuote(sym),
            fetchProfile(sym).catch(() => null),
          ]);
          return {
            symbol: q.symbol,
            name: q.name,
            price: q.price,
            changePercent: q.changePercent,
            marketCap: p?.marketCap ?? 0,
            peRatio: p?.peRatio ?? null,
            dividendYield: p?.dividendYield ?? null,
          };
        }),
      );
      return { rows };
    },
  }),

  addToWatchlist: tool({
    description: "Add a stock to the user's watchlist.",
    inputSchema: z.object({ symbol: z.string().describe(SYMBOL_DESC) }),
    execute: async ({ symbol }) => {
      const sym = symbol.toUpperCase();
      watchlistRepo.add(sym);
      return { ok: true, symbol: sym, action: "added" as const };
    },
  }),

  removeFromWatchlist: tool({
    description: "Remove a stock from the user's watchlist.",
    inputSchema: z.object({ symbol: z.string().describe(SYMBOL_DESC) }),
    execute: async ({ symbol }) => {
      const sym = symbol.toUpperCase();
      watchlistRepo.remove(sym);
      return { ok: true, symbol: sym, action: "removed" as const };
    },
  }),

  getWatchlist: tool({
    description: "Get the user's current watchlist with live quotes.",
    inputSchema: z.object({}),
    execute: async () => {
      const symbols = watchlistRepo.list();
      const quotes = await Promise.all(
        symbols.map((s) => fetchQuote(s).catch(() => null)),
      );
      return {
        symbols,
        quotes: quotes.filter((q): q is NonNullable<typeof q> => q !== null),
      };
    },
  }),
};

export type ToolName = keyof typeof tools;
