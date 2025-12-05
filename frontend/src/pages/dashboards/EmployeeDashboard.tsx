import { Card, CardContent, Typography, Button, Divider } from "@mui/material";
import { useNavigate } from "react-router-dom";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ChecklistIcon from "@mui/icons-material/Checklist";

const EmployeeDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="px-10 py-8 bg-[#F2F6F8] min-h-screen">

      {/* HEADER */}
      <div className="mb-10">
        <Typography
          variant="h4"
          className="font-extrabold text-gray-900 tracking-wide"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          Employee Dashboard
        </Typography>

        <Typography
          variant="body1"
          className="text-gray-600 mt-2 max-w-xl leading-relaxed"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          Recognize efforts, celebrate achievements, and track your nomination
          activity within the organization.
        </Typography>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

        {/* ===================== NOMINATION CARD ===================== */}
        <Card
          sx={{
            borderRadius: "22px",
            padding: "6px",
            backgroundColor: "#ffffff",

            boxShadow:
              "0 8px 25px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)",
            transition: "all 0.25s ease-in-out",
            display: "flex",
            flexDirection: "column",
            "&:hover": {
              transform: "translateY(-6px)",
              boxShadow:
                "0 14px 32px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.06)",
            },
          }}
        >
          <CardContent className="p-10 flex flex-col h-full">

            {/* ICON + TITLE */}
            <div className="flex items-center gap-3 mb-3">
              <EmojiEventsIcon sx={{ fontSize: 40, color: "#008C8C" }} />
              <Typography
                variant="h5"
                className="font-semibold text-gray-800"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Nominate a Colleague
              </Typography>
            </div>

            {/* DESCRIPTION */}
            <Typography
              variant="body1"
              className="text-gray-600 leading-relaxed mb-10 flex-grow"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Show appreciation for outstanding contributions. Each cycle allows you
              to nominate <strong>one member</strong>.
            </Typography>

            {/* BUTTON */}
            <div className="flex">
              <Button
                variant="contained"
                sx={{
                  backgroundColor: "#008C8C",
                  borderRadius: "30px",
                  paddingX: "32px",
                  paddingY: "12px",
                  fontSize: "16px",
                  textTransform: "none",
                  fontFamily: "Inter, sans-serif",
                  boxShadow: "0 4px 10px rgba(0, 140, 140, 0.3)",
                  "&:hover": {
                    backgroundColor: "#007373",
                    boxShadow: "0 6px 14px rgba(0, 115, 115, 0.35)",
                  },
                }}
                onClick={() => navigate("/dashboard/nominate")}
              >
                Start Nomination
              </Button>
            </div>

          </CardContent>
        </Card>

        {/* ===================== VOTING CARD ===================== */}
        <Card
          sx={{
            borderRadius: "22px",
            padding: "6px",
            backgroundColor: "#ffffff",

            boxShadow:
              "0 8px 25px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)",
            transition: "all 0.25s ease-in-out",
            display: "flex",
            flexDirection: "column",
            "&:hover": {
              transform: "translateY(-6px)",
              boxShadow:
                "0 14px 32px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.06)",
            },
          }}
        >
          <CardContent className="p-10 flex flex-col h-full">

            {/* HEADER */}
            <div className="flex items-center gap-3 mb-3">
              <ChecklistIcon sx={{ fontSize: 40, color: "#008C8C" }} />
              <Typography
                variant="h5"
                className="font-semibold text-gray-800"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Voting
              </Typography>
            </div>

            <Divider className="my-4" />

            {/* DESCRIPTION */}
            <Typography
              variant="body1"
              className="text-gray-600 leading-relaxed mb-10 flex-grow"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Voting is now open! Review the nominees and cast your vote for the person
              you feel deserves recognition this cycle.
            </Typography>

            {/* BUTTON */}
            <div className="flex">
              <Button
                variant="contained"
                sx={{
                  backgroundColor: "#008C8C",
                  borderRadius: "30px",
                  paddingX: "32px",
                  paddingY: "12px",
                  fontSize: "16px",
                  textTransform: "none",
                  fontFamily: "Inter, sans-serif",
                  boxShadow: "0 4px 10px rgba(0, 140, 140, 0.3)",
                  "&:hover": {
                    backgroundColor: "#007373",
                    boxShadow: "0 6px 14px rgba(0, 115, 115, 0.35)",
                  },
                }}
                onClick={() => navigate("/dashboard/vote")}
              >
                Vote Now
              </Button>
            </div>

          </CardContent>
        </Card>

      </div>

    </div>
  );
};

export default EmployeeDashboard;
