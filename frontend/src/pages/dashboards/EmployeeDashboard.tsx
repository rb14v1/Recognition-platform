import { useEffect, useState } from "react";
import { Card, CardContent, Typography, Button, Chip } from "@mui/material";
import { useNavigate } from "react-router-dom";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import HowToVoteIcon from "@mui/icons-material/HowToVote";
import CampaignIcon from "@mui/icons-material/Campaign";
import { authAPI } from "../../api/auth";
import { useAuth } from "../../context/AuthContext";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
 
const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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
          {user?.role === "COORDINATOR" ? "Coordinator Workspace" : "Employee Workspace"}
        </Typography>
        <Typography variant="body1" className="text-gray-500">
          Welcome back, {user?.username}.
        </Typography>
      </div>
 
      {/* CARDS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl">
 
        {/* CARD 1 */}
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
              sx={{
                borderRadius: 3,
                bgcolor: "#00A8A8",
                textTransform: "none",
                py: 1
              }}
            >
              Go to Nomination
            </Button>
          </CardContent>
        </Card>
 
        {/* CARD 2 */}
        <Card sx={{ borderRadius: 4, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
          <CardContent className="p-6 flex flex-col h-full items-start">
            <div className="p-3 bg-teal-50 rounded-xl mb-4 text-teal-600">
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
                variant="contained"
                fullWidth
                onClick={() => setShowStatus(true)}
                sx={{
                  borderRadius: 3,
                  bgcolor: "#00A8A8",
                  textTransform: "none",
                  py: 1,
                  "&:hover": { bgcolor: "#009191" }
                }}
              >
                Reveal My Status
              </Button>
            ) : (
              <div className="w-full bg-teal-50 border border-teal-100 rounded-xl p-3 text-center relative animate-fadeIn">
                <IconButton
                  size="small"
                  onClick={() => setShowStatus(false)}
                  sx={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    color: "#e57373",
                    padding: "2px"
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
 
                <Typography variant="h3" fontWeight="bold" className="text-teal-600 my-1">
                  {receivedCount}
                </Typography>
 
                <Typography variant="caption" className="text-teal-500 uppercase tracking-wider font-bold">
                  Nominations Received
                </Typography>
              </div>
            )}
          </CardContent>
        </Card>
 
        {/* CARD 3 */}
        <Card sx={{ borderRadius: 4, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
          <CardContent className="p-6 flex flex-col h-full items-start">
            <div className="flex justify-between w-full mb-4">
              <div className="p-3 bg-teal-50 rounded-xl text-teal-600">
                <HowToVoteIcon fontSize="large" />
              </div>
              <Chip label="Active" size="small" />
            </div>
 
            <Typography variant="h6" fontWeight="bold" className="mb-2 text-gray-800">
              Final Voting
            </Typography>
 
            <Typography variant="body2" className="text-gray-500 mb-6 flex-grow">
              Vote for the final winner from the top 15 candidates.
            </Typography>
 
            <Button
              variant="contained"
              fullWidth
              sx={{
                borderRadius: 3,
                bgcolor: "#00A8A8",
                textTransform: "none",
                py: 1,
                "&:hover": { bgcolor: "#009191" }
              }}
              onClick={() => navigate("/dashboard/voting")}
            >
              Cast Vote
            </Button>
          </CardContent>
        </Card>
 
      </div> 
    </div>
  );
};
 
export default EmployeeDashboard;
 
