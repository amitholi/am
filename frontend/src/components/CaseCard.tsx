import { Link } from "react-router-dom";
import type { CaseListItem } from "../types";
import { formatDate, getStatusBadge, getCaseTypeBadge } from "../utils/formatters";

interface Props {
  case_: CaseListItem;
  highlight?: string;
}

export default function CaseCard({ case_, highlight }: Props) {
  return (
    <Link to={`/cases/${case_.id}`} className="block">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-legal-blue text-lg">{case_.case_number}</span>
            <span className={getCaseTypeBadge()}>{case_.case_type}</span>
            {case_.case_type_description && (
              <span className="text-gray-500 text-sm">{case_.case_type_description}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {case_.status && (
              <span className={getStatusBadge(case_.status)}>{case_.status}</span>
            )}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-600">
          {case_.court_name && (
            <div className="flex items-center gap-1">
              <span className="text-gray-400">🏛️</span>
              <span>{case_.court_name}</span>
            </div>
          )}
          {case_.filing_date && (
            <div className="flex items-center gap-1">
              <span className="text-gray-400">📅</span>
              <span>{formatDate(case_.filing_date)}</span>
            </div>
          )}
          {case_.judge_name && (
            <div className="flex items-center gap-1">
              <span className="text-gray-400">⚖️</span>
              <span>{case_.judge_name}</span>
            </div>
          )}
        </div>

        {case_.description && (
          <p className="mt-2 text-sm text-gray-500 line-clamp-2">{case_.description}</p>
        )}
      </div>
    </Link>
  );
}
