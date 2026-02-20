import React, { useEffect, useState } from "react";
import { Typography, Avatar, CircularProgress, Button } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../api/auth";
import toast from "react-hot-toast";
 
type Winner = {
  username: string;
  employee_id: number | string;
  employee_role: string;
  employee_dept: string;
};
 
const WinnersPage: React.FC = () => {
  const navigate = useNavigate();
 
  const [finalWinner, setFinalWinner] = useState<Winner | null>(null);
  const [committeeWinners, setCommitteeWinners] = useState<Winner[]>([]);
  const [coordinatorWinners, setCoordinatorWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    const loadWinners = async () => {
      try {
        const res = await authAPI.getAllWinners();
        const data = res.data;
 
        setFinalWinner(data.final_winner);
        setCommitteeWinners(data.committee_winners || []);
        setCoordinatorWinners(data.coordinator_winners || []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load winners");
      } finally {
        setLoading(false);
      }
    };
 
    loadWinners();
  }, []);
 
  // UPDATED HOVER EFFECT (same as admin dashboard)
  const WinnerCard = ({ w }: { w: Winner }) => (
    <div
      className="
        flex items-center justify-between
        bg-white shadow-sm border border-gray-200 rounded-xl
        px-6 py-4
        hover:bg-white-200 hover:shadow-md
        transition-all duration-200
      "
    >
      <div className="flex items-center gap-4">
        <Avatar
          sx={{
            width: 50,
            height: 50,
            bgcolor: "#00A8A8",
            color: "white",
            fontWeight: "bold",
          }}
        >
          {w.username?.charAt(0).toUpperCase()}
        </Avatar>
 
        <div>
          <Typography className="font-semibold text-gray-900 capitalize">
            {w.username}
          </Typography>
          <Typography className="text-gray-500 text-sm">
            {w.employee_role} • {w.employee_dept}
          </Typography>
        </div>
      </div>
 
      <Typography className="text-gray-700 font-medium">
        ID: {w.employee_id}
      </Typography>
    </div>
  );
 
  if (loading) {
    return (
      <div className="flex justify-center py-40">
        <CircularProgress sx={{ color: "#00A8A8" }} />
      </div>
    );
  }
 
  return (
    <div className="min-h-screen bg-gray-50/50 p-6 pt-8 mx-justify">
 
      {/* HEADER — Back Button (LEFT) + Centered Title */}
      <div className="flex items-center justify-between mb-10">
 
        {/* LEFT — Back Button */}
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/dashboard')}
          sx={{
            color: 'text.secondary',
            textTransform: 'none',
            fontWeight: 500,
            "&:hover": {
              backgroundColor: "rgba(168, 169, 172, 0.04)",
              color: "text.primary"
            }
          }}
        >
          Back to Dashboard
        </Button>
 
        {/* CENTER — Title */}
        <Typography
          variant="h4"
          className="font-bold text-gray-900 text-center flex-1"
        >
          Winners Showcase
        </Typography>
 
        {/* RIGHT — Placeholder */}
        <div className="w-[160px]"></div>
      </div>
 
      {/* FINAL GLOBAL WINNER */}
      <div className="mb-10">
        <Typography variant="h6" className="text-teal-700 font-bold mb-3">
           Global All-Star Award Winner
        </Typography>
 
        {finalWinner ? (
          <div className="border-2 border-teal-400 rounded-xl p-5 bg-white shadow">
            <WinnerCard w={finalWinner} />
          </div>
        ) : (
          <div className="text-gray-500 italic ml-1">No final winner selected yet.</div>
        )}
      </div>
 
      {/* COMMITTEE WINNERS */}
      <div className="mb-10">
        <Typography variant="h6" className="text-gray-800 font-bold mb-3">
           All-Star Award Winners
        </Typography>
 
        {committeeWinners.length > 0 ? (
          <div className="space-y-4">
            {committeeWinners.map((w, i) => (
              <WinnerCard w={w} key={i} />
            ))}
          </div>
        ) : (
          <div className="text-gray-500 italic ml-1">No committee winners yet.</div>
        )}
      </div>
 
      {/* COORDINATOR WINNERS */}
      <div className="mb-10">
        <Typography variant="h6" className="text-gray-800 font-bold mb-3">
           Star Award Winners
        </Typography>
 
        {coordinatorWinners.length > 0 ? (
          <div className="space-y-4">
            {coordinatorWinners.map((w, i) => (
              <WinnerCard w={w} key={i} />
            ))}
          </div>
        ) : (
          <div className="text-gray-500 italic ml-1">No coordinator winners yet.</div>
        )}
      </div>
    </div>
  );
};
 
export default WinnersPage;
 
 