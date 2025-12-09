import { useEffect, useState } from "react";
import { Card, CardContent, Typography, Button, Chip } from "@mui/material";
import { useNavigate } from "react-router-dom";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import HowToVoteIcon from "@mui/icons-material/HowToVote";
import VerifiedIcon from "@mui/icons-material/Verified";
import CampaignIcon from "@mui/icons-material/Campaign";
import { authAPI } from "../../api/auth";
import { useAuth } from "../../context/AuthContext"; // Import Context
 
const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // Get user info
  const [receivedCount, setReceivedCount] = useState<number | null>(null);
  const [showStatus, setShowStatus] = useState(false);
 
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await authAPI.getNominationStatus();
        setReceivedCount(res.data.nominations_received_count);
      } catch (e) {
        console.error("Failed to load status");
      }
    };
    fetchStatus();
  }, []);
 
  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
 
      {/* HEADER */}
      <div className="mb-10 animate-fadeIn">
        <Typography variant="h4" className="font-bold text-gray-900 mb-1 tracking-tight">
          {user?.role === 'COORDINATOR' ? "Coordinator Workspace" : "Employee Workspace"}
        </Typography>
        <Typography variant="body1" className="text-gray-500">
          Welcome back, {user?.username}.
        </Typography>
      </div>
 
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl">
 
        {/* CARD 1: MAKE A NOMINATION */}
        <Card sx={{ borderRadius: 4, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
          <CardContent className="p-6 flex flex-col h-full items-start">
            <div className="p-3 bg-teal-50 rounded-xl mb-4 text-teal-600">
              <EmojiEventsIcon fontSize="large" />
            </div>
            <Typography variant="h6" fontWeight="bold" className="mb-2 text-gray-800">
              Nominate a Colleague
            </Typography>
            <Typography variant="body2" className="text-gray-500 mb-6 flex-grow">
              Recognize a peer for their hard work.
            </Typography>
            <Button
              variant="contained"
              fullWidth
              onClick={() => navigate("/dashboard/nominate")}
              sx={{ borderRadius: 3, bgcolor: "#00A8A8", textTransform: "none", py: 1 }}
            >
              Go to Nomination
            </Button>
          </CardContent>
        </Card>
 
        {/* CARD 2: MY STATUS */}
        <Card sx={{ borderRadius: 4, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
          <CardContent className="p-6 flex flex-col h-full items-start">
            <div className="p-3 bg-blue-50 rounded-xl mb-4 text-blue-600">
              <CampaignIcon fontSize="large" />
            </div>
            <Typography variant="h6" fontWeight="bold" className="mb-2 text-gray-800">
              My Nominations
            </Typography>
            <Typography variant="body2" className="text-gray-500 mb-6 flex-grow">
              Check if peers have nominated you.
            </Typography>
 
            {!showStatus ? (
              <Button
                variant="outlined"
                fullWidth
                onClick={() => setShowStatus(true)}
                sx={{ borderRadius: 3, textTransform: "none", py: 1, borderColor: '#e2e8f0', color: '#64748b' }}
              >
                Reveal My Status
              </Button>
            ) : (
              <div className="w-full bg-blue-50 border border-blue-100 rounded-xl p-3 text-center animate-fadeIn">
                <Typography variant="h3" fontWeight="bold" className="text-blue-600 my-1">
                  {receivedCount}
                </Typography>
                <Typography variant="caption" className="text-blue-500 uppercase tracking-wider font-bold">
                  Nominations Received
                </Typography>
              </div>
            )}
          </CardContent>
        </Card>
 
        {/* CARD 3: VOTING */}
        <Card sx={{ borderRadius: 4, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
          <CardContent className="p-6 flex flex-col h-full items-start">
            <div className="flex justify-between w-full mb-4">
              <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                <HowToVoteIcon fontSize="large" />
              </div>
              <Chip label="Active" color="primary" size="small" />
            </div>
            <Typography variant="h6" fontWeight="bold" className="mb-2 text-gray-800">
              Final Voting
            </Typography>
            <Typography variant="body2" className="text-gray-500 mb-6 flex-grow">
              Vote for the final winner from the top 15 candidates.
            </Typography>
            <Button
              variant="outlined"
              fullWidth
              sx={{ borderRadius: 3, color: '#4f46e5', borderColor: '#4f46e5' }}
              onClick={() => navigate('/dashboard/voting')} // Make sure to add this route in App.tsx!
            >
              Cast Vote
            </Button>
          </CardContent>
        </Card>
      </div>
 
      <div className="mt-12 flex items-center gap-2 text-xs text-gray-400">
        <VerifiedIcon fontSize="small" />
        <span>Authenticated as {user?.role || "User"}</span>
      </div>
    </div>
  );
};
 
export default EmployeeDashboard;
 