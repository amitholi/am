"use client";
import { useEffect, useRef } from "react";
import type { UIMessage } from "ai";
import { ChatMessage } from "@/components/chat/ChatMessage";
import type { useChat } from "@ai-sdk/react";

const SUGGESTIONS = [
  "What's AAPL trading at right now?",
  "Show me a 1-year chart for NVDA",
  "Compare MSFT, GOOGL, and AAPL",
  "Latest news on TSLA",
  "What does NVIDIA do? Add it to my watchlist.",
  "How has the S&P 500 done this year?",
];

export function ChatThread({
  messages,
  status,
  onSendMessage,
  onPickSuggestion,
}: {
  messages: UIMessage[];
  status: "submitted" | "streaming" | "ready" | "error";
  onSendMessage: ReturnType<typeof useChat>["sendMessage"];
  onPickSuggestion: (text: string) => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, status]);

  if (messages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-4 py-8">
        <div className="mb-1 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <span className="text-lg font-bold">$</span>
        </div>
        <h1 className="mt-3 text-2xl font-semibold">Stock Chat</h1>
        <p className="mt-1 max-w-md text-center text-sm text-muted-foreground">
          Ask about any stock — quotes, charts, news, comparisons, fundamentals.
          The AI calls live tools so numbers are always current.
        </p>
        <div className="mt-6 grid w-full max-w-xl gap-2 sm:grid-cols-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => onPickSuggestion(s)}
              className="rounded-lg border bg-card p-3 text-left text-sm hover:bg-accent"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      {messages.map((m, i) => (
        <ChatMessage
          key={m.id}
          message={m}
          isStreaming={
            status === "streaming" &&
            i === messages.length - 1 &&
            m.role === "assistant"
          }
          onSendMessage={onSendMessage}
        />
      ))}
      {status === "submitted" &&
        messages[messages.length - 1]?.role === "user" && (
          <div className="px-4 py-3 text-xs text-muted-foreground">
            Thinking
            <span className="caret-blink ml-0.5 inline-block h-3 w-0.5 align-middle" />
          </div>
        )}
      <div ref={bottomRef} />
    </div>
  );
}
