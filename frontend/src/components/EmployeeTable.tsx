import { Avatar, Typography, Button, IconButton, Tooltip, Chip } from "@mui/material";
import { Edit, Delete, HowToVote, School, EmojiEvents } from "@mui/icons-material";
 
interface EmployeeTableProps {
  employees: any[];
  mode?: "manage" | "promote" | "vote" | "nominate";
  onEdit?: (emp: any) => void;
  onRemove?: (emp: any) => void;
  onPromote?: (emp: any) => void;
  onVote?: (id: number, name: string) => void;
  onSelect?: (emp: any) => void;
  hasVoted?: boolean;
}
 
const EmployeeTable = ({
  employees,
  mode = "manage",
  onEdit,
  onRemove,
  onPromote,
  onVote,
  onSelect,
  hasVoted = false
}: EmployeeTableProps) => {
 
  if (!employees || employees.length === 0) return null;
 
  return (
    <div className="w-full">
 
      {/* HEADER */}
      <div className="hidden md:flex items-center gap-4 px-6 py-3 bg-gray-50 border border-gray-200 rounded-t-xl
                      text-xs font-bold text-gray-500 uppercase tracking-wider text-center">
        <div className="w-1/4 pl-2 text-left">Employee Details</div>
        <div className="flex-1 flex items-center gap-4">
          <div className="w-20 text-left">ID</div>
          {/* Changed fixed widths to flex-1 to distribute space evenly */}
          <div className="flex-1">Portfolio</div>
          <div className="flex-1">Practise</div>
        </div>
        <div className="w-[120px] text-right pr-2">Action</div>
      </div>
 
      {/* BODY */}
      <div className="flex flex-col gap-3 mt-2">
        {employees.map((emp) => (
         
          <div
            key={emp.id}
            className="flex flex-col md:flex-row items-center p-4 rounded-xl
                       border border-gray-200 bg-white hover:shadow-md hover:border-teal-300
                       transition-all duration-200"
          >
 
            {/* LEFT — AVATAR + NAME */}
            <div className="flex items-center gap-4 w-full md:w-1/4 mb-3 md:mb-0">
              <Avatar
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: "#00A8A8",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "1.1rem"
                }}
              >
                {(emp.username || emp.nominee_name)?.charAt(0).toUpperCase()}
              </Avatar>
 
              <div className="min-w-0 flex-1">
                <Typography fontWeight="bold" className="text-gray-900 leading-tight truncate" title={emp.username || emp.nominee_name}>
                  {emp.username || emp.nominee_name}
                </Typography>
                <Typography variant="caption" className="md:hidden text-gray-400 font-mono">
                  {emp.employee_id}
                </Typography>
              </div>
            </div>
 
            {/* MIDDLE — ID, ROLE, DEPARTMENT */}
            <div className="flex items-center justify-between w-full md:flex-1 gap-4">
 
              <div className="w-20 text-sm text-gray-500 font-mono hidden md:block text-left">
                {emp.employee_id}
              </div>
 
              {/* Portfolio - Flexible width and wrap text */}
              <div className="flex-1 flex justify-center items-center px-1">
                <Typography className="text-gray-700 font-medium text-sm leading-tight break-words text-center w-full">
                  {emp.employee_role || emp.nominee_role || "N/A"}
                </Typography>
              </div>
 
              {/* Practise - Flexible width with modified multiline Chip */}
              <div className="flex-1 flex justify-center items-center px-1">
                <Chip
                  label={emp.employee_dept || emp.nominee_dept || "General"}
                  size="small"
                  sx={{
                    bgcolor: "#f3f4f6",
                    color: "#4b5563",
                    fontWeight: 600,
                    borderRadius: "8px",
                    height: "auto", 
                    py: 0.5,
                    "& .MuiChip-label": {
                      display: "block",
                      whiteSpace: "normal",
                      lineHeight: 1.2,
                      textAlign: "center"
                    }
                  }}
                />
              </div>
 
              {/* RIGHT — ACTION BUTTONS */}
              <div className="w-[120px] flex justify-end gap-2">
 
                {/* VOTE MODE */}
                {mode === "vote" && onVote && (
                  <Button
                    variant={hasVoted ? "outlined" : "contained"}
                    disabled={hasVoted}
                    onClick={() => onVote(emp.id, emp.nominee_name)}
                    startIcon={<HowToVote />}
                    size="small"
                    sx={{
                      borderRadius: "8px",
                      bgcolor: hasVoted ? "transparent" : "#00A8A8",
                      color: hasVoted ? "#94a3b8" : "white",
                      borderColor: hasVoted ? "#cbd5e1" : "transparent",
                      textTransform: "none",
                      fontWeight: "bold",
                      "&:hover": { bgcolor: hasVoted ? "transparent" : "#008f8f" }
                    }}
                  >
                    {hasVoted ? "Voted" : "Vote"}
                  </Button>
                )}
 
                {/* NOMINATE MODE */}
                {mode === "nominate" && onSelect && (
                  <Button
                    variant="outlined"
                    onClick={() => onSelect(emp)}
                    startIcon={<EmojiEvents />}
                    size="small"
                    sx={{
                      borderColor: "#00A8A8",
                      color: "#00A8A8",
                      textTransform: "none",
                      fontWeight: "bold",
                      borderRadius: "8px",
                      "&:hover": { bgcolor: "#e0f2f1", borderColor: "#008f8f" }
                    }}
                  >
                    Nominate
                  </Button>
                )}
 
                {/* MANAGE MODE */}
                {mode === "manage" && (
                  <>
                    {onEdit && (
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => onEdit(emp)}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {onRemove && (
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => onRemove(emp)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </>
                )}
 
                {/* PROMOTE MODE */}
                {mode === "promote" && onPromote && (
                  <Button
                    variant="contained"
                    startIcon={<School />}
                    size="small"
                    onClick={() => onPromote(emp)}
                    sx={{
                      bgcolor: "#00A8A8",
                      textTransform: "none",
                      fontWeight: "bold",
                      "&:hover": { bgcolor: "#008f8f" }
                    }}
                  >
                    Promote
                  </Button>
                )}
 
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
 
export default EmployeeTable;