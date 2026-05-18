import { NextRequest } from "next/server";
import { fetchChart } from "@/lib/providers/yahoo";
import type { ChartRange } from "@/lib/types";

export const runtime = "nodejs";

const VALID: ChartRange[] = ["1D", "5D", "1M", "6M", "1Y", "5Y"];

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol");
  const range = req.nextUrl.searchParams.get("range") as ChartRange | null;
  if (!symbol || !range || !VALID.includes(range)) {
    return new Response("symbol and valid range required", { status: 400 });
  }
  const candles = await fetchChart(symbol, range);
  return Response.json({ symbol: symbol.toUpperCase(), range, candles });
}
