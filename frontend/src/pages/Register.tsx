import { useEffect, useState } from "react";
import { TextField, Button, MenuItem } from "@mui/material";
import { registerEmployee, getManagers } from "../api/auth";
import type { Manager } from "../types";

function Register() {
  const [managers, setManagers] = useState<Manager[]>([]);

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    emp_id: "",
    manager_id: "",
  });

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadManagers();
  }, []);

  const loadManagers = async () => {
    const res = await getManagers();
    setManagers(res.data);
  };

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async () => {
    try {
      const res = await registerEmployee(form);
      setSuccess("Employee Registered Successfully!");
      setError("");
      setForm({
        username: "",
        email: "",
        password: "",
        emp_id: "",
        manager_id: "",
      });
    } catch (err: any) {
      setError(err.response?.data || "Registration Failed");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">

      <div className="bg-white p-8 shadow-lg rounded-lg w-96">
        <h2 className="text-2xl font-bold mb-4 text-center">Employee Register</h2>

        <TextField
          fullWidth
          label="Username"
          name="username"
          value={form.username}
          onChange={handleChange}
          className="mb-4"
        />

        <TextField
          fullWidth
          label="Email"
          name="email"
          value={form.email}
          onChange={handleChange}
          className="mb-4"
        />

        <TextField
          fullWidth
          label="Password"
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          className="mb-4"
        />

        <TextField
          fullWidth
          label="Employee ID"
          name="emp_id"
          value={form.emp_id}
          onChange={handleChange}
          className="mb-4"
        />

        <TextField
          fullWidth
          select
          label="Select Manager"
          name="manager_id"
          value={form.manager_id}
          onChange={handleChange}
          className="mb-4"
        >
          {managers.map((m) => (
            <MenuItem key={m.id} value={m.id}>
              {m.name}
            </MenuItem>
          ))}
        </TextField>

        {success && <p className="text-green-600">{success}</p>}
        {error && <p className="text-red-600">{error}</p>}

        <Button variant="contained" color="primary" fullWidth onClick={handleRegister}>
          Register
        </Button>
      </div>

    </div>
  );
}

export default Register;
