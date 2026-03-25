import { Outlet, Link, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Layout() {
  const navigate = useNavigate();
  const [searchQ, setSearchQ] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleHeaderSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQ.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQ.trim())}`);
      setSearchQ("");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-legal-blue text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 flex-shrink-0">
              <div className="w-9 h-9 bg-legal-gold rounded-lg flex items-center justify-center font-bold text-legal-blue text-lg">
                ⚖️
              </div>
              <div className="hidden sm:block">
                <div className="font-bold text-lg leading-tight">מאגר בתי המשפט</div>
                <div className="text-blue-200 text-xs">Israel Legal Database</div>
              </div>
            </Link>

            {/* Header search */}
            <form onSubmit={handleHeaderSearch} className="hidden md:flex flex-1 max-w-lg mx-6">
              <div className="relative w-full">
                <input
                  type="text"
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="חפש תיק, שם צד, שופט..."
                  className="w-full rounded-lg py-2 pr-4 pl-10 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-legal-gold"
                  dir="rtl"
                />
                <button type="submit" className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  🔍
                </button>
              </div>
            </form>

            {/* Nav links */}
            <nav className="hidden md:flex items-center gap-4 text-sm">
              <Link to="/search" className="hover:text-blue-200 transition-colors">חיפוש</Link>
              <Link to="/judges" className="hover:text-blue-200 transition-colors">שופטים</Link>
              <Link to="/dashboard" className="hover:text-blue-200 transition-colors">סטטיסטיקות</Link>
              <Link to="/admin" className="bg-legal-gold text-legal-blue px-3 py-1 rounded-lg font-semibold hover:bg-yellow-400 transition-colors text-xs">
                ניהול
              </Link>
            </nav>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-blue-800"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              ☰
            </button>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 space-y-2">
              <form onSubmit={handleHeaderSearch} className="flex">
                <input
                  type="text"
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="חפש..."
                  className="flex-1 rounded-lg py-2 px-4 text-gray-900 text-sm"
                  dir="rtl"
                />
              </form>
              <div className="flex flex-col gap-1">
                {[
                  { to: "/search", label: "חיפוש" },
                  { to: "/judges", label: "שופטים" },
                  { to: "/dashboard", label: "סטטיסטיקות" },
                  { to: "/admin", label: "ניהול" },
                ].map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded hover:bg-blue-800 text-sm"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-legal-blue text-white mt-8">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold mb-2">מאגר בתי המשפט</h3>
              <p className="text-blue-200 text-sm">
                מאגר נתוני תיקי בתי משפט ישראלי — מבוסס נתונים ציבוריים בלבד.
                כל הנתונים מקורם ב-odata.org.il ו-data.gov.il.
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-2">קישורים</h3>
              <ul className="space-y-1 text-sm text-blue-200">
                <li><Link to="/search" className="hover:text-white">חיפוש תיקים</Link></li>
                <li><Link to="/dashboard" className="hover:text-white">סטטיסטיקות</Link></li>
                <li><a href="/api/docs" className="hover:text-white" target="_blank">תיעוד API</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-2">מקורות מידע</h3>
              <ul className="space-y-1 text-sm text-blue-200">
                <li>odata.org.il</li>
                <li>data.gov.il</li>
                <li>בתי המשפט בישראל</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-blue-800 mt-6 pt-4 text-center text-blue-300 text-xs">
            נתוני ציבור בלבד • מידע פומבי • {new Date().getFullYear()}
          </div>
        </div>
      </footer>
    </div>
  );
}
