// src/pages/VotingPage.tsx
import { useState, useEffect } from "react";
import { Typography } from "@mui/material";
import { HowToVote, Lock, HowToVote as HowToVoteIcon } from "@mui/icons-material";
import { authAPI } from "../api/auth";
import toast from 'react-hot-toast';
import EmployeeTable from "../components/EmployeeTable"; // 👈 NEW
 
const VotingPage = () => {
    const [finalists, setFinalists] = useState<any[]>([]);
    const [hasVoted, setHasVoted] = useState(false);
    const [loading, setLoading] = useState(true);
 
    useEffect(() => { loadData(); }, []);
 
    const loadData = async () => {
        try {
            const res = await authAPI.getVotingOptions();
            setFinalists(res.data.finalists);
            setHasVoted(res.data.has_voted);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };
 
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
 
                // ✅ USING TABLE WITH VOTING MODE
                <EmployeeTable
                    employees={finalists}
                    mode="vote"
                    hasVoted={hasVoted}
                    onVote={handleVoteClick}
                />
            )}
        </div>
    );
};
 
export default VotingPage;
 