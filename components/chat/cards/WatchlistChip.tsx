"use client";
import { Check, Star, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function WatchlistChip({
  symbol,
  action,
}: {
  symbol: string;
  action: "added" | "removed";
}) {
  const added = action === "added";
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-sm shadow-sm",
        added ? "border-success/40" : "border-danger/40",
      )}
    >
      <span
        className={cn(
          "inline-flex h-5 w-5 items-center justify-center rounded-full",
          added ? "bg-success/15 text-success" : "bg-danger/15 text-danger",
        )}
      >
        {added ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      </span>
      <Star className="h-3.5 w-3.5" />
      <span className="font-medium">{symbol}</span>
      <span className="text-muted-foreground">
        {added ? "added to watchlist" : "removed from watchlist"}
      </span>
    </div>
  );
}
