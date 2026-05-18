"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Header } from "@/components/header/Header";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { ChatThread } from "@/components/chat/ChatThread";
import { ChatInput } from "@/components/chat/ChatInput";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";

function newId() {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  );
}

export default function Page() {
  const [chatId, setChatId] = useState<string | null>(null);
  const [model, setModel] = useState<"sonnet" | "haiku">("sonnet");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [historyKey, setHistoryKey] = useState(0);
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("stockchat:lastChatId");
    setChatId(saved ?? newId());
  }, []);

  useEffect(() => {
    if (!chatId) return;
    localStorage.setItem("stockchat:lastChatId", chatId);
  }, [chatId]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ messages, id }) => ({
          body: { messages, id, model },
        }),
      }),
    [model],
  );

  const { messages, sendMessage, stop, status, setMessages } = useChat({
    id: chatId ?? undefined,
    transport,
    messages: initialMessages,
  });

  const loadingRef = useRef<string | null>(null);
  useEffect(() => {
    if (!chatId || loadingRef.current === chatId) return;
    loadingRef.current = chatId;
    fetch(`/api/chats/${chatId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        const ms = data.messages as UIMessage[];
        if (ms?.length) {
          setInitialMessages(ms);
          setMessages(ms);
        } else {
          setMessages([]);
        }
      })
      .catch(() => undefined);
  }, [chatId, setMessages]);

  const onSend = useCallback(
    (text: string) => {
      sendMessage({ text });
      setTimeout(() => setHistoryKey((k) => k + 1), 800);
    },
    [sendMessage],
  );

  const onNewChat = useCallback(() => {
    setChatId(newId());
    setMessages([]);
    setSidebarOpen(false);
  }, [setMessages]);

  const onSelectChat = useCallback((id: string) => {
    setChatId(id);
    loadingRef.current = null;
    setSidebarOpen(false);
  }, []);

  const onChatDeleted = useCallback(
    (id: string) => {
      if (id === chatId) onNewChat();
    },
    [chatId, onNewChat],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        onNewChat();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const ta = document.querySelector("textarea");
        if (ta instanceof HTMLTextAreaElement) {
          ta.focus();
          ta.setSelectionRange(ta.value.length, ta.value.length);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onNewChat]);

  const sidebar = (
    <Sidebar
      onNewChat={onNewChat}
      onSelectChat={onSelectChat}
      currentChatId={chatId}
      historyRefreshKey={historyKey}
      onAskFromWatchlist={onSend}
      onChatDeleted={onChatDeleted}
    />
  );

  return (
    <div className="flex h-screen w-screen flex-col">
      <Header
        onOpenMenu={() => setSidebarOpen(true)}
        model={model}
        onModelChange={setModel}
      />
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-64 shrink-0 lg:flex">{sidebar}</aside>
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-72 p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            {sidebar}
          </SheetContent>
        </Sheet>
        <main className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <ChatThread
              messages={messages}
              status={status}
              onSendMessage={sendMessage}
              onPickSuggestion={onSend}
            />
          </div>
          <div className="border-t bg-background/95 px-3 pb-3 pt-2 backdrop-blur sm:px-4">
            <div className="mx-auto w-full max-w-3xl">
              <ChatInput status={status} onSend={onSend} onStop={stop} />
              <div className="mt-1.5 px-1 text-center text-[10px] text-muted-foreground">
                Not investment advice. Data may be delayed. ⌘N new chat · ⌘K
                focus input.
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
