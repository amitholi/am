"use client";
import { Menu, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/header/ThemeToggle";
import { ModelSelector } from "@/components/header/ModelSelector";

export function Header({
  onOpenMenu,
  model,
  onModelChange,
}: {
  onOpenMenu: () => void;
  model: "sonnet" | "haiku";
  onModelChange: (m: "sonnet" | "haiku") => void;
}) {
  return (
    <header className="flex h-12 items-center justify-between gap-2 border-b px-2 sm:px-4">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onOpenMenu}
          aria-label="Menu"
        >
          <Menu className="h-4 w-4" />
        </Button>
        <span className="font-semibold tracking-tight">Stock Chat</span>
      </div>
      <div className="flex items-center gap-2">
        <ModelSelector value={model} onChange={onModelChange} />
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon"
          aria-label="Settings"
          onClick={() =>
            alert(
              "Settings — coming soon. Edit .env.local for API keys, run `npm run seed` to seed watchlist.",
            )
          }
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
