import { useAuth } from "../context/AuthContext";
import { Button } from "@mui/material";

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-4xl font-bold text-teal-700">Welcome, {user?.username}!</h1>
      <p className="text-lg text-gray-600 mt-2">Role: {user?.role}</p>
      
      <Button 
        variant="contained" 
        color="error" 
        onClick={logout} 
        sx={{ mt: 4 }}
      >
        Logout
      </Button>
    </div>
  );
};

export default Dashboard;