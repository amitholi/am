import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listJudges } from "../api/client";

export default function JudgesListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["judges-list", page],
    queryFn: () => listJudges(undefined, page),
  });

  const filtered = search
    ? (data?.items || []).filter((j: any) => j.name.includes(search))
    : data?.items || [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6" dir="rtl">
      <h1 className="text-2xl font-bold text-legal-blue mb-6">שופטים</h1>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="חפש שם שופט..."
          className="w-full rounded-lg border border-gray-200 py-2.5 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          dir="rtl"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-100 p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="table-hebrew">
            <thead>
              <tr>
                <th>שם</th>
                <th>תואר</th>
                <th>בית משפט</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((judge: any) => (
                <tr key={judge.id}>
                  <td>
                    <Link to={`/judges/${judge.id}`} className="text-blue-600 hover:underline font-medium">
                      {judge.name}
                    </Link>
                  </td>
                  <td className="text-gray-500">{judge.title || "—"}</td>
                  <td className="text-gray-500">{judge.court_name || "—"}</td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={3} className="text-center text-gray-400 py-8">לא נמצאו שופטים</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {data?.total > 50 && (
        <div className="flex justify-center gap-3 mt-6">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            הקודם
          </button>
          <span className="flex items-center text-gray-600 text-sm">
            עמוד {page}
          </span>
          <button
            disabled={filtered.length < 50}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            הבא
          </button>
        </div>
      )}
    </div>
  );
}
