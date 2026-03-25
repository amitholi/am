import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]" dir="rtl">
      <div className="text-center">
        <div className="text-7xl mb-6">⚖️</div>
        <h1 className="text-4xl font-bold text-legal-blue mb-3">404</h1>
        <p className="text-gray-600 text-lg mb-8">הדף המבוקש לא נמצא</p>
        <Link
          to="/"
          className="bg-legal-blue text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-800 transition-colors"
        >
          חזרה לדף הראשי
        </Link>
      </div>
    </div>
  );
}
