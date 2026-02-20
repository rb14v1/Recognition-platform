import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Tabs,
  Tab,
  Box,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
} from "@mui/material";

import {
  CheckCircle,
  Cancel,
  EmojiEvents,
  History,
  AccessTime,
} from "@mui/icons-material";

import CloseIcon from "@mui/icons-material/Close"; 


import { authAPI } from "../api/auth";
import toast from "react-hot-toast";

const NominationApprovals = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [nominations, setNominations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
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
      toast.success(`Nomination ${action === "APPROVE" ? "Approved" : "Rejected"}!`);
      setOpenModal(null);
      loadNoms();
    } catch (e) {
      toast.error("Action failed");
    }
  };

  /** GROUP NOMINATIONS BY NOMINEE */
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
      {/* PAGE HEADER */}
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

      {/* LOADING / EMPTY STATE / DATA */}
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
                borderLeft: "6px solid #00A8A8",
                boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
              }}
            >
              <CardContent className="flex flex-col md:flex-row justify-between gap-6 p-6">
                
                {/* LEFT SIDE — INFO */}
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Typography variant="h6" fontWeight="bold">
                      {grp.nominee_name}
                    </Typography>

                    <Chip
                      label={grp.nominee_role}
                      size="small"
                      sx={{
                        bgcolor: "#e2e8f0",
                        color: "#000",
                        fontWeight: "bold",
                      }}
                    />
                  </div>

                  <Typography sx={{ marginTop: 2, fontWeight: 500 }}>
                    {grp.list.length} nomination(s) received
                    <span
                      onClick={() => setOpenModal(grp)}
                      style={{
                        marginLeft: "8px",
                        backgroundColor: "#e2e8f0",
                        padding: "4px 10px",
                        borderRadius: "16px",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        color: "#000",
                        cursor: "pointer",
                        display: "inline-block",
                      }}
                    >
                      View details
                    </span>
                  </Typography>
                </div>

                {/* RIGHT SIDE — APPROVE & REJECT */}
                {activeTab === 0 && (
                  <div
                    className="flex flex-col gap-3"
                    style={{
                      minWidth: "180px",
                      justifyContent: "flex-start",
                      alignItems: "flex-end",
                    }}
                  >
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircle />}
                      onClick={() => handleAction(grp.id, "APPROVE")}
                      sx={{
                        fontWeight: "bold",
                        textTransform: "none",
                        borderRadius: 2,
                        width: "150px",
                      }}
                    >
                      Approve
                    </Button>

                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<Cancel />}
                      onClick={() => handleAction(grp.id, "REJECT")}
                      sx={{
                        fontWeight: "bold",
                        textTransform: "none",
                        borderRadius: 2,
                        width: "150px",
                      }}
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

          {/* TOP-RIGHT CLOSE BUTTON */}
          <CloseIcon
            onClick={() => setOpenModal(null)}
            sx={{
              cursor: "pointer",
              fontSize: "1.7rem",
              color: "#444",
              "&:hover": { color: "#000" },
            }}
          />
        </DialogTitle>

        <DialogContent sx={{ pb: 1 }}>
          {openModal?.list?.map((item: any, i: number) => (
            <div
              key={i}
              style={{
                marginBottom: "18px",
                paddingBottom: "12px",
                borderBottom:
                  i !== openModal.list.length - 1 ? "1px solid #e5e5e5" : "none",
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
                sx={{ color: "#008080", fontStyle: "italic" }}
              >
                {new Date(item.submitted_at).toLocaleString()}
              </Typography>
            </div>
          ))}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NominationApprovals;
