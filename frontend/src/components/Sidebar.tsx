import { 
  Dashboard as DashboardIcon, 
  People, 
  WorkspacePremium, 
  MenuOpen, 
  Menu,
  TrendingUp,
  Gavel
} from "@mui/icons-material";
import { Tooltip, IconButton} from "@mui/material";

interface SidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
  userRole: string;
}

const Sidebar = ({ activeSection, setActiveSection, isOpen, toggleSidebar, userRole }: SidebarProps) => {
  
  // Base items (Everyone sees these)
  let menuItems = [
    { id: "workspace", label: "Dashboard", icon: <DashboardIcon /> },
  ];

  // COORDINATOR ONLY Features (Team Management)
  if (userRole === 'COORDINATOR') {
    menuItems.push(
        { id: "team", label: "My Team", icon: <People /> },
        { id: "add-members", label: "Add Members", icon: <People sx={{ opacity: 0.5 }} /> },
        { id: "approvals", label: "Approvals", icon: <WorkspacePremium /> } // Coordinator Level Approvals
    );
  }

  // COMMITTEE ONLY Features (High Level)
  if (['COMMITTEE', 'ADMIN'].includes(userRole)) {
     menuItems.push(
        { id: "committee-review", label: "Final Review", icon: <Gavel /> } // Shows global approved list
     );
  }

  // SHARED Features (Both need this)
  // Both need to be able to promote people below them
  menuItems.push(
    { id: "promote", label: "Promote Role", icon: <TrendingUp /> }
  );

  return (
    <aside 
      className={`bg-white border-r border-gray-200 fixed h-full z-20 transition-all duration-300 ease-in-out pt-20
        ${isOpen ? "w-64" : "w-20"}
      `}
    >
      <div className="flex justify-end px-4 mb-6">
        <IconButton onClick={toggleSidebar}>
          {isOpen ? <MenuOpen /> : <Menu />}
        </IconButton>
      </div>

      <div className="space-y-2 px-3">
        {menuItems.map((item) => (
          <div
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`flex items-center gap-4 px-3 py-3 rounded-xl cursor-pointer transition-all duration-200 group
              ${activeSection === item.id 
                ? "bg-teal-50 text-teal-700 shadow-sm" 
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              }`}
          >
            <Tooltip title={!isOpen ? item.label : ""} placement="right">
              <div className={`${activeSection === item.id ? "text-teal-600" : "text-gray-400 group-hover:text-gray-600"}`}>
                {item.icon}
              </div>
            </Tooltip>
            
            <span 
              className={`text-sm font-medium whitespace-nowrap transition-opacity duration-300 
              ${isOpen ? "opacity-100" : "opacity-0 w-0 overflow-hidden"}`}
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