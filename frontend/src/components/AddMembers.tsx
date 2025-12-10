import { useState, useEffect, useMemo } from "react";
import { 
  Typography, Button, Box, CircularProgress, Avatar, Checkbox, Chip
} from "@mui/material";
import { PersonAdd } from "@mui/icons-material";
import { authAPI } from "../api/auth";
import toast from 'react-hot-toast';
import SearchBar from "../components/SearchBar"; 
import PaginationControl from "../components/PaginationControl"; // 🔥 IMPORT

const ITEMS_PER_PAGE = 8; // Adjust items per page

const AddMembers = () => {
  // Data State
  const [fullList, setFullList] = useState<any[]>([]); 
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  // Pagination State
  const [page, setPage] = useState(1); // 🔥 Page State

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<'name' | 'empId'>('name');
  const [filters, setFilters] = useState({
    dept: "All",
    role: "All",
    location: "All"
  });

  useEffect(() => { 
      loadUnassignedEmployees(); 
  }, []);

  const loadUnassignedEmployees = async () => {
    setLoading(true);
    try {
        const res = await authAPI.searchUnassigned("", {}); 
        setFullList(res.data);
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
        toast.success(`Successfully added ${selectedIds.length} members!`);
        setSelectedIds([]);
        loadUnassignedEmployees(); 
    } catch(e) { 
        toast.error("Failed to add members"); 
    }
  };

  const toggleSelection = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const departments = useMemo(() => ["All", ...Array.from(new Set(fullList.map(e => e.employee_dept).filter(Boolean)))], [fullList]);
  const roles = useMemo(() => ["All", ...Array.from(new Set(fullList.map(e => e.employee_role).filter(Boolean)))], [fullList]);
  const locations = useMemo(() => ["All", ...Array.from(new Set(fullList.map(e => e.location).filter(Boolean)))], [fullList]);

  // 🔥 Reset page on filter change
  useEffect(() => { setPage(1); }, [searchTerm, searchType, filters]);

  const filteredList = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return fullList.filter((emp) => {
      const username = emp.username?.toLowerCase() || "";
      const empId = emp.employee_id?.toLowerCase() || "";
      const matchesSearch = searchType === "name" ? username.includes(q) : empId.includes(q);
      const matchesDept = filters.dept === "All" || emp.employee_dept === filters.dept;
      const matchesRole = filters.role === "All" || emp.employee_role === filters.role;
      const matchesLoc = filters.location === "All" || emp.location === filters.location;
      return matchesSearch && matchesDept && matchesRole && matchesLoc;
    });
  }, [fullList, searchTerm, searchType, filters]);

  // 🔥 Pagination Logic
  const paginatedList = useMemo(() => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    return filteredList.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredList, page]);

  const totalPages = Math.ceil(filteredList.length / ITEMS_PER_PAGE);

  return (
    <div className="animate-fadeIn max-w-7xl mx-auto pb-32 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 gap-4 border-b border-gray-100 pb-4">
        <div>
            <Typography variant="h5" fontWeight="bold" className="text-gray-800 flex items-center gap-2">
                <PersonAdd className="text-teal-600" fontSize="large"/> Add Team Members
            </Typography>
            <Typography variant="body1" className="text-gray-500 mt-1">
                Find unassigned employees and claim them for your team.
            </Typography>
        </div>
      </div>

      <SearchBar 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchType={searchType}
        onSearchTypeChange={setSearchType}
        filters={filters}
        onFilterChange={(key, val) => setFilters(prev => ({ ...prev, [key]: val }))}
        options={{ departments, roles, locations }}
      />

      {loading ? (
          <div className="flex justify-center p-10"><CircularProgress sx={{ color: '#00A8A8' }} /></div>
      ) : (
        <div className="flex flex-col gap-3">
            
            {/* 🔥 NEW: HEADER ROW */}
            <div className="hidden md:flex items-center px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider bg-transparent">
                <div className="w-1/4 pl-2">Employee Details</div>
                <div className="flex items-center justify-between w-full md:flex-1 gap-4">
                    <div className="w-20 hidden md:block">ID</div>
                    <div className="flex-1">Job Title</div>
                    <div className="w-32">Department</div>
                    <div className="pl-4 border-l border-transparent text-right w-16">Select</div>
                </div>
            </div>

            {/* List Rows */}
            {paginatedList.map(emp => {
                const isSelected = selectedIds.includes(emp.id);
                return (
                    <div 
                        key={emp.id} 
                        onClick={() => toggleSelection(emp.id)} 
                        className={`group flex flex-col md:flex-row items-center p-4 rounded-xl border transition-all duration-200 cursor-pointer
                            ${isSelected ? 'bg-teal-50 border-teal-500 shadow-md' : 'bg-white border-gray-200 hover:shadow-md hover:border-teal-300'}
                        `}
                    >
                        <div className="flex items-center gap-4 w-full md:w-1/4 mb-2 md:mb-0">
                            <Avatar sx={{ width: 48, height: 48, bgcolor: isSelected ? '#00A8A8' : '#e0f2f1', color: isSelected ? 'white' : '#00695c', fontWeight: 'bold' }}>
                                {emp.username?.charAt(0).toUpperCase()}
                            </Avatar>
                            <div>
                                <Typography fontWeight="bold" className="text-gray-900 leading-tight">{emp.username}</Typography>
                            </div>
                        </div>

                        <div className="flex items-center justify-between w-full md:flex-1 gap-4">
                            <div className="w-20 text-sm text-gray-500 font-mono hidden md:block">{emp.employee_id}</div>
                            <div className="flex-1 text-sm font-medium text-gray-700">{emp.employee_role || <span className="text-gray-400 italic">No Title</span>}</div>
                            <div className="w-32"><Chip label={emp.employee_dept || "General"} size="small" sx={{ bgcolor: '#f3f4f6', color: '#4b5563', fontWeight: 600, borderRadius: '6px' }} /></div>
                            <div className="pl-4 border-l border-gray-100">
                                <Checkbox checked={isSelected} sx={{ color: '#cbd5e1', '&.Mui-checked': { color: '#00A8A8' } }} />
                            </div>
                        </div>
                    </div>
                );
            })}

            {filteredList.length === 0 && (
                <div className="text-center py-12 border border-dashed rounded-xl bg-gray-50 text-gray-500">
                    <Typography>No employees found.</Typography>
                </div>
            )}

            {/* 🔥 PAGINATION */}
            <PaginationControl count={totalPages} page={page} onChange={(_, v) => setPage(v)} />
        </div>
      )}

      {/* Floating Action Bar (Unchanged) */}
      {selectedIds.length > 0 && (
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 animate-bounceIn">
              <Box className="bg-gray-900 text-white pl-6 pr-2 py-2 rounded-full shadow-2xl flex items-center gap-6 border border-gray-700 backdrop-blur-md bg-opacity-95">
                  <div className="flex flex-col"><Typography fontWeight="bold" variant="body1">{selectedIds.length} Selected</Typography><Typography variant="caption" className="text-gray-400">Ready to assign</Typography></div>
                  <div className="h-8 w-[1px] bg-gray-700"></div>
                  <Button variant="contained" onClick={handleAddMembers} startIcon={<PersonAdd />} sx={{ bgcolor: '#00A8A8', color: 'white', '&:hover': { bgcolor: '#008f8f' }, borderRadius: 10, px: 4, py: 1, textTransform: 'none', fontWeight: 'bold' }}>Add to Team</Button>
              </Box>
          </div>
      )}
    </div>
  );
};

export default AddMembers;