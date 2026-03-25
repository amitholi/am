import type { SearchFacets } from "../types";

interface Props {
  facets?: SearchFacets;
  activeFilters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
}

export default function FacetPanel({ facets, activeFilters, onFilterChange }: Props) {
  if (!facets) return null;

  const toggle = (key: string, value: string) => {
    if (activeFilters[key] === value) {
      onFilterChange(key, "");
    } else {
      onFilterChange(key, value);
    }
  };

  return (
    <div className="space-y-6">
      {/* Case Types */}
      {facets.case_types.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-700 mb-3 text-sm">סוג הליך</h3>
          <div className="space-y-1">
            {facets.case_types.map((f) => (
              <button
                key={f.value}
                onClick={() => toggle("case_type", f.value || "")}
                className={`w-full text-right flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeFilters.case_type === f.value
                    ? "bg-blue-100 text-blue-800 font-medium"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                <span className="font-mono text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                  {f.count.toLocaleString()}
                </span>
                <span>{f.value}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Status */}
      {facets.statuses.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-700 mb-3 text-sm">סטטוס</h3>
          <div className="space-y-1">
            {facets.statuses.map((f) => (
              <button
                key={f.value}
                onClick={() => toggle("status", f.value || "")}
                className={`w-full text-right flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeFilters.status === f.value
                    ? "bg-green-100 text-green-800 font-medium"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                <span className="font-mono text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                  {f.count.toLocaleString()}
                </span>
                <span>{f.value}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Courts */}
      {facets.courts.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-700 mb-3 text-sm">בית משפט</h3>
          <div className="space-y-1">
            {facets.courts.slice(0, 10).map((f) => (
              <button
                key={f.id}
                onClick={() => toggle("court_id", String(f.id))}
                className={`w-full text-right flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeFilters.court_id === String(f.id)
                    ? "bg-purple-100 text-purple-800 font-medium"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                <span className="font-mono text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                  {f.count.toLocaleString()}
                </span>
                <span className="truncate ml-2">{f.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Years */}
      {facets.years.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-700 mb-3 text-sm">שנה</h3>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {facets.years.map((f) => (
              <button
                key={f.year}
                onClick={() => {
                  const y = String(f.year);
                  if (activeFilters.date_from === `${y}-01-01`) {
                    onFilterChange("date_from", "");
                    onFilterChange("date_to", "");
                  } else {
                    onFilterChange("date_from", `${y}-01-01`);
                    onFilterChange("date_to", `${y}-12-31`);
                  }
                }}
                className={`w-full text-right flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeFilters.date_from === `${f.year}-01-01`
                    ? "bg-orange-100 text-orange-800 font-medium"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                <span className="font-mono text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                  {f.count.toLocaleString()}
                </span>
                <span>{f.year}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Clear filters */}
      {Object.values(activeFilters).some(Boolean) && (
        <button
          onClick={() => {
            ["case_type", "status", "court_id", "date_from", "date_to"].forEach(
              (k) => onFilterChange(k, "")
            );
          }}
          className="w-full py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
        >
          נקה פילטרים ✕
        </button>
      )}
    </div>
  );
}
