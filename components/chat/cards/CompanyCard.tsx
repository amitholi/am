"use client";
import { ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCompact } from "@/lib/utils";
import type { CompanyProfile } from "@/lib/types";

export function CompanyCard({ profile }: { profile: CompanyProfile }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-semibold">{profile.name}</div>
            <div className="text-xs text-muted-foreground">
              {profile.symbol} · {profile.exchange} · {profile.country}
            </div>
          </div>
          {profile.website && (
            <a
              href={profile.website}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              Website <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
          <Cell label="Sector" value={profile.sector} />
          <Cell label="Industry" value={profile.industry} />
          <Cell
            label="Market Cap"
            value={profile.marketCap ? formatCompact(profile.marketCap) : "—"}
          />
          <Cell
            label="P/E"
            value={profile.peRatio ? profile.peRatio.toFixed(2) : "—"}
          />
          <Cell
            label="Dividend"
            value={
              profile.dividendYield
                ? `${(profile.dividendYield * 100).toFixed(2)}%`
                : "—"
            }
          />
          <Cell
            label="Employees"
            value={profile.employees ? formatCompact(profile.employees) : "—"}
          />
        </div>
        {profile.summary && (
          <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-muted-foreground">
            {profile.summary}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate font-medium">{value}</span>
    </div>
  );
}
