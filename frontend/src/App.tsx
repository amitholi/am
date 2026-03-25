import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import SearchResultsPage from "./pages/SearchResultsPage";
import CasePage from "./pages/CasePage";
import JudgePage from "./pages/JudgePage";
import JudgesListPage from "./pages/JudgesListPage";
import PartyPage from "./pages/PartyPage";
import AttorneyPage from "./pages/AttorneyPage";
import DashboardPage from "./pages/DashboardPage";
import AdminPage from "./pages/AdminPage";
import NotFoundPage from "./pages/NotFoundPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="search" element={<SearchResultsPage />} />
        <Route path="cases/:id" element={<CasePage />} />
        <Route path="judges" element={<JudgesListPage />} />
        <Route path="judges/:id" element={<JudgePage />} />
        <Route path="parties/:id" element={<PartyPage />} />
        <Route path="attorneys/:id" element={<AttorneyPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
