import { useState, useEffect } from "react";
import { useLocation, Outlet } from "react-router-dom"; 
import Sidebar from "../../components/Sidebar";
import { authAPI } from "../../api/auth";

const ManagementDashboard = () => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userRole, setUserRole] = useState("COORDINATOR");

  useEffect(() => {
    authAPI.getMe().then((res) => setUserRole(res.data.role));
  }, []);

  const hideSidebar = location.state?.hideSidebar === true;

  // Read the URL to tell the Sidebar which tab should be highlighted green
  const pathParts = location.pathname.split('/');
  const currentPath = pathParts[pathParts.length - 1];
  const activeSection = currentPath === 'management' || currentPath === '' ? 'dashboard' : currentPath;

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">

      {/* SIDEBAR */}
      {!hideSidebar && (
        <Sidebar
          activeSection={activeSection}
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
        <Outlet /> 
      </main>
    </div>
  );
};

export default ManagementDashboard;