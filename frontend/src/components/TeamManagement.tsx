import { useState, useEffect } from "react";
import {
  Typography, Button, TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, CircularProgress, InputAdornment
} from "@mui/material";
import { Group, Edit, Search } from "@mui/icons-material";
import { authAPI } from "../api/auth";
import toast from "react-hot-toast";
import { Avatar } from "@mui/material";

const TeamManagement = () => {
  const [team, setTeam] = useState<any[]>([]);
  const [filteredTeam, setFilteredTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search
  const [searchTerm, setSearchTerm] = useState("");

  // Edit Dialog State
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [editForm, setEditForm] = useState({ employee_dept: "", employee_role: "" });

  useEffect(() => { loadTeam(); }, []);

  const loadTeam = async () => {
    setLoading(true);
    try {
      const res = await authAPI.getMyTeam();
      setTeam(res.data);
      setFilteredTeam(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // 🔍 Search Handler
  const handleSearch = () => {
    const term = searchTerm.toLowerCase();
    const results = team.filter((e) =>
      e.username.toLowerCase().includes(term)
    );
    setFilteredTeam(results);
  };

  // Open Edit Modal
  const handleEditClick = (member: any) => {
    setSelectedMember(member);
    setEditForm({
      employee_dept: member.employee_dept || "",
      employee_role: member.employee_role || "",
    });
    setOpenEdit(true);
  };

  // Submit Update
  const handleUpdate = async () => {
    try {
      await authAPI.updateTeamMember(selectedMember.id, editForm);
      toast.success("Member Details Updated!");
      setOpenEdit(false);
      loadTeam();
    } catch (e) {
      toast.error("Update failed");
    }
  };

  return (
    <div className="animate-fadeIn max-w-7xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <Typography
          variant="h5"
          fontWeight="bold"
          className="text-gray-800 flex items-center gap-2"
        >
          <Group className="text-teal-600" /> My Team
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Manage your direct reports ({team.length} members)
        </Typography>
      </div>

      {/* SEARCH BAR */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">

        <TextField
          placeholder="Search employee name..."
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search className="text-gray-400" />
              </InputAdornment>
            ),
            sx: {
              borderRadius: 2,
              background: "#fff",
              "& fieldset": { border: "1px solid #e2e2e2" }
            }
          }}
        />

        <Button
          variant="contained"
          onClick={handleSearch}
          startIcon={<Search />}
          sx={{
            bgcolor: "#00A8A8",
            "&:hover": { bgcolor: "#008f8f" },
            px: 5,
            py: 1.4,
            borderRadius: 2,
            fontWeight: "bold"
          }}
        >
          Search
        </Button>
      </div>

      {/* CONTENT AREA */}
      {loading ? (
        <div className="flex justify-center p-12">
          <CircularProgress sx={{ color: "#00A8A8" }} />
        </div>
      ) : filteredTeam.length === 0 ? (
        <div className="text-center text-gray-500 py-10">
          No team members found.
        </div>
      ) : (
        // ROW-LIST UI (Like Promote Page)
        <div className="space-y-4">
          {filteredTeam.map((m) => (
            <div
              key={m.id}
              className="
                flex items-center justify-between
                bg-white shadow-sm border border-gray-200
                rounded-2xl px-6 py-4
              "
            >
              {/* Left Section */}
              <div className="flex items-center gap-5 flex-1">

                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: "#00A8A8",
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "1.1rem",
                  }}
                >
                  {m.username?.charAt(0)?.toUpperCase()}
                </Avatar>

                {/* Details Row */}
                <div className="flex items-center gap-10">

                  <Typography className="text-gray-900 font-semibold min-w-[120px] capitalize">
                    {m.username}
                  </Typography>

                  <Typography className="text-gray-700 min-w-[50px]">
                    {m.employee_id}
                  </Typography>

                  <Typography className="text-gray-700 min-w-[150px] capitalize">
                    {m.employee_role}
                  </Typography>

                  <Typography className="text-gray-700 min-w-[140px] capitalize">
                    {m.employee_dept}
                  </Typography>

                </div>
              </div>

              {/* Edit Button */}
              <Button
                variant="contained"
                startIcon={<Edit />}
                onClick={() => handleEditClick(m)}
                sx={{
                  bgcolor: "#00A8A8",
                  "&:hover": { bgcolor: "#008f8f" },
                  px: 4,
                  py: 1.2,
                  borderRadius: 2,
                  fontWeight: "bold",
                }}
              >
                Edit
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* --- EDIT DIALOG --- */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="xs">
        <DialogTitle>Update {selectedMember?.username}</DialogTitle>

        <DialogContent className="pt-4 space-y-4">
          <TextField
            fullWidth
            label="Job Title"
            variant="outlined"
            value={editForm.employee_role}
            size="small"
            onChange={(e) =>
              setEditForm({ ...editForm, employee_role: e.target.value })
            }
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />

          <TextField
            fullWidth
            label="Department"
            variant="outlined"
            value={editForm.employee_dept}
            size="small"
            onChange={(e) =>
              setEditForm({ ...editForm, employee_dept: e.target.value })
            }
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />
        </DialogContent>

        <DialogActions className="p-4 pt-0">
          <Button onClick={() => setOpenEdit(false)} sx={{ color: "gray" }}>
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleUpdate}
            sx={{
              bgcolor: "#00A8A8",
              borderRadius: 2,
              "&:hover": { bgcolor: "#008f8f" }
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default TeamManagement;
