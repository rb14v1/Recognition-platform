import { useState } from "react";
import { TextField, Button, Card, CardContent, IconButton, InputAdornment, Typography } from "@mui/material";
import { Visibility, VisibilityOff, Login as LoginIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../utils/errorHandler";
import toast from 'react-hot-toast';

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.username || !form.password) {
      toast.error("Please fill in both username and password");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Authenticating...");

    try {
      await login(form);
      toast.success("Welcome back!", { id: toastId });
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      toast.error(msg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-4">
        <Card sx={{ 
            width: "100%", 
            maxWidth: 450, 
            borderRadius: "24px", 
            boxShadow: "0px 10px 40px rgba(0,0,0,0.08)", 
            padding: 4 
        }}>
          <CardContent>
            {/* Wrapped the content in a <form> and attached onSubmit */}
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <div className="text-center mb-6">
                   <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Welcome Back</h1>
                   <p className="text-gray-500 text-sm mt-2">Enter your credentials to access the portal</p>
                </div>

                <TextField
                  fullWidth 
                  label="Username" 
                  name="username"
                  variant="outlined"
                  value={form.username} 
                  onChange={handleChange}
                  sx={{ 
                      "& .MuiOutlinedInput-root": { borderRadius: "12px" },
                      "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#00A8A8" },
                      "& .MuiInputLabel-root.Mui-focused": { color: "#00A8A8" }
                  }}
                />

                <TextField
                  fullWidth 
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  name="password" 
                  variant="outlined"
                  value={form.password} 
                  onChange={handleChange}
                  sx={{ 
                      "& .MuiOutlinedInput-root": { borderRadius: "12px" },
                      "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#00A8A8" },
                      "& .MuiInputLabel-root.Mui-focused": { color: "#00A8A8" },
                      "& input::-ms-reveal, & input::-ms-clear": { display: "none" }
                  }}
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
                  type="submit" 
                  variant="contained" 
                  disabled={loading}
                  endIcon={!loading && <LoginIcon />}
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
                  {loading ? "Logging in..." : "Log In"}
                </Button>

                <div className="text-center mt-4">
                    <Typography variant="body2" color="textSecondary">
                        Don’t have an account?{" "}
                        <span 
                            className="text-[#00A8A8] font-semibold cursor-pointer hover:underline" 
                            onClick={() => navigate("/register")}
                        >
                            Create Account
                        </span>
                    </Typography>
                </div>
            </form>
          </CardContent>
        </Card>
    </div>
  );
}

export default Login;