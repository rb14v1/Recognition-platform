import React, { useState, useEffect } from "react";
import { Typography, Avatar, Button, Chip, CircularProgress } from "@mui/material";
import { useAuth } from "../../context/AuthContext";
import UndoIcon from "@mui/icons-material/Undo";

import StarIcon from "@mui/icons-material/Star";

import { authAPI } from "../../api/auth";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [nominees, setNominees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      const res = await authAPI.getVoteResults();
      setNominees(res.data);
    } catch (e) {
      console.error("Failed to load results", e);
      toast.error("Failed to load voting results");
    } finally {
      setLoading(false);
    }
  };

  //  CUSTOM CONFIRM POPUP
  const askConfirmWinner = (id: number, name: string) => {
    toast.custom(
      (t) => (
        <div
          className={`p-6 bg-white rounded-2xl shadow-xl border border-gray-200 w-80 transition-all
        ${t.visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}`}
        >
          <Typography
            variant="subtitle1"
            fontWeight="bold"
            className="mb-4 text-gray-800 text-center"
          >
            Confirm Winner
          </Typography>

          <Typography
            variant="body2"
            className="mb-5 text-gray-600 text-center"
          >
            Are you sure you want to declare <b>{name}</b> as a final winner?
          </Typography>

          <div className="flex gap-3">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="flex-1 px-4 py-2 text-sm font-bold bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>

            <button
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  await authAPI.reviewNomination({
                    nomination_id: id,
                    action: "APPROVE",
                  });
                  toast.success(`${name} has been awarded!`);
                  loadResults();
                } catch (e) {
                  toast.error("Failed to update status");
                }
              }}
              className="flex-1 px-4 py-2 text-sm font-bold text-white bg-[#00A8A8] rounded-lg hover:bg-[#008f8f]"
            >
              Confirm
            </button>
          </div>
        </div>
      ),
      { duration: Infinity }
    );
  };


  const getRowStyle = () => {
    return "border-l-4 border-l-teal-500 bg-teal-50/20";
  };

  return (
    <div className="animate-fadeIn min-h-screen w-full px-6 pt-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <Typography variant="h4" className="font-bold text-gray-900 tracking-tight">
            Final Selection
          </Typography>
        </div>

      </div>

      {/* TOP 15 */}
      <div className="bg-white shadow-sm border border-teal-200 rounded-2xl px-5 py-3 mb-8 w-fit flex items-center gap-3">
        <StarIcon sx={{ color: "#00A8A8", fontSize: "26px" }} />
        <Typography className="text-teal-700 font-semibold text-lg tracking-wide">
          Top 15 Nominees
        </Typography>
      </div>

      {/* TABLE HEADER */}
      <div
        className="
        hidden md:grid grid-cols-12 gap-4 px-6 py-3 mb-3
        bg-gray-100/80 border border-gray-200 rounded-xl
        font-bold text-gray-500 text-xs uppercase tracking-wider"
      >
        <div className="col-span-4 text-left">Nominee Details</div>
        <div className="col-span-2 flex justify-center text-center">Portfolio</div>
        <div className="col-span-2 flex justify-center text-center">Practise</div>
        <div className="col-span-2 flex justify-center text-center">Vote Count</div>
        <div className="col-span-2 flex justify-center text-center">Action</div>
      </div>

      {/* RESULTS */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-20">
            <CircularProgress sx={{ color: "#00A8A8" }} />
          </div>
        ) : nominees.length === 0 ? (
          <div className="text-center py-20 text-gray-400 border border-dashed border-gray-300 rounded-2xl">
            No finalists or votes found yet.
          </div>
        ) : (
          nominees.map((nom) => (
            <div
              key={nom.id}
              className={`
                grid grid-cols-12 gap-4 items-center
                bg-white shadow-sm rounded-xl px-6 py-4
                hover:shadow-md transition
                ${getRowStyle()}
              `}
            >

              {/* NOMINEE */}
              <div className="col-span-4 flex items-center gap-4 text-left min-w-0">
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: "#00A8A8",
                    color: "white",
                    fontWeight: "bold",
                  }}
                >
                  {nom.nominee_name.charAt(0).toUpperCase()}
                </Avatar>

                <div className="min-w-0 flex-1">
                  <Typography className="text-gray-900 font-bold text-lg truncate w-full" title={nom.nominee_name}>
                    {nom.nominee_name}
                  </Typography>
                  <Typography variant="caption" className="text-gray-400">
                    ID: {nom.employee_id}
                  </Typography>
                </div>
              </div>

              {/* PORTFOLIO - Removed truncate, allowed to wrap neatly */}
              <div className="col-span-2 flex justify-center items-center px-2">
                <Typography className="text-gray-700 font-medium text-center text-sm leading-tight break-words w-full">
                  {nom.employee_role}
                </Typography>
              </div>

              {/* DEPARTMENT / PRACTISE - Removed truncate, allowed to wrap neatly */}
              <div className="col-span-2 flex justify-center items-center px-2">
                <Typography className="text-gray-700 font-medium text-center text-sm leading-tight break-words w-full">
                  {nom.employee_dept}
                </Typography>
              </div>

              {/* VOTES */}
              <div className="col-span-2 flex flex-col justify-center items-center">
                <Typography className="text-teal-700 text-2xl font-black">
                  {nom.vote_count}
                </Typography>
                <Typography variant="caption" className="text-teal-600/70 font-bold uppercase text-[0.6rem]">
                  Total Votes
                </Typography>
              </div>

              {/* ACTION */}
              <div className="col-span-2 flex justify-center">
                {nom.status === "AWARDED" ? (
                  <div className="flex items-center gap-2">
                    <Chip
                      label="Winner"
                      sx={{
                        bgcolor: "#00A8A8",
                        color: "white",
                        fontWeight: "bold",
                        px: 2,
                        borderRadius: "20px",
                      }}
                    />

                    {/* UNDO BUTTON */}
                    <Button
                      size="small"
                      onClick={async () => {
                        try {
                          await authAPI.reviewNomination({
                            nomination_id: nom.id,
                            action: "UNDO",
                          });

                          toast.success("Winner reverted!");
                          loadResults();
                        } catch (e) {
                          toast.error("Failed to undo winner");
                        }
                      }}
                      sx={{
                        minWidth: 0,
                        padding: "0px",
                        bgcolor: "#00A8A8",
                        "&:hover": { bgcolor: "#008f8f" }
                      }}
                    >
                      <UndoIcon sx={{ fontSize: 18, color: "white" }} />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => askConfirmWinner(nom.id, nom.nominee_name)}
                    sx={{
                      bgcolor: "#00A8A8",
                      textTransform: "none",
                      fontWeight: "bold",
                      borderRadius: 2,
                      "&:hover": { bgcolor: "#008f8f" }
                    }}
                  >
                    Declare Winner
                  </Button>
                )}
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;