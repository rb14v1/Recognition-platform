import { useState } from "react";
import { TextField, Button, Card, CardContent, IconButton, InputAdornment } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../utils/errorHandler"; // 👈 Reuse this!
import toast from 'react-hot-toast';

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth(); // Context handles the API call & Token storage

  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async () => {
    if (!form.username || !form.password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Logging in...");

    try {
      await login(form);
      toast.success("Welcome back!", { id: toastId });
      // Navigation is automatic via AuthContext logic, or you can do it here:
      // navigate("/dashboard");
    } catch (err: unknown) {
      // ⚡️ PRO MOVE: Use the utility. No more if/else spaghetti here.
      const msg = getErrorMessage(err);
      toast.error(msg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full"> {/* Layout wrapper handles bg/header */}
        <Card sx={{ width: 400, borderRadius: "20px", paddingY: 2, paddingX: 3, boxShadow: "0px 12px 30px rgba(0,0,0,0.12)", border: "1px solid #00D1C9", background: "white" }}>
          <CardContent>
            <h2 className="text-3xl font-bold text-center text-gray-800">Login</h2>
            <p className="text-center text-gray-500 text-sm mb-6">Please sign in to continue</p>

            <TextField
              fullWidth placeholder="Username" name="username"
              value={form.username} onChange={handleChange}
              sx={{ mb: 3 }}
            />

            <TextField
              fullWidth placeholder="Password"
              type={showPassword ? "text" : "password"}
              name="password" value={form.password} onChange={handleChange}
              sx={{ mb: 1 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              fullWidth variant="contained" onClick={handleLogin} disabled={loading}
              sx={{ py: 1.2, mt: 3, borderRadius: "30px", backgroundColor: "#00A8A8" }}
            >
              {loading ? "Checking..." : "Login"}
            </Button>

            <p className="text-center text-gray-600 text-sm mt-4">
              Don’t have an account?{" "}
              <span className="text-teal-600 cursor-pointer hover:underline" onClick={() => navigate("/register")}>
                Click here
              </span>
            </p>
          </CardContent>
        </Card>
    </div>
  );
}

export default Login;