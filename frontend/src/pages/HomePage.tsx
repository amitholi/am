import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getOverviewStats } from "../api/client";
import { formatNumber } from "../utils/formatters";

const POPULAR_SEARCHES = [
  'ת"צ ניירות ערך',
  "תביעה ייצוגית צרכנים",
  "פשיטת רגל",
  "זכויות עובדים",
  "נזיקין",
  "מקרקעין",
];

const CASE_TYPES_QUICK = [
  { type: 'ת"א', label: "תביעה אזרחית", icon: "⚖️" },
  { type: 'ת"צ', label: "תובענה ייצוגית", icon: "👥" },
  { type: 'ע"א', label: "ערעור אזרחי", icon: "📋" },
  { type: 'ת"פ', label: "תיק פלילי", icon: "🔒" },
  { type: 'תמ"ש', label: "תיק משפחה", icon: "👨‍👩‍👧" },
  { type: 'סע"ש', label: "סכסוך עבודה", icon: "🏭" },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<"text" | "case_number" | "party" | "attorney" | "judge">("text");

  const { data: stats } = useQuery({
    queryKey: ["stats-overview"],
    queryFn: getOverviewStats,
    staleTime: 1000 * 60 * 10,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const params = new URLSearchParams();
    if (searchType === "text") {
      params.set("q", query.trim());
    } else if (searchType === "case_number") {
      params.set("case_number", query.trim());
    } else if (searchType === "party") {
      params.set("party_name", query.trim());
    } else if (searchType === "attorney") {
      params.set("attorney_name", query.trim());
    } else if (searchType === "judge") {
      params.set("judge_name", query.trim());
    }
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div dir="rtl">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-legal-blue via-blue-900 to-blue-800 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-6xl mb-4">⚖️</div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            מאגר תיקי בתי משפט ישראלי
          </h1>
          <p className="text-xl text-blue-200 mb-10">
            חיפוש, עיון וניתוח נתוני תיקי בתי משפט בישראל • נתונים ציבוריים בלבד
          </p>

          {/* Search type tabs */}
          <div className="flex justify-center gap-1 mb-4 flex-wrap">
            {[
              { key: "text", label: "חיפוש חופשי" },
              { key: "case_number", label: "מספר תיק" },
              { key: "party", label: "שם צד" },
              { key: "attorney", label: "עורך דין" },
              { key: "judge", label: "שופט" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setSearchType(t.key as typeof searchType)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  searchType === t.key
                    ? "bg-white text-legal-blue"
                    : "bg-blue-800 text-blue-200 hover:bg-blue-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Main search form */}
          <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl mx-auto">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                searchType === "case_number"
                  ? "הזן מספר תיק, לדוגמה: 12345-01-20"
                  : searchType === "party"
                  ? "הזן שם תובע, נתבע, מבקש..."
                  : searchType === "attorney"
                  ? "הזן שם עורך דין..."
                  : searchType === "judge"
                  ? "הזן שם שופט..."
                  : "חפש תיק, נושא, מספר תיק..."
              }
              className="flex-1 rounded-xl py-4 px-6 text-gray-900 text-lg focus:outline-none focus:ring-2 focus:ring-legal-gold shadow-lg"
              dir="rtl"
              autoFocus
            />
            <button
              type="submit"
              className="bg-legal-gold text-legal-blue px-8 py-4 rounded-xl font-bold text-lg hover:bg-yellow-400 transition-colors shadow-lg flex-shrink-0"
            >
              חפש
            </button>
          </form>

          {/* Popular searches */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <span className="text-blue-300 text-sm">חיפושים נפוצים:</span>
            {POPULAR_SEARCHES.map((q) => (
              <button
                key={q}
                onClick={() => navigate(`/search?q=${encodeURIComponent(q)}`)}
                className="text-sm text-blue-200 hover:text-white bg-blue-800 hover:bg-blue-700 px-3 py-1 rounded-full transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      {stats && (
        <section className="bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: "סך תיקים", value: formatNumber(stats.total_cases), icon: "📂", color: "text-blue-600" },
                { label: "תיקים פתוחים", value: formatNumber(stats.open_cases), icon: "🟢", color: "text-green-600" },
                { label: "תובענות ייצוגיות", value: formatNumber(stats.class_actions), icon: "👥", color: "text-purple-600" },
                { label: "שופטים", value: formatNumber(stats.total_judges), icon: "⚖️", color: "text-legal-blue" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl mb-1">{stat.icon}</div>
                  <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-gray-500 text-sm mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Case Types Quick Access */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-legal-blue mb-6">חיפוש לפי סוג הליך</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {CASE_TYPES_QUICK.map((ct) => (
            <Link
              key={ct.type}
              to={`/search?case_type=${encodeURIComponent(ct.type)}`}
              className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all p-4 text-center group"
            >
              <div className="text-3xl mb-2">{ct.icon}</div>
              <div className="font-bold text-legal-blue group-hover:text-blue-600 text-lg">{ct.type}</div>
              <div className="text-gray-500 text-xs mt-1">{ct.label}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick Links */}
      <section className="bg-gray-50 border-t">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link to="/dashboard" className="card hover:shadow-lg transition-shadow group">
              <div className="text-4xl mb-3">📊</div>
              <h3 className="text-xl font-bold text-legal-blue group-hover:text-blue-600 mb-2">דשבורד סטטיסטי</h3>
              <p className="text-gray-600 text-sm">גרפים ויזואליזציות של נתוני בתי המשפט לאורך זמן</p>
            </Link>
            <Link to="/judges" className="card hover:shadow-lg transition-shadow group">
              <div className="text-4xl mb-3">⚖️</div>
              <h3 className="text-xl font-bold text-legal-blue group-hover:text-blue-600 mb-2">שופטים</h3>
              <p className="text-gray-600 text-sm">חיפוש שופטים, פרופיל ועומסי עבודה</p>
            </Link>
            <Link to="/search" className="card hover:shadow-lg transition-shadow group">
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="text-xl font-bold text-legal-blue group-hover:text-blue-600 mb-2">חיפוש מתקדם</h3>
              <p className="text-gray-600 text-sm">חיפוש עם פילטרים לפי בית משפט, תאריך, סטטוס ועוד</p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
