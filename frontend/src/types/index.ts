export interface Court {
  id: number;
  name: string;
  name_en?: string;
  court_type: string;
  district?: string;
  city?: string;
}

export interface Judge {
  id: number;
  name: string;
  title?: string;
  court_id?: number;
  court_name?: string;
  appointment_date?: string;
}

export interface Party {
  id: number;
  case_id: number;
  name: string;
  party_type?: string;
  party_number?: number;
  entity_type?: string;
}

export interface Attorney {
  id: number;
  name: string;
  license_number?: string;
  firm_name?: string;
}

export interface Document {
  id: number;
  case_id: number;
  document_type?: string;
  title?: string;
  filing_date?: string;
  source_url?: string;
}

export interface Hearing {
  id: number;
  case_id: number;
  hearing_date?: string;
  hearing_type?: string;
  courtroom?: string;
  notes?: string;
}

export interface Case {
  id: number;
  case_number: string;
  case_type: string;
  case_type_description?: string;
  court_id?: number;
  court?: Court;
  filing_date?: string;
  status?: string;
  judge_name?: string;
  judge_id?: number;
  description?: string;
  decision_type?: string;
  source_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CaseListItem {
  id: number;
  case_number: string;
  case_type: string;
  case_type_description?: string;
  court_id?: number;
  court_name?: string;
  filing_date?: string;
  status?: string;
  judge_name?: string;
  description?: string;
}

export interface Facet {
  value?: string;
  name?: string;
  id?: number;
  year?: number;
  count: number;
}

export interface SearchFacets {
  case_types: Facet[];
  courts: { id: number; name: string; count: number }[];
  statuses: Facet[];
  years: { year: number; count: number }[];
}

export interface PaginatedCases {
  items: CaseListItem[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
  facets?: SearchFacets;
}

export interface TimelineEvent {
  date: string;
  type: "filing" | "document" | "hearing" | "decision";
  title: string;
  description?: string;
  courtroom?: string;
  id?: number;
}

export interface Statistics {
  total_cases: number;
  open_cases: number;
  closed_cases: number;
  total_courts: number;
  total_judges: number;
  total_attorneys: number;
  class_actions: number;
}

export interface JudgeStats {
  judge_id: number;
  judge_name: string;
  total_cases: number;
  open_cases: number;
  closed_cases: number;
  case_types: { type: string; count: number }[];
  cases_by_year: { year: number; count: number }[];
}

export interface SearchParams {
  q?: string;
  case_type?: string;
  court_id?: number;
  date_from?: string;
  date_to?: string;
  status?: string;
  judge_name?: string;
  page?: number;
  per_page?: number;
  sort?: string;
}
