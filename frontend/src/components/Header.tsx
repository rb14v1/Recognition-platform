import { useState, useRef, useEffect } from "react";
import Logo from "../assets/Version1-Logo.png";
import { useAuth } from "../context/AuthContext";
import {
  Avatar,
  IconButton,
  Badge,
  Popover,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import {
  Logout,
  AccountCircle,
  NotificationsNone,
} from "@mui/icons-material";
import ProfileDialog from "./ProfileDialog";
import { authAPI } from "../api/auth";

function Header() {
  const { user, logout } = useAuth();

  const [open, setOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [notifAnchor, setNotifAnchor] = useState<HTMLElement | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (user?.username) {
      loadNotifications();
    }
  }, [user?.username]);

  const loadNotifications = async () => {
    try {
      const res = await authAPI.getNotifications();
      setNotifications(res.data);
      setUnread(res.data.filter((n: any) => !n.is_read).length);
    } catch (e) {
      console.error("Notification load failed", e);
    }
  };

  const handleNotifClick = async (event: React.MouseEvent<HTMLElement>) => {
    setNotifAnchor(event.currentTarget);

    const unreadNotifs = notifications.filter(n => !n.is_read);
    for (const n of unreadNotifs) {
      await authAPI.markNotificationRead(n.id);
    }
    setUnread(0);
  };

  const handleNotifClose = () => setNotifAnchor(null);

  if (!user) return null;

  // SAFE INITIALS
  const username = user?.username ?? "";
  const initials = username ? username.substring(0, 2).toUpperCase() : "U";

  return (
    <>
      <header className="fixed top-0 left-0 w-full h-16 flex items-center justify-between px-8 bg-white border-b border-gray-200 z-50">
        <img src={Logo} alt="Version 1" className="h-8 object-contain" />

        <div className="flex items-center gap-6">
          <IconButton onClick={handleNotifClick}>
            <Badge badgeContent={unread} color="error">
              <NotificationsNone sx={{ fontSize: 28, color: "#00A8A8" }} />
            </Badge>
          </IconButton>

          <Popover
            open={Boolean(notifAnchor)}
            anchorEl={notifAnchor}
            onClose={handleNotifClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            PaperProps={{ sx: { width: 320, borderRadius: 2 } }}
          >
            <div className="p-3 font-semibold text-teal-700">Notifications</div>
            <Divider />
            <List sx={{ maxHeight: 300, overflowY: "auto" }}>
              {notifications.length === 0 ? (
                <ListItem>
                  <ListItemText primary="No notifications yet" />
                </ListItem>
              ) : (
                notifications.map((n: any) => (
                  <ListItem key={n.id}>
                    <ListItemText
                      primary={n.message}
                      primaryTypographyProps={{
                        fontWeight: n.is_read ? "normal" : "bold",
                      }}
                    />
                  </ListItem>
                ))
              )}
            </List>
          </Popover>

          <div ref={menuRef} className="relative">
            <div
              onClick={() => setOpen(!open)}
              className="flex items-center gap-3 cursor-pointer"
            >
              <Avatar sx={{ bgcolor: "#00A8A8" }}>{initials}</Avatar>
            </div>

            {open && (
              <div className="absolute right-0 mt-3 w-56 bg-white shadow-lg rounded-xl">
                <button
                  onClick={() => {
                    setProfileDialogOpen(true);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2"
                >
                  <AccountCircle fontSize="small" />
                  My Info
                </button>

                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-red-600"
                >
                  <Logout fontSize="small" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <ProfileDialog
        open={profileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
        user={user}
      />
    </>
  );
}

export default Header;
