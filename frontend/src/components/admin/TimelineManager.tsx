import { useState, useEffect } from "react";
import { 
  Typography, Paper, TextField, Button, Grid, CircularProgress, Card, CardContent 
} from "@mui/material";
import { 
  DateRange, Save, History, EmojiEvents, AccessTime, HowToVote, Update 
} from "@mui/icons-material";
import { authAPI } from "../../api/auth"; 
import toast from "react-hot-toast";

const TimelineManager = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "Annual Awards 2024",
    nomination_start: "", nomination_end: "",
    coordinator_start: "", coordinator_end: "",
    committee_start: "", committee_end: "",
    voting_start: "", voting_end: ""
  });

  useEffect(() => { loadTimeline(); }, []);

  const loadTimeline = async () => {
    try {
      const res = await authAPI.getTimeline();
      if (res.data) {
        const formatted = Object.keys(res.data).reduce((acc: any, key) => {
          if ((key.includes('start') || key.includes('end')) && res.data[key]) {
            acc[key] = new Date(res.data[key]).toISOString().slice(0, 16);
          } else {
            acc[key] = res.data[key];
          }
          return acc;
        }, {});
        setFormData(formatted);
      }
    } catch (e) { console.log("No active timeline found"); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await authAPI.setTimeline(formData);
      toast.success("Schedule updated successfully!");
    } catch (e: any) {
      toast.error(e.response?.data?.error || "Failed to update timeline");
    } finally {
      setLoading(false);
    }
  };

  // --- Softer Phase Card Component ---
  const PhaseCard = ({ title, prefix, icon, desc }: any) => (
    <Card elevation={0} className="border border-gray-200 rounded-xl overflow-hidden hover:border-teal-300 transition-colors h-full bg-white">
        {/* Header Strip - Clean & Light */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
            <div className="p-2 rounded-lg bg-white border border-gray-100 text-teal-600 shadow-sm">
                {icon}
            </div>
            <div>
                <Typography variant="subtitle2" className="font-bold text-gray-800 uppercase tracking-wide text-xs">
                    {title}
                </Typography>
                <Typography variant="caption" className="text-gray-500 font-medium block mt-0.5">
                    {desc}
                </Typography>
            </div>
        </div>
        
        {/* Content */}
        <CardContent className="p-5">
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        type="datetime-local"
                        label="Starts"
                        InputLabelProps={{ shrink: true }}
                        name={`${prefix}_start`}
                        value={(formData as any)[`${prefix}_start`] || ""}
                        onChange={handleChange}
                        size="small"
                        sx={{ 
                            "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: '#fff' } 
                        }}
                    />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        type="datetime-local"
                        label="Ends"
                        InputLabelProps={{ shrink: true }}
                        name={`${prefix}_end`}
                        value={(formData as any)[`${prefix}_end`] || ""}
                        onChange={handleChange}
                        size="small"
                        sx={{ 
                            "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: '#fff' } 
                        }}
                    />
                </Grid>
            </Grid>
        </CardContent>
    </Card>
  );

  return (
    <div className="animate-fadeIn max-w-6xl mx-auto">
      {/* Configuration Header Card */}
      <Paper elevation={0} className="p-6 border border-gray-200 rounded-2xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-white shadow-sm">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-teal-50 rounded-xl text-teal-700">
                <Update fontSize="large" />
            </div>
            <div>
                <Typography variant="h6" fontWeight="bold" className="text-gray-900">
                    Nomination Schedule
                </Typography>
                <Typography variant="body2" className="text-gray-500">
                    Define the active dates for each phase of the cycle.
                </Typography>
            </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <TextField 
                label="Cycle Name" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Q4 2024"
                size="small"
                sx={{ minWidth: 240, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />
            <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save />}
                onClick={handleSave}
                disabled={loading}
                sx={{
                    bgcolor: "#00A8A8",
                    "&:hover": { bgcolor: "#008f8f" },
                    textTransform: 'none',
                    fontWeight: 'bold',
                    boxShadow: 'none',
                    height: 40,
                    borderRadius: 2,
                    px: 3
                }}
            >
                {loading ? "Saving..." : "Save Schedule"}
            </Button>
        </div>
      </Paper>

      {/* Grid Layout for Phases */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <PhaseCard 
            title="1. Nominations" 
            prefix="nomination" 
            desc="Employees submit peers"
            icon={<History fontSize="small" />} 
        />
        <PhaseCard 
            title="2. Coordinator Review" 
            prefix="coordinator" 
            desc="Managers approve/reject"
            icon={<AccessTime fontSize="small" />} 
        />
        <PhaseCard 
            title="3. Committee Selection" 
            prefix="committee" 
            desc="Select top 15 finalists"
            icon={<EmojiEvents fontSize="small" />} 
        />
        <PhaseCard 
            title="4. Voting Period" 
            prefix="voting" 
            desc="Company-wide voting"
            icon={<HowToVote fontSize="small" />} 
        />
      </div>
    </div>
  );
};

export default TimelineManager;