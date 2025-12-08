import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import EmployeeDashboard from "./EmployeeDashboard"; // Your existing workspace
import TeamManagement from "../../components/TeamManagement";
import NominationApprovals from "../../components/NominationApprovals";
import AddMembers from "../../components/AddMembers";
import PromotePage from "../PromoteRole"; 
import CommitteeReview from "../../components/CommitteeReview"; // NEW PAGE
import { authAPI } from "../../api/auth"; // To fetch user role

const ManagementDashboard = () => {
  const [activeSection, setActiveSection] = useState("workspace");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userRole, setUserRole] = useState("COORDINATOR"); // Default

  useEffect(() => {
    // We need to know who is logged in to show the right menu
    const fetchProfile = async () => {
        try {
            const res = await authAPI.getMe();
            setUserRole(res.data.role);
        } catch(e) { console.error(e); }
    };
    fetchProfile();
  }, []);

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar 
        activeSection={activeSection} 
        setActiveSection={setActiveSection} 
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        userRole={userRole} // Passing role down
      />

      <main 
        className={`flex-1 p-6 md:p-10 pt-6 transition-all duration-300 ease-in-out
          ${isSidebarOpen ? "md:ml-64" : "md:ml-20"}
        `}
      >
        {activeSection === "workspace" && <EmployeeDashboard />}
        {activeSection === "team" && <TeamManagement />}
        {activeSection === "add-members" && <AddMembers onBack={() => setActiveSection("team")} />}
        {activeSection === "promote" && <PromotePage />}
        {activeSection === "approvals" && <NominationApprovals />}
        
        {/* Only accessible via sidebar if role is COMMITTEE */}
        {activeSection === "committee-review" && <CommitteeReview />}
      </main>
    </div>
  );
};

export default ManagementDashboard;