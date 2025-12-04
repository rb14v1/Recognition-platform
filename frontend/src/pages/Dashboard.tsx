// src/pages/Dashboard.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait until we know who the user is
    if (!loading && user) {
      // 🚦 REDIRECT LOGIC
      switch (user.role) {
        case "EMPLOYEE":
          navigate("/dashboard/employee");
          break;
        case "COORDINATOR": // or "MANAGER" depending on your DB value
          navigate("/dashboard/manager");
          break;
        case "COMMITTEE":
          navigate("/dashboard/committee");
          break;
        case "ADMIN":
          navigate("/dashboard/admin");
          break;
        default:
          navigate("/login"); // If role is broken, kick them out
      }
    }
  }, [user, loading, navigate]);

  return (
    <div className="h-full flex items-center justify-center">
      <p className="text-teal-600 animate-pulse">Redirecting to your dashboard...</p>
    </div>
  );
};

export default Dashboard;