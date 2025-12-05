import { useState } from "react";
import Sidebar from "../../components/Sidebar";
import EmployeeDashboard from "./EmployeeDashboard";
import TeamManagement from "../../components/TeamManagement";
import NominationApprovals from "../../components/NominationApprovals";
import AddMembers from "../../components/AddMembers.tsx"; // Import New
import PromotePage from "../PromoteRole"; // Import New

const CoordinatorDashboard = () => {
  const [activeSection, setActiveSection] = useState("workspace");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar 
        activeSection={activeSection} 
        setActiveSection={setActiveSection} 
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
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
      </main>
    </div>
  );
};

export default CoordinatorDashboard;