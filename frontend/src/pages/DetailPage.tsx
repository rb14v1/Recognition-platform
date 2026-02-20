import { useState, useEffect, useRef } from "react";
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Typography, Button, Chip, Box, CircularProgress
} from "@mui/material";
import { 
    CheckCircle, Cancel, SentimentSatisfiedAlt, 
    SentimentNeutral, SentimentDissatisfied, AutoAwesome 
} from "@mui/icons-material";
import toast from "react-hot-toast";
import axios from "axios";

const TEAL = "#00A8A8";

interface AnalysisRow {
    id: number;
    name: string;
    email: string;
    votes: number;
    summary: string;
    sentiment: string;
    status: string;
}

interface DetailPageProps {
    onViewDetails: (nomineeName: string) => void;
    // Updated signature to pass back ID and Status
    onActionComplete?: (id: number, status: string) => void; 
}

const DetailPage = ({ onViewDetails, onActionComplete }: DetailPageProps) => {
    const [rows, setRows] = useState<AnalysisRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const hasFetched = useRef(false);

    const fetchAIAnalysis = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access') || localStorage.getItem('access_token');
            const baseUrl = import.meta.env.VITE_API_URL; 
            const endpoint = `${baseUrl}nominations/ai-analysis/`;

            const response = await axios.get(endpoint, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            setRows(response.data);
            if (response.data.length === 0) toast("No insights found.", { icon: "ℹ️" });

        } catch (error: any) {
            console.error("AI Error:", error);
            toast.error("Failed to load insights.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;
        fetchAIAnalysis();
    }, []);

    const handleAction = async (id: number, action: "Approved" | "Rejected") => {
        setProcessingId(id); 

        try {
            const token = localStorage.getItem('access') || localStorage.getItem('access_token');
            const backendAction = action === "Approved" ? "APPROVE" : "REJECT";
            await axios.post(`${import.meta.env.VITE_API_URL}coordinator/nominations/`, {
                nomination_id: id, 
                action: backendAction
            }, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            // 2. Define Final Status
            const finalStatus = action === "Approved" ? "COORDINATOR_APPROVED" : "COORDINATOR_REJECTED";
            
            // 3. Update Copilot Table
            setRows(prevRows => prevRows.map((row) =>
                row.id === id ? { ...row, status: finalStatus } : row
            ));

            toast.success(action === "Approved" ? "Shortlisted & Mail Sent!" : "Rejected & Mail Sent");

            // 4. INSTANTLY Update Parent (No Network Delay)
            if (onActionComplete) {
                onActionComplete(id, finalStatus);
            }

        } catch(err) {
            console.error(err);
            toast.error("Action failed.");
        } finally {
            setProcessingId(null);
        }
    };

    const getSentimentChip = (sentiment: string) => {
        let color: "success" | "warning" | "error" | "default" = "default";
        let icon = <SentimentNeutral />;
        const s = sentiment?.toLowerCase() || "";

        if (s === "positive") { color = "success"; icon = <SentimentSatisfiedAlt />; } 
        else if (s === "negative") { color = "error"; icon = <SentimentDissatisfied />; }

        return <Chip icon={icon} label={sentiment || "Unknown"} color={color} variant="outlined" size="small" sx={{ fontWeight: "bold", textTransform: 'capitalize' }} />;
    };

    return (
        <div className="animate-fadeIn w-full">
            <Box mb={2} display="flex" justifyContent="flex-end">
                <Button 
                    startIcon={<AutoAwesome />} 
                    variant="text" 
                    sx={{ color: TEAL, fontWeight: "bold" }}
                    onClick={() => { hasFetched.current = false; fetchAIAnalysis(); }}
                    disabled={loading}
                >
                    {loading ? "Analyzing..." : "Refresh Analysis"}
                </Button>
            </Box>

            <TableContainer component={Paper} sx={{ boxShadow: "none", border: "1px solid #e0e0e0", borderRadius: 3 }}>
                {loading ? (
                    <Box p={5} display="flex" justifyContent="center"><CircularProgress sx={{ color: TEAL }} /></Box>
                ) : (
                    <Table sx={{ minWidth: 650 }}>
                        <TableHead sx={{ backgroundColor: "#f5f7fa" }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: "bold" }}>Candidate</TableCell>
                                <TableCell align="center" sx={{ fontWeight: "bold" }}>Votes</TableCell>
                                <TableCell sx={{ fontWeight: "bold", width: "45%" }}>Executive Summary</TableCell>
                                <TableCell align="center" sx={{ fontWeight: "bold" }}>Sentiment</TableCell>
                                <TableCell align="center" sx={{ fontWeight: "bold" }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rows.map((row) => (
                                <TableRow key={row.id} hover>
                                    <TableCell>
                                        <Typography fontWeight="bold">{row.name}</Typography>
                                        <Typography variant="caption" color="textSecondary">{row.email}</Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip label={row.votes} size="small" sx={{ bgcolor: "#e3f2fd", color: "#1976d2", fontWeight: "bold" }} />
                                    </TableCell>
                                    <TableCell 
                                        onClick={() => onViewDetails(row.name)}
                                        sx={{ cursor: "pointer" }}
                                    >
                                        <Typography variant="body2" sx={{ color: "#333", lineHeight: 1.5 }}>
                                            {row.summary}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">{getSentimentChip(row.sentiment)}</TableCell>
                                    
                                    <TableCell align="center">
                                        {processingId === row.id ? (
                                            <CircularProgress size={24} sx={{ color: TEAL }} />
                                        ) : (
                                            !["COORDINATOR_APPROVED", "COORDINATOR_REJECTED", "APPROVED", "REJECTED"].includes(row.status) && row.status !== "AWARDED" ? (
                                                <Box display="flex" justifyContent="center" gap={1}>
                                                    <Button variant="contained" size="small" color="success" onClick={() => handleAction(row.id, "Approved")} sx={{ minWidth: "32px", p: 1 }}>
                                                        <CheckCircle fontSize="small" />
                                                    </Button>
                                                    <Button variant="outlined" size="small" color="error" onClick={() => handleAction(row.id, "Rejected")} sx={{ minWidth: "32px", p: 1 }}>
                                                        <Cancel fontSize="small" />
                                                    </Button>
                                                </Box>
                                            ) : (
                                                <Chip 
                                                    label={row.status.replace("COORDINATOR_", "")} 
                                                    color={row.status.includes("REJECT") ? "error" : "success"} 
                                                    size="small" 
                                                />
                                            )
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </TableContainer>
        </div>
    );
};

export default DetailPage;