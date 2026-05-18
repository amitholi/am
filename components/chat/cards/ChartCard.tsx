"use client";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import type { ChartRange, OHLC } from "@/lib/types";

const RANGES: ChartRange[] = ["1D", "5D", "1M", "6M", "1Y", "5Y"];

export function ChartCard({
  symbol,
  range,
  candles,
}: {
  symbol: string;
  range: ChartRange;
  candles: OHLC[];
}) {
  const [activeRange, setActiveRange] = useState<ChartRange>(range);
  const [series, setSeries] = useState<OHLC[]>(candles);
  const [loading, setLoading] = useState(false);

  const data = useMemo(
    () =>
      series.map((c) => ({
        date: c.date,
        close: c.close,
        label:
          activeRange === "1D" || activeRange === "5D"
            ? new Date(c.date).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : new Date(c.date).toLocaleDateString([], {
                month: "short",
                day: "numeric",
              }),
      })),
    [series, activeRange],
  );

  const first = data[0]?.close ?? 0;
  const last = data[data.length - 1]?.close ?? 0;
  const up = last >= first;
  const color = up ? "var(--color-success)" : "var(--color-danger)";

  async function changeRange(r: ChartRange) {
    if (r === activeRange) return;
    setActiveRange(r);
    setLoading(true);
    try {
      const res = await fetch(
        `/api/chart?symbol=${encodeURIComponent(symbol)}&range=${r}`,
      );
      const json = (await res.json()) as { candles: OHLC[] };
      setSeries(json.candles);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div>
            <div className="font-semibold">{symbol}</div>
            <div className="text-xs text-muted-foreground">
              {data.length} points · {activeRange}
            </div>
          </div>
          <div className="flex gap-1">
            {RANGES.map((r) => (
              <Button
                key={r}
                size="sm"
                variant={r === activeRange ? "secondary" : "ghost"}
                className="h-7 px-2 text-xs"
                onClick={() => changeRange(r)}
                disabled={loading}
              >
                {r}
              </Button>
            ))}
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ left: 8, right: 8, top: 8 }}>
              <defs>
                <linearGradient
                  id={`g-${symbol}-${activeRange}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                stroke="var(--border)"
                minTickGap={28}
              />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                stroke="var(--border)"
                tickFormatter={(v) => formatCurrency(Number(v))}
                width={64}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(v: number) => formatCurrency(v)}
                labelFormatter={(l) => l as string}
              />
              <Area
                type="monotone"
                dataKey="close"
                stroke={color}
                fill={`url(#g-${symbol}-${activeRange})`}
                strokeWidth={1.8}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className={cn("mt-2 text-xs text-muted-foreground")}>
          {formatCurrency(first)} → {formatCurrency(last)}
        </div>
      </CardContent>
    </Card>
  );
}
