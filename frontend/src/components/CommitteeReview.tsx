import { useState, useEffect } from "react";
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
    DialogActions,
} from "@mui/material";
 
import { EmojiEvents, Cancel, CheckCircle } from "@mui/icons-material";
import { authAPI } from "../api/auth";
import toast from "react-hot-toast";
 
// YOUR EXACT SHADE
const TEAL = "#00A8A8";
const TEAL_HOVER = "#008F8F";
 
const CommitteeReview = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [nominations, setNominations] = useState<any[]>([]);
    const [openModal, setOpenModal] = useState<any>(null);
 
    useEffect(() => {
        loadData();
    }, [activeTab]);
 
    const loadData = async () => {
        try {
            const filter = activeTab === 0 ? "pending" : "history";
            const res = await authAPI.getCoordinatorNominations(filter);
            setNominations(res.data);
        } catch (e) {
            console.error(e);
        }
    };
 
    const handleDecision = async (id: number, action: "APPROVE" | "REJECT") => {
        try {
            await authAPI.reviewNomination({ nomination_id: id, action });
            toast.success(
                action === "APPROVE" ? "Promoted to Finalist!" : "Nomination Rejected"
            );
            setOpenModal(null);
            loadData();
        } catch (e) {
            toast.error("Action failed");
        }
    };
 
    // GROUP BY NOMINEE
    const grouped = nominations.reduce((acc: any, n: any) => {
        if (!acc[n.nominee_name]) {
            acc[n.nominee_name] = {
                nominee_name: n.nominee_name,
                nominee_role: n.nominee_role,
                nominee_dept: n.nominee_dept,
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
 
    const groupedList = Object.values(grouped);
 
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
                    onChange={(_, v) => setActiveTab(v)}
                    TabIndicatorProps={{ style: { backgroundColor: TEAL } }}
                    sx={{
                        "& .MuiTab-root": { color: TEAL, fontWeight: "bold" },
                        "& .Mui-selected": { color: TEAL + " !important" },
                    }}
                >
                    <Tab label="Review Pool" />
                    <Tab label="Decision History" />
                </Tabs>
            </Box>
 
            {/* CARDS */}
            <div className="grid grid-cols-1 gap-4">
                {groupedList.map((grp: any, index: number) => (
                    <Card
                        key={index}
                        sx={{
                            borderRadius: 3,
                            borderLeft: `6px solid ${TEAL}`,
                        }}
                    >
                        <CardContent className="flex flex-col  p-6">
                            {/* TOP ROW */}
                            <div className="flex justify-between items-start">
                                {/* LEFT SIDE */}
                                <div className="flex items-center gap-3">
                                    <Avatar
                                        sx={{
                                            width: 56,
                                            height: 56,
                                            bgcolor: TEAL,
                                            color: "white",
                                            fontWeight: "bold",
                                            fontSize: "1.2rem",
                                        }}
                                    >
                                        {grp.nominee_name[0].toUpperCase()}
                                    </Avatar>
 
                                    <div className="flex flex-col">
 
                                        {/* FULL NAME + ROLE IN SAME ROW */}
                                        <div className="flex items-center gap-3">
                                            <Typography variant="h6" fontWeight="bold">
                                                {grp.nominee_full_name || grp.nominee_name}
                                            </Typography>
 
                                            <Chip
                                                label={grp.nominee_role}
                                                size="small"
                                                sx={{
                                                    bgcolor: "#e5e7eb",
                                                    fontWeight: "bold",
                                                    height: 26,
                                                }}
                                            />
                                        </div>
 
                                    </div>
                                </div>
 
 
                                {/* ACTION BUTTONS */}
                                {activeTab === 0 && (
                                    <div className="flex flex-col gap-2 min-w-[160px]">
                                        <Button
                                            variant="contained"
                                            sx={{
                                                bgcolor: "green",
                                                "&:hover": { bgcolor: "#0b6e0b" },
                                                color: "white",
                                                fontWeight: "bold",
                                                borderRadius: 2,
                                            }}
                                            onClick={() => handleDecision(grp.id, "APPROVE")}
                                            startIcon={<EmojiEvents />}
                                        >
                                            Select Finalist
                                        </Button>
 
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            startIcon={<Cancel />}
                                            onClick={() => handleDecision(grp.id, "REJECT")}
                                            sx={{ borderRadius: 2 }}
                                        >
                                            Reject
                                        </Button>
                                    </div>
                                )}
                            </div>
 
                            {/* NOMINATIONS COUNT */}
                            <div className="flex items-center gap-3 text-black font-medium">
                                <Typography sx={{ fontWeight: 600 }}>
                                    {grp.list.length} nomination(s) received
                                </Typography>
 
                                <Chip
                                    label="View details"
                                    onClick={() => setOpenModal(grp)}
                                    sx={{
                                        cursor: "pointer",
                                        bgcolor: "#e5e7eb",
                                        "&:hover": { bgcolor: "#d4d4d4" },
                                        fontWeight: "bold",
                                    }}
                                />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
 
            {/* NO DATA */}
            {groupedList.length === 0 && (
                <div className="text-center py-20 text-gray-400">
                    <Typography>No nominations found.</Typography>
                </div>
            )}
 
            {/* MODAL */}
            <Dialog
                open={!!openModal}
                onClose={() => setOpenModal(null)}
                fullWidth
                maxWidth="sm"
                PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
            >
                <DialogTitle
                    sx={{
                        fontSize: "1.5rem",
                        fontWeight: 700,
                        color: "#00A8A8",
                        borderBottom: "2px solid #00A8A8",
                        pb: 2,
                    }}
                >
                    Nominations for {openModal?.nominee_name}
                </DialogTitle>
 
                <DialogContent sx={{ pb: 1 }}>
                    {openModal?.list?.map((item: any, i: number) => (
                        <div
                            key={i}
                            style={{
                                marginBottom: "18px",
                                paddingBottom: "12px",
                                borderBottom: "1px solid #e5e5e5",
                            }}
                        >
                            <Typography sx={{ fontWeight: "bold", color: "#000" }}>
                                Nominated by:{" "}
                                <span style={{ fontWeight: 400 }}>{item.nominator_name}</span>
                            </Typography>
 
                            <Typography sx={{ color: "#333", mb: 1, wordBreak: "break-word" }}>
                                <b>Reason:</b> {item.reason}
                            </Typography>
 
                            <Typography
                                variant="caption"
                                sx={{ color: "#00A8A8", fontStyle: "italic" }}
                            >
                                {new Date(item.submitted_at).toLocaleString()}
                            </Typography>
                        </div>
                    ))}
                </DialogContent>
 
                {/* Modal Action Buttons */}
                <DialogActions sx={{ justifyContent: "flex-start", px: 3, pb: 2 }}>
                    <Button
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircle />}
                        onClick={() => handleDecision(openModal?.id, "APPROVE")}
                        sx={{ fontWeight: "bold", textTransform: "none", borderRadius: 2 }}
                    >
                        Approve
                    </Button>
 
                    <Button
                        variant="outlined"
                        color="error"
                        startIcon={<Cancel />}
                        onClick={() => handleDecision(openModal?.id, "REJECT")}
                        sx={{ fontWeight: "bold", textTransform: "none", borderRadius: 2 }}
                    >
                        Reject
                    </Button>
 
                    <Button onClick={() => setOpenModal(null)} sx={{ ml: "auto" }}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
 
        </div>
    );
};
 
export default CommitteeReview;
 
 