import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { 
  Button, 
  Card, 
  CardContent, 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Typography,
  Chip
} from "@mui/material";
import { authAPI } from "../api/auth";
import { getErrorMessage } from "../utils/errorHandler";
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user, logout } = useAuth();
  
  // State for Promotion Form
  const [targetId, setTargetId] = useState("");
  const [selectedRole, setSelectedRole] = useState("EMPLOYEE");
  const [loading, setLoading] = useState(false);

  // Available Roles (Must match Backend Enum)
  const roles = [
    { value: "EMPLOYEE", label: "Employee (Level 1)" },
    { value: "COORDINATOR", label: "Coordinator (Level 2)" },
    { value: "COMMITTEE", label: "Committee (Level 3)" },
    { value: "ADMIN", label: "Admin (Level 4)" },
  ];

  // ✅ FIX: Safe Helper to get initials
  // Prevents "charAt of undefined" crash if user isn't fully loaded
  const getInitials = () => {
    if (user?.username) {
        return user.username.charAt(0).toUpperCase();
    }
    return "?"; 
  };

  const handlePromote = async () => {
    if (!targetId) {
      toast.error("Please enter a User ID");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Processing promotion...");

    try {
      // Convert ID to number because API expects Integer
      await authAPI.promote({
        user_id_to_promote: parseInt(targetId),
        new_role: selectedRole
      });
      
      toast.success(`User ${targetId} promoted to ${selectedRole}!`, { id: toastId });
      setTargetId(""); // Reset form
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      toast.error(msg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-full py-10 px-4">
      
      {/* 1. User Profile Section */}
      <Card sx={{ width: "100%", maxWidth: 600, borderRadius: "16px", mb: 4, boxShadow: 3 }}>
        <CardContent className="flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-teal-600 text-white rounded-full flex items-center justify-center text-3xl font-bold mb-3 shadow-md">
                {/* 🔥 SAFE FUNCTION CALL */}
                {getInitials()}
            </div>
            <Typography variant="h5" fontWeight="bold">
                {/* 🔥 SAFE FALLBACK */}
                {user?.username || "Guest User"}
            </Typography>
            <div className="mt-2 mb-4">
                 <Chip label={user?.role || "GUEST"} color="primary" variant="outlined" sx={{ fontWeight: "bold" }} />
            </div>
            
            <Typography variant="body2" color="text.secondary">
                User ID: <span className="font-mono font-bold text-black">{user?.user_id || "N/A"}</span>
            </Typography>

            <Button 
                variant="outlined" 
                color="error" 
                onClick={logout} 
                sx={{ mt: 3, borderRadius: "20px", textTransform: "none" }}
            >
                Log out
            </Button>
        </CardContent>
      </Card>

      {/* 2. Promotion Console (The Test Zone) */}
      <Card sx={{ width: "100%", maxWidth: 600, borderRadius: "16px", boxShadow: 3, border: "1px solid #e0e0e0" }}>
        <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: "#333" }}>
                🚀 Promotion Console
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Enter a User ID to change their role. Remember, you can't promote someone above your own rank!
            </Typography>

            <div className="flex gap-3 flex-col sm:flex-row">
                {/* Target ID Input */}
                <TextField 
                    label="Target User ID" 
                    variant="outlined" 
                    type="number"
                    fullWidth
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    size="small"
                />

                {/* Role Selector */}
                <FormControl fullWidth size="small">
                    <InputLabel>New Role</InputLabel>
                    <Select
                        value={selectedRole}
                        label="New Role"
                        onChange={(e) => setSelectedRole(e.target.value)}
                    >
                        {roles.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </div>

            <Button 
                fullWidth 
                variant="contained" 
                onClick={handlePromote}
                disabled={loading}
                sx={{ 
                    mt: 3, 
                    py: 1.2, 
                    borderRadius: "8px", 
                    backgroundColor: "#00A8A8", 
                    "&:hover": { backgroundColor: "#008f8f" } 
                }}
            >
                {loading ? "Verifying..." : "Promote User"}
            </Button>

        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;