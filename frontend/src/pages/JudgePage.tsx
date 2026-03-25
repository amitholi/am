import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getJudge, getJudgeStats, getJudgeCases } from "../api/client";
import { formatDate, formatNumber, getStatusBadge, getCaseTypeBadge } from "../utils/formatters";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#1e3a5f", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe", "#dbeafe"];

export default function JudgePage() {
  const { id } = useParams<{ id: string }>();
  const judgeId = Number(id);

  const { data: judge, isLoading } = useQuery({
    queryKey: ["judge", judgeId],
    queryFn: () => getJudge(judgeId),
  });

  const { data: stats } = useQuery({
    queryKey: ["judge-stats", judgeId],
    queryFn: () => getJudgeStats(judgeId),
  });

  const { data: cases } = useQuery({
    queryKey: ["judge-cases", judgeId],
    queryFn: () => getJudgeCases(judgeId),
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-100 rounded w-1/4" />
      </div>
    );
  }

  if (!judge) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-700">שופט לא נמצא</h1>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6" dir="rtl">
      <nav className="text-sm text-gray-500 mb-4">
        <Link to="/" className="hover:text-blue-600">ראשי</Link> / {" "}
        <Link to="/judges" className="hover:text-blue-600">שופטים</Link> / {" "}
        <span className="text-gray-800">{judge.name}</span>
      </nav>

      {/* Profile */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 bg-legal-blue rounded-full flex items-center justify-center text-white text-2xl flex-shrink-0">
            ⚖️
          </div>
          <div>
            <h1 className="text-2xl font-bold text-legal-blue">{judge.name}</h1>
            {judge.title && <div className="text-gray-600 mt-1">{judge.title}</div>}
            {judge.court_name && (
              <div className="flex items-center gap-2 text-gray-500 text-sm mt-2">
                <span>🏛️</span>
                <span>{judge.court_name}</span>
              </div>
            )}
            {judge.appointment_date && (
              <div className="text-gray-400 text-sm mt-1">
                מינוי: {formatDate(judge.appointment_date)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "סה\"כ תיקים", value: formatNumber(stats.total_cases), color: "text-blue-600", bg: "bg-blue-50" },
            { label: "תיקים פתוחים", value: formatNumber(stats.open_cases), color: "text-green-600", bg: "bg-green-50" },
            { label: "תיקים סגורים", value: formatNumber(stats.closed_cases), color: "text-gray-600", bg: "bg-gray-50" },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center`}>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-gray-500 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Cases by year */}
          {stats.cases_by_year.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-700 mb-4">תיקים לאורך שנים</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.cases_by_year}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1e3a5f" name="תיקים" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Case types pie */}
          {stats.case_types.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-700 mb-4">התפלגות סוגי תיקים</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={stats.case_types}
                    dataKey="count"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                  >
                    {stats.case_types.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Recent cases */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-bold text-gray-700 mb-4">תיקים אחרונים</h3>
        {!cases?.cases?.length ? (
          <p className="text-gray-400 text-center py-6">אין תיקים</p>
        ) : (
          <table className="table-hebrew">
            <thead>
              <tr>
                <th>מספר תיק</th>
                <th>סוג</th>
                <th>בית משפט</th>
                <th>תאריך הגשה</th>
                <th>סטטוס</th>
              </tr>
            </thead>
            <tbody>
              {cases.cases.map((c: any) => (
                <tr key={c.id} className="cursor-pointer" onClick={() => window.location.href = `/cases/${c.id}`}>
                  <td>
                    <Link to={`/cases/${c.id}`} className="text-blue-600 hover:underline font-medium">
                      {c.case_number}
                    </Link>
                  </td>
                  <td><span className={getCaseTypeBadge()}>{c.case_type}</span></td>
                  <td className="text-gray-600">{c.court_name || "—"}</td>
                  <td className="text-gray-500">{formatDate(c.filing_date)}</td>
                  <td>{c.status && <span className={getStatusBadge(c.status)}>{c.status}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
