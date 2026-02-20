import { Search } from "@mui/icons-material";
import { 
  TextField, 
  InputAdornment, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Paper
} from "@mui/material";
import type {SelectChangeEvent } from "@mui/material";
interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchType: "name" | "empId";
  onSearchTypeChange: (type: "name" | "empId") => void;
  filters: {
    dept: string;
    role: string;
    location: string;
  };
  onFilterChange: (key: "dept" | "role" | "location", value: string) => void;
  options: {
    departments: string[];
    roles: string[];
    locations: string[];
  };
}

const SearchBar = ({ 
  searchTerm, 
  onSearchChange, 
  searchType, 
  onSearchTypeChange, 
  filters, 
  onFilterChange, 
  options 
}: SearchBarProps) => {

  return (
    <div className="w-full flex justify-center mt-6 mb-6">
      <Paper 
        elevation={0}
        className="p-3 rounded-2xl border border-gray-200 w-full max-w-6xl flex flex-col lg:flex-row items-center gap-4 bg-white shadow-sm"
      >
        {/* --- LEFT GROUP: Toggle + Search --- */}
        <div className="flex flex-col sm:flex-row items-center gap-4 flex-1 w-full lg:w-auto">
          
          {/* Custom Toggle Switch */}
          <div className="flex bg-gray-100 rounded-full p-1 border border-gray-200 shrink-0 h-10 items-center">
            <button
              onClick={() => onSearchTypeChange("name")}
              className={`px-5 h-8 text-sm font-bold rounded-full transition-all duration-200 flex items-center justify-center ${
                searchType === "name" 
                  ? "bg-teal-600 text-white shadow-md" 
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Name
            </button>
            <button
              onClick={() => onSearchTypeChange("empId")}
              className={`px-5 h-8 text-sm font-bold rounded-full transition-all duration-200 flex items-center justify-center ${
                searchType === "empId" 
                  ? "bg-teal-600 text-white shadow-md" 
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Emp ID
            </button>
          </div>

          {/* Search Input */}
          <TextField
            fullWidth
            size="small"
            placeholder={searchType === "name" ? "Search by name..." : "Search by ID..."}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search className="text-gray-400" />
                </InputAdornment>
              ),
              sx: {
                borderRadius: "9999px",
                backgroundColor: "#f9fafb",
                height: "40px", 
                "& fieldset": { border: "1px solid #f3f4f6" },
                "&:hover fieldset": { borderColor: "#d1d5db" },
                "&.Mui-focused fieldset": { borderColor: "#00A8A8" },
                paddingLeft: 1
              },
            }}
          />
        </div>

        {/* --- RIGHT GROUP: Filters --- */}
        {/* Kept pt-2 to prevent label clipping */}
        <div className="flex gap-3 w-full lg:w-auto overflow-x-auto pb-2 pt-2 lg:pt-0 lg:overflow-visible scrollbar-hide px-1">
          <FilterDropdown 
            label="Practise" 
            value={filters.dept} 
            options={options.departments} 
            onChange={(val: string) => onFilterChange("dept", val)} 
          />
          <FilterDropdown 
            label="Job Role" 
            value={filters.role} 
            options={options.roles} 
            onChange={(val: string) => onFilterChange("role", val)} 
          />
          <FilterDropdown 
            label="Location" 
            value={filters.location} 
            options={options.locations} 
            onChange={(val: string) => onFilterChange("location", val)} 
          />
        </div>
      </Paper>
    </div>
  );
};

// --- Helper Component ---
interface FilterDropdownProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

const FilterDropdown = ({ label, value, options, onChange }: FilterDropdownProps) => {
  const handleChange = (event: SelectChangeEvent) => {
    onChange(event.target.value as string);
  };

  return (
    <FormControl size="small" className="min-w-[140px] w-full lg:w-auto">
      {/* INCREASED FONT SIZE: 0.95rem (was 0.85rem) */}
      <InputLabel sx={{ fontSize: '0.95rem', color: '#6b7280', bgcolor: 'white', px: 0.5 }}>{label}</InputLabel>
      <Select
        value={value}
        label={label}
        onChange={handleChange}
        sx={{ 
          borderRadius: 3,
          minWidth: 140,
          height: "40px",
          fontSize: '0.875rem',
          backgroundColor: 'white',
          "& .MuiOutlinedInput-notchedOutline": { borderColor: '#e5e7eb' },
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: '#d1d5db' },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: '#00A8A8' }
        }}
      >
        {options.map((opt: string) => (
          <MenuItem key={opt} value={opt} sx={{ fontSize: '0.875rem' }}>
            {opt}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default SearchBar;