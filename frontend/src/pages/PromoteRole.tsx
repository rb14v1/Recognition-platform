import { useState, useEffect } from "react";
import {
    Typography, Button, Dialog, DialogTitle, DialogContent,
    DialogActions, FormControl, RadioGroup, FormControlLabel,
    Radio, Box, TextField, InputAdornment
} from "@mui/material";
import { TrendingUp, School, Search } from "@mui/icons-material";
import { authAPI } from "../api/auth";
import toast from "react-hot-toast";
import { Avatar } from "@mui/material";

const PromoteRole = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [targetRole, setTargetRole] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => { loadUsers(); }, []);

    const loadUsers = async () => {
        try {
            const res = await authAPI.getPromotableUsers();
            const sorted = [...res.data].sort((a, b) =>
                a.username.localeCompare(b.username)
            );

            setUsers(sorted);
            setFilteredUsers(sorted);

        } catch (e) { console.error(e); }
    };

    // 🔍 SEARCH FUNCTION
    const handleSearch = () => {
        const term = searchTerm.toLowerCase();
        const results = users.filter((u) =>
            u.username.toLowerCase().includes(term)
        );
        setFilteredUsers(results);
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
            loadUsers();
        } catch (e: any) {
            toast.error(e.response?.data?.error || "Promotion failed");
        }
    };

    return (
        <div className="animate-fadeIn max-w-6xl mx-auto">

            {/* HEADER */}
            <div className="mb-8">
                <Typography
                    variant="h5"
                    fontWeight="bold"
                    className="text-gray-800 flex items-center gap-2"
                >
                    <TrendingUp sx={{ color: "#00A8A8" }} /> Promote Employees
                </Typography>
                <Typography variant="body2" color="textSecondary">
                    Elevate eligible employees to higher roles. You can only promote up to your own level.
                </Typography>
            </div>

            {/* 🔍 SEARCH BAR */}
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-3">

                <TextField
                    placeholder="Search employee by name..."
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
                            "& fieldset": { border: "1px solid #e2e2e2" },
                            paddingLeft: "8px"
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

            {/* EMPLOYEE LIST */}
            {filteredUsers.length === 0 ? (
                <Typography className="text-gray-500 text-center py-10">
                    No employees match your search.
                </Typography>
            ) : (
                <div className="space-y-4">
                    {filteredUsers.map((u) => (
                        <div
                            key={u.id}
                            className="
                                flex items-center justify-between 
                                bg-white shadow-sm border border-gray-200 
                                rounded-2xl px-6 py-4
                            "
                        >
                            {/* LEFT SIDE — Avatar + info */}
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
                                    {u.username?.charAt(0)?.toUpperCase()}
                                </Avatar>

                                {/* DETAILS ROW — PERFECT ALIGNMENT */}
                                <div className="flex items-center gap-10">

                                    {/* NAME */}
                                    <Typography className="text-gray-900 font-semibold capitalize w-[140px] truncate">
                                        {u.username}
                                    </Typography>

                                    {/* EMPLOYEE ID */}
                                    <Typography className="text-gray-700 font-medium w-[70px]">
                                        {u.employee_id}
                                    </Typography>

                                    {/* ROLE */}
                                    <Typography className="text-gray-700 font-medium capitalize w-[220px] truncate">
                                        {u.employee_role}
                                    </Typography>

                                    {/* DEPARTMENT */}
                                    <Typography className="text-gray-700 font-medium capitalize w-[160px] truncate">
                                        {u.employee_dept}
                                    </Typography>

                                </div>
                            </div>

                            {/* RIGHT SIDE — Promote Button */}
                            <Button
                                variant="contained"
                                startIcon={<School />}
                                onClick={() => { setSelectedUser(u); setOpenDialog(true); }}
                                sx={{
                                    bgcolor: "#00A8A8",
                                    "&:hover": { bgcolor: "#008f8f" },
                                    px: 4,
                                    py: 1.2,
                                    borderRadius: 2,
                                    fontWeight: "bold",
                                }}
                            >
                                Promote
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            {/* PROMOTION DIALOG */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="xs">
                <DialogTitle>Promote {selectedUser?.username}</DialogTitle>

                <DialogContent dividers>
                    <Typography variant="body2" className="mb-4 text-gray-500">
                        Current Role: <b>{selectedUser?.role}</b>
                    </Typography>

                    <Typography fontWeight="bold" className="mb-2">
                        Select New Role:
                    </Typography>

                    <FormControl fullWidth>
                        <RadioGroup
                            value={targetRole}
                            onChange={(e) => setTargetRole(e.target.value)}
                        >
                            <FormControlLabel
                                value="COORDINATOR"
                                control={
                                    <Radio
                                        sx={{
                                            color: "#00A8A8",
                                            "&.Mui-checked": { color: "#00A8A8" }
                                        }}
                                    />
                                }
                                label={
                                    <Box>
                                        <Typography fontWeight="bold" variant="body2">
                                            Coordinator
                                        </Typography>
                                        <Typography variant="caption" className="text-gray-500">
                                            Can manage teams & approvals
                                        </Typography>
                                    </Box>
                                }
                                className="mb-2"
                            />

                        </RadioGroup>
                    </FormControl>
                </DialogContent>

                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>

                    <Button
                        variant="contained"
                        disabled={!targetRole}
                        onClick={handlePromote}
                        sx={{
                            bgcolor: "#00A8A8",
                            "&:hover": { bgcolor: "#008f8f" }
                        }}
                    >
                        Confirm Promotion
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default PromoteRole;
