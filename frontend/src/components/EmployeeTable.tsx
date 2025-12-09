import { Avatar, Typography, Button, IconButton, Tooltip } from "@mui/material";
import { Edit, Delete, HowToVote, School, EmojiEvents } from "@mui/icons-material";
 
interface EmployeeTableProps {
  employees: any[];
 
  // Modes
  mode?: "manage" | "promote" | "vote" | "nominate";
 
  // Actions
  onEdit?: (emp: any) => void;
  onRemove?: (emp: any) => void;
  onPromote?: (emp: any) => void;
  onVote?: (id: number, name: string) => void;
  onSelect?: (emp: any) => void; // For nominate page
 
  // State for Voting
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
    <div className="flex flex-col gap-3">
      {employees.map((emp) => (
        <div
          key={emp.id}
          className="group flex flex-col md:flex-row items-center justify-between p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
        >
          {/* LEFT: Avatar & Identity */}
          <div className="flex items-center gap-4 w-full md:w-1/3 mb-4 md:mb-0">
            <Avatar
                sx={{
                    width: 48, height: 48,
                    bgcolor: '#00A8A8',
                    fontWeight: 'bold', fontSize: '1.1rem'
                }}
            >
                {(emp.username || emp.nominee_name)?.charAt(0).toUpperCase()}
            </Avatar>
            <div>
                <Typography variant="subtitle1" fontWeight="bold" className="text-gray-900 leading-tight">
                    {emp.username || emp.nominee_name}
                </Typography>
                <Typography variant="caption" className="text-gray-400 font-mono">
                    ID: {emp.employee_id || "N/A"}
                </Typography>
            </div>
          </div>
 
          {/* MIDDLE: Role & Dept */}
          <div className="flex flex-row md:flex-row items-center justify-between gap-4 w-full md:w-1/3 mb-4 md:mb-0">
            <div className="flex-1">
                <Typography variant="caption" className="text-gray-400 uppercase font-bold text-[0.65rem] tracking-wider block mb-1">
                    Job Title
                </Typography>
                <Typography variant="body2" className="text-gray-700 font-medium truncate">
                    {emp.employee_role || emp.nominee_role || "Employee"}
                </Typography>
            </div>
            <div className="flex-1">
                <Typography variant="caption" className="text-gray-400 uppercase font-bold text-[0.65rem] tracking-wider block mb-1">
                    Department
                </Typography>
                <Typography variant="body2" className="text-gray-700 font-medium">
                    {emp.employee_dept || emp.nominee_dept || "General"}
                </Typography>
            </div>
          </div>
 
          {/* RIGHT: Actions (Dynamic based on Mode) */}
          <div className="flex justify-end w-full md:w-auto min-w-[120px]">
           
            {/* 1. PROMOTE MODE */}
            {mode === "promote" && onPromote && (
                <Button
                    variant="contained"
                    onClick={() => onPromote(emp)}
                    startIcon={<School />}
                    sx={{
                        bgcolor: '#00A8A8',
                        color: 'white',
                        fontWeight: 'bold',
                        borderRadius: 2,
                        textTransform: 'none',
                        boxShadow: 'none',
                        '&:hover': { bgcolor: '#008f8f', boxShadow: '0 4px 12px rgba(0,168,168,0.3)' }
                    }}
                >
                    Promote
                </Button>
            )}
 
            {/* 2. VOTE MODE */}
            {mode === "vote" && onVote && (
                <Button
                    variant={hasVoted ? "outlined" : "contained"}
                    disabled={hasVoted}
                    onClick={() => onVote(emp.id, emp.nominee_name)}
                    startIcon={<HowToVote />}
                    sx={{
                        bgcolor: hasVoted ? 'transparent' : '#00A8A8',
                        color: hasVoted ? '#94a3b8' : 'white',
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 'bold',
                        '&:hover': { bgcolor: '#008f8f' }
                    }}
                >
                    {hasVoted ? "Voted" : "Vote"}
                </Button>
            )}
 
            {/* 3. NOMINATE MODE */}
            {mode === "nominate" && onSelect && (
                <Button
                    variant="outlined"
                    onClick={() => onSelect(emp)}
                    startIcon={<EmojiEvents />}
                    sx={{
                        borderColor: '#00A8A8',
                        color: '#00A8A8',
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 'bold',
                        '&:hover': { bgcolor: '#e0f2f1', borderColor: '#008f8f' }
                    }}
                >
                    Nominate
                </Button>
            )}
 
            {/* 4. MANAGE TEAM MODE */}
            {mode === "manage" && (
                <div className="flex gap-1">
                    {onEdit && (
                        <Tooltip title="Edit Details">
                            <IconButton onClick={() => onEdit(emp)} size="small" className="hover:bg-teal-50 text-gray-400 hover:text-teal-600">
                                <Edit fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                    {onRemove && (
                        <Tooltip title="Remove Member">
                            <IconButton onClick={() => onRemove(emp)} size="small" className="hover:bg-red-50 text-gray-400 hover:text-red-500">
                                <Delete fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                </div>
            )}
 
          </div>
        </div>
      ))}
    </div>
  );
};
 
export default EmployeeTable;
 