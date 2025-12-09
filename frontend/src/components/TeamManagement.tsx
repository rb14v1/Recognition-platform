import { useState, useEffect, useMemo } from "react";
import {
  Typography, Button, TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, CircularProgress, Avatar, Chip, Tooltip
} from "@mui/material";
import { Group, Edit, ArrowBack } from "@mui/icons-material";
import { authAPI } from "../api/auth";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import PaginationControl from "../components/PaginationControl"; // 🔥 IMPORT

const ITEMS_PER_PAGE = 6;

const TeamManagement = () => {
  const navigate = useNavigate();

  // Data
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [page, setPage] = useState(1);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<"name" | "empId">("name");
  const [filters, setFilters] = useState({
    dept: "All",
    role: "All",
    location: "All"
  });

  // Edit Dialog State
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [editForm, setEditForm] = useState({ employee_dept: "", employee_role: "" });

  useEffect(() => { loadTeam(); }, []);

  const loadTeam = async () => {
    setLoading(true);
    try {
      // Fetch ALL team members initially
      const res = await authAPI.getMyTeam();
      setTeam(res.data);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load team");
    } finally {
      setLoading(false);
    }
  };

  // --- DERIVED OPTIONS (For Dropdowns) ---
  const departments = useMemo(() => 
    ["All", ...Array.from(new Set(team.map(m => m.employee_dept).filter(Boolean)))], 
    [team]
  );
  const jobRoles = useMemo(() => 
    ["All", ...Array.from(new Set(team.map(m => m.employee_role).filter(Boolean)))], 
    [team]
  );
  const locations = useMemo(() => 
    ["All", ...Array.from(new Set(team.map(m => m.location).filter(Boolean)))], 
    [team]
  );

  // --- 🔥 Reset Page on Filter Change ---
  useEffect(() => {
    setPage(1);
  }, [searchTerm, searchType, filters]);

  // --- CLIENT-SIDE FILTERING ---
  const filteredTeam = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return team.filter((m) => {
      const username = m.username?.toLowerCase() || "";
      const empId = m.employee_id?.toLowerCase() || "";
      const dept = m.employee_dept || "";
      const job = m.employee_role || "";
      const loc = m.location || "";

      const matchesSearch = searchType === "name" 
        ? username.includes(q) 
        : empId.includes(q);

      const matchesDept = filters.dept === "All" || dept === filters.dept;
      const matchesRole = filters.role === "All" || job === filters.role;
      const matchesLoc = filters.location === "All" || loc === filters.location;

      return matchesSearch && matchesDept && matchesRole && matchesLoc;
    });
  }, [team, searchTerm, searchType, filters]);

  // --- 🔥 Pagination Logic ---
  const paginatedTeam = useMemo(() => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    return filteredTeam.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTeam, page]);

  const totalPages = Math.ceil(filteredTeam.length / ITEMS_PER_PAGE);

  // Actions
  const handleEditClick = (member: any) => {
    setSelectedMember(member);
    setEditForm({
      employee_dept: member.employee_dept || "",
      employee_role: member.employee_role || "",
    });
    setOpenEdit(true);
  };

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
    <div className="animate-fadeIn max-w-7xl mx-auto pb-20 p-6">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6">
        <div>
            <Button
                startIcon={<ArrowBack />}
                onClick={() => navigate("/dashboard")}
                sx={{ mb: 2, color: "text.secondary", textTransform: "none" }}
            >
                Back to Dashboard
            </Button>
            <Typography variant="h5" fontWeight="bold" className="text-gray-800 flex items-center gap-2">
                <Group className="text-teal-600" /> My Team
            </Typography>
            <Typography variant="body2" color="textSecondary" className="mt-1">
                Manage your direct reports ({team.length} members)
            </Typography>
        </div>
      </div>

      {/* SEARCH BAR */}
      <SearchBar 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchType={searchType}
        onSearchTypeChange={setSearchType}
        filters={filters}
        onFilterChange={(key, val) => setFilters(prev => ({ ...prev, [key]: val }))}
        options={{
            departments,
            roles: jobRoles,
            locations
        }}
      />

      {/* LIST CONTENT */}
      {loading ? (
        <div className="flex justify-center p-12">
          <CircularProgress sx={{ color: "#00A8A8" }} />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
            
            {/* 🔥 HEADER ROW */}
            <div className="hidden md:flex items-center gap-4 px-6 py-3 bg-gray-50 border border-gray-200 rounded-t-xl text-xs font-bold text-gray-500 uppercase tracking-wider">
                <div className="w-1/3 pl-2">Employee Details</div>
                <div className="flex-1 flex items-center gap-4">
                    <div className="w-20">ID</div>
                    <div className="flex-1">Job Title</div>
                    <div className="w-32">Department</div>
                </div>
                <div className="w-[120px] text-right pr-4">Action</div>
            </div>

            {/* ROWS */}
            {paginatedTeam.map((m) => (
                <div
                    key={m.id}
                    className="group flex flex-col md:flex-row items-center p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md hover:border-teal-300 transition-all duration-200"
                >
                    {/* LEFT: Identity */}
                    <div className="flex items-center gap-4 w-full md:w-1/3 mb-2 md:mb-0">
                        <Avatar
                            sx={{
                                width: 48, height: 48,
                                bgcolor: "#00A8A8", color: "white",
                                fontWeight: "bold",
                            }}
                        >
                            {m.username?.charAt(0)?.toUpperCase()}
                        </Avatar>
                        <div>
                            <Typography fontWeight="bold" className="text-gray-900 leading-tight">
                                {m.username}
                            </Typography>
                            <Typography variant="caption" className="md:hidden text-gray-400 font-mono">
                                {m.employee_id}
                            </Typography>
                        </div>
                    </div>

                    {/* MIDDLE: Details */}
                    <div className="flex items-center justify-between w-full md:flex-1 gap-4">
                        {/* ID Column */}
                        <div className="w-20 text-sm text-gray-500 font-mono hidden md:block">
                            {m.employee_id}
                        </div>

                        {/* Role Column */}
                        <div className="flex-1 text-sm font-medium text-gray-700">
                            {m.employee_role || <span className="text-gray-400 italic">No Title</span>}
                        </div>

                        {/* Dept Column */}
                        <div className="w-32">
                            <Chip 
                                label={m.employee_dept || "General"} 
                                size="small"
                                sx={{ 
                                    bgcolor: '#f3f4f6', color: '#4b5563', 
                                    fontWeight: 600, borderRadius: '6px'
                                }}
                            />
                        </div>
                    </div>

                    {/* RIGHT: Action */}
                    <div className="w-full md:w-[120px] flex justify-end mt-3 md:mt-0">
                        <Tooltip title="Edit Details">
                            <Button
                                variant="outlined"
                                startIcon={<Edit />}
                                size="small"
                                onClick={() => handleEditClick(m)}
                                sx={{
                                    borderColor: '#00A8A8',
                                    color: '#00A8A8',
                                    textTransform: 'none',
                                    fontWeight: 'bold',
                                    '&:hover': { bgcolor: '#e0f2f1', borderColor: '#008f8f' }
                                }}
                            >
                                Edit
                            </Button>
                        </Tooltip>
                    </div>
                </div>
            ))}

            {filteredTeam.length === 0 && (
                <div className="text-center py-12 border border-dashed rounded-xl bg-gray-50 text-gray-500">
                    No team members match your search criteria.
                </div>
            )}

            {/* 🔥 PAGINATION CONTROL */}
            <PaginationControl 
                count={totalPages} 
                page={page} 
                onChange={(_, v) => setPage(v)} 
            />
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