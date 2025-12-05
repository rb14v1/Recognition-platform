import { useState, useEffect } from "react";
import { Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, RadioGroup, FormControlLabel, Radio, Box } from "@mui/material";
import { TrendingUp, School } from "@mui/icons-material";
import { authAPI } from "../api/auth";
import toast from 'react-hot-toast';
import EmployeeCard from "../components/EmployeeCard";

const PromotePage = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [targetRole, setTargetRole] = useState("");

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      const res = await authAPI.getPromotableUsers();
      setUsers(res.data);
    } catch(e) { console.error(e); }
  };

  const handlePromote = async () => {
    if (!selectedUser || !targetRole) return;
    try {
        await authAPI.promote({
            user_id_to_promote: selectedUser.id,
            new_role: targetRole
        });
        toast.success(`${selectedUser.username} promoted successfully!`);
        setOpenDialog(false);
        loadUsers(); // Refresh list
    } catch (e: any) {
        toast.error(e.response?.data?.error || "Promotion failed");
    }
  };

  return (
    <div className="animate-fadeIn max-w-7xl mx-auto">
        <div className="mb-8">
            <Typography variant="h5" fontWeight="bold" className="text-gray-800 flex items-center gap-2">
                <TrendingUp className="text-orange-600"/> Promote Employees
            </Typography>
            <Typography variant="body2" color="textSecondary">
                Elevate eligible employees to higher roles. You can only promote up to your own level.
            </Typography>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {users.map(u => (
                <div key={u.id} className="relative">
                    <EmployeeCard emp={u} />
                    <Button 
                        fullWidth 
                        variant="contained" 
                        color="warning"
                        startIcon={<School />}
                        className="mt-2"
                        sx={{ mt: 2, borderRadius: 2 }}
                        onClick={() => { setSelectedUser(u); setOpenDialog(true); }}
                    >
                        Promote
                    </Button>
                </div>
            ))}
        </div>

        {/* Promotion Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="xs">
            <DialogTitle>Promote {selectedUser?.username}</DialogTitle>
            <DialogContent dividers>
                <Typography variant="body2" className="mb-4 text-gray-500">
                    Current Role: <b>{selectedUser?.role}</b>
                </Typography>
                
                <Typography fontWeight="bold" className="mb-2">Select New Role:</Typography>
                <FormControl component="fieldset">
                    <RadioGroup value={targetRole} onChange={(e) => setTargetRole(e.target.value)}>
                        <FormControlLabel 
                            value="COORDINATOR" 
                            control={<Radio color="warning" />} 
                            label={
                                <Box>
                                    <Typography fontWeight="bold" variant="body2">Coordinator</Typography>
                                    <Typography variant="caption" className="text-gray-500">Can manage teams & approvals</Typography>
                                </Box>
                            } 
                            className="mb-2"
                        />
                        {/* Add more roles here if the backend logic allows (e.g. COMMITTEE) */}
                    </RadioGroup>
                </FormControl>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                <Button variant="contained" color="warning" onClick={handlePromote} disabled={!targetRole}>
                    Confirm Promotion
                </Button>
            </DialogActions>
        </Dialog>
    </div>
  );
};

export default PromotePage;