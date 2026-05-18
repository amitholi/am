import type { NewsItem } from "@/lib/types";
import { finnhubQueue } from "@/lib/rateLimit";
import { demoNews, DEMO_SYMBOLS } from "@/lib/providers/demoData";

const BASE = "https://finnhub.io/api/v1";

interface FinnhubNews {
  id?: number | string;
  headline: string;
  source: string;
  url: string;
  datetime: number;
  summary?: string;
  image?: string;
}

function fmtDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function classifySentiment(text: string): NewsItem["sentiment"] {
  const t = text.toLowerCase();
  const pos = /(beat|surge|gain|raise|upgrade|record|rally|strong|growth|profit|positive|bull|outperform)/;
  const neg = /(miss|fall|drop|cut|downgrade|loss|weak|decline|negative|bear|underperform|lawsuit|probe|investigation)/;
  if (pos.test(t) && !neg.test(t)) return "positive";
  if (neg.test(t) && !pos.test(t)) return "negative";
  return "neutral";
}

export async function fetchNews(
  symbolRaw: string,
  days = 7,
): Promise<NewsItem[]> {
  const symbol = symbolRaw.toUpperCase();
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return demoNews(symbol, days);

  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 3600 * 1000);
  const url = `${BASE}/company-news?symbol=${encodeURIComponent(
    symbol,
  )}&from=${fmtDate(from)}&to=${fmtDate(to)}&token=${key}`;

  try {
    const data = await finnhubQueue.add(async () => {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`Finnhub ${res.status}`);
      return (await res.json()) as FinnhubNews[];
    });
    if (!Array.isArray(data) || data.length === 0) {
      return DEMO_SYMBOLS.includes(symbol) ? demoNews(symbol, days) : [];
    }
    return data.slice(0, 12).map((n, i) => ({
      id: String(n.id ?? `${symbol}-${i}`),
      headline: n.headline,
      source: n.source,
      url: n.url,
      publishedAt: new Date((n.datetime ?? 0) * 1000).toISOString(),
      summary: n.summary,
      image: n.image,
      sentiment: classifySentiment(`${n.headline} ${n.summary ?? ""}`),
    }));
  } catch {
    return DEMO_SYMBOLS.includes(symbol) ? demoNews(symbol, days) : [];
  }
}
