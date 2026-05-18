"use client";
import { useEffect, useRef, useState } from "react";
import type { SymbolSearchResult } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SymbolAutocomplete({
  query,
  onPick,
}: {
  query: string;
  onPick: (sym: string) => void;
}) {
  const [results, setResults] = useState<SymbolSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const m = query.match(/\$?([A-Za-z]{1,5})$/);
    const tag = m?.[1];
    if (!tag || tag.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(tag)}`);
        const j = (await res.json()) as { results: SymbolSearchResult[] };
        setResults(j.results.slice(0, 6));
        setOpen(j.results.length > 0);
      } catch {
        setOpen(false);
      }
    }, 150);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  if (!open || results.length === 0) return null;

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 max-h-60 overflow-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg">
      {results.map((r) => (
        <button
          key={`${r.symbol}-${r.exchange}`}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            onPick(r.symbol);
            setOpen(false);
          }}
          className={cn(
            "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent",
          )}
        >
          <span>
            <span className="font-semibold">{r.symbol}</span>{" "}
            <span className="text-xs text-muted-foreground">{r.name}</span>
          </span>
          {r.exchange && (
            <span className="text-xs text-muted-foreground">{r.exchange}</span>
          )}
        </button>
      ))}
    </div>
  );
}
