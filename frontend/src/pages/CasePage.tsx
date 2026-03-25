import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  getCase,
  getCaseParties,
  getCaseDocuments,
  getCaseHearings,
  getCaseTimeline,
} from "../api/client";
import Timeline from "../components/Timeline";
import { formatDate, getStatusBadge, getCaseTypeBadge, getPartyTypeBadge } from "../utils/formatters";

type Tab = "details" | "parties" | "documents" | "hearings" | "timeline";

export default function CasePage() {
  const { id } = useParams<{ id: string }>();
  const caseId = Number(id);
  const [activeTab, setActiveTab] = useState<Tab>("details");

  const { data: case_, isLoading, isError } = useQuery({
    queryKey: ["case", caseId],
    queryFn: () => getCase(caseId),
    enabled: !!caseId,
  });

  const { data: parties } = useQuery({
    queryKey: ["case-parties", caseId],
    queryFn: () => getCaseParties(caseId),
    enabled: activeTab === "parties" && !!caseId,
  });

  const { data: documents } = useQuery({
    queryKey: ["case-documents", caseId],
    queryFn: () => getCaseDocuments(caseId),
    enabled: activeTab === "documents" && !!caseId,
  });

  const { data: hearings } = useQuery({
    queryKey: ["case-hearings", caseId],
    queryFn: () => getCaseHearings(caseId),
    enabled: activeTab === "hearings" && !!caseId,
  });

  const { data: timeline } = useQuery({
    queryKey: ["case-timeline", caseId],
    queryFn: () => getCaseTimeline(caseId),
    enabled: activeTab === "timeline" && !!caseId,
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-100 rounded w-1/3" />
          <div className="card mt-6 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-4 bg-gray-100 rounded" />)}
          </div>
        </div>
      </div>
    );
  }

  if (isError || !case_) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-700">תיק לא נמצא</h1>
        <Link to="/search" className="text-blue-600 hover:underline mt-4 inline-block">
          חזרה לחיפוש
        </Link>
      </div>
    );
  }

  const TABS = [
    { key: "details", label: "פרטים" },
    { key: "parties", label: "צדדים" },
    { key: "documents", label: "מסמכים" },
    { key: "hearings", label: "דיונים" },
    { key: "timeline", label: "ציר זמן" },
  ] as const;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6" dir="rtl">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-4">
        <Link to="/" className="hover:text-blue-600">ראשי</Link>
        {" / "}
        <Link to="/search" className="hover:text-blue-600">חיפוש</Link>
        {" / "}
        <span className="text-gray-800">{case_.case_number}</span>
      </nav>

      {/* Case header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h1 className="text-2xl font-bold text-legal-blue">{case_.case_number}</h1>
              <span className={getCaseTypeBadge()}>{case_.case_type}</span>
              {case_.case_type_description && (
                <span className="text-gray-600 text-sm">{case_.case_type_description}</span>
              )}
            </div>
            {case_.court?.name && (
              <div className="flex items-center gap-2 text-gray-600">
                <span>🏛️</span>
                <span>{case_.court.name}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {case_.status && <span className={getStatusBadge(case_.status)}>{case_.status}</span>}
            {case_.source_url && (
              <a
                href={case_.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                מקור ↗
              </a>
            )}
          </div>
        </div>

        {/* Meta info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100">
          <div>
            <div className="text-xs text-gray-400 mb-1">תאריך הגשה</div>
            <div className="font-medium text-gray-800">{formatDate(case_.filing_date)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">שופט</div>
            <div className="font-medium text-gray-800">
              {case_.judge_id ? (
                <Link to={`/judges/${case_.judge_id}`} className="text-blue-600 hover:underline">
                  {case_.judge_name || "—"}
                </Link>
              ) : (
                case_.judge_name || "—"
              )}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">סטטוס</div>
            <div className="font-medium text-gray-800">{case_.status || "—"}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">עדכון אחרון</div>
            <div className="font-medium text-gray-800">{formatDate(case_.updated_at)}</div>
          </div>
        </div>

        {case_.description && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="text-xs text-gray-400 mb-1">תיאור</div>
            <p className="text-gray-700">{case_.description}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-white text-legal-blue shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {activeTab === "details" && (
          <div className="space-y-4">
            <h2 className="font-bold text-gray-800 text-lg mb-4">פרטי תיק</h2>
            <table className="w-full text-sm">
              <tbody>
                {[
                  ["מספר תיק", case_.case_number],
                  ["סוג הליך", `${case_.case_type}${case_.case_type_description ? ` — ${case_.case_type_description}` : ""}`],
                  ["בית משפט", case_.court?.name],
                  ["שופט", case_.judge_name],
                  ["תאריך הגשה", formatDate(case_.filing_date)],
                  ["סטטוס", case_.status],
                  ["סוג הכרעה", case_.decision_type],
                  ["תאריך עדכון סטטוס", formatDate((case_ as any).status_date)],
                ].filter(([, v]) => v).map(([label, value]) => (
                  <tr key={label as string} className="border-b border-gray-50">
                    <td className="py-3 text-gray-400 font-medium w-40">{label}</td>
                    <td className="py-3 text-gray-800">{value as string}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "parties" && (
          <div>
            <h2 className="font-bold text-gray-800 text-lg mb-4">צדדים בתיק</h2>
            {!parties?.length ? (
              <p className="text-gray-400 text-center py-8">אין מידע על צדדים</p>
            ) : (
              <table className="table-hebrew">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>שם</th>
                    <th>תפקיד</th>
                    <th>סוג ישות</th>
                  </tr>
                </thead>
                <tbody>
                  {parties.map((p) => (
                    <tr key={p.id}>
                      <td className="text-gray-400">{p.party_number || "—"}</td>
                      <td>
                        <Link to={`/parties/${p.id}`} className="text-blue-600 hover:underline font-medium">
                          {p.name}
                        </Link>
                      </td>
                      <td>
                        {p.party_type && (
                          <span className={getPartyTypeBadge(p.party_type)}>{p.party_type}</span>
                        )}
                      </td>
                      <td className="text-gray-500">{p.entity_type || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === "documents" && (
          <div>
            <h2 className="font-bold text-gray-800 text-lg mb-4">מסמכי התיק</h2>
            {!documents?.length ? (
              <p className="text-gray-400 text-center py-8">אין מסמכים זמינים</p>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-start justify-between gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📄</span>
                        <span className="font-medium text-gray-800">{doc.title || doc.document_type || "מסמך"}</span>
                      </div>
                      {doc.document_type && doc.title && (
                        <span className="text-xs text-gray-500 mr-7">{doc.document_type}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <span className="text-sm text-gray-400">{formatDate(doc.filing_date)}</span>
                      {doc.source_url && (
                        <a
                          href={doc.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          צפה ↗
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "hearings" && (
          <div>
            <h2 className="font-bold text-gray-800 text-lg mb-4">לוח דיונים</h2>
            {!hearings?.length ? (
              <p className="text-gray-400 text-center py-8">אין דיונים רשומים</p>
            ) : (
              <table className="table-hebrew">
                <thead>
                  <tr>
                    <th>תאריך ושעה</th>
                    <th>סוג דיון</th>
                    <th>אולם</th>
                    <th>הערות</th>
                  </tr>
                </thead>
                <tbody>
                  {hearings.map((h) => (
                    <tr key={h.id}>
                      <td className="font-medium">{formatDate(h.hearing_date)}</td>
                      <td>{h.hearing_type || "—"}</td>
                      <td>{h.courtroom || "—"}</td>
                      <td className="text-gray-500 text-sm max-w-xs truncate">{h.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === "timeline" && (
          <div>
            <h2 className="font-bold text-gray-800 text-lg mb-6">ציר זמן התיק</h2>
            <Timeline events={timeline?.events || []} />
          </div>
        )}
      </div>
    </div>
  );
}
