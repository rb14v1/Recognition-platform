import { useState, useEffect } from "react";
import { 
  Card, CardContent, Typography, Button, Chip, 
  Tabs, Tab, Box, CircularProgress 
} from "@mui/material";
import { 
  CheckCircle, Cancel, EmojiEvents, Badge, 
  History, AccessTime 
} from "@mui/icons-material";
import { authAPI } from "../api/auth";
import toast from 'react-hot-toast';

const NominationApprovals = () => {
  const [activeTab, setActiveTab] = useState(0); // 0 = Pending, 1 = History
  const [nominations, setNominations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { 
      loadNoms(); 
  }, [activeTab]);

  const loadNoms = async () => {
    setLoading(true);
    try {
      const filter = activeTab === 0 ? 'pending' : 'history';
      const res = await authAPI.getCoordinatorNominations(filter);
      setNominations(res.data);
    } catch(e) { 
        console.error(e); 
    } finally {
        setLoading(false);
    }
  };

  const handleAction = async (id: number, action: 'APPROVE' | 'REJECT') => {
    try {
      await authAPI.reviewNomination({ nomination_id: id, action });
      toast.success(`Nomination ${action === 'APPROVE' ? 'Approved' : 'Rejected'}!`);
      loadNoms(); // Refresh list
    } catch(e) { toast.error("Action failed"); }
  };

  return (
    <div className="animate-fadeIn max-w-5xl mx-auto">
      <div className="mb-6">
        <Typography variant="h5" fontWeight="bold" className="text-gray-800">Team Nominations</Typography>
        <Typography variant="body2" color="textSecondary">Review and approve nominations for your direct reports.</Typography>
      </div>

      {/* TABS */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs 
            value={activeTab} 
            onChange={(_, v) => setActiveTab(v)} 
            textColor="primary"
            indicatorColor="primary"
            sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 'bold', fontSize: '1rem' } }}
        >
          <Tab icon={<AccessTime />} iconPosition="start" label="Pending Requests" />
          <Tab icon={<History />} iconPosition="start" label="Approval History" />
        </Tabs>
      </Box>
      
      {/* LOADING STATE */}
      {loading ? (
          <div className="flex justify-center py-20"><CircularProgress /></div>
      ) : nominations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-300 text-gray-400">
          <EmojiEvents sx={{ fontSize: 60, opacity: 0.2, mb: 2 }} />
          <Typography>
              {activeTab === 0 ? "All caught up! No pending nominations." : "No history found."}
          </Typography>
        </div>
      ) : (
        <div className="space-y-4">
          {nominations.map(nom => (
            <Card key={nom.id} sx={{ borderRadius: 3, borderLeft: activeTab === 0 ? '6px solid #00A8A8' : '6px solid #cbd5e1', overflow: 'visible' }}>
              <CardContent className="flex flex-col md:flex-row justify-between gap-6 p-6">
                
                {/* INFO SECTION */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Typography variant="h6" fontWeight="bold">{nom.nominee_name}</Typography>
                    <Chip 
                        label={nom.nominee_role} 
                        size="small" 
                        sx={{ bgcolor: '#f1f5f9', color: '#475569', fontWeight: 'bold', height: 20, fontSize: '0.65rem' }} 
                    />
                    {/* History Status Badge */}
                    {activeTab === 1 && (
                        <Chip 
                            label={nom.status} 
                            color={nom.status === 'APPROVED' ? 'success' : 'error'}
                            size="small"
                            sx={{ fontWeight: 'bold' }}
                        />
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-500 mb-3 flex items-center gap-2">
                    <Badge fontSize="small" /> Nominated by: <span className="font-semibold text-gray-900">{nom.nominator_name}</span>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 italic text-gray-700 text-sm">
                    "{nom.reason}"
                  </div>
                </div>

                {/* ACTION BUTTONS (Only for Pending Tab) */}
                {activeTab === 0 && (
                    <div className="flex flex-row md:flex-col gap-2 justify-center min-w-[140px] pt-4 md:pt-0 md:pl-6 border-t md:border-t-0 md:border-l border-gray-100">
                    <Button 
                        fullWidth 
                        variant="contained" 
                        color="success" 
                        onClick={() => handleAction(nom.id, 'APPROVE')} 
                        startIcon={<CheckCircle />}
                        sx={{ boxShadow: 'none' }}
                    >
                        Approve
                    </Button>
                    <Button 
                        fullWidth 
                        variant="outlined" 
                        color="error" 
                        onClick={() => handleAction(nom.id, 'REJECT')} 
                        startIcon={<Cancel />}
                    >
                        Reject
                    </Button>
                    </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default NominationApprovals;