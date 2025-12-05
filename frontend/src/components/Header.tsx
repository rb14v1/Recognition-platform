import { useState, useRef, useEffect } from "react";
import Logo from "../assets/Version1-Logo.png"; 
import { useAuth } from "../context/AuthContext";
import { Avatar } from "@mui/material";
import { Logout, AccountCircle } from "@mui/icons-material"; 
import ProfileDialog from "./ProfileDialog";

function Header() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // SAFE ACCESS: Prevent crash if user.username is undefined
  const username = user?.username || "Guest";
  const initials = username.substring(0, 2).toUpperCase();
  const email = user?.email || "";
  const role = user?.role || "";

  return (
    <>
      <header className="fixed top-0 left-0 w-full h-16 flex items-center justify-between px-8 bg-white border-b border-gray-200 z-50">
        
        <div className="flex items-center cursor-pointer">
          <img src={Logo} alt="Version 1" className="h-8 object-contain" />
        </div>

        {user && (
          <div className="relative" ref={menuRef}>
            <div 
              onClick={() => setOpen(!open)}
              className="flex items-center gap-3 cursor-pointer p-1.5 rounded-full hover:bg-gray-50 transition-colors"
            >
              <div className="text-right hidden md:block">
                 <p className="text-sm font-semibold text-gray-800 leading-tight">{username}</p>
                 <p className="text-xs text-teal-600 font-medium">{role}</p>
              </div>
              <Avatar 
                sx={{ bgcolor: "#00A8A8", width: 40, height: 40, fontSize: "1rem", fontWeight: "bold" }}
              >
                {initials}
              </Avatar>
            </div>

            {open && (
              <div className="absolute right-0 mt-3 w-64 bg-white border border-gray-100 rounded-xl shadow-xl z-50 animate-fadeIn overflow-hidden">
                
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                   <p className="font-bold text-gray-800">{username}</p>
                   <p className="text-xs text-gray-500 truncate">{email}</p>
                </div>

                <div className="p-2">
                   <button 
                     onClick={() => { setProfileDialogOpen(true); setOpen(false); }}
                     className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                   >
                      <AccountCircle fontSize="small" className="text-teal-600"/>
                      My Info
                   </button>
                   
                   <button 
                     onClick={logout}
                     className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-1"
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
      
      <ProfileDialog open={profileDialogOpen} onClose={() => setProfileDialogOpen(false)} user={user} />
    </>
  );
}

export default Header;