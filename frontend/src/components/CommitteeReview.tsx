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

import { EmojiEvents, Cancel, History, AccessTime, Category } from "@mui/icons-material";
import { authAPI } from "../api/auth";
import toast from "react-hot-toast";
import CloseIcon from "@mui/icons-material/Close";

const TEAL = "#00A8A8";

const CommitteeReview = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [nominations, setNominations] = useState<any[]>([]);
    
    // Separate state for the dialog visibility and the data it holds
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedNominee, setSelectedNominee] = useState<any>(null);
    
    const [loading, setLoading] = useState(true);

    // 1. Fetch data based on specific tab index
    const fetchNominations = async (tabIndex: number) => {
        try {
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
    }, []);

    // 3. Bulletproof Tab Switcher 
    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        if (activeTab === newValue) return; 
        
        setLoading(true);           
        setNominations([]);         
        setActiveTab(newValue);     
        fetchNominations(newValue); 
    };

    const handleDecision = async (id: number, action: "APPROVE" | "REJECT") => {
        const toastId = toast.loading("Processing...");
        try {
            await authAPI.reviewNomination({ nomination_id: id, action });
            toast.success(action === "APPROVE" ? "Promoted to Finalist!" : "Nomination Rejected", { id: toastId });
            
            setIsDialogOpen(false); // Close dialog smoothly

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

    const renderMetrics = (metrics: any) => {
        if (!metrics) return "N/A";
        
        let data = metrics;
        if (typeof metrics === 'string') {
            try {
                data = JSON.parse(metrics);
            } catch (e) {
                return metrics; 
            }
        }

        if (Array.isArray(data)) {
            return (
                <ul style={{ margin: "5px 0", paddingLeft: "20px" }}>
                    {data.map((m: any, idx: number) => (
                        <li key={idx}>
                            {m.metric || m.category || m.name || JSON.stringify(m)}
                        </li>
                    ))}
                </ul>
            );
        }
        return JSON.stringify(data);
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
            category: n.category,
            selected_metrics: n.selected_metrics
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
                                    <Button 
                                        size="small" 
                                        variant="contained" 
                                        onClick={() => { setSelectedNominee(grp); setIsDialogOpen(true); }} 
                                        sx={{ textTransform: "none", bgcolor: "#f3f4f6", color: "#374151", fontWeight: "bold", borderRadius: 4 }}
                                    >
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

            <Dialog 
                open={isDialogOpen} 
                onClose={() => setIsDialogOpen(false)} 
                fullWidth 
                maxWidth="sm"
            >
                <DialogTitle sx={{ display: "flex", justifyContent: "space-between", color: TEAL, borderBottom: `2px solid ${TEAL}` }}>
                    Nominations for {selectedNominee?.nominee_name}
                    <CloseIcon onClick={() => setIsDialogOpen(false)} sx={{ cursor: "pointer", color: "#444" }} />
                </DialogTitle>
                <DialogContent sx={{ py: 2 }}>
                    {selectedNominee?.list?.map((item: any, i: number) => (
                        <div key={i} style={{ marginBottom: "18px", paddingBottom: "12px", borderBottom: "1px solid #e5e5e5" }}>
                            
                            {/* Nominator & Reason */}
                            <Typography sx={{ fontWeight: "bold" }}>Nominated by: <span style={{ fontWeight: 400 }}>{item.nominator_name}</span></Typography>
                            <Typography sx={{ mb: 1, color: "#333", mt: 1 }}><b>Reason:</b> {item.reason}</Typography>

                            {/* CATEGORY */}
                            <Typography sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Category fontSize="small" sx={{ color: TEAL }} />
                                <b>Category:</b> {item.category || "N/A"}
                            </Typography>

                            {/* METRICS */}
                            <Box sx={{ mt: 1, bgcolor: "#f9fafb", p: 1, borderRadius: 2 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: "bold", color: "#555" }}>
                                    Key Metrics / Behaviors:
                                </Typography>
                                <Typography variant="body2" component="div" sx={{ color: "#333" }}>
                                    {renderMetrics(item.selected_metrics)}
                                </Typography>
                            </Box>
                            
                            <Typography variant="caption" sx={{ color: TEAL, fontStyle: "italic", display: 'block', mt: 1 }}>
                                Submitted on: {new Date(item.submitted_at).toLocaleString()}
                            </Typography>
                        </div>
                    ))}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CommitteeReview;