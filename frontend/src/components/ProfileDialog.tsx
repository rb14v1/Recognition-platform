import { useState, useEffect } from "react";
import { Dialog, Avatar, Typography, IconButton, Chip, TextField } from "@mui/material";
import { Close, Badge, Business, Work, Person, LocationOn, Edit, Save } from "@mui/icons-material";
import type { User } from "../types";
import { authAPI } from "../api/auth"


interface ProfileDialogProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  isOwnProfile?: boolean; 
}

const ProfileDialog = ({ open, onClose, user, isOwnProfile = false }: ProfileDialogProps) => {
  const [isEditingLoc, setIsEditingLoc] = useState(false);
  const [locationValue, setLocationValue] = useState("");
  const [displayLocation, setDisplayLocation] = useState("");

  useEffect(() => {
    if (user) {
        const loc = user.location || ""; 
        setLocationValue(loc);
        setDisplayLocation(loc);
    }
  }, [user]);

  if (!user) return null;

  const initial = (user.username || "U").charAt(0).toUpperCase();
  const displayName = user.username || "User";

  const handleSaveLocation = async () => {
    try {
        await authAPI.updateProfile({ location: locationValue });

        setDisplayLocation(locationValue);
        setIsEditingLoc(false);
        console.log("Location updated successfully!");
    } catch (error) {
        console.error("Failed to update location", error);
        alert("Failed to save location. Please try again.");
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{ sx: { borderRadius: 4, padding: 0 } }}
    >
      <div className="relative bg-gradient-to-r from-teal-600 to-teal-500 h-32">
        <IconButton 
            onClick={onClose} 
            sx={{ position: 'absolute', right: 8, top: 8, color: 'white', bgcolor: 'rgba(0,0,0,0.1)' }}
        >
            <Close />
        </IconButton>
      </div>

      <div className="px-6 pb-6 -mt-12">
        <div className="flex flex-col items-center">
            <Avatar 
                sx={{ width: 96, height: 96, border: '4px solid white', bgcolor: 'white', color: '#00A8A8', fontSize: 40, fontWeight: 'bold', boxShadow: 3 }}
            >
                {initial}
            </Avatar>
            <Typography variant="h5" fontWeight="bold" className="mt-2 text-gray-800">
                {displayName}
            </Typography>
            <Chip label={user.role || "Employee"} size="small" sx={{ mt: 1, bgcolor: '#e0f2f1', color: '#00695c', fontWeight: 'bold' }} />
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoItem icon={<Badge />} label="Employee ID" value={user.employee_id} />
            <InfoItem icon={<Work />} label="Portfolio" value={user.employee_role} />
            <InfoItem icon={<Business />} label="Practise" value={user.employee_dept} />
            
            {/* LOCATION SECTION (UPDATED) */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 relative group">
                <div className="text-teal-600 mt-0.5"><LocationOn /></div>
                <div className="flex-1">
                    <Typography variant="caption" className="text-gray-500 uppercase font-bold tracking-wide">
                        Location
                    </Typography>

                    {isEditingLoc ? (
                        <div className="flex items-center gap-2 mt-1">
                            <TextField 
                                variant="standard" 
                                size="small" 
                                value={locationValue}
                                onChange={(e) => setLocationValue(e.target.value)}
                                placeholder="City, Country"
                                autoFocus
                            />
                            <IconButton size="small" color="primary" onClick={handleSaveLocation}>
                                <Save fontSize="small" />
                            </IconButton>
                        </div>
                    ) : (
                        <Typography variant="body1" className="text-gray-900 font-medium">
                            {displayLocation || "Not Set"}
                        </Typography>
                    )}
                </div>

                {/* THE PEN BUTTON: Only shows if it's YOUR profile and not already editing */}
                {isOwnProfile && !isEditingLoc && (
                    <IconButton 
                        size="small" 
                        sx={{ position: 'absolute', right: 4, top: 4 }}
                        onClick={() => setIsEditingLoc(true)}
                    >
                        <Edit fontSize="small" className="text-gray-400 hover:text-teal-600" />
                    </IconButton>
                )}
            </div>

            <InfoItem icon={<Person />} label="Manager" value={user.manager_name} />
        </div>
      </div>
    </Dialog>
  );
};

const InfoItem = ({ icon, label, value }: any) => (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
        <div className="text-teal-600 mt-0.5">{icon}</div>
        <div>
            <Typography variant="caption" className="text-gray-500 uppercase font-bold tracking-wide">
                {label}
            </Typography>
            <Typography variant="body1" className="text-gray-900 font-medium">
                {value || "Not Assigned"}
            </Typography>
        </div>
    </div>
);

export default ProfileDialog;