// src/pages/Nominate.tsx
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Button,
  Collapse,
  IconButton,
  Divider,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import api from "../api/axiosInstance";

const API_BASE = import.meta.env.VITE_API_URL; // ✅ Use .env

const Nominate = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [searchText, setSearchText] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [reason, setReason] = useState("");
  const [showFilters, setShowFilters] = useState(false);

 const token = localStorage.getItem("accessToken");


  // ------------------------------
  // Fetch Employees from Backend
  // ------------------------------
  const fetchEmployees = async () => {
    try {
      const params = new URLSearchParams();

      if (searchText) params.append("search", searchText);
      if (selectedDept) params.append("dept", selectedDept);
      if (selectedRole) params.append("role", selectedRole);

      const response = await fetch(
        `${API_BASE}nominate/list/?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        console.error("API error:", response.status);
        return;
      }

      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [searchText, selectedDept, selectedRole]);

  // ------------------------------
  // Extract Dynamic Department List
  // ------------------------------
  const departmentList = [
    ...new Set(employees.map((emp) => emp.employee_dept)),
  ];

  // ------------------------------
  // Extract Dynamic Role List
  // ------------------------------
  const roleList =
    selectedDept.length > 0
      ? [
          ...new Set(
            employees
              .filter((emp) => emp.employee_dept === selectedDept)
              .map((emp) => emp.employee_role)
          ),
        ]
      : [];

  // ------------------------------
  // Submit Nomination
  // ------------------------------
  const submitNomination = async () => {
  if (!selectedEmployee || !reason.trim()) return;

  try {
    const response = await api.post("nominate/submit/", {
      nominee: selectedEmployee.id,
      reason: reason,
    });

    alert("Nomination submitted successfully!");
    setSelectedEmployee(null);
    setReason("");

  } catch (error: any) {
    console.error("Nomination Error:", error);
    alert(error.response?.data?.error || "Something went wrong");
  }
};


  return (
    <div className="flex flex-col items-center min-h-screen py-10 px-4">
      <Card
        sx={{
          width: "100%",
          maxWidth: 650,
          borderRadius: "18px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
        }}
      >
        <CardContent>
          {/* HEADER */}
          <div className="flex justify-between items-center mb-5">
            <Typography
              variant="h5"
              fontWeight="bold"
              className="text-gray-800"
            >
              Nominate a Colleague
            </Typography>

            {/* FILTER BUTTON */}
            <IconButton
              onClick={() => setShowFilters(!showFilters)}
              sx={{
                border: "1px solid #ccc",
                borderRadius: "10px",
                padding: "6px 10px",
              }}
            >
              <FilterListIcon />
              <span className="ml-2 text-sm font-medium">Filters</span>
            </IconButton>
          </div>

          {/* SEARCH BAR */}
          <TextField
            label="Search employee..."
            fullWidth
            variant="outlined"
            size="medium"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            sx={{ mb: 3 }}
          />

          {/* FILTER PANEL */}
          <Collapse in={showFilters}>
            <div className="bg-gray-50 p-4 rounded-lg border mb-3">

              {/* DEPARTMENT FILTER */}
              <FormControl fullWidth size="small" sx={{ mb: 3 }}>
                <InputLabel>Department</InputLabel>
                <Select
                  value={selectedDept}
                  label="Department"
                  onChange={(e) => {
                    setSelectedDept(e.target.value);
                    setSelectedRole("");
                  }}
                >
                  <MenuItem value="">
                    <em>All Departments</em>
                  </MenuItem>

                  {departmentList.map((dept) => (
                    <MenuItem key={dept} value={dept}>
                      {dept}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* ROLE FILTER */}
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Role</InputLabel>
                <Select
                  value={selectedRole}
                  label="Role"
                  disabled={!selectedDept}
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  <MenuItem value="">
                    <em>All Roles</em>
                  </MenuItem>

                  {roleList.map((role) => (
                    <MenuItem key={role} value={role}>
                      {role}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
          </Collapse>

          <Divider className="my-4" />

          {/* EMPLOYEE LIST */}
          <Typography variant="subtitle1" fontWeight="bold" className="mb-2">
            Select Employee:
          </Typography>

          <div className="border rounded-lg p-3 max-h-48 overflow-y-auto mb-4 bg-white">
            {employees.map((emp) => (
              <div
                key={emp.id}
                onClick={() => setSelectedEmployee(emp)}
                className={`p-3 rounded cursor-pointer mb-2 transition-all ${
                  selectedEmployee?.id === emp.id
                    ? "bg-teal-100 border border-teal-300 shadow-sm"
                    : "hover:bg-gray-100"
                }`}
              >
                <div className="font-semibold">{emp.username}</div>
                <div className="text-xs text-gray-600">
                  {emp.employee_role} — {emp.employee_dept}
                </div>
              </div>
            ))}

            {employees.length === 0 && (
              <p className="text-gray-500 text-sm italic text-center py-2">
                No matching employees
              </p>
            )}
          </div>

          {/* REASON FIELD */}
          {selectedEmployee && (
            <div className="mt-6">
              <Typography className="mb-2 font-semibold text-sm">
                Reason for nominating{" "}
                <span className="text-teal-700 font-bold">
                  {selectedEmployee.username}
                </span>
                :
              </Typography>

              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="Enter reason here..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />

              <Button
                variant="contained"
                fullWidth
                sx={{
                  mt: 3,
                  py: 1.6,
                  backgroundColor: "#008C8C",
                  borderRadius: "28px",
                  "&:hover": { backgroundColor: "#007373" },
                }}
                disabled={!reason.trim()}
                onClick={submitNomination}
              >
                Submit Nomination
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Nominate;
