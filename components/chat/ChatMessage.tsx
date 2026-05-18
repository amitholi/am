"use client";
import { useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import ReactMarkdown from "react-markdown";
import type { UIMessage } from "ai";
import { QuoteCard } from "@/components/chat/cards/QuoteCard";
import { ChartCard } from "@/components/chat/cards/ChartCard";
import { NewsList } from "@/components/chat/cards/NewsList";
import { ComparisonTable } from "@/components/chat/cards/ComparisonTable";
import { CompanyCard } from "@/components/chat/cards/CompanyCard";
import { WatchlistChip } from "@/components/chat/cards/WatchlistChip";
import { ErrorCard } from "@/components/chat/cards/ErrorCard";
import { ToolSpinner } from "@/components/chat/cards/ToolSpinner";
import type {
  ChartRange,
  CompanyProfile,
  ComparisonRow,
  NewsItem,
  OHLC,
  Quote,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type ChatLike = ReturnType<typeof useChat>;

const TOOL_LABELS: Record<string, string> = {
  getQuote: "Fetching quote",
  getChart: "Loading chart",
  getCompany: "Loading company profile",
  getNews: "Searching news",
  compareStocks: "Comparing",
  addToWatchlist: "Updating watchlist",
  removeFromWatchlist: "Updating watchlist",
  getWatchlist: "Loading watchlist",
};

function toolName(part: { type: string }): string | null {
  if (part.type.startsWith("tool-")) return part.type.slice("tool-".length);
  return null;
}

export function ChatMessage({
  message,
  isStreaming,
  onSendMessage,
}: {
  message: UIMessage;
  isStreaming: boolean;
  onSendMessage?: ChatLike["sendMessage"];
}) {
  const isUser = message.role === "user";
  const parts = useMemo(() => message.parts ?? [], [message.parts]);

  return (
    <div
      className={cn(
        "flex w-full gap-3 px-3 py-3 sm:px-4",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {!isUser && (
        <div className="mt-1 hidden h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold sm:flex">
          AI
        </div>
      )}
      <div
        className={cn(
          "flex max-w-[min(800px,calc(100%-2rem))] flex-col gap-2",
          isUser ? "items-end" : "items-start",
        )}
      >
        {parts.map((part, idx) => {
          if (part.type === "text") {
            const text = (part as { text: string }).text;
            return (
              <div
                key={idx}
                className={cn(
                  "max-w-full rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  isUser
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-card-foreground",
                )}
              >
                <div className="prose prose-sm dark:prose-invert max-w-none break-words whitespace-pre-wrap">
                  <ReactMarkdown>{text}</ReactMarkdown>
                </div>
                {!isUser &&
                  isStreaming &&
                  idx === parts.length - 1 && (
                    <span className="caret-blink ml-0.5 inline-block h-3.5 align-middle" />
                  )}
              </div>
            );
          }

          const name = toolName(part);
          if (!name) return null;

          const state = (part as { state?: string }).state;
          const input = (part as { input?: unknown }).input as
            | Record<string, unknown>
            | undefined;
          const output = (part as { output?: unknown }).output;
          const errorText = (part as { errorText?: string }).errorText;

          if (state === "output-error" || errorText) {
            return (
              <ErrorCard
                key={idx}
                title={`${name} failed`}
                message={errorText ?? "Tool returned an error."}
              />
            );
          }

          if (state !== "output-available") {
            const label = TOOL_LABELS[name] ?? "Working";
            const sym =
              input && typeof input.symbol === "string"
                ? ` ${input.symbol.toUpperCase()}…`
                : "…";
            return <ToolSpinner key={idx} label={`${label}${sym}`} />;
          }

          return (
            <div key={idx} className="w-full">
              <ToolResult
                name={name}
                output={output}
                onAdd={
                  onSendMessage
                    ? (sym) =>
                        onSendMessage({ text: `Add ${sym} to my watchlist` })
                    : undefined
                }
              />
            </div>
          );
        })}
      </div>
      {isUser && (
        <div className="mt-1 hidden h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold sm:flex">
          You
        </div>
      )}
    </div>
  );
}

function ToolResult({
  name,
  output,
  onAdd,
}: {
  name: string;
  output: unknown;
  onAdd?: (sym: string) => void;
}) {
  if (!output || typeof output !== "object") return null;
  switch (name) {
    case "getQuote":
      return <QuoteCard quote={output as Quote} onAdd={onAdd} />;
    case "getChart": {
      const o = output as { symbol: string; range: ChartRange; candles: OHLC[] };
      return <ChartCard symbol={o.symbol} range={o.range} candles={o.candles} />;
    }
    case "getCompany":
      return <CompanyCard profile={output as CompanyProfile} />;
    case "getNews": {
      const o = output as { symbol: string; items: NewsItem[] };
      return <NewsList symbol={o.symbol} items={o.items} />;
    }
    case "compareStocks":
      return <ComparisonTable rows={(output as { rows: ComparisonRow[] }).rows} />;
    case "addToWatchlist":
    case "removeFromWatchlist": {
      const o = output as { symbol: string; action: "added" | "removed" };
      return <WatchlistChip symbol={o.symbol} action={o.action} />;
    }
    case "getWatchlist": {
      const o = output as { quotes: Quote[] };
      if (!o.quotes?.length) {
        return (
          <div className="rounded-xl border bg-muted/30 p-3 text-sm text-muted-foreground">
            Your watchlist is empty.
          </div>
        );
      }
      return (
        <div className="grid w-full gap-2 sm:grid-cols-2">
          {o.quotes.map((q) => (
            <QuoteCard key={q.symbol} quote={q} />
          ))}
        </div>
      );
    }
    default:
      return null;
  }
}
