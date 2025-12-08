import { useState, useEffect } from "react";
import { Card, CardContent, Typography, Button, Chip, Avatar, Box, Tabs, Tab } from "@mui/material";
import { EmojiEvents,Cancel } from "@mui/icons-material";
import { authAPI } from "../api/auth";
import toast from 'react-hot-toast';

const CommitteeReview = () => {
  const [activeTab, setActiveTab] = useState(0); // 0 = Review Pool, 1 = History
  const [nominations, setNominations] = useState<any[]>([]);

  useEffect(() => { loadData(); }, [activeTab]);

  const loadData = async () => {
    try {
        const filter = activeTab === 0 ? 'pending' : 'history';
        const res = await authAPI.getCoordinatorNominations(filter);
        setNominations(res.data);
    } catch(e) { console.error(e); }
  };

  const handleDecision = async (id: number, action: 'APPROVE' | 'REJECT') => {
      try {
          await authAPI.reviewNomination({ nomination_id: id, action });
          toast.success(action === 'APPROVE' ? "Promoted to Finalist!" : "Nomination Rejected");
          loadData();
      } catch(e) { toast.error("Action failed"); }
  }

  return (
    <div className="animate-fadeIn max-w-6xl mx-auto">
        <div className="mb-6">
            <Typography variant="h5" fontWeight="bold" className="text-gray-900">
                Committee Evaluation
            </Typography>
            <Typography variant="body2" className="text-gray-500">
                Review candidates approved by Coordinators. Select finalists for the Admin vote.
            </Typography>
        </div>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
            <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
                <Tab label={`Review Pool (${activeTab === 0 ? nominations.length : ''})`} />
                <Tab label="Decision History" />
            </Tabs>
        </Box>

        <div className="grid grid-cols-1 gap-4">
            {nominations.map(nom => (
                <Card key={nom.id} sx={{ borderRadius: 3, borderLeft: '6px solid #9333ea', overflow: 'visible' }}>
                    <CardContent className="flex flex-col md:flex-row gap-6 p-6">
                        {/* Avatar & Name */}
                        <div className="flex items-start gap-4 min-w-[200px]">
                            <Avatar sx={{ width: 56, height: 56, bgcolor: '#f3e8ff', color: '#9333ea', fontWeight: 'bold' }}>
                                {nom.nominee_name[0]}
                            </Avatar>
                            <div>
                                <Typography variant="h6" fontWeight="bold">{nom.nominee_name}</Typography>
                                <Typography variant="body2" color="textSecondary">{nom.nominee_role}</Typography>
                                <Chip label={nom.nominee_dept} size="small" sx={{ mt: 1, fontSize: '0.6rem' }} />
                            </div>
                        </div>

                        {/* Reason */}
                        <div className="flex-1 bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <Typography variant="caption" className="text-gray-400 font-bold uppercase mb-1 block">
                                Nomination Reason (by {nom.nominator_name})
                            </Typography>
                            <Typography variant="body2" className="text-gray-800 italic">
                                "{nom.reason}"
                            </Typography>
                        </div>

                        {/* Actions */}
                        {activeTab === 0 && (
                            <div className="flex flex-col justify-center gap-2 min-w-[150px]">
                                <Button 
                                    variant="contained" 
                                    sx={{ bgcolor: '#9333ea', '&:hover': { bgcolor: '#7e22ce' } }}
                                    onClick={() => handleDecision(nom.id, 'APPROVE')}
                                    startIcon={<EmojiEvents />}
                                >
                                    Select Finalist
                                </Button>
                                <Button 
                                    variant="outlined" 
                                    color="error"
                                    onClick={() => handleDecision(nom.id, 'REJECT')}
                                    startIcon={<Cancel />}
                                >
                                    Reject
                                </Button>
                            </div>
                        )}
                         {activeTab === 1 && (
                            <div className="flex items-center justify-center min-w-[150px]">
                                <Chip 
                                    label={nom.status.replace('_', ' ')} 
                                    color={nom.status === 'COMMITTEE_APPROVED' ? 'secondary' : 'error'} 
                                    variant="filled"
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}
             {nominations.length === 0 && (
                <div className="text-center py-20 text-gray-400">
                    <Typography>No nominations found in this stage.</Typography>
                </div>
            )}
        </div>
    </div>
  );
};

export default CommitteeReview;