import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getAttorney, getAttorneyCases } from "../api/client";
import CaseCard from "../components/CaseCard";
import { formatNumber } from "../utils/formatters";

export default function AttorneyPage() {
  const { id } = useParams<{ id: string }>();
  const attorneyId = Number(id);

  const { data: attorney, isLoading } = useQuery({
    queryKey: ["attorney", attorneyId],
    queryFn: () => getAttorney(attorneyId),
  });

  const { data: cases } = useQuery({
    queryKey: ["attorney-cases", attorneyId],
    queryFn: () => getAttorneyCases(attorneyId),
  });

  if (isLoading) {
    return <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse"><div className="h-8 bg-gray-200 rounded w-1/3" /></div>;
  }

  if (!attorney) {
    return <div className="max-w-5xl mx-auto px-4 py-8 text-center"><h1 className="text-2xl font-bold text-gray-700">עורך דין לא נמצא</h1></div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6" dir="rtl">
      <nav className="text-sm text-gray-500 mb-4">
        <Link to="/" className="hover:text-blue-600">ראשי</Link> /{" "}
        <span className="text-gray-800">{attorney.name}</span>
      </nav>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-2xl">👨‍⚖️</div>
          <div>
            <h1 className="text-2xl font-bold text-legal-blue">{attorney.name}</h1>
            {attorney.firm_name && <div className="text-gray-600 mt-1">{attorney.firm_name}</div>}
            {attorney.license_number && (
              <div className="text-gray-400 text-sm mt-1">רישיון: {attorney.license_number}</div>
            )}
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-500">
          <strong>{formatNumber(cases?.total)}</strong> תיקים
        </div>
      </div>

      <div className="space-y-3">
        {cases?.cases?.map((case_: any) => (
          <CaseCard key={case_.id} case_={case_} />
        ))}
        {!cases?.cases?.length && (
          <div className="text-center text-gray-400 py-12">אין תיקים</div>
        )}
      </div>
    </div>
  );
}
