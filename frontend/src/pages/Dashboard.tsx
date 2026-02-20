// src/pages/Dashboard.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      switch (user.role) {
        case "EMPLOYEE":
          navigate("/dashboard/employee");
          break;
          
        // SHARED: Coordinator & Committee share the management view
        case "COORDINATOR": 
        case "COMMITTEE":
          navigate("/dashboard/management");
          break;

        // SEPARATE: Admin gets their own dashboard
        case "ADMIN": 
          navigate("/dashboard/admin");
          break;
          
        default:
          navigate("/login"); 
      }
    }
  }, [user, loading, navigate]);

  return (
    <div className="h-full flex items-center justify-center">
      <p className="text-teal-600 animate-pulse font-bold">Redirecting...</p>
    </div>
  );
};

export default Dashboard;