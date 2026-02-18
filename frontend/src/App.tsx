import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Nominate from "./pages/Nominate";
import VotingPage from "./pages/VotingPage";
import UploadDataPage from "./pages/UploadDataPage";
import DetailPage from "./pages/DetailPage";
import WinnersPage from "./pages/WinnersPage";

// Dashboards
import EmployeeDashboard from "./pages/dashboards/EmployeeDashboard";
import ManagementDashboard from "./pages/dashboards/ManagementDashboard";
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import Report from "./pages/Report";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* PUBLIC ROUTES */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* PROTECTED ROUTES */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>

              {/* Auto-routing page (role-based) */}
              <Route path="/dashboard" element={<Dashboard />} />

              {/* EMPLOYEE DASHBOARD */}
              <Route path="/dashboard/employee" element={<EmployeeDashboard />} />

              {/* WINNERS PAGE (Admin / Committee / Coordinator can access) */}
              <Route path="/dashboard/winners" element={<WinnersPage />} />

              {/* MANAGEMENT DASHBOARD */}
              <Route path="/dashboard/management" element={<ManagementDashboard />} />

              {/* ADMIN DASHBOARD */}
              <Route path="/dashboard/admin" element={<AdminDashboard />} />
              {/* ANALYTICS DASHBOARD (Admin / Committee / Coordinator) */}
              <Route path="/dashboard/report" element={<Report />} />
              <Route path="/dashboard/upload" element={<UploadDataPage />} />


              {/* UTILITIES */}
              <Route path="/dashboard/nominate" element={<Nominate />} />
              <Route path="/dashboard/voting" element={<VotingPage />} />
              <Route path="/dashboard/detailpage" element={<DetailPage />} />

            </Route>
          </Route>

          {/* FALLBACK */}
          <Route path="*" element={<Navigate to="/" />} />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

