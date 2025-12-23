import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import EmployeeDashboard from "./EmployeeDashboard";
import CommitteeReview from "../../components/CommitteeReview";
import CoordinatorNomination from "../../components/CoordinatorNomination";
import { authAPI } from "../../api/auth";
import AdminDashboard from "./AdminDashboard";               // id: "operations"
import WinnersPage from "../WinnersPage";                     // id: "winners"
import Report from "../Report";

const ManagementDashboard = () => {
  const location = useLocation();

  // 🔥 READ STATE FROM NAVIGATION
  // This allows you to jump to specific tabs from other pages (e.g., clicking "Reports" on AdminDashboard)
  const hideSidebar = location.state?.hideSidebar === true;
  const initialTab = location.state?.initialTab || "dashboard";

  const [activeSection, setActiveSection] = useState(initialTab);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userRole, setUserRole] = useState("COORDINATOR");

  useEffect(() => {
    // Fetch role to ensure sidebar shows correct options
    authAPI.getMe().then((res) => setUserRole(res.data.role));
  }, []);

  // Sync activeSection if navigation state changes
  useEffect(() => {
    if (location.state?.initialTab) {
      setActiveSection(location.state.initialTab);
    }
  }, [location.state]);

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">

      {/* ✅ SIDEBAR — Controlled by state */}
      {!hideSidebar && (
        <Sidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          isOpen={isSidebarOpen}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          userRole={userRole}
        />
      )}

      {/* ✅ MAIN CONTENT AREA */}
      <main
        className={`flex-1 p-6 transition-all duration-300 ${
          hideSidebar ? "ml-0" : isSidebarOpen ? "ml-64" : "ml-20"
        }`}
      >
        {/* 1. PERSONAL DASHBOARD */}
        {activeSection === "dashboard" && <EmployeeDashboard />}

        {/* 2. COORDINATOR APPROVALS */}
        {activeSection === "coordinator" && <CoordinatorNomination />}

        {/* 3. COMMITTEE REVIEW */}
        {activeSection === "committee" && <CommitteeReview />}

        {/* 4. OPERATIONS (ADMIN DASHBOARD) */}
        {activeSection === "operations" && <AdminDashboard />}

        {/* 5. WINNERS PODIUM */}
        {activeSection === "winners" && <WinnersPage />}

        {/* 6. ANALYTICS & REPORTS */}
        {activeSection === "reports" && <Report />}

      </main>
    </div>
  );
};

export default ManagementDashboard;