import { useState, useEffect } from "react";
import {
  TextField, Select, MenuItem, Typography, Button, 
  CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, 
  InputAdornment, FormControl, InputLabel, IconButton, Avatar
} from "@mui/material";
import { Search, Warning, Close, ArrowBack } from "@mui/icons-material"; 
import { authAPI } from "../api/auth";
import toast from 'react-hot-toast';
import { useNavigate } from "react-router-dom";
import EmployeeCard from "../components/EmployeeCard"; 

const Nominate = () => {
  const navigate = useNavigate();

  // --- Data States ---
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // --- Status States ---
  const [hasNominated, setHasNominated] = useState(false);
  const [mySelection, setMySelection] = useState<any | null>(null);
  const [savedReason, setSavedReason] = useState("");

  // --- Filter States ---
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");

  // --- Action States ---
  const [selectedEmp, setSelectedEmp] = useState<any | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // --- Dialogs ---
  const [nominateDialogOpen, setNominateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");

  // 1. Initial Data Fetch
  useEffect(() => {
    loadPageData();
  }, []);

  const loadPageData = async () => {
    setLoading(true);
    try {
      const [statusRes, listRes] = await Promise.all([
        authAPI.getNominationStatus(),
        authAPI.getNominationOptions()
      ]);

      setHasNominated(statusRes.data.has_nominated);
      setMySelection(statusRes.data.nominee);
      setSavedReason(statusRes.data.reason || "");
      setEmployees(listRes.data);

    } catch (error) {
      console.error(error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // 2. Filter Logic
  const departments = ["All", ...new Set(employees.map(e => e.employee_dept).filter(Boolean))];
  const roles = ["All", ...new Set(employees.map(e => e.employee_role).filter(Boolean))]; 

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter === "All" || emp.employee_dept === deptFilter;
    const matchesRole = roleFilter === "All" || emp.employee_role === roleFilter;
    return matchesSearch && matchesDept && matchesRole;
  });

  // 3. Handlers
  const handleCardClick = (emp: any) => {
    if (hasNominated) return; 
    setSelectedEmp(emp);
    setMode("create");
    setReason(""); 
    setNominateDialogOpen(true);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEmp(mySelection);
    setMode("edit");
    setReason(savedReason); 
    setNominateDialogOpen(true);
  };

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setSubmitting(true);
    try {
      if (mode === 'create') {
          await authAPI.submitNomination({ nominee: selectedEmp.id, reason });
          toast.success("Nomination Submitted!");
      } else {
          await authAPI.updateNomination({ nominee: selectedEmp.id, reason });
          toast.success("Nomination Updated!");
      }
      setNominateDialogOpen(false);
      loadPageData(); 
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Action failed");
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
        setSavedReason("");
        setDeleteDialogOpen(false);
        loadPageData();
    } catch (err: any) {
        toast.error(err.response?.data?.error || "Failed to remove");
    } finally {
        setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      
      <div className="max-w-7xl mx-auto mb-8">
        
        {/* IMPROVED: Robust Back Button */}
        <Button 
            variant="outlined" 
            startIcon={<ArrowBack />} 
            onClick={() => navigate('/dashboard')}
            sx={{ 
                mb: 4, 
                px: 3,
                py: 1,
                borderRadius: "12px",
                textTransform: 'none',
                fontWeight: 600,
                borderColor: "#e2e8f0",
                color: "#64748b",
                backgroundColor: "white",
                boxShadow: "0px 2px 4px rgba(0,0,0,0.02)",
                transition: "all 0.2s",
                "&:hover": { 
                    borderColor: "#00A8A8", 
                    color: "#00A8A8", 
                    backgroundColor: "#f0fdfa",
                    transform: "translateX(-4px)" // Subtle animation
                }
            }}
        >
            Back to Dashboard
        </Button>

        <Typography variant="h5" fontWeight="800" className="text-gray-900 tracking-tight">
             {hasNominated ? "Your Selection" : "Nominate a Peer"}
        </Typography>
        <Typography variant="body2" className="text-gray-500 mt-1">
            {hasNominated 
                ? "You have nominated the following colleague. You can edit or remove this selection." 
                : "Select a deserving peer below and tell us why they stand out."}
        </Typography>

        {/* Filter Bar - Hidden if Nominated */}
        {!hasNominated && (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center mt-6 animate-fadeIn">
                
                {/* Search - 50% */}
                <div className="w-full md:w-1/2">
                    <TextField 
                        placeholder="Search by name..." 
                        size="small"
                        fullWidth
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><Search fontSize="small" className="text-gray-400"/></InputAdornment>,
                            sx: { borderRadius: 2, backgroundColor: '#f9fafb', '& fieldset': { border: 'none' } }
                        }}
                    />
                </div>

                {/* Filters - 50% */}
                <div className="w-full md:w-1/2 flex gap-3">
                    <FormControl size="small" fullWidth>
                        <InputLabel>Department</InputLabel>
                        <Select 
                            value={deptFilter} 
                            label="Department"
                            onChange={(e) => setDeptFilter(e.target.value)}
                            sx={{ borderRadius: 2 }}
                        >
                            <MenuItem value="All">All</MenuItem>
                            {departments.map((d: any) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                        </Select>
                    </FormControl>

                    <FormControl size="small" fullWidth>
                        <InputLabel>Job Role</InputLabel>
                        <Select 
                            value={roleFilter} 
                            label="Job Role"
                            onChange={(e) => setRoleFilter(e.target.value)}
                            sx={{ borderRadius: 2 }}
                        >
                            <MenuItem value="All">All</MenuItem>
                            {roles.map((r: any) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                        </Select>
                    </FormControl>
                </div>
            </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
             <div className="flex justify-center p-10"><CircularProgress /></div>
        ) : hasNominated && mySelection ? (
            // --- VIEW: My Selection (Single Card) ---
            <div className="flex justify-center animate-fadeIn">
                <EmployeeCard 
                    emp={mySelection} 
                    isSelected={true} 
                    onEdit={handleEditClick}
                    onRemove={handleRemoveClick}
                />
            </div>
        ) : (
            // --- VIEW: Grid Selection ---
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                {filteredEmployees.map((emp) => (
                    <EmployeeCard 
                        key={emp.id} 
                        emp={emp} 
                        onClick={() => handleCardClick(emp)}
                    />
                ))}
                {filteredEmployees.length === 0 && (
                    <div className="col-span-full text-center text-gray-500 py-10">
                        No employees found matching your filters.
                    </div>
                )}
            </div>
        )}
      </div>

      {/* 1. Nomination/Edit Dialog */}
      <Dialog 
        open={nominateDialogOpen} 
        onClose={() => setNominateDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 4, p: 1 } }}
      >
        <DialogTitle className="flex justify-between items-center">
            <span>{mode === 'edit' ? 'Update Nomination' : 'Nominate Colleague'}</span>
            <IconButton onClick={() => setNominateDialogOpen(false)} size="small"><Close /></IconButton>
        </DialogTitle>
        <DialogContent>
            <div className="bg-gray-50 p-3 rounded-lg mb-4 flex items-center gap-3">
                <Avatar sx={{ width: 32, height: 32, bgcolor: '#00A8A8', fontSize: 14 }}>{selectedEmp?.username.charAt(0)}</Avatar>
                <div>
                    <Typography variant="subtitle2" fontWeight="bold">{selectedEmp?.username}</Typography>
                    <Typography variant="caption" className="text-gray-500">{selectedEmp?.employee_role || "Employee"}</Typography>
                </div>
            </div>
            
            <Typography variant="body2" className="text-gray-600 mb-2 font-medium">
                Reason for Nomination <span className="text-red-500">*</span>
            </Typography>
            <TextField
                autoFocus
                multiline
                rows={4}
                fullWidth
                placeholder={mode === 'edit' ? "Enter your new reason here..." : "Ex: For outstanding leadership..."}
                value={reason} 
                onChange={(e) => setReason(e.target.value)}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
            />
        </DialogContent>
        <DialogActions className="p-4 pt-0">
            <Button onClick={() => setNominateDialogOpen(false)} color="inherit" sx={{ borderRadius: 2 }}>
                Cancel
            </Button>
            <Button 
                onClick={handleSubmit} 
                variant="contained" 
                disabled={!reason.trim() || submitting}
                sx={{ bgcolor: '#00A8A8', borderRadius: 2, px: 4, "&:hover": { bgcolor: '#008f8f' } }}
            >
                {submitting ? "Saving..." : (mode === 'edit' ? "Update Nomination" : "Confirm Nomination")}
            </Button>
        </DialogActions>
      </Dialog>

      {/* 2. Remove Confirmation Dialog */}
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
            <Typography variant="h6" fontWeight="bold" className="text-gray-900 mb-1">
                Remove Nomination?
            </Typography>
            <Typography variant="body2" className="text-gray-500 mb-6">
                Are you sure you want to remove your nomination?
                <br/><br/>
                You can nominate someone else afterwards.
            </Typography>
            
            <div className="flex gap-3 w-full">
                <Button 
                    fullWidth 
                    variant="outlined" 
                    onClick={() => setDeleteDialogOpen(false)}
                    sx={{ borderRadius: 2, borderColor: '#e5e7eb', color: '#374151' }}
                >
                    Keep It
                </Button>
                <Button 
                    fullWidth 
                    variant="contained" 
                    color="error" 
                    onClick={handleConfirmDelete}
                    disabled={submitting}
                    sx={{ borderRadius: 2, boxShadow: 'none' }}
                >
                    {submitting ? "Removing..." : "Yes, Remove"}
                </Button>
            </div>
        </div>
      </Dialog>

    </div>
  );
};

export default Nominate;