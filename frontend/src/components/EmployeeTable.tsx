import { Avatar, Typography, Button, IconButton, Tooltip, Chip } from "@mui/material";
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
    <div className="w-full">
      
      {/* --- TABLE HEADER (Visible only on Desktop) --- */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border border-gray-200 rounded-t-xl text-xs font-bold text-gray-500 uppercase tracking-wider">
        <div className="col-span-5">Employee Details</div>
        <div className="col-span-3">Job Title</div>
        <div className="col-span-2">Department</div>
        <div className="col-span-2 text-right">Action</div>
      </div>

      {/* --- TABLE BODY --- */}
      <div className="flex flex-col gap-3 md:gap-0">
        {employees.map((emp) => (
          <div
            key={emp.id}
            className="group relative grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 bg-white border border-gray-100 md:border-t-0 md:first:border-t md:border-x md:last:rounded-b-xl rounded-xl md:rounded-none shadow-sm md:shadow-none hover:bg-teal-50/30 transition-all duration-200"
          >
            
            {/* 1. IDENTITY COLUMN */}
            <div className="col-span-5 flex items-center gap-4">
              <Avatar
                sx={{
                  width: 40, height: 40,
                  bgcolor: '#00A8A8',
                  fontWeight: 'bold', fontSize: '1rem'
                }}
              >
                {(emp.username || emp.nominee_name)?.charAt(0).toUpperCase()}
              </Avatar>
              <div>
                <Typography variant="subtitle2" fontWeight="bold" className="text-gray-900 leading-tight">
                  {emp.username || emp.nominee_name}
                </Typography>
                <Typography variant="caption" className="text-gray-400 font-mono">
                  ID: {emp.employee_id || "N/A"}
                </Typography>
              </div>
            </div>

            {/* 2. JOB TITLE COLUMN */}
            <div className="col-span-3">
              {/* Label for Mobile only */}
              <span className="md:hidden text-[0.65rem] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Job Title
              </span>
              <Typography variant="body2" className="text-gray-700 font-medium truncate">
                {emp.employee_role || emp.nominee_role || <span className="text-gray-400 italic">Not Assigned</span>}
              </Typography>
            </div>

            {/* 3. DEPARTMENT COLUMN */}
            <div className="col-span-2">
              {/* Label for Mobile only */}
              <span className="md:hidden text-[0.65rem] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Department
              </span>
              <Chip 
                label={emp.employee_dept || emp.nominee_dept || "General"}
                size="small"
                sx={{ 
                    bgcolor: '#f3f4f6', 
                    color: '#4b5563', 
                    fontWeight: 600, 
                    fontSize: '0.75rem',
                    height: '24px',
                    borderRadius: '6px'
                }}
              />
            </div>

            {/* 4. ACTIONS COLUMN */}
            <div className="col-span-2 flex justify-end items-center gap-2">
              
              {/* Promote Mode */}
              {mode === "promote" && onPromote && (
                <Button
                  variant="contained"
                  onClick={() => onPromote(emp)}
                  startIcon={<School />}
                  size="small"
                  sx={{
                    bgcolor: '#00A8A8',
                    textTransform: 'none',
                    fontWeight: 'bold',
                    '&:hover': { bgcolor: '#008f8f' }
                  }}
                >
                  Promote
                </Button>
              )}

              {/* Vote Mode */}
              {mode === "vote" && onVote && (
                <Button
                  variant={hasVoted ? "outlined" : "contained"}
                  disabled={hasVoted}
                  onClick={() => onVote(emp.id, emp.nominee_name)}
                  startIcon={<HowToVote />}
                  size="small"
                  sx={{
                    bgcolor: hasVoted ? 'transparent' : '#00A8A8',
                    color: hasVoted ? '#94a3b8' : 'white',
                    borderColor: hasVoted ? '#cbd5e1' : 'transparent',
                    textTransform: 'none',
                    fontWeight: 'bold',
                    '&:hover': { bgcolor: hasVoted ? 'transparent' : '#008f8f' }
                  }}
                >
                  {hasVoted ? "Voted" : "Vote"}
                </Button>
              )}

              {/* Nominate Mode */}
              {mode === "nominate" && onSelect && (
                <Button
                  variant="outlined"
                  onClick={() => onSelect(emp)}
                  startIcon={<EmojiEvents />}
                  size="small"
                  sx={{
                    borderColor: '#00A8A8',
                    color: '#00A8A8',
                    textTransform: 'none',
                    fontWeight: 'bold',
                    '&:hover': { bgcolor: '#e0f2f1', borderColor: '#008f8f' }
                  }}
                >
                  Nominate
                </Button>
              )}

              {/* Manage Mode */}
              {mode === "manage" && (
                <div className="flex gap-1">
                  {onEdit && (
                    <Tooltip title="Edit Details">
                      <IconButton 
                        onClick={() => onEdit(emp)} 
                        size="small" 
                        className="hover:bg-teal-50 text-gray-400 hover:text-teal-600 transition-colors"
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {onRemove && (
                    <Tooltip title="Remove Member">
                      <IconButton 
                        onClick={() => onRemove(emp)} 
                        size="small" 
                        className="hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      >
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
    </div>
  );
};

export default EmployeeTable;