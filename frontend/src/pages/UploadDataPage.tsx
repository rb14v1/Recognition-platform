import React, { useState, useRef } from "react";
import { 
  Button, 
  TextField, 
  Typography, 
  Box, 
  Grid,
  Alert,
  CircularProgress,
  MenuItem,
  Paper
} from "@mui/material";
import { 
  FileUpload, 
  CheckCircle, 
  Error as ErrorIcon,
  CloudUpload
} from "@mui/icons-material";

const UploadDataPage = () => {
  // --- STATE ---
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    employee_id: "",
    contract_type: "Permanent",
    location: "Bangalore",
    country: "India",
    practice: "",
    portfolio: "",
    line_manager_name: ""
  });

  const [uploadLoading, setUploadLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error" | ""; msg: string }>({ type: "", msg: "" });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- REUSABLE TEAL FOCUS STYLE ---
  const tealFocusStyle = {
    "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": { 
        borderColor: "#0d9488" 
    },
    "& .MuiInputLabel-root.Mui-focused": { 
        color: "#0d9488" 
    }
  };

  // --- HELPER: GET TOKEN SAFELY ---
  const getAuthToken = () => {
    // Check common key names
    const token = localStorage.getItem("access_token") || 
                  localStorage.getItem("access") || 
                  localStorage.getItem("token");
    
    if (!token) {
      console.error(" No token found in LocalStorage!");
    } else {
      console.log(" Token found:", token.substring(0, 10) + "...");
    }
    return token;
  };

  // --- HANDLERS ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const token = getAuthToken();
      if (!token) {
        setStatus({ type: "error", msg: "Authentication Error: Please Log In again." });
        return;
      }

      setUploadLoading(true);
      setStatus({ type: "", msg: "" });
      
      try {
        const response = await fetch("http://127.0.0.1:8000/api/admin/manage-users/", { 
          method: "POST",
          headers: { 
            "Authorization": `Bearer ${token}` 
          },
          body: formDataUpload,
        });

        // Handle 401 specifically
        if (response.status === 401) {
            throw new Error("Session Expired. Please Logout and Login again.");
        }

        const data = await response.json();
        
        if (response.ok) {
           setStatus({ type: "success", msg: `Bulk Upload Success: ${data.created} created, ${data.updated} updated.` });
        } else {
           setStatus({ type: "error", msg: data.error || "Upload failed" });
        }
      } catch (error: any) {
        setStatus({ type: "error", msg: error.message || "Server Error" });
      } finally {
        setUploadLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = ""; 
      }
    }
  };

  const handleManualSubmit = async () => {
    if (!formData.email || !formData.name) {
      setStatus({ type: "error", msg: "Name and Email are required." });
      return;
    }

    const token = getAuthToken();
    if (!token) {
        setStatus({ type: "error", msg: "Authentication Error: Please Log In again." });
        return;
    }

    setFormLoading(true);
    setStatus({ type: "", msg: "" });

    try {
      const response = await fetch("http://127.0.0.1:8000/api/admin/manage-users/", { 
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify(formData),
      });

      if (response.status === 401) {
        throw new Error("Session Expired. Please Logout and Login again.");
      }

      const data = await response.json();
      if (response.ok) {
        setStatus({ type: "success", msg: data.message });
        setFormData({ ...formData, name: "", email: "", employee_id: "" });
      } else {
        setStatus({ type: "error", msg: data.error || "Save failed" });
      }
    } catch (error: any) {
      setStatus({ type: "error", msg: error.message || "Network Error" });
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <Box className="w-full max-w-7xl mx-auto animate-fade-in p-6">
      
      {/* --- PAGE HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
            <Typography variant="h4" className="font-bold text-gray-800 tracking-tight">
                Data Management
            </Typography>
            <Typography variant="body1" className="text-gray-500 mt-1">
                Add employees manually or upload bulk data via Excel.
            </Typography>
        </div>

        {/* TOP RIGHT: UPLOAD EXCEL BUTTON */}
        <div>
            <input
              type="file"
              accept=".xlsx, .csv"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <Button
                variant="outlined"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadLoading}
                startIcon={uploadLoading ? <CircularProgress size={20}/> : <FileUpload />}
                sx={{ 
                    color: "#0d9488",
                    borderColor: "#0d9488",
                    '&:hover': { bgcolor: "#f0fdfa", borderColor: "#0f766e" },
                    textTransform: "none",
                    borderRadius: 3,
                    px: 3,
                    py: 1,
                    fontWeight: 600,
                    fontSize: "0.95rem"
                }}
            >
                {uploadLoading ? "Uploading..." : "Upload Excel File"}
            </Button>
        </div>
      </div>

      {/* --- STATUS MESSAGE --- */}
      {status.msg && (
        <Alert 
            severity={status.type === "success" ? "success" : "error"} 
            className="mb-6 rounded-xl shadow-sm border border-gray-100"
            icon={status.type === "success" ? <CheckCircle /> : <ErrorIcon />}
            onClose={() => setStatus({ type: "", msg: "" })}
        >
            {status.msg}
        </Alert>
      )}

      {/* --- MANUAL ENTRY FORM --- */}
      <Paper className="border border-gray-200 shadow-sm rounded-xl overflow-hidden bg-white mb-6">
        
        {/* Card Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <CloudUpload className="text-teal-600" />
            <Typography variant="h6" className="font-bold text-gray-700">
                Single Employee Entry
            </Typography>
        </div>

        {/* Card Content */}
        <div className="p-8">
            <Grid container spacing={4}>
                
                {/* SECTION 1: IDENTITY */}
                <Grid item xs={12}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                            <TextField fullWidth label="Full Name" name="name" 
                                value={formData.name} onChange={handleInputChange} 
                                variant="outlined" required size="small" 
                                sx={tealFocusStyle}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField fullWidth label="Work Email" name="email" 
                                value={formData.email} onChange={handleInputChange} 
                                variant="outlined" required size="small" 
                                sx={tealFocusStyle}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField fullWidth label="Employee ID" name="employee_id" 
                                value={formData.employee_id} onChange={handleInputChange} 
                                variant="outlined" placeholder="Auto-gen if empty" size="small" 
                                sx={tealFocusStyle}
                            />
                        </Grid>
                    </Grid>
                </Grid>

                {/* SECTION 2: JOB DETAILS */}
                <Grid item xs={12}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                            <TextField select fullWidth label="Contract Type" name="contract_type" 
                                value={formData.contract_type} onChange={handleInputChange} 
                                size="small" 
                                sx={tealFocusStyle}
                            >
                                <MenuItem value="Permanent">Permanent</MenuItem>
                                <MenuItem value="Intern">Intern</MenuItem>
                                <MenuItem value="Contract">Contract</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField fullWidth label="Practice / Dept" name="practice" 
                                value={formData.practice} onChange={handleInputChange} 
                                size="small" 
                                sx={tealFocusStyle}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField fullWidth label="Portfolio" name="portfolio" 
                                value={formData.portfolio} onChange={handleInputChange} 
                                size="small" 
                                sx={tealFocusStyle}
                            />
                        </Grid>
                    </Grid>
                </Grid>

                {/* SECTION 3: LOCATION & REPORTING */}
                <Grid item xs={12}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                            <TextField fullWidth label="Location" name="location" 
                                value={formData.location} onChange={handleInputChange} 
                                size="small" 
                                sx={tealFocusStyle}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField fullWidth label="Country" name="country" 
                                value={formData.country} onChange={handleInputChange} 
                                size="small" 
                                sx={tealFocusStyle}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField fullWidth label="Line Manager" name="line_manager_name" 
                                value={formData.line_manager_name} onChange={handleInputChange} 
                                size="small" 
                                sx={tealFocusStyle}
                            />
                        </Grid>
                    </Grid>
                </Grid>

            </Grid>
        </div>
      </Paper>

      {/* --- SUBMIT BUTTON --- */}
      <div className="flex justify-end">
        <Button 
            variant="contained" 
            onClick={handleManualSubmit}
            disabled={formLoading}
            size="large"
            sx={{ 
                bgcolor: "#0d9488", 
                '&:hover': { bgcolor: "#0f766e" },
                px: 6, py: 1.5, borderRadius: 3,
                textTransform: "none", fontSize: "1rem", fontWeight: "bold",
                boxShadow: "0 4px 6px -1px rgba(13, 148, 136, 0.2)"
            }}
        >
            {formLoading ? <CircularProgress size={24} color="inherit"/> : "Add / Update Employee"}
        </Button>
      </div>

    </Box>
  );
};

export default UploadDataPage;