"use client";
import { useEffect, useState } from "react";
import { MessageSquare, Trash2 } from "lucide-react";
import type { ChatRow } from "@/lib/db";
import { cn } from "@/lib/utils";

export function ChatHistory({
  currentId,
  onSelect,
  onDeleted,
  refreshKey,
}: {
  currentId: string | null;
  onSelect: (id: string) => void;
  onDeleted: (id: string) => void;
  refreshKey: number;
}) {
  const [chats, setChats] = useState<ChatRow[]>([]);

  async function load() {
    try {
      const res = await fetch("/api/chats", { cache: "no-store" });
      const j = (await res.json()) as { chats: ChatRow[] };
      setChats(j.chats);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    load();
  }, [refreshKey]);

  async function remove(id: string) {
    await fetch(`/api/chats?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    onDeleted(id);
    load();
  }

  if (chats.length === 0) return null;

  return (
    <div className="flex flex-col gap-0.5">
      <div className="px-2 pb-1 pt-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        History
      </div>
      {chats.map((c) => (
        <div
          key={c.id}
          className={cn(
            "group flex items-center gap-1 rounded-md px-2 py-1.5 text-sm hover:bg-accent",
            c.id === currentId && "bg-accent",
          )}
        >
          <button
            onClick={() => onSelect(c.id)}
            className="flex min-w-0 flex-1 items-center gap-2 text-left"
          >
            <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{c.title || "Untitled"}</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              remove(c.id);
            }}
            className="opacity-0 transition group-hover:opacity-100"
            aria-label="Delete chat"
          >
            <Trash2 className="h-3 w-3 text-muted-foreground hover:text-danger" />
          </button>
        </div>
      ))}
    </div>
  );
}
