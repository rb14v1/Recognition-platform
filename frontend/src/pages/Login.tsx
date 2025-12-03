import { useState } from "react";
import {
  TextField,
  Button,
  Card,
  CardContent,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import Logo from "../assets/Version1-Logo.png";
import { loginUser } from "../api/auth";

function Login() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async () => {
    try {
      const res = await loginUser(form);
      localStorage.setItem("token", res.data.token);
      alert("Login Successful!");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Login failed");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background: "linear-gradient(to bottom right, #eef2f7, #f7f9fb)",
      }}
    >
      <Card
        sx={{
          width: 380,
          borderRadius: "18px",
          paddingY: 2,
          paddingX: 3,
          boxShadow: "0px 12px 30px rgba(0,0,0,0.12)",
          background: "white",
        }}
      >
        <CardContent>

          {/* Logo */}
          <div className="flex flex-col justify-center items-center mt-1 mb-2">
            <img src={Logo} alt="Company Logo" className="w-34 object-contain" />
            
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center text-gray-800 mt-2">
            Welcome Back
          </h2>
          <p className="text-center text-gray-500 text-sm mb-4">
            Sign in to access your workspace
          </p>

          {/* Email */}
          <TextField
            fullWidth
            variant="outlined"
            label="Email Address"
            name="email"
            value={form.email}
            onChange={handleChange}
            sx={{
              mb: 2,
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
                backgroundColor: "#f3f6fb",
              },
            }}
          />

          {/* Password with Visibility Toggle */}
          <TextField
            fullWidth
            variant="outlined"
            type={showPassword ? "text" : "password"}
            label="Password"
            name="password"
            value={form.password}
            onChange={handleChange}
            sx={{
              mb: 2,
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
                backgroundColor: "#f3f6fb",
              },
            }}
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

          {/* Error */}
          {error && (
            <p className="text-red-500 text-sm text-center mb-2">{error}</p>
          )}

          {/* Login Button */}
          <Button
            fullWidth
            variant="contained"
            onClick={handleLogin}
            sx={{
              py: 1.2,
              mt: 1,
              fontSize: "16px",
              borderRadius: "10px",
              textTransform: "none",
              background: "linear-gradient(to right, #0066ff, #004dcc)",
              "&:hover": {
                background: "linear-gradient(to right, #0059e6, #003fb8)",
              },
            }}
          >
            Login
          </Button>

          {/* Divider */}
          <div className="border-t border-gray-200 mt-5 mb-3"></div>

          {/* Footer */}
          <p className="text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} Version 1. Internal Use Only.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default Login;
