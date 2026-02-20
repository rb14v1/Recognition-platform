import {
  Dashboard as DashboardIcon,
  SupervisorAccount,
  Groups,
  Gavel,
  EmojiEvents,
  Assessment,
  MenuOpen,
  Menu,
  CloudUpload,
} from "@mui/icons-material";
import { Tooltip, IconButton } from "@mui/material";
import { useNavigate } from "react-router-dom";

interface SidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
  userRole: string;
}

const Sidebar = ({
  activeSection,
  setActiveSection,
  isOpen,
  toggleSidebar,
  userRole,
}: SidebarProps) => {
  const navigate = useNavigate();

  // Base menu
  let menuItems = [
    { id: "dashboard", label: "Dashboard", icon: <DashboardIcon /> },
  ];

  if (userRole === "COORDINATOR") {
    menuItems.push(
      { 
        id: "coordinator", 
        label: "Star-Award", 
        icon: <SupervisorAccount /> 
      },
      { 
        id: "committee", 
        label: "All-Star-Award", 
        icon: <Groups /> 
      },
      { 
        id: "operations", 
        label: "Global-Award",   
        icon: <Gavel />    
      },
      { 
        id: "winners", 
        label: "Winners", 
        icon: <EmojiEvents /> 
      },
      {
        id: "upload",
        label: "Upload Data",
        icon: <CloudUpload />,
      },
      { 
        id: "reports", 
        label: "Reports", 
        icon: <Assessment /> 
      }
    );
  }

  // Handle Clicks
  const handleItemClick = (itemId: string) => {
    setActiveSection(itemId);
    
    switch (itemId) {
      default:
        break;
    }
  };

  return (
    <aside
      className={`bg-white border-r border-gray-200 fixed h-full z-20 pt-5 transition-all duration-300 ease-in-out shadow-sm
        ${isOpen ? "w-64" : "w-20"}
      `}
    >
      {/* TOGGLE BUTTON */}
      <div className="flex justify-end px-4 mb-8">
        <IconButton onClick={toggleSidebar}>
          {isOpen ? <MenuOpen /> : <Menu />}
        </IconButton>
      </div>

      {/* MENU ITEMS */}
      <div className="space-y-2 px-3">
        {menuItems.map((item) => (
          <div
            key={item.id}
            onClick={() => handleItemClick(item.id)}
            className={`flex items-center gap-4 px-3 py-3 rounded-xl cursor-pointer transition-colors
              ${
                activeSection === item.id
                  ? "bg-teal-50 text-teal-700 font-bold border border-teal-100" // Teal Active State
                  : "text-gray-500 hover:bg-gray-100"
              }
            `}
          >
            <Tooltip title={!isOpen ? item.label : ""} placement="right">
              <div className={`flex items-center justify-center ${activeSection === item.id ? "text-teal-600" : ""}`}>
                {item.icon}
              </div>
            </Tooltip>

            <span
              className={`text-sm font-medium whitespace-nowrap transition-opacity duration-200 ${
                isOpen ? "block opacity-100" : "hidden opacity-0"
              }`}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;