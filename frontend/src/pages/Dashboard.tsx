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
          
        // ✅ GROUPED: All Management roles go to the same powerful dashboard
        case "COORDINATOR": 
        case "COMMITTEE":
        case "ADMIN": 
          navigate("/dashboard/management");
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