import { useState, useEffect } from "react";
import {
  Card, CardContent, Typography, Button, Chip,
  Tabs, Tab, Box, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions
} from "@mui/material";
import {
  CheckCircle, Cancel, EmojiEvents, Badge,
  History, AccessTime
} from "@mui/icons-material";
import { authAPI } from "../api/auth";
import toast from "react-hot-toast";
 
const NominationApprovals = () => {
  const [activeTab, setActiveTab] = useState(0); // 0 = Pending, 1 = History
  const [nominations, setNominations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
 
  // Modal state
  const [openModal, setOpenModal] = useState<any>(null);
 
  useEffect(() => {
    loadNoms();
  }, [activeTab]);
 
  const loadNoms = async () => {
    setLoading(true);
    try {
      const filter = activeTab === 0 ? "pending" : "history";
      const res = await authAPI.getCoordinatorNominations(filter);
      setNominations(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
 
  const handleAction = async (id: number, action: "APPROVE" | "REJECT") => {
    try {
      await authAPI.reviewNomination({ nomination_id: id, action });
      toast.success(
        `Nomination ${action === "APPROVE" ? "Approved" : "Rejected"}!`
      );
      loadNoms();
    } catch (e) {
      toast.error("Action failed");
    }
  };
 
  // GROUP nominations by nominee
  const grouped = nominations.reduce((acc: any, nom: any) => {
    const key = nom.nominee_name;
 
    if (!acc[key]) {
      acc[key] = {
        id: nom.id,
        nominee_name: nom.nominee_name,
        nominee_role: nom.nominee_role,
        nominee_dept: nom.nominee_dept,
        status: nom.status,
        list: [],
      };
    }
 
    acc[key].list.push({
      nominator_name: nom.nominator_name,
      reason: nom.reason,
      submitted_at: nom.submitted_at,
    });
 
    return acc;
  }, {});
 
  const groupedList = Object.values(grouped);
 
  return (
    <div className="animate-fadeIn max-w-5xl mx-auto">
      <div className="mb-6">
        <Typography variant="h5" fontWeight="bold" className="text-gray-800">
          Team Nominations
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Review and approve nominations for your direct reports.
        </Typography>
      </div>
 
      {/* TABS */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 4 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          TabIndicatorProps={{ style: { backgroundColor: "#00A8A8" } }}
          sx={{
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: "bold",
              fontSize: "1rem",
              color: "#6b7280",
            },
            "& .Mui-selected": {
              color: "#00A8A8 !important",
            },
          }}
        >
          <Tab icon={<AccessTime />} iconPosition="start" label="Pending Requests" />
          <Tab icon={<History />} iconPosition="start" label="Approval History" />
        </Tabs>
      </Box>
 
      {/* LOADING */}
      {loading ? (
        <div className="flex justify-center py-20">
          <CircularProgress />
        </div>
      ) : groupedList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-300 text-gray-400">
          <EmojiEvents sx={{ fontSize: 60, opacity: 0.2, mb: 2 }} />
          <Typography>
            {activeTab === 0
              ? "All caught up! No pending nominations."
              : "No history found."}
          </Typography>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedList.map((grp: any, index: number) => (
            <Card
              key={index}
              sx={{
                borderRadius: 3,
                borderLeft:
                  activeTab === 0
                    ? "6px solid #00A8A8"
                    : "6px solid #cbd5e1",
              }}
            >
              <CardContent className="flex flex-col gap-4 p-6">
                {/* HEADER */}
                <div className="flex items-center gap-3">
                  <Typography variant="h6" fontWeight="bold">
                    {grp.nominee_name}
                  </Typography>
 
                  <Chip
                    label={grp.nominee_role}
                    size="small"
                    sx={{
                      bgcolor: "#f1f5f9",
                      color: "#475569",
                      fontWeight: "bold",
                    }}
                  />
 
                  {activeTab === 1 && (
                    <Chip
                      label={grp.status}
                      color={grp.status === "APPROVED" ? "success" : "error"}
                      size="small"
                      sx={{ fontWeight: "bold" }}
                    />
                  )}
                </div>
 
                {/* SUMMARY */}
                <Typography
                  className="text-teal-600 font-medium cursor-pointer"
                  onClick={() => setOpenModal(grp)}
                >
                  {grp.list.length} nomination(s) received — <b>View details</b>
                </Typography>
 
                {/* ACTION BUTTONS */}
                {activeTab === 0 && (
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircle />}
                      fullWidth
                      onClick={() => handleAction(grp.id, "APPROVE")}
                    >
                      Approve
                    </Button>
 
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<Cancel />}
                      fullWidth
                      onClick={() => handleAction(grp.id, "REJECT")}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
 
      {/* MODAL */}
      <Dialog
        open={!!openModal}
        onClose={() => setOpenModal(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Nominations for {openModal?.nominee_name}
        </DialogTitle>
 
        <DialogContent>
          {openModal?.list?.map((item: any, i: number) => (
            <div key={i} className="border-b py-3">
              <Typography>
                <b>Nominated by:</b> {item.nominator_name}
              </Typography>
              <Typography>
                <b>Reason:</b> {item.reason}
              </Typography>
              <Typography
                variant="caption"
                className="text-gray-400"
              >
                {new Date(item.submitted_at).toLocaleString()}
              </Typography>
            </div>
          ))}
        </DialogContent>
 
        <DialogActions>
          <Button onClick={() => setOpenModal(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
 
export default NominationApprovals;
 
 