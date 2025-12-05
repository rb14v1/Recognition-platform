import { useState } from "react";
import { TextField, Button, Card, CardContent, IconButton, InputAdornment, Typography } from "@mui/material";
import { Visibility, VisibilityOff, PersonAdd } from "@mui/icons-material";
import { authAPI } from "../api/auth";
import { useNavigate } from "react-router-dom";
import toast from 'react-hot-toast';

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    employee_id: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async () => {
    setLoading(true);
    const toastId = toast.loading("Creating account...");

    try {
      await authAPI.register(form);
      toast.success("Registration successful!", { id: toastId });
      setTimeout(() => navigate("/login"), 1000);
    } catch (err: any) {
      // Handle Django error format
      const data = err.response?.data;
      const firstError = typeof data === 'object' ? Object.values(data)[0] : "Registration failed";
      const msg = Array.isArray(firstError) ? firstError[0] : String(firstError);
      
      toast.error(msg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const inputStyles = {
    "& .MuiOutlinedInput-root": { borderRadius: "12px" },
    "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#00A8A8" },
    "& .MuiInputLabel-root.Mui-focused": { color: "#00A8A8" }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-10 px-4">
        <Card sx={{ 
            width: "100%", 
            maxWidth: 500, 
            borderRadius: "24px", 
            boxShadow: "0px 10px 40px rgba(0,0,0,0.08)", 
            padding: 3 
        }}>
          <CardContent className="flex flex-col gap-4">
            <div className="text-center mb-4">
               <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Create Account</h1>
               <p className="text-gray-500 text-sm mt-2">Join the recognition platform</p>
            </div>

            <TextField fullWidth label="Username" name="username" value={form.username} onChange={handleChange} sx={inputStyles} />
            <TextField fullWidth label="Email Address" name="email" value={form.email} onChange={handleChange} sx={inputStyles} />
            <TextField fullWidth label="Employee ID" name="employee_id" value={form.employee_id} onChange={handleChange} sx={inputStyles} helperText="Enter your official organizational ID" />
            
            <TextField
              fullWidth label="Password" type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={handleChange} sx={inputStyles}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              fullWidth 
              variant="contained" 
              onClick={handleRegister} 
              disabled={loading}
              endIcon={!loading && <PersonAdd />}
              sx={{ 
                  py: 1.5, 
                  mt: 2, 
                  borderRadius: "12px", 
                  backgroundColor: "#00A8A8", 
                  fontWeight: 600,
                  textTransform: "none",
                  fontSize: "1rem",
                  "&:hover": { backgroundColor: "#008f8f" }
              }}
            >
              {loading ? "Registering..." : "Register"}
            </Button>

            <div className="text-center mt-4">
                <Typography variant="body2" color="textSecondary">
                    Already have an account?{" "}
                    <span 
                        className="text-[#00A8A8] font-semibold cursor-pointer hover:underline" 
                        onClick={() => navigate("/login")}
                    >
                        Login here
                    </span>
                </Typography>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}

export default Register;