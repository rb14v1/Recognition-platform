import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard"; // The Traffic Cop
import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Nominate from "./pages/Nominate";

// 👇 IMPORT THE SEPARATE FILES
import EmployeeDashboard from "./pages/dashboards/EmployeeDashboard";
import ManagerDashboard from "./pages/dashboards/CoordinatorDashboard";
import CommitteeDashboard from "./pages/dashboards/CommitteeDashboard";
import AdminDashboard from "./pages/dashboards/AdminDashboard";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          <Route element={<ProtectedRoute />}>
             <Route element={<MainLayout />}>
                {/* Traffic Cop */}
                <Route path="/dashboard" element={<Dashboard />} />

                {/* Specific Roles */}
                <Route path="/dashboard/employee" element={<EmployeeDashboard />} />
                <Route path="/dashboard/manager" element={<ManagerDashboard />} />
                <Route path="/dashboard/committee" element={<CommitteeDashboard />} />
                <Route path="/dashboard/admin" element={<AdminDashboard />} />
                <Route path="/dashboard/nominate" element={<Nominate />} />
             </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;