"use client";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Watchlist } from "@/components/sidebar/Watchlist";
import { ChatHistory } from "@/components/sidebar/ChatHistory";

export function Sidebar({
  onNewChat,
  onSelectChat,
  currentChatId,
  historyRefreshKey,
  onAskFromWatchlist,
  onChatDeleted,
}: {
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  currentChatId: string | null;
  historyRefreshKey: number;
  onAskFromWatchlist: (q: string) => void;
  onChatDeleted: (id: string) => void;
}) {
  return (
    <div className="flex h-full w-full flex-col gap-2 border-r bg-background p-2">
      <Button onClick={onNewChat} size="sm" className="w-full justify-start">
        <Plus className="h-4 w-4" />
        New chat
      </Button>
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-3 pr-2">
          <Watchlist onAsk={onAskFromWatchlist} />
          <ChatHistory
            currentId={currentChatId}
            onSelect={onSelectChat}
            onDeleted={onChatDeleted}
            refreshKey={historyRefreshKey}
          />
        </div>
      </ScrollArea>
      <div className="border-t pt-2 text-[10px] leading-tight text-muted-foreground">
        Not investment advice. Data may be delayed.
      </div>
    </div>
  );
}
