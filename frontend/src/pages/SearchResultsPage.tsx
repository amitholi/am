import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { searchCases } from "../api/client";
import CaseCard from "../components/CaseCard";
import FacetPanel from "../components/FacetPanel";
import type { SearchParams } from "../types";

const SORT_OPTIONS = [
  { value: "relevance", label: "רלוונטיות" },
  { value: "date_desc", label: "תאריך (חדש לישן)" },
  { value: "date_asc", label: "תאריך (ישן לחדש)" },
  { value: "case_number", label: "מספר תיק" },
];

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const getParam = (key: string) => searchParams.get(key) || "";

  const [localQ, setLocalQ] = useState(getParam("q"));

  const params: SearchParams = {
    q: getParam("q") || undefined,
    case_type: getParam("case_type") || undefined,
    court_id: getParam("court_id") ? Number(getParam("court_id")) : undefined,
    date_from: getParam("date_from") || undefined,
    date_to: getParam("date_to") || undefined,
    status: getParam("status") || undefined,
    judge_name: getParam("judge_name") || undefined,
    page: Number(getParam("page")) || 1,
    per_page: 20,
    sort: getParam("sort") || "relevance",
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["search", params],
    queryFn: () => searchCases(params),
    keepPreviousData: true,
  } as any);

  useEffect(() => {
    setLocalQ(getParam("q"));
  }, [searchParams]);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.delete("page");
    setSearchParams(next);
  };

  const activeFilters: Record<string, string> = {
    case_type: getParam("case_type"),
    status: getParam("status"),
    court_id: getParam("court_id"),
    date_from: getParam("date_from"),
    date_to: getParam("date_to"),
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam("q", localQ);
  };

  const totalPages = (data as any)?.pages || 0;
  const currentPage = params.page || 1;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6" dir="rtl">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <input
          type="text"
          value={localQ}
          onChange={(e) => setLocalQ(e.target.value)}
          placeholder="חיפוש חופשי בעברית..."
          className="flex-1 rounded-xl border border-gray-200 py-3 px-5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          dir="rtl"
        />
        <select
          value={getParam("sort") || "relevance"}
          onChange={(e) => updateParam("sort", e.target.value)}
          className="rounded-xl border border-gray-200 py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <button
          type="submit"
          className="bg-legal-blue text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-800 transition-colors"
        >
          חפש
        </button>
      </form>

      {/* Date range */}
      <div className="flex items-center gap-3 mb-6 text-sm flex-wrap">
        <span className="text-gray-500">תאריך הגשה:</span>
        <input
          type="date"
          value={getParam("date_from")}
          onChange={(e) => updateParam("date_from", e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-gray-400">עד</span>
        <input
          type="date"
          value={getParam("date_to")}
          onChange={(e) => updateParam("date_to", e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          value={getParam("judge_name")}
          onChange={(e) => updateParam("judge_name", e.target.value)}
          placeholder="שופט..."
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-36"
        />
      </div>

      <div className="flex gap-6">
        {/* Facets sidebar */}
        <aside className="w-56 flex-shrink-0 hidden lg:block">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-gray-700 mb-4 text-sm uppercase tracking-wide">סינון תוצאות</h2>
            <FacetPanel
              facets={(data as any)?.facets}
              activeFilters={activeFilters}
              onFilterChange={updateParam}
            />
          </div>
        </aside>

        {/* Results */}
        <main className="flex-1 min-w-0">
          {/* Results header */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-gray-600 text-sm">
              {isLoading ? (
                "טוען..."
              ) : (data as any)?.total !== undefined ? (
                <span>נמצאו <strong>{(data as any).total.toLocaleString()}</strong> תיקים</span>
              ) : null}
            </div>
            {/* Active filter chips */}
            <div className="flex flex-wrap gap-2">
              {Object.entries(activeFilters).map(([k, v]) =>
                v ? (
                  <span
                    key={k}
                    className="flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full cursor-pointer hover:bg-blue-200"
                    onClick={() => updateParam(k, "")}
                  >
                    {v} ✕
                  </span>
                ) : null
              )}
            </div>
          </div>

          {isLoading && (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              ))}
            </div>
          )}

          {isError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <div className="text-4xl mb-3">⚠️</div>
              <p className="text-red-700">שגיאה בטעינת תוצאות. נסה שוב.</p>
            </div>
          )}

          {!isLoading && !isError && (data as any)?.items?.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">לא נמצאו תיקים</h3>
              <p className="text-gray-500">נסה לשנות את מונחי החיפוש או הפילטרים</p>
            </div>
          )}

          <div className="space-y-3">
            {(data as any)?.items?.map((case_: any) => (
              <CaseCard key={case_.id} case_={case_} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                disabled={currentPage <= 1}
                onClick={() => updateParam("page", String(currentPage - 1))}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                הקודם
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                  let page: number;
                  if (totalPages <= 7) {
                    page = i + 1;
                  } else if (currentPage <= 4) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 3) {
                    page = totalPages - 6 + i;
                  } else {
                    page = currentPage - 3 + i;
                  }
                  return (
                    <button
                      key={page}
                      onClick={() => updateParam("page", String(page))}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                        page === currentPage
                          ? "bg-legal-blue text-white"
                          : "border border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => updateParam("page", String(currentPage + 1))}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                הבא
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
