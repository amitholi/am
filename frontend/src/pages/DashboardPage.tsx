import { useQuery } from "@tanstack/react-query";
import {
  getStatsByYear,
  getStatsByType,
  getStatsByCourt,
  getTrends,
  getTopJudges,
  getOverviewStats,
} from "../api/client";
import { formatNumber } from "../utils/formatters";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const COLORS = ["#1e3a5f", "#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#c9a227", "#f59e0b", "#10b981", "#6366f1", "#ec4899"];

export default function DashboardPage() {
  const { data: overview } = useQuery({ queryKey: ["stats-overview"], queryFn: getOverviewStats });
  const { data: byYear } = useQuery({ queryKey: ["stats-by-year"], queryFn: getStatsByYear });
  const { data: byType } = useQuery({ queryKey: ["stats-by-type"], queryFn: getStatsByType });
  const { data: byCourt } = useQuery({ queryKey: ["stats-by-court"], queryFn: getStatsByCourt });
  const { data: trends } = useQuery({ queryKey: ["stats-trends"], queryFn: () => getTrends(24) });
  const { data: topJudges } = useQuery({ queryKey: ["top-judges"], queryFn: () => getTopJudges(10) });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6" dir="rtl">
      <h1 className="text-2xl font-bold text-legal-blue mb-6">דשבורד סטטיסטי</h1>

      {/* Overview cards */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "סך תיקים", value: formatNumber(overview.total_cases), icon: "📂", color: "from-blue-600 to-blue-700" },
            { label: "תיקים פתוחים", value: formatNumber(overview.open_cases), icon: "🟢", color: "from-green-500 to-green-600" },
            { label: "תובענות ייצוגיות", value: formatNumber(overview.class_actions), icon: "👥", color: "from-purple-600 to-purple-700" },
            { label: "שופטים רשומים", value: formatNumber(overview.total_judges), icon: "⚖️", color: "from-legal-blue to-blue-900" },
          ].map((s) => (
            <div key={s.label} className={`bg-gradient-to-br ${s.color} text-white rounded-xl p-5 shadow-sm`}>
              <div className="text-3xl mb-2">{s.icon}</div>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-sm opacity-80 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Trends line chart */}
        {trends && trends.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-gray-700 mb-4">תיקים חדשים — 24 חודשים</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={40} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#1e3a5f"
                  strokeWidth={2}
                  dot={false}
                  name="תיקים"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* By type pie */}
        {byType && byType.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-gray-700 mb-4">התפלגות סוגי הליכים</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={byType.slice(0, 8)}
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ type, percent }) =>
                    percent > 0.03 ? `${type} ${(percent * 100).toFixed(0)}%` : ""
                  }
                  labelLine={false}
                >
                  {byType.slice(0, 8).map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => formatNumber(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* By year bar */}
        {byYear && byYear.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-gray-700 mb-4">תיקים לפי שנה</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={byYear.slice(-15)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => formatNumber(v)} />
                <Bar dataKey="count" fill="#1e3a5f" name="תיקים" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* By court bar */}
        {byCourt && byCourt.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-gray-700 mb-4">תיקים לפי בית משפט (Top 10)</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={byCourt.slice(0, 10)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={130} />
                <Tooltip formatter={(v: any) => formatNumber(v)} />
                <Bar dataKey="count" fill="#2563eb" name="תיקים" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top judges */}
      {topJudges && topJudges.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-bold text-gray-700 mb-4">Top 10 שופטים לפי מספר תיקים</h2>
          <div className="overflow-x-auto">
            <table className="table-hebrew">
              <thead>
                <tr>
                  <th>#</th>
                  <th>שם</th>
                  <th>תואר</th>
                  <th>מספר תיקים</th>
                </tr>
              </thead>
              <tbody>
                {topJudges.map((j: any, i: number) => (
                  <tr key={j.id}>
                    <td className="text-gray-400 font-mono">{i + 1}</td>
                    <td>
                      <a href={`/judges/${j.id}`} className="text-blue-600 hover:underline font-medium">
                        {j.name}
                      </a>
                    </td>
                    <td className="text-gray-500">{j.title || "—"}</td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div
                          className="h-2 rounded-full bg-legal-blue"
                          style={{ width: `${Math.min(100, (j.count / (topJudges[0]?.count || 1)) * 120)}px` }}
                        />
                        <span className="font-semibold text-legal-blue">{formatNumber(j.count)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
