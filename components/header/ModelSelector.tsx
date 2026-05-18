"use client";
import { cn } from "@/lib/utils";

export function ModelSelector({
  value,
  onChange,
}: {
  value: "sonnet" | "haiku";
  onChange: (v: "sonnet" | "haiku") => void;
}) {
  return (
    <div className="inline-flex h-8 items-center rounded-md border bg-muted/40 p-0.5 text-xs">
      {(["sonnet", "haiku"] as const).map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={cn(
            "rounded-sm px-2 py-1 font-medium transition",
            value === opt
              ? "bg-background shadow"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {opt === "sonnet" ? "Sonnet 4.5" : "Haiku 4.5"}
        </button>
      ))}
    </div>
  );
}
