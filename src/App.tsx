import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// import { LoginPage } from "./features/auth/login";
import Layout from "./components/Layout";
import DashboardPage from "../src/features/Dashboard";
import BikesPage from "../src/features/Bikes";
import RequestsPage from "../src/features/RequestsPage";
import MaintenancePage from "../src/features/MaintenancePage";
import ComplaintsPage from "../src/features/ComplaintsPage";
import StudentsPage from "../src/features/StudentsPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* <Route path="/" element={<LoginPage />} /> */}
         <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />

        <Route
          path="/admin"
          element={
            <Layout>
              <DashboardPage />
            </Layout>
          }
        />

        <Route
          path="/admin/*"
          element={
            <Layout>
              <Routes>
                <Route path="" element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="bicycles" element={<BikesPage />} />
                <Route path="requests" element={<RequestsPage />} />
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
