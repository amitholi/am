"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowDownRight, ArrowUpRight, Plus } from "lucide-react";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import type { Quote } from "@/lib/types";
import {
  cn,
  formatCompact,
  formatCurrency,
  formatPercent,
} from "@/lib/utils";

export function QuoteCard({
  quote,
  onAdd,
}: {
  quote: Quote;
  onAdd?: (symbol: string) => void;
}) {
  const up = quote.change >= 0;
  const tone = up ? "text-success" : "text-danger";
  const bg = up ? "bg-success/10" : "bg-danger/10";
  const spark = (quote.sparkline ?? []).map((v, i) => ({ i, v }));

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="font-bold tracking-wide">{quote.symbol}</span>
              <span className="truncate text-xs text-muted-foreground">
                {quote.name}
              </span>
            </div>
            <div className="mt-1 text-3xl font-semibold tabular-nums">
              {formatCurrency(quote.price, quote.currency)}
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm">
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium",
                  bg,
                  tone,
                )}
              >
                {up ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {formatPercent(quote.changePercent)}
              </span>
              <span className={cn("tabular-nums", tone)}>
                {up ? "+" : ""}
                {formatCurrency(quote.change, quote.currency)}
              </span>
              <span className="text-xs text-muted-foreground">
                {quote.marketState === "REGULAR" ? "Live" : quote.marketState}
              </span>
            </div>
          </div>
          {spark.length > 1 && (
            <div className="h-12 w-28 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={spark}>
                  <Line
                    type="monotone"
                    dataKey="v"
                    stroke={up ? "var(--color-success)" : "var(--color-danger)"}
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
          <Cell label="Open" value={formatCurrency(quote.open, quote.currency)} />
          <Cell
            label="Prev"
            value={formatCurrency(quote.previousClose, quote.currency)}
          />
          <Cell
            label="Range"
            value={`${formatCurrency(quote.dayLow, quote.currency)} – ${formatCurrency(
              quote.dayHigh,
              quote.currency,
            )}`}
          />
          <Cell label="Vol" value={formatCompact(quote.volume)} />
        </div>
        {onAdd && (
          <div className="mt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAdd(quote.symbol)}
            >
              <Plus className="h-3 w-3" />
              Add to watchlist
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate font-medium tabular-nums">{value}</span>
    </div>
  );
}
