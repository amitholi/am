"use client";
import { ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn, timeAgo } from "@/lib/utils";
import type { NewsItem } from "@/lib/types";

function faviconUrl(url: string) {
  try {
    const u = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=32`;
  } catch {
    return "";
  }
}

function sentimentTone(s: NewsItem["sentiment"]) {
  switch (s) {
    case "positive":
      return "bg-success/15 text-success";
    case "negative":
      return "bg-danger/15 text-danger";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function NewsList({
  symbol,
  items,
}: {
  symbol: string;
  items: NewsItem[];
}) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {symbol} — latest news
        </div>
        {items.length === 0 ? (
          <div className="px-1 py-4 text-sm text-muted-foreground">
            No recent headlines.
          </div>
        ) : (
          <ul className="divide-y">
            {items.map((n) => (
              <li key={n.id}>
                <a
                  href={n.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-start gap-2 rounded-md px-1 py-2 hover:bg-accent"
                >
                  {faviconUrl(n.url) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={faviconUrl(n.url)}
                      alt=""
                      className="mt-0.5 h-4 w-4 shrink-0 rounded-sm"
                    />
                  ) : (
                    <span className="mt-0.5 h-4 w-4 shrink-0 rounded-sm bg-muted" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-2 text-sm font-medium leading-snug">
                      {n.headline}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="truncate">{n.source}</span>
                      <span>·</span>
                      <span>{timeAgo(n.publishedAt)}</span>
                      {n.sentiment && (
                        <span
                          className={cn(
                            "rounded px-1 py-0.5 text-[10px] font-medium",
                            sentimentTone(n.sentiment),
                          )}
                        >
                          {n.sentiment}
                        </span>
                      )}
                    </div>
                  </div>
                  <ExternalLink className="mt-1 h-3 w-3 shrink-0 text-muted-foreground" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
