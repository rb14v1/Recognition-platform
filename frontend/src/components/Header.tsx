import { useState, useRef, useEffect } from "react";
import Logo from "../assets/Version1-Logo.png"; // Ensure you have this logo
import { useAuth } from "../context/AuthContext";
import { Avatar, Divider } from "@mui/material";
import { Logout, Person, Badge, Work, Business } from "@mui/icons-material"; // MUI Icons

function Header() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Initials generator
  const getInitials = (name: string) => name ? name.substring(0, 2).toUpperCase() : "U";

  return (
    <header className="fixed top-0 left-0 w-full h-16 flex items-center justify-between px-8 bg-white border-b border-gray-200 z-50">
      
      {/* Brand Logo */}
      <div className="flex items-center cursor-pointer">
        <img src={Logo} alt="Version 1" className="h-8 object-contain" />
      </div>

      {/* User Profile Section */}
      {user && (
        <div className="relative" ref={menuRef}>
          {/* Avatar Trigger */}
          <div 
            onClick={() => setOpen(!open)}
            className="flex items-center gap-3 cursor-pointer p-1.5 rounded-full hover:bg-gray-50 transition-colors"
          >
            <div className="text-right hidden md:block">
               <p className="text-sm font-semibold text-gray-800 leading-tight">{user.username}</p>
               <p className="text-xs text-teal-600 font-medium">{user.role}</p>
            </div>
            <Avatar 
              sx={{ bgcolor: "#00A8A8", width: 40, height: 40, fontSize: "1rem", fontWeight: "bold" }}
            >
              {getInitials(user.username)}
            </Avatar>
          </div>

          {/* Professional Dropdown */}
          {open && (
            <div className="absolute right-0 mt-3 w-80 bg-white border border-gray-100 rounded-xl shadow-xl z-50 animate-fadeIn overflow-hidden">
              
              {/* Header of Dropdown */}
              <div className="bg-gradient-to-r from-[#00A8A8] to-[#008f8f] p-6 text-white text-center">
                 <Avatar 
                    sx={{ bgcolor: "white", color: "#00A8A8", width: 64, height: 64, margin: "0 auto", fontSize: "1.5rem", fontWeight: "bold", boxShadow: 3 }}
                 >
                    {getInitials(user.username)}
                 </Avatar>
                 <h3 className="mt-3 font-bold text-lg">{user.username}</h3>
                 <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium tracking-wide">
                    {user.role}
                 </span>
              </div>

              {/* User Details List */}
              <div className="p-4 space-y-3">
                 <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Badge fontSize="small" className="text-teal-600" />
                    <div>
                       <p className="text-xs text-gray-400 uppercase font-semibold">Employee ID</p>
                       <p className="font-medium text-gray-800">{user.employee_id || "N/A"}</p>
                    </div>
                 </div>
                 
                 <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Work fontSize="small" className="text-teal-600" />
                    <div>
                       <p className="text-xs text-gray-400 uppercase font-semibold">Job Title</p>
                       <p className="font-medium text-gray-800">{user.employee_role || "Not Assigned"}</p>
                    </div>
                 </div>

                 <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Business fontSize="small" className="text-teal-600" />
                    <div>
                       <p className="text-xs text-gray-400 uppercase font-semibold">Department</p>
                       <p className="font-medium text-gray-800">{user.employee_dept || "General / N/A"}</p>
                    </div>
                 </div>

                 <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Person fontSize="small" className="text-teal-600" />
                    <div>
                       <p className="text-xs text-gray-400 uppercase font-semibold">Manager</p>
                       <p className="font-medium text-gray-800">{user.manager_name || "N/A"}</p>
                    </div>
                 </div>
              </div>

              <Divider />

              {/* Logout Button */}
              <div className="p-2">
                 <button 
                   onClick={logout}
                   className="w-full flex items-center justify-center gap-2 p-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                 >
                    <Logout fontSize="small" />
                    Log Out
                 </button>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

export default Header;