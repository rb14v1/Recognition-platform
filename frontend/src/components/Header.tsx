import { useState, useRef, useEffect } from "react";
import Logo from "../assets/Version1-Logo.png";
import { useAuth } from "../context/AuthContext"; // Import Context

function Header() {
  const { user, logout } = useAuth(); // Use Context
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fallback if user isn't loaded yet
  const username = user?.username || "Guest";
  const initials = username.slice(0, 2).toUpperCase();

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 w-full h-14 flex items-center justify-between px-6 bg-white shadow-[0_2px_6px_rgba(0,0,0,0.15)] z-50">
      
      <div className="flex items-center">
        <img src={Logo} alt="Version 1 Logo" className="w-36 object-contain" />
      </div>

      {user && ( // Only show avatar if logged in
        <div className="relative" ref={menuRef}>
          <div
            onClick={() => setOpen(!open)}
            className="w-11 h-11 bg-teal-600 text-white rounded-full flex items-center justify-center cursor-pointer font-semibold shadow-md transition-all hover:bg-teal-700"
          >
            {initials}
          </div>

          {open && (
            <div className="absolute right-0 mt-3 w-80 bg-white border border-gray-200 shadow-2xl rounded-xl z-50 py-5 px-6 animate-fadeIn">
              <div className="absolute -top-2 right-4 w-4 h-4 bg-white border-l border-t border-gray-200 rotate-45"></div>

              <div className="flex justify-between items-center text-sm mb-4">
                <span className="text-teal-700 font-semibold text-[15px]">Version 1</span>
                <button onClick={logout} className="text-teal-600 hover:text-teal-800 hover:underline">
                  Sign out
                </button>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-16 h-16 bg-white border-[2.5px] border-teal-700 rounded-full flex items-center justify-center text-2xl font-bold text-teal-700 shadow-sm">
                  {initials}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-[17px]">{username}</p>
                  <p className="text-gray-600 text-sm">Employee</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

export default Header;