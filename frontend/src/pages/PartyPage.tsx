import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getParty } from "../api/client";
import CaseCard from "../components/CaseCard";
import { formatNumber } from "../utils/formatters";

export default function PartyPage() {
  const { id } = useParams<{ id: string }>();
  const partyId = Number(id);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["party", partyId],
    queryFn: () => getParty(partyId),
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}</div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-700">צד לא נמצא</h1>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6" dir="rtl">
      <nav className="text-sm text-gray-500 mb-4">
        <Link to="/" className="hover:text-blue-600">ראשי</Link> /{" "}
        <span className="text-gray-800">{data.party?.name}</span>
      </nav>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h1 className="text-2xl font-bold text-legal-blue">{data.party?.name}</h1>
        {data.party?.party_type && (
          <div className="text-gray-600 mt-1">{data.party.party_type}</div>
        )}
        {data.party?.entity_type && (
          <div className="text-gray-400 text-sm mt-1">{data.party.entity_type}</div>
        )}
        <div className="mt-3 text-sm text-gray-500">
          <strong>{formatNumber(data.total)}</strong> תיקים קשורים
        </div>
      </div>

      <div className="space-y-3">
        {data.cases?.map((case_: any) => (
          <CaseCard key={case_.id} case_={case_} />
        ))}
        {!data.cases?.length && (
          <div className="text-center text-gray-400 py-12">אין תיקים</div>
        )}
      </div>
    </div>
  );
}
