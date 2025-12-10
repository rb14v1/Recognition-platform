import { useState, useEffect, useMemo } from "react";
import { Typography, Button } from "@mui/material";
import { HowToVote, Lock, HowToVote as HowToVoteIcon, ArrowBack } from "@mui/icons-material";
import { authAPI } from "../api/auth";
import toast from 'react-hot-toast';
import { useNavigate } from "react-router-dom";
import EmployeeTable from "../components/EmployeeTable";
import PaginationControl from "../components/PaginationControl"; // 🔥 IMPORT

const ITEMS_PER_PAGE = 6; // Adjust number of rows per page

const VotingPage = () => {
    const navigate = useNavigate();
    const [finalists, setFinalists] = useState<any[]>([]);
    const [hasVoted, setHasVoted] = useState(false);
    const [loading, setLoading] = useState(true);
    
    // 🔥 Pagination State
    const [page, setPage] = useState(1);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const res = await authAPI.getVotingOptions();
            setFinalists(res.data.finalists);
            setHasVoted(res.data.has_voted);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    // 🔥 Pagination Logic
    const paginatedFinalists = useMemo(() => {
        const startIndex = (page - 1) * ITEMS_PER_PAGE;
        return finalists.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [finalists, page]);

    const totalPages = Math.ceil(finalists.length / ITEMS_PER_PAGE);

    const executeVote = async (id: number) => {
        try {
            await authAPI.castVote(id);
            toast.success("Vote Submitted!");
            setHasVoted(true);
        } catch (e: any) { toast.error(e.response?.data?.error || "Failed"); }
    };

    const handleVoteClick = (id: number, name: string) => {
        if (hasVoted) return;

        toast((t) => (
            <div className="flex flex-col gap-3 min-w-[250px]">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-50 rounded-full text-teal-600">
                        <HowToVoteIcon fontSize="small" />
                    </div>
                    <Typography variant="subtitle2" fontWeight="bold">Confirm Vote for {name}?</Typography>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => toast.dismiss(t.id)} className="flex-1 px-3 py-2 text-xs font-bold bg-gray-100 rounded">Cancel</button>
                    <button onClick={() => { toast.dismiss(t.id); executeVote(id); }} className="flex-1 px-3 py-2 text-xs font-bold text-white bg-[#00A8A8] rounded">Confirm</button>
                </div>
            </div>
        ), { duration: Infinity, style: { borderRadius: '12px', border: '1px solid #e2e8f0' } });
    };

    return (
        <div className="animate-fadeIn max-w-7xl mx-auto p-6">
            
            {/* Back Button */}
            <div className="w-full flex justify-start">
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => navigate("/dashboard")}
                    sx={{ 
                        mb: 3, 
                        color: "text.secondary", 
                        textTransform: "none",
                        fontWeight: 500,
                        "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)", color: "text.primary" }
                    }}
                >
                    Back to Dashboard
                </Button>
            </div>

            <div className="text-center mb-10">
                <Typography variant="h4" fontWeight="bold" className="text-gray-900 flex items-center justify-center gap-3">
                    <HowToVote fontSize="large" className="text-[#00A8A8]" />
                    {hasVoted ? "Voting Complete" : "Cast Your Vote"}
                </Typography>
            </div>

            {loading ? (
                <div className="text-center p-10">Loading...</div>
            ) : finalists.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-200">
                    <Lock className="text-gray-300 text-6xl mb-4 opacity-50" />
                    <Typography className="text-gray-400">Voting is currently closed.</Typography>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {/* ✅ USING TABLE WITH PAGINATED DATA */}
                    <EmployeeTable
                        employees={paginatedFinalists}
                        mode="vote"
                        hasVoted={hasVoted}
                        onVote={handleVoteClick}
                    />

                    {/* 🔥 PAGINATION CONTROL */}
                    <PaginationControl 
                        count={totalPages} 
                        page={page} 
                        onChange={(_, v) => setPage(v)} 
                    />
                </div>
            )}
        </div>
    );
};

export default VotingPage;  