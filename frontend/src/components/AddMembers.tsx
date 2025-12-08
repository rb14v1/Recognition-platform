import { useState, useEffect } from "react";
import { 
  Typography, 
  Button, 
  TextField, 
  Checkbox, 
  ToggleButton, 
  ToggleButtonGroup,
  Box,
  CircularProgress
} from "@mui/material";
import { Search, PersonAdd, SentimentDissatisfied } from "@mui/icons-material";
import { authAPI } from "../api/auth";
import toast from 'react-hot-toast';
import EmployeeCard from "./EmployeeCard";

interface AddMembersProps {
    onBack?: () => void; 
}

const AddMembers = ({ }: AddMembersProps) => {
  const [unassignedList, setUnassignedList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<'name' | 'id'>('name');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  // Load initial list on mount
  useEffect(() => { 
      handleSearch(); 
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    try {
        const res = await authAPI.searchUnassigned(searchQuery, searchType);
        setUnassignedList(res.data);
    } catch(e) { 
        console.error(e);
        toast.error("Failed to fetch employees"); 
    } finally {
        setLoading(false);
    }
  };

  const handleAddMembers = async () => {
    if(selectedIds.length === 0) return;
    try {
        await authAPI.linkEmployeesToTeam(selectedIds);
        toast.success(`Successfully added ${selectedIds.length} members to your team!`);
        setSelectedIds([]);
        handleSearch(); // Refresh list to remove added users
    } catch(e) { 
        toast.error("Failed to add members"); 
    }
  };

  const toggleSelection = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <div className="animate-fadeIn max-w-7xl mx-auto pb-24">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 border-b border-gray-100 pb-4">
        <div>
            <Typography variant="h5" fontWeight="bold" className="text-gray-800 flex items-center gap-2">
                <PersonAdd className="text-teal-600" fontSize="large"/> Add Team Members
            </Typography>
            <Typography variant="body1" className="text-gray-500 mt-1">
                Find unassigned employees and claim them for your team.
            </Typography>
        </div>
      </div>

      {/* 2. Search Bar & Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row gap-4 items-center">
         <ToggleButtonGroup
            value={searchType}
            exclusive
            onChange={(_, v) => v && setSearchType(v)}
            size="small"
            sx={{ height: 40 }}
        >
            <ToggleButton value="name" className="px-4 font-bold">Name</ToggleButton>
            <ToggleButton value="id" className="px-4 font-bold">Emp ID</ToggleButton>
        </ToggleButtonGroup>

        <div className="flex-1 w-full relative">
            <TextField 
                fullWidth 
                size="small" 
                placeholder={`Search unassigned employees by ${searchType === 'name' ? 'Name' : 'ID'}...`} 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                sx={{ 
                    '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#f8fafc' } 
                }}
            />
        </div>
        
        <Button 
            variant="contained" 
            onClick={handleSearch} 
            sx={{ 
                bgcolor: '#00A8A8', 
                borderRadius: 3, 
                px: 4, 
                height: 40,
                boxShadow: 'none',
                '&:hover': { bgcolor: '#008f8f', boxShadow: '0 4px 12px rgba(0,168,168,0.3)' } 
            }}
        >
            <Search className="mr-2"/> Search
        </Button>
      </div>

      {/* 3. Results Grid */}
      {loading ? (
          <div className="flex justify-center p-10"><CircularProgress sx={{ color: '#00A8A8' }} /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {unassignedList.map(emp => (
                <div key={emp.id} onClick={() => toggleSelection(emp.id)} className="relative cursor-pointer group h-full">
                    {/* Visual Selection Overlay */}
                    <div className={`absolute inset-0 border-2 rounded-xl z-10 transition-all pointer-events-none duration-200
                        ${selectedIds.includes(emp.id) 
                            ? 'border-teal-500 bg-teal-50/10 shadow-lg scale-[1.02]' 
                            : 'border-transparent group-hover:border-gray-200'
                        }`} 
                    />
                    
                    {/* Checkbox Badge */}
                    <div className="absolute top-3 right-3 z-20">
                        <Checkbox 
                            checked={selectedIds.includes(emp.id)} 
                            icon={<div className="w-6 h-6 rounded-full border-2 border-gray-300 bg-white" />}
                            checkedIcon={<div className="w-6 h-6 rounded-full bg-teal-500 border-2 border-teal-500 flex items-center justify-center"><div className="w-2 h-2 bg-white rounded-full"/></div>}
                        />
                    </div>
                    
                    {/* Reusing Employee Card */}
                    <EmployeeCard emp={emp} isSelected={selectedIds.includes(emp.id)} />
                </div>
            ))}
        </div>
      )}

      {/* 4. Empty State */}
      {!loading && unassignedList.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
            <SentimentDissatisfied sx={{ fontSize: 60, opacity: 0.2, mb: 2 }} />
            <Typography variant="h6" className="font-medium text-gray-400">No unassigned employees found.</Typography>
            <Typography variant="body2" className="text-gray-400">Try searching for a different name or ID.</Typography>
        </div>
      )}

      {/* 5. Floating Action Bar (Only shows when items are selected) */}
      {selectedIds.length > 0 && (
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 animate-bounceIn">
              <Box className="bg-gray-900 text-white pl-6 pr-2 py-2 rounded-full shadow-2xl flex items-center gap-6 border border-gray-700 backdrop-blur-md bg-opacity-95">
                  <div className="flex flex-col">
                    <Typography fontWeight="bold" variant="body1">{selectedIds.length} Users Selected</Typography>
                    <Typography variant="caption" className="text-gray-400">Ready to assign</Typography>
                  </div>
                  
                  <div className="h-8 w-[1px] bg-gray-700"></div>
                  
                  <Button 
                    variant="contained" 
                    onClick={handleAddMembers}
                    startIcon={<PersonAdd />}
                    sx={{ 
                        bgcolor: '#00A8A8', 
                        color: 'white',
                        '&:hover': { bgcolor: '#008f8f' }, 
                        borderRadius: 10, 
                        px: 4,
                        py: 1,
                        textTransform: 'none',
                        fontWeight: 'bold',
                        fontSize: '1rem'
                    }}
                  >
                    Add to Team
                  </Button>
              </Box>
          </div>
      )}
    </div>
  );
};

export default AddMembers;