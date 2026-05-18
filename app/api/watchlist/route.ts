import { NextRequest } from "next/server";
import { watchlistRepo } from "@/lib/db";
import { fetchQuote } from "@/lib/providers/yahoo";

export const runtime = "nodejs";

export async function GET() {
  const symbols = watchlistRepo.list();
  const quotes = await Promise.all(
    symbols.map((s) =>
      fetchQuote(s).catch(() => ({
        symbol: s,
        name: s,
        price: 0,
        change: 0,
        changePercent: 0,
        open: 0,
        dayHigh: 0,
        dayLow: 0,
        volume: 0,
        marketState: "UNKNOWN",
        currency: "USD",
        previousClose: 0,
      })),
    ),
  );
  return Response.json({ symbols, quotes });
}

export async function POST(req: NextRequest) {
  const { symbol } = (await req.json()) as { symbol?: string };
  if (!symbol) return new Response("symbol required", { status: 400 });
  watchlistRepo.add(symbol);
  return Response.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const symbol = url.searchParams.get("symbol");
  if (!symbol) return new Response("symbol required", { status: 400 });
  watchlistRepo.remove(symbol);
  return Response.json({ ok: true });
}
