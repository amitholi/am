import { useState } from "react";
import { adminSyncOdata, adminGetStats, adminClearCache } from "../api/client";

export default function AdminPage() {
  const [apiKey, setApiKey] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [log, setLog] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = (msg: string) => setLog((prev) => [`[${new Date().toLocaleTimeString("he-IL")}] ${msg}`, ...prev.slice(0, 49)]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await adminGetStats(apiKey);
      setStats(data);
      setAuthenticated(true);
      addLog("התחברות הצליחה");
    } catch {
      addLog("שגיאה: מפתח API שגוי");
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setLoading(true);
    try {
      const data = await adminSyncOdata(apiKey);
      addLog(`סנכרון הופעל: Task ID ${data.task_id}`);
    } catch (e: any) {
      addLog(`שגיאה בסנכרון: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = async () => {
    setLoading(true);
    try {
      await adminClearCache(apiKey);
      addLog("קאש נוקה בהצלחה");
    } catch (e: any) {
      addLog(`שגיאה: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshStats = async () => {
    try {
      const data = await adminGetStats(apiKey);
      setStats(data);
      addLog("סטטיסטיקות עודכנו");
    } catch (e: any) {
      addLog(`שגיאה: ${e.message}`);
    }
  };

  if (!authenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-20" dir="rtl">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🔐</div>
            <h1 className="text-2xl font-bold text-legal-blue">כניסת מנהל</h1>
            <p className="text-gray-500 text-sm mt-2">הזן מפתח API לגישה לממשק הניהול</p>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="מפתח API"
              className="w-full rounded-xl border border-gray-200 py-3 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              dir="ltr"
            />
            <button
              type="submit"
              disabled={loading || !apiKey}
              className="w-full bg-legal-blue text-white py-3 rounded-xl font-semibold hover:bg-blue-800 transition-colors disabled:opacity-50"
            >
              {loading ? "מתחבר..." : "כניסה"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-legal-blue">ממשק ניהול</h1>
        <button
          onClick={() => { setAuthenticated(false); setStats(null); setLog([]); }}
          className="text-sm text-red-600 hover:text-red-800"
        >
          התנתק
        </button>
      </div>

      {/* Table counts */}
      {stats?.table_counts && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-700">נתוני מסד נתונים</h2>
            <button onClick={handleRefreshStats} className="text-blue-600 hover:text-blue-800 text-sm">
              רענן
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.table_counts).map(([table, count]: [string, any]) => (
              <div key={table} className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-legal-blue">{count.toLocaleString()}</div>
                <div className="text-gray-500 text-sm mt-1">{table}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="text-3xl mb-3">🔄</div>
          <h3 className="font-bold text-gray-700 mb-2">סנכרון מ-odata.org.il</h3>
          <p className="text-gray-500 text-sm mb-4">סנכרן תיקי בתי משפט ממאגר הנתונים הפתוח</p>
          <button
            onClick={handleSync}
            disabled={loading}
            className="w-full bg-legal-blue text-white py-2 rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 font-medium"
          >
            {loading ? "מסנכרן..." : "סנכרן עכשיו"}
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="text-3xl mb-3">🗑️</div>
          <h3 className="font-bold text-gray-700 mb-2">ניקוי קאש</h3>
          <p className="text-gray-500 text-sm mb-4">נקה את מטמון תוצאות החיפוש ב-Redis</p>
          <button
            onClick={handleClearCache}
            disabled={loading}
            className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 font-medium"
          >
            נקה קאש
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="text-3xl mb-3">📤</div>
          <h3 className="font-bold text-gray-700 mb-2">ייבוא CSV</h3>
          <p className="text-gray-500 text-sm mb-4">ייבא קובץ CSV עם נתוני תיקים</p>
          <a
            href="/api/docs#/ניהול/import_csv_api_v1_admin_import_csv_post"
            target="_blank"
            className="block w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-center"
          >
            פתח API Docs
          </a>
        </div>
      </div>

      {/* Quick export links */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="font-bold text-gray-700 mb-4">ייצוא נתונים</h2>
        <div className="flex gap-3 flex-wrap">
          <a
            href="/api/v1/export/csv"
            className="px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
          >
            📊 ייצוא CSV
          </a>
          <a
            href="/api/v1/export/excel"
            className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
          >
            📗 ייצוא Excel
          </a>
          <a
            href="/api/v1/export/json"
            className="px-4 py-2 bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
          >
            🔧 ייצוא JSON
          </a>
          <a
            href="/api/docs"
            target="_blank"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            📖 API Docs
          </a>
        </div>
      </div>

      {/* Log */}
      {log.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-5">
          <h2 className="text-green-400 font-mono text-sm mb-3">לוג פעולות</h2>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {log.map((entry, i) => (
              <div key={i} className="text-green-300 text-xs font-mono">
                {entry}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
