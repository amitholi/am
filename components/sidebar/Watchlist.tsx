"use client";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";
import type { Quote } from "@/lib/types";

export function Watchlist({
  onAsk,
}: {
  onAsk: (text: string) => void;
}) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const res = await fetch("/api/watchlist", { cache: "no-store" });
      const json = (await res.json()) as { quotes: Quote[] };
      setQuotes(json.quotes);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 60_000);
    return () => clearInterval(id);
  }, []);

  async function remove(sym: string) {
    await fetch(`/api/watchlist?symbol=${encodeURIComponent(sym)}`, {
      method: "DELETE",
    });
    refresh();
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="px-2 pb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Watchlist
      </div>
      {loading ? (
        <div className="px-2 py-1 text-xs text-muted-foreground">Loading…</div>
      ) : quotes.length === 0 ? (
        <div className="px-2 py-1 text-xs text-muted-foreground">
          Ask the AI to add a stock.
        </div>
      ) : (
        quotes.map((q) => {
          const up = q.changePercent >= 0;
          return (
            <div
              key={q.symbol}
              className="group flex items-center justify-between gap-1 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
            >
              <button
                onClick={() => onAsk(`What's ${q.symbol} doing today?`)}
                className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left"
              >
                <div className="min-w-0">
                  <div className="font-medium">{q.symbol}</div>
                  <div className="truncate text-[10px] text-muted-foreground">
                    {q.name}
                  </div>
                </div>
                <div className="text-right">
                  <div className="tabular-nums text-xs">
                    {formatCurrency(q.price, q.currency)}
                  </div>
                  <div
                    className={cn(
                      "tabular-nums text-[10px] font-medium",
                      up ? "text-success" : "text-danger",
                    )}
                  >
                    {formatPercent(q.changePercent)}
                  </div>
                </div>
              </button>
              <button
                onClick={() => remove(q.symbol)}
                className="opacity-0 transition group-hover:opacity-100"
                aria-label={`Remove ${q.symbol}`}
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}
