import { Card, CardContent, Avatar, Typography, Chip, Button } from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";

interface EmployeeCardProps {
  emp: any;
  isSelected?: boolean;
  onClick?: () => void;
  onEdit?: (e: React.MouseEvent) => void;
  onRemove?: (e: React.MouseEvent) => void;
}

const EmployeeCard = ({ emp, isSelected = false, onClick, onEdit, onRemove }: EmployeeCardProps) => {
  if (!emp) return null;

  return (
    <Card 
        onClick={onClick}
        className={`relative transition-all border group h-full flex flex-col justify-between
            ${isSelected 
              ? "w-full max-w-md border-teal-500 ring-2 ring-teal-50 shadow-xl cursor-default bg-white" 
              : "hover:shadow-lg cursor-pointer border-gray-100 bg-white"
            }
        `}
        sx={{ borderRadius: 3, overflow: 'visible' }}
    >
        <CardContent className="p-5">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                 <div className="flex items-center gap-3">
                    <Avatar 
                        sx={{ 
                            width: 56, height: 56, 
                            bgcolor: isSelected ? '#00A8A8' : '#f1f5f9', 
                            color: isSelected ? 'white' : '#475569', fontWeight: 'bold' 
                        }}
                    >
                        {emp.username?.charAt(0).toUpperCase()}
                    </Avatar>
                    <div>
                        <Typography variant="h6" fontWeight="bold" className="text-gray-900 leading-tight">
                            {emp.username}
                        </Typography>
                        <Chip 
                            label={emp.employee_role || emp.role || "Employee"} 
                            size="small" 
                            className="mt-1"
                            sx={{ height: 20, fontSize: '0.65rem', bgcolor: '#e2e8f0', color: '#475569', fontWeight: 700 }} 
                        />
                    </div>
                 </div>
                 {isSelected && <Chip label="Selected" sx={{ bgcolor: "#e0f2f1", color: "#00695c", fontWeight: "bold" }} size="small" />}
            </div>

            {/* Info Grid */}
            <div className="space-y-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <div className="flex justify-between border-b border-gray-200 pb-1">
                    <span className="text-xs text-gray-400 font-bold uppercase">ID</span>
                    <span className="font-medium text-gray-800">{emp.employee_id || "N/A"}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-1">
                    <span className="text-xs text-gray-400 font-bold uppercase">Job Title</span>
                    <span className="font-medium text-gray-800">{emp.employee_role || "N/A"}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-1">
                    <span className="text-xs text-gray-400 font-bold uppercase">Department</span>
                    <span className="font-medium text-gray-800">{emp.employee_dept || "General"}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-xs text-gray-400 font-bold uppercase">Manager</span>
                    <span className="font-medium text-gray-800">{emp.manager_name || "-"}</span>
                </div>
            </div>

            {/* Buttons - Now clearly visible */}
            {isSelected && onEdit && onRemove && (
                <div className="flex gap-3 mt-5 pt-2 border-t border-gray-100 animate-fadeIn">
                    <Button 
                        fullWidth 
                        variant="outlined" 
                        startIcon={<Edit />} 
                        onClick={onEdit} 
                        sx={{ 
                            borderRadius: 2, 
                            textTransform: 'none', 
                            color: '#00A8A8', 
                            borderColor: '#00A8A8',
                            fontWeight: 600,
                            "&:hover": { backgroundColor: "#e0f2f1", borderColor: "#008f8f" }
                        }}
                    >
                        Edit Reason
                    </Button>
                    <Button 
                        fullWidth 
                        variant="outlined" 
                        color="error" 
                        startIcon={<Delete />} 
                        onClick={onRemove} 
                        sx={{ 
                            borderRadius: 2, 
                            textTransform: 'none',
                            fontWeight: 600,
                            "&:hover": { backgroundColor: "#fee2e2" }
                        }}
                    >
                        Remove
                    </Button>
                </div>
            )}
        </CardContent>
    </Card>
  );
};

export default EmployeeCard;