import { NextRequest } from "next/server";
import { searchSymbols } from "@/lib/providers/yahoo";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (q.trim().length < 1) return Response.json({ results: [] });
  const results = await searchSymbols(q);
  return Response.json({ results });
}
