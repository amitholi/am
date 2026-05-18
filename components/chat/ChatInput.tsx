"use client";
import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowUp, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SymbolAutocomplete } from "@/components/chat/SymbolAutocomplete";
import { cn } from "@/lib/utils";

export function ChatInput({
  status,
  onSend,
  onStop,
}: {
  status: "submitted" | "streaming" | "ready" | "error";
  onSend: (text: string) => void;
  onStop: () => void;
}) {
  const [value, setValue] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);
  const busy = status === "streaming" || status === "submitted";

  function submit(e?: FormEvent) {
    e?.preventDefault();
    const v = value.trim();
    if (!v || busy) return;
    onSend(v);
    setValue("");
    if (taRef.current) taRef.current.style.height = "auto";
  }

  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function pickSymbol(sym: string) {
    const before = value.replace(/\$?([A-Za-z]{1,5})$/, "");
    const next = `${before}${sym} `;
    setValue(next);
    requestAnimationFrame(() => taRef.current?.focus());
  }

  return (
    <form onSubmit={submit} className="relative">
      <SymbolAutocomplete query={value} onPick={pickSymbol} />
      <div
        className={cn(
          "flex items-end gap-2 rounded-2xl border bg-card p-2 shadow-sm focus-within:ring-2 focus-within:ring-ring",
        )}
      >
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            const t = e.currentTarget;
            t.style.height = "auto";
            t.style.height = Math.min(160, t.scrollHeight) + "px";
          }}
          onKeyDown={onKey}
          rows={1}
          placeholder="Ask about a stock — try 'price of AAPL' or 'compare NVDA vs TSLA'"
          className="max-h-40 min-h-[28px] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
        />
        {busy ? (
          <Button
            type="button"
            size="icon"
            variant="secondary"
            onClick={onStop}
            aria-label="Stop"
          >
            <Square className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button
            type="submit"
            size="icon"
            disabled={!value.trim()}
            aria-label="Send"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        )}
      </div>
    </form>
  );
}
