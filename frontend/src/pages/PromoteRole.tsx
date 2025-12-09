import { useState, useEffect, useMemo } from "react";
import {
    Typography, Button, Dialog, DialogTitle, DialogContent,
    DialogActions, FormControl, RadioGroup, FormControlLabel,
    Radio, Box, Avatar, Chip, Tooltip, CircularProgress
} from "@mui/material";
import { TrendingUp, School, ArrowBack } from "@mui/icons-material";
import { authAPI } from "../api/auth";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import PaginationControl from "../components/PaginationControl"; // 🔥 IMPORT

const ITEMS_PER_PAGE = 6;

const PromoteRole = () => {
    const navigate = useNavigate();

    // Data
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Pagination State
    const [page, setPage] = useState(1);

    // Filter State
    const [searchTerm, setSearchTerm] = useState("");
    const [searchType, setSearchType] = useState<"name" | "empId">("name");
    const [filters, setFilters] = useState({
        dept: "All",
        role: "All",
        location: "All"
    });

    // Promotion State
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [targetRole, setTargetRole] = useState("");

    useEffect(() => { loadUsers(); }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            // Fetch all promotable users initially
            const res = await authAPI.getPromotableUsers();
            setUsers(res.data);
        } catch (e) {
            console.error(e);
            toast.error("Failed to load employees");
        } finally {
            setLoading(false);
        }
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
            setTargetRole(""); // Reset selection
            loadUsers(); // Refresh list
        } catch (e: any) {
            toast.error(e.response?.data?.error || "Promotion failed");
        }
    };

    // --- DERIVED OPTIONS (For Dropdowns) ---
    const departments = useMemo(() => 
        ["All", ...Array.from(new Set(users.map(u => u.employee_dept).filter(Boolean)))], 
        [users]
    );
    const jobRoles = useMemo(() => 
        ["All", ...Array.from(new Set(users.map(u => u.employee_role).filter(Boolean)))], 
        [users]
    );
    const locations = useMemo(() => 
        ["All", ...Array.from(new Set(users.map(u => u.location).filter(Boolean)))], 
        [users]
    );

    // --- 🔥 Reset Page on Filter Change ---
    useEffect(() => {
        setPage(1);
    }, [searchTerm, searchType, filters]);

    // --- CLIENT-SIDE FILTERING ---
    const filteredUsers = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();

        return users.filter((u) => {
            const username = u.username?.toLowerCase() || "";
            const empId = u.employee_id?.toLowerCase() || "";
            const dept = u.employee_dept || "";
            const job = u.employee_role || "";
            const loc = u.location || "";

            const matchesSearch = searchType === "name" 
                ? username.includes(q) 
                : empId.includes(q);

            const matchesDept = filters.dept === "All" || dept === filters.dept;
            const matchesRole = filters.role === "All" || job === filters.role;
            const matchesLoc = filters.location === "All" || loc === filters.location;

            return matchesSearch && matchesDept && matchesRole && matchesLoc;
        });
    }, [users, searchTerm, searchType, filters]);

    // --- 🔥 Pagination Logic ---
    const paginatedUsers = useMemo(() => {
        const startIndex = (page - 1) * ITEMS_PER_PAGE;
        return filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredUsers, page]);

    const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);


    return (
        <div className="animate-fadeIn max-w-6xl mx-auto pb-20 p-6">

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
                        <TrendingUp sx={{ color: "#00A8A8" }} /> Promote Employees
                    </Typography>
                    <Typography variant="body2" color="textSecondary" className="mt-1">
                        Elevate eligible employees to higher roles. You can only promote up to your own level.
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
                <div className="flex justify-center p-12"><CircularProgress sx={{ color: '#00A8A8' }} /></div>
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
                        <div className="w-[140px] text-right pr-4">Action</div>
                    </div>

                    {/* ROWS */}
                    {paginatedUsers.map((u) => (
                        <div
                            key={u.id}
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
                                    {u.username?.charAt(0)?.toUpperCase()}
                                </Avatar>
                                <div>
                                    <Typography fontWeight="bold" className="text-gray-900 leading-tight">
                                        {u.username}
                                    </Typography>
                                    <Typography variant="caption" className="md:hidden text-gray-400 font-mono">
                                        {u.employee_id}
                                    </Typography>
                                </div>
                            </div>

                            {/* MIDDLE: Details */}
                            <div className="flex items-center justify-between w-full md:flex-1 gap-4">
                                {/* ID Column */}
                                <div className="w-20 text-sm text-gray-500 font-mono hidden md:block">
                                    {u.employee_id}
                                </div>

                                {/* Role Column */}
                                <div className="flex-1 text-sm font-medium text-gray-700">
                                    {u.employee_role || <span className="text-gray-400 italic">No Title</span>}
                                </div>

                                {/* Dept Column */}
                                <div className="w-32">
                                    <Chip 
                                        label={u.employee_dept || "General"} 
                                        size="small"
                                        sx={{ 
                                            bgcolor: '#f3f4f6', color: '#4b5563', 
                                            fontWeight: 600, borderRadius: '6px'
                                        }}
                                    />
                                </div>
                            </div>

                            {/* RIGHT: Action */}
                            <div className="w-full md:w-[140px] flex justify-end mt-3 md:mt-0">
                                <Button
                                    variant="contained"
                                    startIcon={<School />}
                                    size="small"
                                    onClick={() => { setSelectedUser(u); setOpenDialog(true); }}
                                    sx={{
                                        bgcolor: "#00A8A8",
                                        "&:hover": { bgcolor: "#008f8f" },
                                        textTransform: "none",
                                        fontWeight: "bold",
                                        borderRadius: 2
                                    }}
                                >
                                    Promote
                                </Button>
                            </div>
                        </div>
                    ))}

                    {filteredUsers.length === 0 && (
                        <div className="text-center py-12 border border-dashed rounded-xl bg-gray-50 text-gray-500">
                            No employees match your search criteria.
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

            {/* PROMOTION DIALOG */}
            <Dialog 
                open={openDialog} 
                onClose={() => setOpenDialog(false)} 
                fullWidth 
                maxWidth="xs"
                PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
            >
                <DialogTitle sx={{ fontWeight: 'bold' }}>
                    Promote {selectedUser?.username}
                </DialogTitle>

                <DialogContent>
                    <div className="bg-teal-50 p-3 rounded-lg mb-4 text-sm text-teal-800 border border-teal-100">
                        Current Role: <span className="font-bold">{selectedUser?.role}</span>
                    </div>

                    <Typography fontWeight="bold" className="mb-2 text-sm text-gray-600">
                        Select New Permission Level:
                    </Typography>

                    <FormControl fullWidth>
                        <RadioGroup
                            value={targetRole}
                            onChange={(e) => setTargetRole(e.target.value)}
                        >
                            <FormControlLabel
                                value="COORDINATOR"
                                control={<Radio sx={{ color: "#00A8A8", "&.Mui-checked": { color: "#00A8A8" } }} />}
                                label={
                                    <Box>
                                        <Typography fontWeight="bold" variant="body2">Coordinator</Typography>
                                        <Typography variant="caption" className="text-gray-500">
                                            Can manage teams & approve nominations
                                        </Typography>
                                    </Box>
                                }
                                className="mb-2 border border-gray-200 rounded-lg p-1 hover:bg-gray-50 transition"
                                sx={{ margin: 0, mb: 1, width: '100%' }}
                            />
                             {/* You can add COMMITTEE here if needed later */}
                        </RadioGroup>
                    </FormControl>
                </DialogContent>

                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setOpenDialog(false)} sx={{ color: 'gray' }}>Cancel</Button>
                    <Button
                        variant="contained"
                        disabled={!targetRole}
                        onClick={handlePromote}
                        sx={{
                            bgcolor: "#00A8A8",
                            "&:hover": { bgcolor: "#008f8f" },
                            boxShadow: 'none',
                            px: 3
                        }}
                    >
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default PromoteRole;