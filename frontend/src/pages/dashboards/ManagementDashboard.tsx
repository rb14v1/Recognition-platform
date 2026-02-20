import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import EmployeeDashboard from "./EmployeeDashboard";
import CommitteeReview from "../../components/CommitteeReview";
import CoordinatorNomination from "../../components/CoordinatorReview";
import { authAPI } from "../../api/auth";
import AdminDashboard from "./AdminDashboard";
import WinnersPage from "../WinnersPage";
import Report from "../Report";
import UploadDataPage from "../UploadDataPage"; 

const ManagementDashboard = () => {
  const location = useLocation();

  const hideSidebar = location.state?.hideSidebar === true;
  const initialTab = location.state?.initialTab || "dashboard";

  const [activeSection, setActiveSection] = useState(initialTab);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userRole, setUserRole] = useState("COORDINATOR");

  useEffect(() => {
    authAPI.getMe().then((res) => setUserRole(res.data.role));
  }, []);

  useEffect(() => {
    if (location.state?.initialTab) {
      setActiveSection(location.state.initialTab);
    }
  }, [location.state]);

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">

      {/*  SIDEBAR */}
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
        className={`flex-1 p-6 transition-all duration-300 ${
          hideSidebar ? "ml-0" : isSidebarOpen ? "ml-64" : "ml-20"
        }`}
      >
        {activeSection === "dashboard" && <EmployeeDashboard />}
        {activeSection === "coordinator" && <CoordinatorNomination />}
        {activeSection === "committee" && <CommitteeReview />}
        {activeSection === "operations" && <AdminDashboard />}
        {activeSection === "winners" && <WinnersPage />}
        {activeSection === "reports" && <Report />}

        {/*  ADD THIS SECTION TO KEEP SIDEBAR VISIBLE */}
        {activeSection === "upload" && <UploadDataPage />}

      </main>
    </div>
  );
};

export default ManagementDashboard;