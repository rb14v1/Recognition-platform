import React, { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    Typography,
    Button,
    Chip,
    Avatar,
    Box,
    Tabs,
    Tab,
    Dialog,
    DialogTitle,
    DialogContent,
} from "@mui/material";

import { EmojiEvents, Cancel, History, AccessTime } from "@mui/icons-material";
import { authAPI } from "../api/auth";
import toast from "react-hot-toast";
import CloseIcon from "@mui/icons-material/Close";

const TEAL = "#00A8A8";

const CommitteeReview = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [nominations, setNominations] = useState<any[]>([]);
    const [openModal, setOpenModal] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // 1. Fetch data based on specific tab index
    const fetchNominations = async (tabIndex: number) => {
        try {
            // ✅ CORRECTED: "committee_pending" ensures we only get Committee records
            const filter = tabIndex === 0 ? "committee_pending" : "history";
            const res = await authAPI.getCoordinatorNominations(filter);
            setNominations(res.data);
        } catch (e) {
            console.error("Failed to load nominations:", e);
        } finally {
            setLoading(false);
        }
    };

    // 2. Fetch on the very first page load
    useEffect(() => {
        fetchNominations(activeTab);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 3. ✅ THE FIX: Bulletproof Tab Switcher (No React lag, no flashing)
    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        if (activeTab === newValue) return; // Do nothing if clicking the same tab
        
        setLoading(true);           // 1. Instantly show loading spinner
        setNominations([]);         // 2. Instantly wipe old data from screen
        setActiveTab(newValue);     // 3. Move the tab line
        fetchNominations(newValue); // 4. Fetch the new data
    };

    const handleDecision = async (id: number, action: "APPROVE" | "REJECT") => {
        const toastId = toast.loading("Processing...");
        try {
            await authAPI.reviewNomination({ nomination_id: id, action });
            toast.success(action === "APPROVE" ? "Promoted to Finalist!" : "Nomination Rejected", { id: toastId });
            setOpenModal(null);
            
            // Instantly refresh the current tab
            setLoading(true);
            setNominations([]);
            fetchNominations(activeTab);

        } catch (e: any) {
             if (e.response?.data?.error) {
                toast.error(e.response.data.error, { id: toastId }); 
            } else {
                toast.error("Action failed", { id: toastId });
            }
            setLoading(false);
        }
    };

    // Grouping logic
    const grouped = nominations.reduce((acc: any, n: any) => {
        if (!acc[n.nominee_name]) {
            acc[n.nominee_name] = {
                nominee_name: n.nominee_name,
                nominee_role: n.nominee_role,
                nominee_dept: n.nominee_dept,
                nominee_full_name: n.nominee_name,
                id: n.id,
                list: [],
                status: n.status,
            };
        }
        acc[n.nominee_name].list.push({
            nominator_name: n.nominator_name,
            reason: n.reason,
            submitted_at: n.submitted_at,
            id: n.id,
        });
        return acc;
    }, {});

    let groupedList = Object.values(grouped);

    // Filter out Coordinator-only history so the Committee only sees their own actions
    if (activeTab === 1) {
        groupedList = groupedList.filter((grp: any) => 
            ["COMMITTEE_APPROVED", "COMMITTEE_REJECTED", "AWARDED"].includes(grp.status)
        );
    }

    return (
        <div className="animate-fadeIn max-w-6xl mx-auto">
            {/* HEADER */}
            <div className="mb-6">
                <Typography variant="h5" fontWeight="bold" className="text-gray-900">
                    Committee Evaluation
                </Typography>
                <Typography variant="body2" className="text-gray-500">
                    Review candidates approved by Coordinators. Select finalists for the Admin vote.
                </Typography>
            </div>

            {/* TABS */}
            <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 4 }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange} 
                    TabIndicatorProps={{ style: { backgroundColor: TEAL } }}
                    sx={{
                        "& .MuiTab-root": { color: TEAL, fontWeight: "bold" },
                        "& .Mui-selected": { color: TEAL + " !important" },
                    }}
                >
                    <Tab icon={<AccessTime />} iconPosition="start" label="Review Pool" />
                    <Tab icon={<History />} iconPosition="start" label="Decision History" />
                </Tabs>
            </Box>

            {/* CARDS LIST */}
            <div className="flex flex-col gap-3">
                {!loading && groupedList.map((grp: any, index: number) => (
                    <Card
                        key={index}
                        sx={{
                            borderRadius: 3,
                            borderLeft: `6px solid ${TEAL}`,
                            boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
                        }}
                    >
                        <CardContent className="p-4">
                            <div className="flex items-center w-full">
                               
                                {/* Profile Info */}
                                <div className="flex items-center gap-3 w-1/3">
                                    <Avatar
                                        sx={{
                                            width: 50,
                                            height: 50,
                                            bgcolor: TEAL,
                                            color: "white",
                                            fontWeight: "bold",
                                            fontSize: "1.2rem",
                                        }}
                                    >
                                        {grp.nominee_name?.[0]?.toUpperCase()}
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <Typography variant="subtitle1" fontWeight="bold" sx={{ lineHeight: 1.2 }}>
                                            {grp.nominee_full_name}
                                        </Typography>
                                        <div className="mt-1">
                                            <Chip
                                                label={grp.nominee_role}
                                                size="small"
                                                sx={{ bgcolor: "#e5e7eb", fontWeight: "bold", height: 22, fontSize: "0.75rem" }}
                                            />
                                        </div>
                                    </div>
                                </div>

                               {/* Details Button */}
                                <div className="flex flex-1 flex-row justify-center items-center gap-4 border-l border-r border-gray-100 px-4">
                                    <Typography variant="body2" sx={{ color: "#4b5563", fontWeight: 500 }}>
                                        {grp.list.length} nomination(s) received
                                        </Typography>
                                        <Button size="small" variant="contained" onClick={() => setOpenModal(grp)} sx={{ textTransform: "none", bgcolor: "#f3f4f6", color: "#374151", fontWeight: "bold", borderRadius: 4 }}>
                                            View details
                                        </Button>
                                </div>

                                {/* Committee Actions or Status */}
                                <div className="flex flex-col justify-center items-end gap-2 w-1/3 pl-4">
                                    {activeTab === 0 ? (
                                        <>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                sx={{
                                                    bgcolor: "green",
                                                    fontWeight: "bold",
                                                    borderRadius: 2,
                                                    px: 2,
                                                    width: "150px",
                                                    textTransform: "none",
                                                    "&:hover": { bgcolor: "#0b6e0b" },
                                                }}
                                                startIcon={<EmojiEvents />}
                                                onClick={() => handleDecision(grp.id, "APPROVE")}
                                            >
                                                Select Finalist
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                color="error"
                                                startIcon={<Cancel />}
                                                sx={{ borderRadius: 2, px: 2, width: "150px", textTransform: "none", fontWeight: "bold" }}
                                                onClick={() => handleDecision(grp.id, "REJECT")}
                                            >
                                                Reject
                                            </Button>
                                        </>
                                    ) : (
                                        <Chip
                                            label={
                                                grp.status === "COMMITTEE_APPROVED" ? "Finalist" : 
                                                grp.status === "AWARDED" ? "Winner" : 
                                                grp.status === "COMMITTEE_REJECTED" ? "Rejected" : grp.status
                                            }
                                            color={
                                                grp.status === "COMMITTEE_REJECTED" ? "error" : "success"
                                            }
                                            variant="outlined"
                                            sx={{ fontWeight: "bold" }}
                                        />
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* LOADING AND EMPTY STATES */}
            {loading && (
                <div className="text-center py-20 text-gray-400">
                    <Typography>Loading data...</Typography>
                </div>
            )}

            {!loading && groupedList.length === 0 && (
                <div className="text-center py-20 text-gray-400">
                    <Typography>No records found in {activeTab === 0 ? "Review Pool" : "Decision History"}.</Typography>
                </div>
            )}

            {/* View Details Modal */}
            <Dialog
                open={!!openModal}
                onClose={() => setOpenModal(null)}
                fullWidth
                maxWidth="sm"
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ color: "#008080", fontWeight: 700, display: "flex", justifyContent: "space-between" }}>
                    Nominations for {openModal?.nominee_name}
                    <CloseIcon onClick={() => setOpenModal(null)} sx={{ cursor: "pointer" }} />
                </DialogTitle>
                <DialogContent sx={{ pb: 1 }}>
                    {openModal?.list?.map((item: any, i: number) => (
                        <div key={i} style={{ marginBottom: "18px", borderBottom: i !== openModal.list.length - 1 ? "1px solid #e5e5e5" : "none", paddingBottom: "12px" }}>
                            <Typography sx={{ fontWeight: "bold" }}>Nominated by: {item.nominator_name}</Typography>
                            <Typography sx={{ mb: 1 }}><b>Reason:</b> {item.reason}</Typography>
                            <Typography variant="caption" sx={{ color: "#008080" }}>{new Date(item.submitted_at).toLocaleString()}</Typography>
                        </div>
                    ))}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CommitteeReview;