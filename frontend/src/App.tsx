import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Nominate from "./pages/Nominate";
import VotingPage from "./pages/VotingPage"; // 👈 IMPORT THIS
 
// Dashboards
import EmployeeDashboard from "./pages/dashboards/EmployeeDashboard";
import ManagementDashboard from "./pages/dashboards/ManagementDashboard";
import AdminDashboard from "./pages/dashboards/AdminDashboard";
 
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>
 
          {/* Protected */}
          <Route element={<ProtectedRoute />}>
             <Route element={<MainLayout />}>
                {/* Traffic Cop */}
                <Route path="/dashboard" element={<Dashboard />} />
 
                {/* 1. Employee */}
                <Route path="/dashboard/employee" element={<EmployeeDashboard />} />
 
                {/* 2. Management (Coordinator + Committee) */}
                <Route path="/dashboard/management" element={<ManagementDashboard />} />
               
                {/* 3. Admin (Exclusive) */}
                <Route path="/dashboard/admin" element={<AdminDashboard />} />
               
                {/* Utilities */}
                <Route path="/dashboard/nominate" element={<Nominate />} />
                <Route path="/dashboard/voting" element={<VotingPage />} /> {/* 👈 ADD THIS LINE */}
             </Route>
          </Route>
 
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
 
export default App;
 