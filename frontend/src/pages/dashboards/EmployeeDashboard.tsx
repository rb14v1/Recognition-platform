import { Card, CardContent, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

const EmployeeDashboard = () => {
    const navigate = useNavigate();
    return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Employee Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card sx={{ borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
          <CardContent className="flex flex-col items-center p-8 text-center">
            <Typography variant="h5" component="div" className="font-bold mb-2">
              🏆 Nominate a Colleague
            </Typography>
            <Typography variant="body2" color="text.secondary" className="mb-6">
              Recognize someone's hard work. You can nominate 1 person per cycle.
            </Typography>
            
            {/* 3. Add onClick handler */}
            <Button 
              variant="contained" 
              color="primary" 
              sx={{ borderRadius: "20px", backgroundColor: "#00A8A8" }}
              onClick={() => navigate('/dashboard/nominate')}
            >
              Start Nomination
            </Button>
          </CardContent>
        </Card>

        {/* 2. Status Section */}
        <Card sx={{ borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
           <CardContent>
             <Typography variant="h6">My Status</Typography>
             <p className="text-gray-500 mt-2">You haven't nominated anyone yet.</p>
           </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmployeeDashboard;