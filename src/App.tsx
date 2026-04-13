import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./features/auth/login";
import Layout from "./components/Layout";
import DashboardPage from "./features/Dashboard";
import BikesPage from "./features/Bikes";
import RequestsPage from "./features/RequestsPage";
import MaintenancePage from "./features/MaintenancePage";
import ComplaintsPage from "./features/ComplaintsPage";
import StudentsPage from "./features/StudentsPage";
import FinesAuditPage from "./features/FinesAuditPage";

function isAuthenticated() {
  return Boolean(localStorage.getItem("bmsAdminToken"));
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />

        <Route
          path="/admin/*"
          element={
            <Layout>
              <Routes>
                <Route path="" element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="bicycles" element={<BikesPage />} />
                <Route path="requests" element={<RequestsPage />} />
                <Route path="audit" element={<FinesAuditPage />} />
                <Route path="maintenance" element={<MaintenancePage />} />
                <Route path="complaints" element={<ComplaintsPage />} />
                <Route path="students" element={<StudentsPage />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
