import { useState, useEffect, useMemo } from "react";
import {
  Typography,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Avatar,
  TextField,
  Chip,
  Tooltip
} from "@mui/material";
import { Warning, Close, ArrowBack, EmojiEvents, Edit, Delete } from "@mui/icons-material";
import { authAPI } from "../api/auth";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import SearchBar from "../components/SearchBar"; 
import PaginationControl from "../components/PaginationControl"; // 🔥 IMPORT

const ITEMS_PER_PAGE = 5;

const Nominate = () => {
  const navigate = useNavigate();

  // Data
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [page, setPage] = useState(1);

  // Nomination Status
  const [hasNominated, setHasNominated] = useState(false);
  const [mySelection, setMySelection] = useState<any | null>(null);
  const [savedReason, setSavedReason] = useState("");

  // --- FILTERS STATE ---
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<"name" | "empId">("name");
  const [filters, setFilters] = useState({
    dept: "All",
    role: "All",
    location: "All"
  });

  // Actions
  const [selectedEmp, setSelectedEmp] = useState<any | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Dialogs
  const [nominateDialogOpen, setNominateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");

  // Load Data
  useEffect(() => {
    loadPageData();
  }, []);

  const loadPageData = async () => {
    setLoading(true);
    try {
      const [statusRes, listRes] = await Promise.all([
        authAPI.getNominationStatus(),
        authAPI.getNominationOptions(),
      ]);

      setHasNominated(Boolean(statusRes.data?.has_nominated));
      setMySelection(statusRes.data?.nominee ?? null);
      setSavedReason(statusRes.data?.reason ?? "");

      const listData = Array.isArray(listRes.data)
        ? listRes.data
        : listRes.data?.results ?? [];

      setEmployees(listData);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // --- Derived Options for SearchBar ---
  const departments = useMemo(
    () => ["All", ...Array.from(new Set(employees.map((e) => e.employee_dept).filter(Boolean)))],
    [employees]
  );

  const allRoles = useMemo(
    () => ["All", ...Array.from(new Set(employees.map((e) => e.employee_role).filter(Boolean)))],
    [employees]
  );

  const rolesForDept = useMemo(() => {
    if (filters.dept === "All") return allRoles;
    const setRoles = new Set(
      employees
        .filter((e) => e.employee_dept === filters.dept)
        .map((e) => e.employee_role)
        .filter(Boolean)
    );
    return ["All", ...Array.from(setRoles)];
  }, [filters.dept, employees, allRoles]);

  useEffect(() => {
    if (!rolesForDept.includes(filters.role)) {
      setFilters(prev => ({ ...prev, role: "All" }));
    }
  }, [rolesForDept, filters.role]);

  const locations = useMemo(
    () => ["All", ...Array.from(new Set(employees.map((e) => e.location).filter(Boolean)))],
    [employees]
  );

  // --- 🔥 Reset Page on Filter Change ---
  useEffect(() => {
    setPage(1);
  }, [searchTerm, searchType, filters]);

  // --- Filter Logic ---
  const filteredEmployees = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return employees.filter((emp) => {
      const username = emp.username?.toLowerCase() || "";
      const empId = emp.employee_id?.toLowerCase() || "";
      const dept = emp.employee_dept || "";
      const role = emp.employee_role || "";
      const loc = emp.location || ""; 

      let matchesSearch =
        searchType === "name" ? username.includes(q) : empId.includes(q);

      const matchesDept = filters.dept === "All" || dept === filters.dept;
      const matchesRole = filters.role === "All" || role === filters.role;
      const matchesLoc = filters.location === "All" || loc === filters.location;

      return matchesSearch && matchesDept && matchesRole && matchesLoc;
    });
  }, [employees, searchTerm, searchType, filters]);

  // --- 🔥 Pagination Logic ---
  const paginatedEmployees = useMemo(() => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    return filteredEmployees.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredEmployees, page]);

  const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);

  // Handlers
  const handleSelectClick = (emp: any) => {
    if (hasNominated) return;
    setSelectedEmp(emp);
    setMode("create");
    setReason("");
    setNominateDialogOpen(true);
  };

  const handleEditClick = (emp: any) => {
    setSelectedEmp(emp);
    setMode("edit");
    setReason(savedReason);
    setNominateDialogOpen(true);
  };

  const handleRemoveClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!reason.trim() || !selectedEmp) return;
    setSubmitting(true);
    try {
      if (mode === "create") {
        await authAPI.submitNomination({ nominee: selectedEmp.id, reason });
        toast.success("Nomination submitted!");
      } else {
        await authAPI.updateNomination({ nominee: selectedEmp.id, reason });
        toast.success("Nomination updated!");
      }
      setNominateDialogOpen(false);
      loadPageData();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    setSubmitting(true);
    try {
      await authAPI.withdrawNomination();
      toast.success("Nomination removed.");
      setHasNominated(false);
      setMySelection(null);
      setDeleteDialogOpen(false);
      loadPageData();
    } catch (err: any) {
      toast.error("Failed");
    } finally {
      setSubmitting(false);
    }
  };

  // --- Reusable Row Component ---
  const EmployeeRow = ({ emp, type }: { emp: any, type: 'nominate' | 'manage' }) => (
    <div className="group flex flex-col md:flex-row items-center p-4 rounded-xl border border-gray-200 bg-white hover:shadow-md hover:border-teal-300 transition-all duration-200">
        
        {/* LEFT: Identity */}
        <div className="flex items-center gap-4 w-full md:w-1/4 mb-2 md:mb-0">
            <Avatar 
                sx={{ 
                    width: 48, height: 48, 
                    bgcolor: type === 'manage' ? '#00A8A8' : '#e0f2f1', 
                    color: type === 'manage' ? 'white' : '#00695c',
                    fontWeight: 'bold'
                }}
            >
                {(emp.username || emp.nominee_name)?.charAt(0).toUpperCase()}
            </Avatar>
            <div>
                <Typography fontWeight="bold" className="text-gray-900 leading-tight">
                    {emp.username || emp.nominee_name}
                </Typography>
                <Typography variant="caption" className="md:hidden text-gray-400 font-mono">
                     {emp.employee_id}
                </Typography>
            </div>
        </div>

        {/* MIDDLE COLUMNS */}
        <div className="flex items-center justify-between w-full md:flex-1 gap-4">
            
            {/* ID Column */}
            <div className="w-20 text-sm text-gray-500 font-mono hidden md:block">
                {emp.employee_id}
            </div>

            {/* Role Column */}
            <div className="flex-1 text-sm font-medium text-gray-700">
                {emp.employee_role || <span className="text-gray-400 italic">No Title</span>}
            </div>

            {/* Dept Column */}
            <div className="w-32">
                <Chip 
                    label={emp.employee_dept || "General"} 
                    size="small"
                    sx={{ 
                        bgcolor: '#f3f4f6', 
                        color: '#4b5563', 
                        fontWeight: 600,
                        borderRadius: '6px'
                    }}
                />
            </div>

            {/* RIGHT: Actions */}
            <div className="pl-4 w-[120px] flex justify-end gap-2">
                {type === 'nominate' ? (
                     <Button
                        variant="outlined"
                        onClick={() => handleSelectClick(emp)}
                        startIcon={<EmojiEvents />}
                        size="small"
                        sx={{
                            borderColor: '#00A8A8',
                            color: '#00A8A8',
                            textTransform: 'none',
                            fontWeight: 'bold',
                            borderRadius: '8px',
                            '&:hover': { bgcolor: '#e0f2f1', borderColor: '#008f8f' }
                        }}
                    >
                        Nominate
                    </Button>
                ) : (
                    <>
                        <Tooltip title="Edit Nomination">
                             <IconButton 
                                onClick={() => handleEditClick(emp)} 
                                className="text-gray-400 hover:text-teal-600 hover:bg-teal-50"
                            >
                                <Edit fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Remove Nomination">
                             <IconButton 
                                onClick={handleRemoveClick} 
                                className="text-gray-400 hover:text-red-500 hover:bg-red-50"
                            >
                                <Delete fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </>
                )}
            </div>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">

      <div className="w-full flex justify-start">
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate("/dashboard")}
          sx={{ mb: 3, color: "text.secondary", textTransform: "none" }}
        >
          Back to Dashboard
        </Button>
      </div>

      <Typography variant="h5" fontWeight="800">
        {hasNominated ? "Your Selection" : "Nominate a Peer"}
      </Typography>

      <Typography variant="body2" className="text-gray-500">
        {hasNominated
          ? "You have nominated a colleague. You can edit or remove it."
          : "Select a deserving peer and tell us why they stand out."}
      </Typography>

      {/* ---------------- FILTER BAR ---------------- */}
      {!hasNominated && (
        <SearchBar 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchType={searchType}
          onSearchTypeChange={setSearchType}
          filters={filters}
          onFilterChange={(key, val) => setFilters(prev => ({ ...prev, [key]: val }))}
          options={{
            departments,
            roles: rolesForDept,
            locations
          }}
        />
      )}

      {/* ---------------- EMPLOYEE LIST ---------------- */}
      <div className="max-w-6xl mx-auto mt-6">
        {loading ? (
          <div className="flex justify-center p-10">
            <CircularProgress sx={{ color: '#00A8A8' }} />
          </div>
        ) : hasNominated && mySelection ? (
          <div className="flex flex-col gap-4">
             <EmployeeRow emp={mySelection} type="manage" />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            
            {/* HEADER ROW */}
            <div className="hidden md:flex items-center gap-4 px-6 py-3 bg-gray-50 border border-gray-200 rounded-t-xl text-xs font-bold text-gray-500 uppercase tracking-wider">
                <div className="w-1/4 pl-2">Employee Details</div>
                <div className="flex-1 flex items-center gap-4">
                    <div className="w-20">ID</div>
                    <div className="flex-1">Job Title</div>
                    <div className="w-32">Department</div>
                </div>
                <div className="w-[120px] text-right pr-2">Action</div>
            </div>

            {/* List Rows */}
            {paginatedEmployees.map(emp => (
                <EmployeeRow key={emp.id} emp={emp} type="nominate" />
            ))}

            {filteredEmployees.length === 0 && (
              <div className="text-center text-gray-500 py-12 border border-dashed rounded-xl mt-4 bg-white/50">
                <Typography>No employees found matching your criteria.</Typography>
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
      </div>

      {/* ---------------- DIALOGS (Existing logic) ---------------- */}
      <Dialog
        open={nominateDialogOpen}
        onClose={() => setNominateDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 4, p: 1 } }}
      >
        <DialogTitle className="flex justify-between items-center">
          <span>{mode === "edit" ? "Update Nomination" : "Nominate Colleague"}</span>
          <IconButton onClick={() => setNominateDialogOpen(false)} size="small">
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <div className="bg-gray-50 p-3 rounded-lg mb-4 flex items-center gap-3">
            <Avatar sx={{ width: 32, height: 32, bgcolor: "#00A8A8" }}>
              {selectedEmp?.username?.charAt(0)}
            </Avatar>
            <div>
              <Typography fontWeight="bold">{selectedEmp?.username}</Typography>
              <Typography variant="caption">{selectedEmp?.employee_role}</Typography>
            </div>
          </div>

          <Typography className="text-gray-600 mb-2 font-medium">
            Reason for Nomination <span className="text-red-500">*</span>
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
            placeholder="Describe why this person deserves recognition..."
          />
        </DialogContent>

        <DialogActions className="p-4 pt-0">
          <Button onClick={() => setNominateDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!reason.trim() || submitting}
            sx={{ bgcolor: "#00A8A8", "&:hover": { bgcolor: "#008f8f" } }}
            onClick={handleSubmit}
          >
            {submitting ? "Saving..." : mode === "edit" ? "Update" : "Submit"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 4, p: 2 } }}
      >
        <div className="flex flex-col items-center text-center">
          <div className="bg-red-50 text-red-500 p-3 rounded-full mb-3">
            <Warning fontSize="large" />
          </div>
          <Typography fontWeight="bold">Remove Nomination?</Typography>
          <Typography variant="body2" className="text-gray-500 mb-6">
            Are you sure you want to remove your nomination?
          </Typography>

          <div className="flex gap-3 w-full">
            <Button fullWidth variant="outlined" onClick={() => setDeleteDialogOpen(false)}>
              Keep
            </Button>
            <Button fullWidth color="error" variant="contained" onClick={handleConfirmDelete}>
              Remove
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default Nominate;