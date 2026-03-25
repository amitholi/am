export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("he-IL", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("he-IL", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export function getStatusBadge(status?: string): string {
  switch (status) {
    case "פתוח":
      return "badge-open";
    case "סגור":
      return "badge-closed";
    case "מחוק":
      return "badge-deleted";
    default:
      return "badge-case-type";
  }
}

export function getCaseTypeBadge(): string {
  return "badge-case-type";
}

export function formatNumber(n?: number): string {
  if (n === undefined || n === null) return "0";
  return n.toLocaleString("he-IL");
}

export function getPartyTypeBadge(partyType?: string): string {
  switch (partyType) {
    case "תובע":
    case "מבקש":
    case "מערער":
      return "bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full";
    case "נתבע":
    case "משיב":
      return "bg-orange-100 text-orange-800 text-xs px-2 py-0.5 rounded-full";
    default:
      return "bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full";
  }
}
