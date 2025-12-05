import { useState, useEffect } from "react";
import { 
  Card, CardContent, Typography, Button, TextField, 
  Dialog, DialogTitle, DialogContent, DialogActions, Chip, Avatar, IconButton, 
} from "@mui/material";
import { Edit } from "@mui/icons-material";
import { authAPI } from "../api/auth";
import toast from 'react-hot-toast';

const TeamManagement = () => {
  const [team, setTeam] = useState<any[]>([]);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  
  // Edit Logic
  const [editForm, setEditForm] = useState({ employee_dept: "", employee_role: "" });

  useEffect(() => { loadTeam(); }, []);

  const loadTeam = async () => {
    try {
      const res = await authAPI.getMyTeam();
      setTeam(res.data);
    } catch(e) { console.error(e); }
  };

  const handleUpdate = async () => {
    try {
        await authAPI.updateTeamMember(selectedMember.id, editForm);
        toast.success("Member Details Updated!");
        setOpenEdit(false);
        loadTeam();
    } catch(e) { toast.error("Update failed"); }
  };

  return (
    <div className="animate-fadeIn max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
            <Typography variant="h5" fontWeight="bold" className="text-gray-800">My Team</Typography>
            <Typography variant="body2" color="textSecondary">Manage direct reports and assign job titles.</Typography>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {team.map(member => (
          <Card key={member.id} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <CardContent className="flex items-center gap-4 relative">
              <Avatar sx={{ width: 56, height: 56, bgcolor: '#cbd5e1', fontWeight: 'bold' }}>
                {member.username?.[0]?.toUpperCase()}
              </Avatar>
              <div className="flex-grow">
                <Typography fontWeight="bold" className="text-gray-800">{member.username}</Typography>
                <div className="flex flex-col gap-1 mt-1">
                    <Typography variant="caption" className="text-gray-500 block">
                        {member.employee_role || "No Job Title"} 
                    </Typography>
                     <Chip 
                        label={member.employee_dept || "No Dept"} 
                        size="small" 
                        sx={{ width: 'fit-content', height: 20, fontSize: '0.6rem', bgcolor: '#f1f5f9' }} 
                    />
                </div>
              </div>
              <IconButton onClick={() => { 
                  setSelectedMember(member); 
                  setEditForm({ employee_dept: member.employee_dept || "", employee_role: member.employee_role || "" }); 
                  setOpenEdit(true); 
              }}>
                <Edit fontSize="small" className="text-teal-600"/>
              </IconButton>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* --- DIALOG: EDIT DETAILS --- */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="xs">
        <DialogTitle>Update {selectedMember?.username}</DialogTitle>
        <DialogContent className="pt-4 space-y-4">
            <Typography variant="caption" className="text-gray-500">
                Update the official job title and department for this employee.
            </Typography>
            <TextField fullWidth label="Job Title" value={editForm.employee_role} onChange={(e) => setEditForm({...editForm, employee_role: e.target.value})} size="small" />
            <TextField fullWidth label="Department" value={editForm.employee_dept} onChange={(e) => setEditForm({...editForm, employee_dept: e.target.value})} size="small" />
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setOpenEdit(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleUpdate} sx={{ bgcolor: '#00A8A8' }}>Save Changes</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default TeamManagement;