import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function ErrorCard({
  title = "Something went wrong",
  message,
}: {
  title?: string;
  message: string;
}) {
  return (
    <Card className="border-danger/40 bg-danger/5">
      <CardContent className="flex items-start gap-2 p-3">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
        <div className="min-w-0">
          <div className="text-sm font-medium">{title}</div>
          <div className="text-xs text-muted-foreground break-words">
            {message}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
