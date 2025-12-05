import { useState, useEffect } from "react";
import { Card, CardContent, Typography, Button, Chip } from "@mui/material";
import { CheckCircle, Cancel, EmojiEvents, Badge } from "@mui/icons-material";
import { authAPI } from "../api/auth";
import toast from 'react-hot-toast';

const NominationApprovals = () => {
  const [nominations, setNominations] = useState<any[]>([]);

  useEffect(() => { loadNoms(); }, []);

  const loadNoms = async () => {
    try {
      const res = await authAPI.getPendingNominations();
      setNominations(res.data);
    } catch(e) { console.error(e); }
  };

  const handleAction = async (id: number, action: 'APPROVE' | 'REJECT') => {
    try {
      await authAPI.reviewNomination({ nomination_id: id, action });
      toast.success(`Nomination ${action === 'APPROVE' ? 'Approved' : 'Rejected'}!`);
      loadNoms();
    } catch(e) { toast.error("Action failed"); }
  };

  return (
    <div className="animate-fadeIn max-w-5xl mx-auto">
      <Typography variant="h5" fontWeight="bold" className="mb-6">Pending Approvals</Typography>
      
      {nominations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-300 text-gray-400">
          <EmojiEvents sx={{ fontSize: 60, opacity: 0.2, mb: 2 }} />
          <Typography>All caught up! No pending nominations.</Typography>
        </div>
      ) : (
        <div className="space-y-4">
          {nominations.map(nom => (
            <Card key={nom.id} sx={{ borderRadius: 3, borderLeft: '6px solid #00A8A8', overflow: 'visible' }}>
              <CardContent className="flex flex-col md:flex-row justify-between gap-6 p-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Typography variant="h6" fontWeight="bold">{nom.nominee_name}</Typography>
                    <Chip label="Nominee" size="small" sx={{ bgcolor: '#f0fdfa', color: '#0d9488', fontWeight: 'bold', height: 20, fontSize: '0.6rem' }} />
                  </div>
                  <div className="text-sm text-gray-500 mb-3 flex items-center gap-2">
                    <Badge fontSize="small" /> Nominated by: <span className="font-semibold text-gray-900">{nom.nominator_name}</span>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <Typography variant="body2" className="italic text-gray-700">"{nom.reason}"</Typography>
                  </div>
                </div>
                <div className="flex flex-row md:flex-col gap-2 justify-center min-w-[140px] pt-4 md:pt-0 md:pl-6 border-t md:border-t-0 md:border-l border-gray-100">
                  <Button fullWidth variant="contained" color="success" onClick={() => handleAction(nom.id, 'APPROVE')} startIcon={<CheckCircle />}>Approve</Button>
                  <Button fullWidth variant="outlined" color="error" onClick={() => handleAction(nom.id, 'REJECT')} startIcon={<Cancel />}>Reject</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default NominationApprovals;