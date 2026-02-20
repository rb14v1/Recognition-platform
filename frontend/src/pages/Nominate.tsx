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
  InputLabel,
  Checkbox,
  ListItemText,
  Box
} from "@mui/material";
import { Warning, Close, ArrowBack, EmojiEvents, Edit, Delete } from "@mui/icons-material";
import { authAPI } from "../api/auth";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import PaginationControl from "../components/PaginationControl";

const ITEMS_PER_PAGE = 15;

const Nominate = () => {
  const navigate = useNavigate();

  // Data
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Store the metadata for filters here
  const [filterMetaData, setFilterMetaData] = useState<any[]>([]);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Nomination Status Data
  const [hasNominated, setHasNominated] = useState(false);
  const [mySelection, setMySelection] = useState<any | null>(null);

  // Saved State (for Edit Mode)
  const [savedReason, setSavedReason] = useState("");
  const [savedCategory, setSavedCategory] = useState("");
  const [savedMetrics, setSavedMetrics] = useState<string[]>([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
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

  // Dynamic Criteria State
  const [metricsByCategory, setMetricsByCategory] = useState<Record<string, string[]>>({});
  const categories = useMemo(() => Object.keys(metricsByCategory), [metricsByCategory]);
  const [isMetricOpen, setIsMetricOpen] = useState(false);

  // DYNAMIC DROPDOWNS (Using filterMetaData)

  // 1. Departments
  const departments = useMemo(() => {
    if (!filterMetaData || filterMetaData.length === 0) return ["All"];
    const depts = filterMetaData.map(item => item.employee_dept).filter(Boolean);
    return ["All", ...Array.from(new Set(depts))];
  }, [filterMetaData]);

  // 2. Locations
  const locations = useMemo(() => {
    if (!filterMetaData || filterMetaData.length === 0) return ["All"];
    const locs = filterMetaData.map(item => item.location).filter(Boolean);
    return ["All", ...Array.from(new Set(locs))];
  }, [filterMetaData]);

  // 3. Roles (Dependent on selected Department)
  const rolesForDept = useMemo(() => {
    if (!filterMetaData || filterMetaData.length === 0) return ["All"];

    let relevantItems = filterMetaData;

    // If a specific dept is selected, filter the roles to match that dept
    if (filters.dept !== "All") {
      relevantItems = relevantItems.filter(item => item.employee_dept === filters.dept);
    }

    const roles = relevantItems.map(item => item.employee_role).filter(Boolean);
    return ["All", ...Array.from(new Set(roles))];
  }, [filterMetaData, filters.dept]);

  // Debounce Logic
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch Page Data (Triggered by changes)
  useEffect(() => {
    loadPageData();
  }, [page, debouncedSearch, filters]);

  // INITIAL FETCH FOR FILTER OPTIONS
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const res = await authAPI.getNominationFilterOptions();

        if (Array.isArray(res.data)) {
          setFilterMetaData(res.data);
        } else {
          console.warn("Filter response was not an array:", res.data);
          setFilterMetaData([]);
        }
      } catch (e) {
        console.error("Failed to load filter options. Is the server running? Check /nominate/filter-options/", e);
      }
    };
    fetchFilters();
  }, []);

  const loadPageData = async () => {
    setLoading(true);
    try {
      const [statusRes, listRes, optionsRes] = await Promise.all([
        authAPI.getNominationStatus(),
        authAPI.getNominationOptions({
          page: page,
          search: debouncedSearch,
          dept: filters.dept === "All" ? "" : filters.dept,
          role: filters.role === "All" ? "" : filters.role,
          location: filters.location === "All" ? "" : filters.location
        }),
        authAPI.getNominationCriteria()
      ]);

      setMetricsByCategory(optionsRes.data || {});

      // Handle Pagination Response
      if (listRes.data && listRes.data.results) {
        setEmployees(listRes.data.results);
        setTotalPages(Math.ceil(listRes.data.count / ITEMS_PER_PAGE));
      } else {
        setEmployees([]);
        setTotalPages(1);
      }

      setHasNominated(Boolean(statusRes.data?.has_nominated));
      setMySelection(statusRes.data?.nominee ?? null);
      setSavedReason(statusRes.data?.reason ?? "");

      const backendMetrics = statusRes.data?.selected_metrics || [];
      if (backendMetrics.length > 0) {
        setSavedCategory(backendMetrics[0].category);
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

    const formattedMetrics = selectedMetrics.map(metric => ({
      category: selectedCategory,
      metric: metric
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

  // UPDATED EMPLOYEE ROW (With strict alignment)
  
  const EmployeeRow = ({ emp, type }: { emp: any; type: "nominate" | "manage" }) => (
    <div 
      className="group flex flex-col md:flex-row items-center px-4 py-3 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-all duration-200"
      style={{ display: 'flex', width: '100%' }}
    >
      {/* 1. EMPLOYEE DETAILS (25%) */}
      <div className="flex items-center gap-3 mb-2 md:mb-0" style={{ width: '25%' }}>
        <Avatar sx={{ width: 40, height: 40, bgcolor: "#00A8A8", color: "white" }}>
          {(emp.username || emp.nominee_name)?.charAt(0).toUpperCase()}
        </Avatar>
        <div className="min-w-0">
          <Typography fontWeight="bold" className="text-gray-900 text-sm leading-tight capitalize truncate">
            {emp.username || emp.nominee_name}
          </Typography>
          <Typography variant="caption" className="md:hidden text-gray-400 font-mono">
            {emp.employee_id}
          </Typography>
        </div>
      </div>

      {/* 2. ID (10%) */}
      <div className="text-sm text-gray-500 font-mono hidden md:block" style={{ width: '10%' }}>
        {emp.employee_id || "-"}
      </div>

      {/* 3. PORTFOLIO (30%) - Pushed Right */}
      <div 
        className="text-sm font-medium text-gray-700 italic hidden md:block"
        style={{ width: '30%', paddingLeft: '4rem' }} // Matches logic from previous table
      >
        {emp.employee_role || <span className="text-gray-400">No Title</span>}
      </div>

      {/* 4. PRACTICE (25%) - Aligned Left naturally */}
      <div className="w-full md:w-auto" style={{ width: '25%' }}>
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

      {/* 5. ACTION (10%) */}
      <div className="flex justify-end gap-2 mt-2 md:mt-0" style={{ width: '10%' }}>
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
              borderRadius: "8px",
              minWidth: "100px"
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
          onFilterChange={(k, v) => {
            setFilters(prev => ({ ...prev, [k]: v }));
            setPage(1); 
          }}
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

            {/* HEADER - UPDATED ALIGNMENT */}
            <div 
              className="hidden md:flex items-center px-4 py-3 bg-gray-50 border border-gray-200 rounded-t-xl text-xs font-bold text-gray-500 uppercase tracking-wider"
              style={{ display: 'flex', width: '100%' }}
            >
              <div style={{ width: '25%', paddingLeft: '8px' }}>Employee Details</div>
              <div style={{ width: '10%' }}>ID</div>
              
              {/* PORTFOLIO (Renamed from Job Title) - Pushed Right */}
              <div style={{ width: '30%', paddingLeft: '4rem' }}>Portfolio</div>
              
              {/* PRACTICE (Renamed from Department) - Aligned Left */}
              <div style={{ width: '25%' }}>Practice</div>
              
              <div style={{ width: '10%', textAlign: 'right', paddingRight: '8px' }}>Action</div>
            </div>

            {/* Dynamic List */}
            {employees.map(emp => (
              <EmployeeRow key={emp.id} emp={emp} type="nominate" />
            ))}

            {employees.length === 0 && (
              <div className="text-center text-gray-500 py-12 border border-dashed rounded-xl mt-4 bg-white/50">
                <Typography>No employees found.</Typography>
              </div>
            )}

            {/* Pagination Control */}
            <PaginationControl
              count={totalPages}
              page={page}
              onChange={(_, v) => setPage(v)}
            />
          </div>
        )}
      </div>

      {/* NOMINATION MODAL (Unchanged Logic) */}
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

          <div className="flex gap-4 w-full mb-2">
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

            <FormControl fullWidth disabled={!selectedCategory}>
              <InputLabel>Select Metrics</InputLabel>
              <Select
                multiple
                open={isMetricOpen}
                onOpen={() => setIsMetricOpen(true)}
                onClose={() => setIsMetricOpen(false)}
                value={selectedMetrics}
                label="Select Metrics"
                onChange={(e) =>
                  setSelectedMetrics(
                    typeof e.target.value === "string"
                      ? e.target.value.split(",")
                      : e.target.value
                  )
                }
                renderValue={(selected) => selected.join(", ")}
                sx={{ borderRadius: 3 }}
                MenuProps={{ PaperProps: { sx: { maxHeight: 300 } } }}
              >
                {(metricsByCategory[selectedCategory] || []).map((metric) => (
                  <MenuItem key={metric} value={metric}>
                    <Checkbox checked={selectedMetrics.indexOf(metric) > -1} sx={{ color: "#00A8A8", '&.Mui-checked': { color: "#00A8A8" } }} />
                    <ListItemText primary={metric} />
                  </MenuItem>
                ))}
                <Box sx={{ display: "flex", justifyContent: "flex-end", p: 1.5, borderTop: "1px solid #f0f0f0", position: "sticky", bottom: 0, bgcolor: "white", zIndex: 10 }}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMetricOpen(false);
                    }}
                    sx={{
                      bgcolor: "#00A8A8",
                      color: "white",
                      fontWeight: "bold",
                      textTransform: "none",
                      "&:hover": { bgcolor: "#008f8f" }
                    }}
                  >
                    Done
                  </Button>
                </Box>
              </Select>
            </FormControl>
          </div>

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
            disabled={submitting || !reason.trim() || !selectedCategory || selectedMetrics.length === 0}
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