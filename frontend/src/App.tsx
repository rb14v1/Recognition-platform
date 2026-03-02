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

import EmployeeDashboard from "./pages/dashboards/EmployeeDashboard";
import ManagementDashboard from "./pages/dashboards/ManagementDashboard";
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import Report from "./pages/Report";

import CoordinatorNomination from "./components/CoordinatorReview"; 
import CommitteeReview from "./components/CommitteeReview"; 

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

              <Route path="/dashboard/nominate" element={<Nominate />} />
              <Route path="/dashboard/voting" element={<VotingPage />} />
              <Route path="/dashboard/detailpage" element={<DetailPage onViewDetails={() => console.log("View details clicked")} />} />

              {/* MANAGEMENT DASHBOARD (Coordinator Layout with Sidebar) */}
              <Route path="/dashboard/management" element={<ManagementDashboard />}>
                
                {/* Child Routes: Rendered inside the <Outlet /> of ManagementDashboard */}
                <Route index element={<EmployeeDashboard />} /> {/* Default view */}
                <Route path="dashboard" element={<EmployeeDashboard />} />
                <Route path="coordinator" element={<CoordinatorNomination />} />
                <Route path="committee" element={<CommitteeReview />} />
                <Route path="operations" element={<AdminDashboard />} />
                <Route path="winners" element={<WinnersPage />} />
                <Route path="reports" element={<Report />} />
                <Route path="upload" element={<UploadDataPage />} />
                
              </Route>

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