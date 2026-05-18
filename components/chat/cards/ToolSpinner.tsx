import { Loader2 } from "lucide-react";

export function ToolSpinner({ label }: { label: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
      <Loader2 className="h-3 w-3 animate-spin" />
      {label}
    </div>
  );
}
