import { useState } from "react";
import { TextField, Button, Card, CardContent, IconButton, InputAdornment } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { authAPI } from "../api/auth"; // Import the new API service
import { useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    employee_id: "", // Matches Django model field
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async () => {
    try {
      await authAPI.register(form);
      setSuccess("Registration successful! Redirecting...");
      setError("");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err: any) {
      // Django returns errors as objects { field: ["error"] }
      // This helper prints the first error found
      const data = err.response?.data;
      const firstError = typeof data === 'object' ? Object.values(data)[0] : "Registration failed";
      setError(Array.isArray(firstError) ? firstError[0] : String(firstError));
      setSuccess("");
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#f3f6f9]">
      <Header />
      <div className="flex-grow flex items-center justify-center mt-14">
        <Card sx={{ width: 420, borderRadius: "20px", paddingY: 2, paddingX: 3, boxShadow: "0px 12px 30px rgba(0,0,0,0.12)", border: "1px solid #00D1C9", background: "white" }}>
          <CardContent>
            <h2 className="text-3xl font-bold text-center text-gray-800">Register</h2>
            
            {/* Username */}
            <TextField fullWidth variant="outlined" placeholder="Username" name="username" value={form.username} onChange={handleChange} sx={{ mb: 3, "& .MuiOutlinedInput-root": { borderRadius: "30px", height: "48px" } }} />
            
            {/* Email */}
            <TextField fullWidth variant="outlined" placeholder="Email" name="email" value={form.email} onChange={handleChange} sx={{ mb: 3, "& .MuiOutlinedInput-root": { borderRadius: "30px", height: "48px" } }} />
            
            {/* Employee ID - NOTE NAME CHANGE */}
            <TextField fullWidth variant="outlined" placeholder="Employee ID" name="employee_id" value={form.employee_id} onChange={handleChange} sx={{ mb: 3, "& .MuiOutlinedInput-root": { borderRadius: "30px", height: "48px" } }} />
            
            {/* Password */}
            <TextField fullWidth variant="outlined" placeholder="Password" type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={handleChange} sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: "30px", height: "48px" } }} InputProps={{ endAdornment: (<InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)}>{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>) }} />

            {error && <p className="text-red-500 text-sm text-center mb-2">{error}</p>}
            {success && <p className="text-green-600 text-sm text-center mb-2">{success}</p>}

            <Button fullWidth variant="contained" onClick={handleRegister} sx={{ py: 1.2, mt: 2, fontSize: "16px", borderRadius: "30px", textTransform: "none", backgroundColor: "#00A8A8", "&:hover": { backgroundColor: "#009292" } }}>Register</Button>

            <p className="text-center text-gray-600 text-sm mt-4">Already have an account? <span className="text-teal-600 cursor-pointer hover:underline" onClick={() => navigate("/login")}>Login here</span></p>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}

export default Register;