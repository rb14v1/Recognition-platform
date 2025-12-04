// src/pages/Nominate.tsx
import { useState } from "react";
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
} from "@mui/material";

// Mock employee data (We will replace this with your API next!)
const departments = [
  { id: "IT", name: "IT Department" },
  { id: "HR", name: "Human Resources" },
  { id: "SALES", name: "Sales Department" },
];

const rolesByDept: Record<string, string[]> = {
  IT: ["Developer", "Tester", "Team Lead"],
  HR: ["HR Executive", "HR Manager"],
  SALES: ["Sales Executive", "Sales Manager"],
};

const employees = [
  { id: 1, name: "Ramya", dept: "IT", role: "Developer" },
  { id: 2, name: "Pavan", dept: "IT", role: "Tester" },
  { id: 3, name: "Kavya", dept: "HR", role: "HR Executive" },
  { id: 4, name: "Mahesh", dept: "SALES", role: "Sales Manager" },
];

const Nominate = () => {
  const [searchText, setSearchText] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [reason, setReason] = useState("");

  // Filter list based on search + dept + role
  const filteredEmployees = employees.filter((emp) => {
    const matchSearch = emp.name.toLowerCase().includes(searchText.toLowerCase());
    const matchDept = selectedDept ? emp.dept === selectedDept : true;
    const matchRole = selectedRole ? emp.role === selectedRole : true;
    return matchSearch && matchDept && matchRole;
  });

  return (
    <div className="flex flex-col items-center justify-start min-h-screen py-10 px-4">
      <Card sx={{ width: "100%", maxWidth: 600, borderRadius: "16px", boxShadow: 3 }}>
        <CardContent>

          <Typography variant="h5" fontWeight="bold" className="mb-4 text-gray-800">
            Nominate a Colleague
          </Typography>

          {/* SEARCH FIELD */}
          <TextField
            label="Search by name"
            fullWidth
            variant="outlined"
            size="small"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            sx={{ mb: 3 }}
          />

          {/* DEPARTMENT FILTER */}
          <FormControl fullWidth size="small" sx={{ mb: 3 }}>
            <InputLabel>Department</InputLabel>
            <Select
              value={selectedDept}
              label="Department"
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setSelectedRole(""); // reset role on dept change
              }}
            >
              <MenuItem value=""><em>All Departments</em></MenuItem>
              {departments.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* ROLE FILTER */}
          <FormControl fullWidth size="small" sx={{ mb: 3 }}>
            <InputLabel>Role</InputLabel>
            <Select
              value={selectedRole}
              label="Role"
              disabled={!selectedDept}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <MenuItem value=""><em>All Roles</em></MenuItem>
              {(rolesByDept[selectedDept] || []).map((role) => (
                <MenuItem key={role} value={role}>
                  {role}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* EMPLOYEE SELECT LIST */}
          <Typography variant="subtitle1" fontWeight="bold" className="mb-2">
            Select Employee:
          </Typography>

          <div className="border rounded-lg p-3 max-h-40 overflow-y-auto mb-4">
            {filteredEmployees.map((emp) => (
              <div
                key={emp.id}
                onClick={() => setSelectedEmployee(emp)}
                className={`p-2 rounded cursor-pointer mb-1 transition-colors
                  ${selectedEmployee?.id === emp.id ? "bg-teal-100 border border-teal-300" : "hover:bg-gray-100"}`}
              >
                <div className="font-semibold text-gray-800">{emp.name}</div>
                <div className="text-xs text-gray-600">{emp.role} — {emp.dept}</div>
              </div>
            ))}

            {filteredEmployees.length === 0 && (
              <p className="text-gray-500 text-sm italic text-center py-2">No matching employees found</p>
            )}
          </div>

          {/* REASON BOX (Display only when employee selected) */}
          {selectedEmployee && (
            <div className="mt-6 animate-fadeIn">
              <Typography className="mb-2 font-semibold text-sm">
                Reason for nominating <span className="text-teal-700 font-bold">{selectedEmployee.name}</span>:
              </Typography>

              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="Ex: For helping me debug the server issue on Friday night..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />

              <Button
                variant="contained"
                fullWidth
                sx={{
                  mt: 3,
                  py: 1.5,
                  backgroundColor: "#00A8A8",
                  borderRadius: "30px",
                  "&:hover": { backgroundColor: "#008f8f" }
                }}
                disabled={!reason.trim()}
                onClick={() => console.log("Submitting:", selectedEmployee, reason)}
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