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
  Tooltip,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from "@mui/material";
import { Warning, Close, ArrowBack, EmojiEvents, Edit, Delete } from "@mui/icons-material";
import { authAPI } from "../api/auth";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import PaginationControl from "../components/PaginationControl";
 
const ITEMS_PER_PAGE = 5;
 
const Nominate = () => {
  const navigate = useNavigate();
 
  // Data
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
 
  // Pagination
  const [page, setPage] = useState(1);
 
  // Nomination Status Data
  const [hasNominated, setHasNominated] = useState(false);
  const [mySelection, setMySelection] = useState<any | null>(null);
 
  // Saved State (for Edit Mode)
  const [savedReason, setSavedReason] = useState("");
  const [savedCategory, setSavedCategory] = useState("");
  const [savedMetrics, setSavedMetrics] = useState<string[]>([]);
 
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<"name" | "empId">("name");
  const [filters, setFilters] = useState({
    dept: "All",
    role: "All",
    location: "All"
  });
 
  // Dialog States
  const [selectedEmp, setSelectedEmp] = useState<any | null>(null);
  const [reason, setReason] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [nominateDialogOpen, setNominateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
 
  // 🔥 DYNAMIC CRITERIA STATE (Replaces hardcoded lists)
  const [metricsByCategory, setMetricsByCategory] = useState<Record<string, string[]>>({});
  const categories = useMemo(() => Object.keys(metricsByCategory), [metricsByCategory]);
 
  useEffect(() => {
    loadPageData();
  }, []);
 
  const loadPageData = async () => {
    setLoading(true);
    try {
      // Fetch Status, Employees List, and Criteria Options
      const [statusRes, listRes, optionsRes] = await Promise.all([
        authAPI.getNominationStatus(),
        authAPI.getNominationOptions(),
        authAPI.getNominationCriteria() // Fetch valid categories/metrics
      ]);
 
      // 1. Set Criteria Options
      setMetricsByCategory(optionsRes.data || {});
 
      // 2. Set Employee List
      const listData = Array.isArray(listRes.data)
        ? listRes.data
        : listRes.data?.results ?? [];
      setEmployees(listData);
 
      // 3. Set Nomination Status
      setHasNominated(Boolean(statusRes.data?.has_nominated));
      setMySelection(statusRes.data?.nominee ?? null);
      setSavedReason(statusRes.data?.reason ?? "");
 
      // 🔥 Transform Backend Data (JSON) -> Frontend State (Category + Array)
      const backendMetrics = statusRes.data?.selected_metrics || [];
      if (backendMetrics.length > 0) {
        // Since UI only supports 1 category, take the first one found
        const firstItem = backendMetrics[0];
        setSavedCategory(firstItem.category);
        // Map all items to get the list of metrics
        setSavedMetrics(backendMetrics.map((item: any) => item.metric));
      } else {
        setSavedCategory("");
        setSavedMetrics([]);
      }
 
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };
 
  // Derived filters
  const departments = useMemo(
    () => ["All", ...new Set(employees.map(e => e.employee_dept).filter(Boolean))],
    [employees]
  );
  const allRoles = useMemo(
    () => ["All", ...new Set(employees.map(e => e.employee_role).filter(Boolean))],
    [employees]
  );
  const rolesForDept = useMemo(() => {
    if (filters.dept === "All") return allRoles;
    return [
      "All",
      ...new Set(
        employees
          .filter(e => e.employee_dept === filters.dept)
          .map(e => e.employee_role)
          .filter(Boolean)
      )
    ];
  }, [employees, filters.dept, allRoles]);
  const locations = useMemo(
    () => ["All", ...new Set(employees.map(e => e.location).filter(Boolean))],
    [employees]
  );
 
  const filteredEmployees = useMemo(() => {
    const q = searchTerm.toLowerCase();
 
    return employees.filter(emp => {
      const matchesSearch =
        searchType === "name"
          ? emp.username?.toLowerCase().includes(q)
          : emp.employee_id?.toLowerCase().includes(q);
 
      const matchesDept = filters.dept === "All" || emp.employee_dept === filters.dept;
      const matchesRole = filters.role === "All" || emp.employee_role === filters.role;
      const matchesLoc = filters.location === "All" || emp.location === filters.location;
 
      return matchesSearch && matchesDept && matchesRole && matchesLoc;
    });
  }, [employees, searchTerm, searchType, filters]);
 
  const paginatedEmployees = filteredEmployees.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );
  const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);
 
  // Handlers
  const handleSelectClick = (emp: any) => {
    setSelectedEmp(emp);
    setMode("create");
    setReason("");
    setSelectedCategory("");
    setSelectedMetrics([]);
    setNominateDialogOpen(true);
  };
 
  const handleEditClick = (emp: any) => {
    setSelectedEmp(emp);
    setMode("edit");
    setReason(savedReason);
    setSelectedCategory(savedCategory);
    setSelectedMetrics(savedMetrics);
    setNominateDialogOpen(true);
  };
 
  const handleSubmit = async () => {
    if (!reason.trim() || !selectedCategory || selectedMetrics.length === 0) return;
 
    setSubmitting(true);
 
    // 🔥 TRANSFORM DATA: Frontend (Cat + List) -> Backend (List of Objects)
    // This existing code in your Nominate.tsx works perfectly for the new logic
    const formattedMetrics = selectedMetrics.map(metric => ({
      category: selectedCategory, // Takes the SINGLE selected category
      metric: metric              // Maps MULTIPLE metrics to it
    }));
 
    const payload = {
      nominee: selectedEmp.id,
      reason,
      selected_metrics: formattedMetrics
    };
 
    try {
      if (mode === "create") {
        await authAPI.submitNomination(payload);
        toast.success("Nomination submitted!");
      } else {
        await authAPI.updateNomination(payload);
        toast.success("Nomination updated!");
      }
 
      setNominateDialogOpen(false);
      loadPageData();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to submit");
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
    } catch {
      toast.error("Cannot remove nomination.");
    } finally {
      setSubmitting(false);
    }
  };
 
  // EMPLOYEE ROW (UNCHANGED)
  const EmployeeRow = ({ emp, type }: { emp: any; type: "nominate" | "manage" }) => (
    <div className="group flex flex-col md:flex-row items-center p-4 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-all duration-200">
      <div className="flex items-center gap-4 w-full md:w-1/4 mb-2 md:mb-0">
        <Avatar sx={{ width: 48, height: 48, bgcolor: "#00A8A8", color: "white" }}>
          {(emp.username || emp.nominee_name)?.charAt(0).toUpperCase()}
        </Avatar>
        <div>
          <Typography fontWeight="bold">
            {emp.username || emp.nominee_name}
          </Typography>
          <Typography variant="caption" className="md:hidden text-gray-400 font-mono">
            {emp.employee_id}
          </Typography>
        </div>
      </div>
 
      <div className="flex items-center justify-between w-full md:flex-1 gap-4">
        <div className="w-20 text-sm text-gray-500 font-mono hidden md:block">
          {emp.employee_id}
        </div>
 
        <div className="flex-1 text-sm font-medium text-gray-700">
          {emp.employee_role || <span className="text-gray-400 italic">No Title</span>}
        </div>
 
        <div className="w-32">
          <Chip
            label={emp.employee_dept || "General"}
            size="small"
            sx={{
              bgcolor: "#f3f4f6",
              color: "#4b5563",
              fontWeight: 600,
              borderRadius: "6px"
            }}
          />
        </div>
 
        <div className="pl-4 w-[120px] flex justify-end gap-2">
          {type === "nominate" ? (
            <Button
              variant="outlined"
              onClick={() => handleSelectClick(emp)}
              startIcon={<EmojiEvents />}
              size="small"
              sx={{
                borderColor: "#00A8A8",
                color: "#00A8A8",
                fontWeight: "bold",
                borderRadius: "8px"
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
                  onClick={() => setDeleteDialogOpen(true)}
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
 
      {/* BACK BUTTON */}
      <div className="w-full flex justify-start">
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate("/dashboard")}
          sx={{ mb: 3, color: "text.secondary", textTransform: "none" }}
        >
          Back to Dashboard
        </Button>
      </div>
 
      {/* TITLE */}
      <Typography variant="h5" fontWeight="800">
        {hasNominated ? "Your Selection" : "Nominate a Peer"}
      </Typography>
 
      <Typography variant="body2" className="text-gray-500">
        {hasNominated
          ? "You have nominated a colleague. You can edit or remove it."
          : "Select a deserving peer and tell us why they stand out."}
      </Typography>
 
      {!hasNominated && (
        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchType={searchType}
          onSearchTypeChange={setSearchType}
          filters={filters}
          onFilterChange={(k, v) => setFilters(prev => ({ ...prev, [k]: v }))}
          options={{ departments, roles: rolesForDept, locations }}
        />
      )}
 
      {/* EMPLOYEE LIST */}
      <div className="max-w-6xl mx-auto mt-6">
        {loading ? (
          <div className="flex justify-center p-10">
            <CircularProgress sx={{ color: "#00A8A8" }} />
          </div>
        ) : hasNominated && mySelection ? (
          <EmployeeRow emp={mySelection} type="manage" />
        ) : (
          <div className="flex flex-col gap-3">
 
            {/* HEADER */}
            <div className="hidden md:flex items-center gap-4 px-6 py-3 bg-gray-50 border border-gray-200 rounded-t-xl text-xs font-bold text-gray-500 uppercase tracking-wider">
              <div className="w-1/4 pl-2">Employee Details</div>
              <div className="flex-1 flex items-center gap-4">
                <div className="w-20">ID</div>
                <div className="flex-1">Job Title</div>
                <div className="w-32">Department</div>
              </div>
              <div className="w-[120px] text-right pr-2">Action</div>
            </div>
 
            {paginatedEmployees.map(emp => (
              <EmployeeRow key={emp.id} emp={emp} type="nominate" />
            ))}
 
            {filteredEmployees.length === 0 && (
              <div className="text-center text-gray-500 py-12 border border-dashed rounded-xl mt-4 bg-white/50">
                <Typography>No employees found.</Typography>
              </div>
            )}
 
            <PaginationControl
              count={totalPages}
              page={page}
              onChange={(_, v) => setPage(v)}
            />
          </div>
        )}
      </div>
 
      {/* NOMINATION MODAL */}
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
 
          {/* EMPLOYEE INFO */}
          <div className="bg-gray-50 p-3 rounded-lg mb-4 flex items-center gap-3">
            <Avatar sx={{ width: 32, height: 32, bgcolor: "#00A8A8" }}>
              {selectedEmp?.username?.charAt(0)}
            </Avatar>
            <div>
              <Typography fontWeight="bold">{selectedEmp?.username}</Typography>
              <Typography variant="caption">{selectedEmp?.employee_role}</Typography>
            </div>
          </div>
 
          {/* ⭐ CATEGORY + METRICS SIDE BY SIDE */}
          <div className="flex gap-4 w-full mb-2">
 
            {/* ⭐ CATEGORY WITH DELETE BUTTON ⭐ */}
            {selectedCategory ? (
              <Chip
                label={selectedCategory}
                onDelete={() => {
                  setSelectedCategory("");
                  setSelectedMetrics([]);
                }}
                sx={{
                  bgcolor: "#e0f7fa",
                  color: "#006064",
                  fontWeight: "bold",
                  width: "100%"
                }}
              />
            ) : (
              <FormControl fullWidth>
                <InputLabel>Select Category</InputLabel>
                <Select
                  value={selectedCategory}
                  label="Select Category"
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setSelectedMetrics([]);
                  }}
                  sx={{ borderRadius: 3 }}
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
 
            {/* METRICS - only enabled when category chosen */}
            <FormControl fullWidth disabled={!selectedCategory}>
              <InputLabel>Select Metrics</InputLabel>
              <Select
                multiple
                value={selectedMetrics}
                label="Select Metrics"
                onChange={(e) =>
                  setSelectedMetrics(
                    typeof e.target.value === "string"
                      ? e.target.value.split(",")
                      : e.target.value
                  )
                }
                sx={{ borderRadius: 3 }}
              >
                {(metricsByCategory[selectedCategory] || []).map((metric) => (
                  <MenuItem key={metric} value={metric}>
                    {metric}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
 
          {/* ⭐ METRIC CHIPS */}
          {selectedMetrics.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedMetrics.map((metric) => (
                <Chip
                  key={metric}
                  label={metric}
                  onDelete={() =>
                    setSelectedMetrics(prev => prev.filter(m => m !== metric))
                  }
                  sx={{ bgcolor: "#e0f7fa", color: "#006064" }}
                />
              ))}
            </div>
          )}
 
          {/* REASON */}
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
            disabled={
              submitting ||
              !reason.trim() ||
              !selectedCategory ||
              selectedMetrics.length === 0
            }
            sx={{ bgcolor: "#00A8A8", "&:hover": { bgcolor: "#008f8f" } }}
            onClick={handleSubmit}
          >
            {submitting ? "Saving..." : mode === "edit" ? "Update" : "Submit"}
          </Button>
        </DialogActions>
      </Dialog>
 
      {/* DELETE MODAL */}
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
 