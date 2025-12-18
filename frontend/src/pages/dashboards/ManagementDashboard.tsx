import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import EmployeeDashboard from "./EmployeeDashboard";
import TeamManagement from "../../components/TeamManagement";
import NominationApprovals from "../../components/NominationApprovals";
import AddMembers from "../../components/AddMembers";
import PromotePage from "../PromoteRole";
import CommitteeReview from "../../components/CommitteeReview";
import { authAPI } from "../../api/auth";

const ManagementDashboard = () => {
  const location = useLocation();

  // 🔥 READ STATE FROM NAVIGATION
  const hideSidebar = location.state?.hideSidebar === true;
  const initialTab = location.state?.initialTab || "workspace";

  const [activeSection, setActiveSection] = useState(initialTab);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userRole, setUserRole] = useState("COORDINATOR");

  useEffect(() => {
    authAPI.getMe().then((res) => setUserRole(res.data.role));
  }, []);

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">

      {/* ✅ SIDEBAR — ONLY IF NOT HIDDEN */}
      {!hideSidebar && (
        <Sidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          isOpen={isSidebarOpen}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          userRole={userRole}
        />
      )}

      {/* MAIN CONTENT */}
      <main
        className={`flex-1 p-6 transition-all ${
          hideSidebar ? "ml-0" : isSidebarOpen ? "ml-64" : "ml-20"
        }`}
      >
        {activeSection === "workspace" && <EmployeeDashboard />}
        {activeSection === "team" && <TeamManagement />}
        {activeSection === "add-members" && (
          <AddMembers onBack={() => setActiveSection("team")} />
        )}
        {activeSection === "approvals" && <NominationApprovals />}
        {activeSection === "committee-review" && <CommitteeReview />}
        {activeSection === "promote" && <PromotePage />}
      </main>
    </div>
  );
};

export default ManagementDashboard;
