"use client";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatCompact, formatCurrency, formatPercent } from "@/lib/utils";
import type { ComparisonRow } from "@/lib/types";

export function ComparisonTable({ rows }: { rows: ComparisonRow[] }) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Symbol</th>
                <th className="px-3 py-2 text-right font-medium">Price</th>
                <th className="px-3 py-2 text-right font-medium">Change</th>
                <th className="px-3 py-2 text-right font-medium">Mkt Cap</th>
                <th className="px-3 py-2 text-right font-medium">P/E</th>
                <th className="px-3 py-2 text-right font-medium">Yield</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const up = r.changePercent >= 0;
                return (
                  <tr key={r.symbol} className="border-b last:border-0">
                    <td className="px-3 py-2">
                      <div className="font-semibold">{r.symbol}</div>
                      <div className="truncate text-xs text-muted-foreground max-w-[120px]">
                        {r.name}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatCurrency(r.price)}
                    </td>
                    <td
                      className={cn(
                        "px-3 py-2 text-right tabular-nums",
                        up ? "text-success" : "text-danger",
                      )}
                    >
                      {formatPercent(r.changePercent)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {r.marketCap ? formatCompact(r.marketCap) : "—"}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {r.peRatio ? r.peRatio.toFixed(2) : "—"}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {r.dividendYield
                        ? `${(r.dividendYield * 100).toFixed(2)}%`
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
