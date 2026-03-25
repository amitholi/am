import axios from "axios";
import type {
  PaginatedCases,
  Case,
  Party,
  Document,
  Hearing,
  Judge,
  JudgeStats,
  Attorney,
  Statistics,
  SearchParams,
  TimelineEvent,
} from "../types";

const api = axios.create({
  baseURL: "/api/v1",
  headers: { "Content-Type": "application/json" },
});

// Search
export const searchCases = async (params: SearchParams): Promise<PaginatedCases> => {
  const { data } = await api.get("/search", { params });
  return data;
};

// Cases
export const getCase = async (id: number): Promise<Case> => {
  const { data } = await api.get(`/cases/${id}`);
  return data;
};

export const getCaseByNumber = async (caseNumber: string): Promise<Case[]> => {
  const { data } = await api.get(`/cases/by-number/${encodeURIComponent(caseNumber)}`);
  return data;
};

export const getCaseParties = async (id: number): Promise<Party[]> => {
  const { data } = await api.get(`/cases/${id}/parties`);
  return data;
};

export const getCaseDocuments = async (id: number): Promise<Document[]> => {
  const { data } = await api.get(`/cases/${id}/documents`);
  return data;
};

export const getCaseHearings = async (id: number): Promise<Hearing[]> => {
  const { data } = await api.get(`/cases/${id}/hearings`);
  return data;
};

export const getCaseTimeline = async (id: number): Promise<{ events: TimelineEvent[] }> => {
  const { data } = await api.get(`/cases/${id}/timeline`);
  return data;
};

// Parties
export const searchParties = async (name: string, page = 1) => {
  const { data } = await api.get("/parties/search", { params: { name, page } });
  return data;
};

export const getParty = async (id: number) => {
  const { data } = await api.get(`/parties/${id}/cases`);
  return data;
};

// Attorneys
export const searchAttorneys = async (name: string, page = 1) => {
  const { data } = await api.get("/attorneys/search", { params: { name, page } });
  return data;
};

export const getAttorney = async (id: number) => {
  const { data } = await api.get(`/attorneys/${id}`);
  return data;
};

export const getAttorneyCases = async (id: number, page = 1) => {
  const { data } = await api.get(`/attorneys/${id}/cases`, { params: { page } });
  return data;
};

// Judges
export const listJudges = async (courtId?: number, page = 1) => {
  const { data } = await api.get("/judges", { params: { court_id: courtId, page } });
  return data;
};

export const getJudge = async (id: number): Promise<Judge> => {
  const { data } = await api.get(`/judges/${id}`);
  return data;
};

export const getJudgeCases = async (id: number, page = 1) => {
  const { data } = await api.get(`/judges/${id}/cases`, { params: { page } });
  return data;
};

export const getJudgeStats = async (id: number): Promise<JudgeStats> => {
  const { data } = await api.get(`/judges/${id}/statistics`);
  return data;
};

// Statistics
export const getOverviewStats = async (): Promise<Statistics> => {
  const { data } = await api.get("/statistics/overview");
  return data;
};

export const getStatsByYear = async () => {
  const { data } = await api.get("/statistics/by-year");
  return data;
};

export const getStatsByType = async () => {
  const { data } = await api.get("/statistics/by-type");
  return data;
};

export const getStatsByCourt = async () => {
  const { data } = await api.get("/statistics/by-court");
  return data;
};

export const getTrends = async (months = 24) => {
  const { data } = await api.get("/statistics/trends", { params: { months } });
  return data;
};

export const getTopJudges = async (limit = 10) => {
  const { data } = await api.get("/statistics/top-judges", { params: { limit } });
  return data;
};

export const getTopAttorneys = async (limit = 10) => {
  const { data } = await api.get("/statistics/top-attorneys", { params: { limit } });
  return data;
};

// Admin
export const adminSyncOdata = async (apiKey: string) => {
  const { data } = await api.post("/admin/sync/odata", {}, {
    headers: { "x-api-key": apiKey },
  });
  return data;
};

export const adminGetStats = async (apiKey: string) => {
  const { data } = await api.get("/admin/stats", {
    headers: { "x-api-key": apiKey },
  });
  return data;
};

export const adminClearCache = async (apiKey: string) => {
  const { data } = await api.post("/admin/cache/clear", {}, {
    headers: { "x-api-key": apiKey },
  });
  return data;
};

// Export URLs
export const getExportUrl = (format: "csv" | "excel" | "json", params: Record<string, string>) => {
  const query = new URLSearchParams(params).toString();
  const ext = format === "excel" ? "excel" : format;
  return `/api/v1/export/${ext}?${query}`;
};
