import {
  Dashboard as DashboardIcon,
  People,
  WorkspacePremium,
  MenuOpen,
  Menu,
  TrendingUp,
  Gavel,
} from "@mui/icons-material";
import { Tooltip, IconButton } from "@mui/material";

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
  let menuItems = [
    { id: "workspace", label: "Dashboard", icon: <DashboardIcon /> },
  ];

  if (userRole === "COORDINATOR") {
    menuItems.push(
      { id: "team", label: "My Team", icon: <People /> },
      {
        id: "add-members",
        label: "Add Members",
        icon: <People sx={{ opacity: 0.5 }} />,
      },
      { id: "approvals", label: "Approvals", icon: <WorkspacePremium /> }
    );
  }

  if (["COMMITTEE", "ADMIN"].includes(userRole)) {
    menuItems.push(
      { id: "committee-review", label: "Final Review", icon: <Gavel /> }
    );
  }

  menuItems.push({
    id: "promote",
    label: "Promote Role",
    icon: <TrendingUp /> },
  );

  return (
    <aside
      className={`bg-white border-r border-gray-200 fixed h-full z-20 pt-20 transition-all
        ${isOpen ? "w-64" : "w-20"}
      `}
    >
      {/* TOGGLE BUTTON */}
      <div className="flex justify-end px-4 mb-6">
        <IconButton onClick={toggleSidebar}>
          {isOpen ? <MenuOpen /> : <Menu />}
        </IconButton>
      </div>

      {/* MENU ITEMS */}
      <div className="space-y-2 px-3">
        {menuItems.map((item) => (
          <div
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`flex items-center gap-4 px-3 py-3 rounded-xl cursor-pointer
              ${
                activeSection === item.id
                  ? "bg-teal-50 text-teal-700"
                  : "text-gray-500 hover:bg-gray-100"
              }
            `}
          >
            <Tooltip title={!isOpen ? item.label : ""} placement="right">
              <div>{item.icon}</div>
            </Tooltip>

            <span
              className={`text-sm font-medium ${
                isOpen ? "block" : "hidden"
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
