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
} from "@mui/material";

import { EmojiEvents, Cancel } from "@mui/icons-material";
import { authAPI } from "../api/auth";
import toast from "react-hot-toast";
import CloseIcon from "@mui/icons-material/Close";

const TEAL = "#00A8A8";

const CommitteeReview = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [nominations, setNominations] = useState<any[]>([]);
    const [openModal, setOpenModal] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        try {
            // 🔥 UPDATED: Request specific "committee_pending" list
            // This ensures we get the ones the Coordinator just approved!
            const filter = activeTab === 0 ? "committee_pending" : "history";

            // line 39
            const res = await authAPI.getCoordinatorNominations(filter as any);
            setNominations(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleDecision = async (id: number, action: "APPROVE" | "REJECT") => {
        try {
            await authAPI.reviewNomination({ nomination_id: id, action });

            toast.success(
                action === "APPROVE"
                    ? "Promoted to Finalist!"
                    : "Nomination Rejected"
            );

            setOpenModal(null);
            loadData();
        } catch (e: any) {
            if (e.response?.data?.error) {
                toast.error(e.response.data.error); // Catch "Limit 15" error
            } else {
                toast.error("Action failed");
            }
        }
    };

    // GROUP NOMINATIONS BY NOMINEE
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

            {/* CARDS LIST */}
            <div className="flex flex-col gap-2">
                {groupedList.map((grp: any, index: number) => (
                    <Card
                        key={index}
                        sx={{
                            borderRadius: 3,
                            borderLeft: `6px solid ${TEAL}`,
                        }}
                    >
                        <CardContent className="flex flex-col space-y-0 p-3">
                            {/* TOP ROW */}
                            <div className="flex justify-between items-center">
                                {/* LEFT SIDE */}
                                <div className="flex items-center gap-3 ">
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
                                        {grp.nominee_name?.[0]?.toUpperCase()}
                                    </Avatar>

                                    <div className="flex flex-col">
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

                                {/* ACTION BUTTONS (Only in pending tab) */}
                                {activeTab === 0 && (
                                    <div className="flex flex-col gap-2 min-w-[160px]">
                                        <Button
                                            variant="contained"
                                            sx={{
                                                bgcolor: "green",
                                                color: "white",
                                                fontWeight: "bold",
                                                borderRadius: 2,
                                                "&:hover": { bgcolor: "#0b6e0b" },
                                            }}
                                            startIcon={<EmojiEvents />}
                                            onClick={() => handleDecision(grp.id, "APPROVE")}
                                        >
                                            Select Finalist
                                        </Button>

                                        <Button
                                            variant="outlined"
                                            color="error"
                                            startIcon={<Cancel />}
                                            sx={{ borderRadius: 2 }}
                                            onClick={() => handleDecision(grp.id, "REJECT")}
                                        >
                                            Reject
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* NOMINATION COUNT */}
                            <div className="flex items-center gap-2 text-black font-medium mt-1">
                                <Typography sx={{ fontWeight: 400 }}>
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

            {/* EMPTY STATE */}
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
                        color: "#008080",
                        borderBottom: "2px solid #008080",
                        pb: 2,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    Nominations for {openModal?.nominee_name}
                    <CloseIcon
                        onClick={() => setOpenModal(null)}
                        sx={{ cursor: "pointer", fontSize: "1.7rem", color: "#444", "&:hover": { color: "#000" } }}
                    />
                </DialogTitle>

                <DialogContent sx={{ pb: 1 }}>
                    {openModal?.list?.map((item: any, i: number) => (
                        <div
                            key={i}
                            style={{
                                marginBottom: "18px",
                                paddingBottom: "12px",
                                borderBottom: i !== openModal.list.length - 1 ? "1px solid #e5e5e5" : "none",
                            }}
                        >
                            <Typography sx={{ fontWeight: "bold", color: "#000" }}>
                                Nominated by: <span style={{ fontWeight: 400 }}>{item.nominator_name}</span>
                            </Typography>
                            <Typography sx={{ color: "#333", mb: 1, wordBreak: "break-word" }}>
                                <b>Reason:</b> {item.reason}
                            </Typography>
                            <Typography variant="caption" sx={{ color: "#008080", fontStyle: "italic" }}>
                                {new Date(item.submitted_at).toLocaleString()}
                            </Typography>
                        </div>
                    ))}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CommitteeReview;