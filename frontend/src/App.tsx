import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard"; // The Traffic Cop
import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Nominate from "./pages/Nominate";

// 👇 THE BIG CHANGE: One Dashboard to rule them all
import EmployeeDashboard from "./pages/dashboards/EmployeeDashboard";
import ManagementDashboard from "./pages/dashboards/ManagementDashboard"; // This handles Manager, Committee, & Admin

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
             <Route element={<MainLayout />}>
                {/* 1. Traffic Cop (Redirects based on Role) */}
                <Route path="/dashboard" element={<Dashboard />} />

                {/* 2. Employee View */}
                <Route path="/dashboard/employee" element={<EmployeeDashboard />} />

                {/* 3. Management View (Coordinator + Committee + Admin) */}
                {/* All these roles go here now! */}
                <Route path="/dashboard/management" element={<ManagementDashboard />} />
                
                {/* 4. Utilities */}
                <Route path="/dashboard/nominate" element={<Nominate />} />
             </Route>
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;