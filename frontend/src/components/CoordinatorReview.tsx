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
    Slide,
    ToggleButton,
    ToggleButtonGroup,
} from "@mui/material";
import { CheckCircle, Cancel, History, AccessTime, SmartToy, ViewList, Close as CloseIcon, Category } from "@mui/icons-material";
import { authAPI } from "../api/auth";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import axios from "axios"; 

// Import DetailPage
import DetailPage from "../pages/DetailPage";

const TEAL = "#00A8A8";

const Transition = React.forwardRef(function Transition(
  props: any, 
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const CoordinatorNomination = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(0);
    const [nominations, setNominations] = useState<any[]>([]);
    const [openModal, setOpenModal] = useState<any>(null);
    const [viewMode, setViewMode] = useState<'list' | 'copilot'>('list');
    const [loading, setLoading] = useState(true);

    // --- MAIN DATA FETCH ---
    const loadData = async () => {
        setLoading(true); 
        try {
            const filter = activeTab === 0 ? "pending" : "history"; 
            const res = await authAPI.getCoordinatorNominations(filter);
            setNominations(res.data);
        } catch (e) {
            console.error("Failed to load nominations:", e);
        } finally {
            setLoading(false); 
        }
    };

    useEffect(() => {
        loadData();
    }, [activeTab]); 

    // Synchronously clear data when tab is clicked to prevent the stale data flash
    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        if (activeTab === newValue) return;
        setLoading(true);
        setNominations([]);
        setActiveTab(newValue);
    };

    // --- INSTANT UPDATE HANDLER ---
    const handleCopilotActionComplete = (id: number, newStatus: string) => {
        setNominations((prevNominations) => 
            prevNominations.map((nom) => 
                nom.id === id ? { ...nom, status: newStatus } : nom
            )
        );
    };

    // --- Helper to Group Nominations ---
    const getGroupedNominations = () => {
        return nominations.reduce((acc: any, n: any) => {
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
    };

    const grouped = getGroupedNominations();
    let groupedList = Object.values(grouped);

    // ✅ REMOVED: The strict activeTab === 1 frontend filter was removed here 
    // so it properly shows ALL history (Committee Approved, Awarded, etc.)

    const handleCopilotClick = (nomineeName: string) => {
        const data = grouped[nomineeName];
        if (data) {
            setOpenModal(data);
        } else {
            toast.error(`Details for ${nomineeName} not found in current list.`);
        }
    };

    const handleDecision = async (id: number, action: "APPROVE" | "REJECT") => {
        const toastId = toast.loading("Processing...");

        try {
            await authAPI.reviewNomination({ nomination_id: id, action });
            toast.success(action === "APPROVE" ? "Nomination Shortlisted!" : "Nomination Rejected", { id: toastId });
            setOpenModal(null);
            loadData(); 
            
        } catch (e) {
            toast.error("Action failed", { id: toastId });
        }
    };

    const handleExport = async () => {
        try {
            const token = localStorage.getItem('access') || localStorage.getItem('access_token');
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/';
            const response = await axios.get(`${baseUrl}nomination/export-star-awards/`, {
                headers: { 'Authorization': `Bearer ${token}` },
                responseType: 'blob', 
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'Star_Award_Export.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success("Excel exported successfully");
        } catch (e) {
            toast.error("Failed to export Excel");
        }
    };

    // --- Helper to format Metrics ---
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

    return (
        <div className="animate-fadeIn max-w-6xl mx-auto" style={{ position: "relative" }}>
            
            {/* HEADER & CONTROLS */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <Typography variant="h5" fontWeight="bold" className="text-gray-900">
                        Coordinator Approvals
                    </Typography>
                    <Typography variant="body2" className="text-gray-500">
                        Review incoming nominations and shortlist valid candidates.
                    </Typography>
                </div>

                <div className="flex items-center gap-3">
                    {activeTab === 0 && (
                        <ToggleButtonGroup
                            value={viewMode}
                            exclusive
                            onChange={(_, newMode) => { if (newMode) setViewMode(newMode); }}
                            size="small"
                            sx={{ bgcolor: "white" }}
                        >
                            <ToggleButton value="list" sx={{ textTransform: 'none', fontWeight: 'bold', px: 2 }}>
                                <ViewList fontSize="small" sx={{ mr: 1 }} /> List
                            </ToggleButton>
                            <ToggleButton value="copilot" sx={{ textTransform: 'none', fontWeight: 'bold', px: 2 }}>
                                <SmartToy fontSize="small" sx={{ mr: 1 }} /> Co-pilot
                            </ToggleButton>
                        </ToggleButtonGroup>
                    )}

                    <Button
                        variant="contained"
                        color="success" 
                        size="small"
                        startIcon={<FileDownloadIcon />}
                        onClick={handleExport}
                        sx={{ fontWeight: "bold", textTransform: "none", borderRadius: 2, height: 40 }}
                    >
                        Export Excel
                    </Button>
                </div>
            </div>

            {/* LIST VIEW */}
            {viewMode === 'list' && (
                <>
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
                            <Tab icon={<AccessTime />} iconPosition="start" label="Pending Reviews" />
                            <Tab icon={<History />} iconPosition="start" label="Approval History" />
                        </Tabs>
                    </Box>

                    <div className="flex flex-col gap-3">
                        {!loading && groupedList.map((grp: any, index: number) => (
                            <Card key={index} sx={{ borderRadius: 3, borderLeft: `6px solid ${TEAL}`, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                                <CardContent className="p-4">
                                    <div className="flex items-center w-full">
                                        <div className="flex items-center gap-3 w-1/3">
                                            <Avatar sx={{ width: 50, height: 50, bgcolor: TEAL, color: "white", fontWeight: "bold" }}>
                                                {grp.nominee_name?.[0]?.toUpperCase()}
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <Typography variant="subtitle1" fontWeight="bold">{grp.nominee_full_name}</Typography>
                                                <Chip label={grp.nominee_role} size="small" sx={{ bgcolor: "#e5e7eb", fontWeight: "bold", mt: 0.5, fontSize: "0.75rem" }} />
                                            </div>
                                        </div> 

                                        <div className="flex flex-1 flex-row justify-center items-center gap-4 border-l border-r border-gray-100 px-4">
                                            <Typography variant="body2" sx={{ color: "#4b5563", fontWeight: 500 }}>
                                                {grp.list.length} nomination(s) received
                                            </Typography>
                                            <Button size="small" variant="contained" onClick={() => setOpenModal(grp)} sx={{ textTransform: "none", bgcolor: "#f3f4f6", color: "#374151", fontWeight: "bold", borderRadius: 4 }}>
                                                View details
                                            </Button>
                                        </div>
                                        
                                        <div className="flex flex-col justify-center items-end gap-2 w-1/3 pl-4">
                                            {activeTab === 0 ? (
                                                <>
                                                    <Button variant="contained" size="small" sx={{ bgcolor: "green", borderRadius: 2, width: "100px" }} startIcon={<CheckCircle />} onClick={() => handleDecision(grp.id, "APPROVE")}>
                                                        Approve
                                                    </Button>
                                                    <Button variant="outlined" size="small" color="error" startIcon={<Cancel />} sx={{ borderRadius: 2, width: "100px" }} onClick={() => handleDecision(grp.id, "REJECT")}>
                                                        Reject
                                                    </Button>
                                                </>
                                            ) : (
                                                <Chip 
                                                    label={
                                                        grp.status === "COORDINATOR_APPROVED" || grp.status === "APPROVED" ? "Approved" : 
                                                        grp.status === "COORDINATOR_REJECTED" || grp.status === "REJECTED" ? "Rejected" : 
                                                        grp.status === "COMMITTEE_APPROVED" ? "Finalist" :
                                                        grp.status === "COMMITTEE_REJECTED" ? "Committee Rejected" :
                                                        grp.status === "AWARDED" ? "Winner" :
                                                        grp.status
                                                    } 
                                                    color={grp.status && grp.status.includes("REJECT") ? "error" : "success"} 
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

                    {/* LOADING AND EMPTY STATES (Moved OUTSIDE the modal!) */}
                    {loading && (
                        <div className="text-center py-20 text-gray-400">
                            <Typography>Loading data...</Typography>
                        </div>
                    )}

                    {!loading && groupedList.length === 0 && (
                        <div className="text-center py-20 text-gray-400">
                            <Typography>No records found in {activeTab === 0 ? "Pending Reviews" : "Approval History"}.</Typography>
                        </div>
                    )}
                </>
            )}

            {/* CO-PILOT VIEW */}
            {viewMode === 'copilot' && (
                <Box mt={2}>
                    <DetailPage 
                        onViewDetails={handleCopilotClick} 
                        onActionComplete={handleCopilotActionComplete} 
                    />
                </Box>
            )}

            {/* SHARED DETAIL MODAL */}
            <Dialog open={!!openModal} onClose={() => setOpenModal(null)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ display: "flex", justifyContent: "space-between", color: TEAL, borderBottom: `2px solid ${TEAL}` }}>
                    Nominations for {openModal?.nominee_name}
                    <CloseIcon onClick={() => setOpenModal(null)} sx={{ cursor: "pointer", color: "#444" }} />
                </DialogTitle>
                <DialogContent sx={{ py: 2 }}>
                    {openModal?.list?.map((item: any, i: number) => (
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

export default CoordinatorNomination;