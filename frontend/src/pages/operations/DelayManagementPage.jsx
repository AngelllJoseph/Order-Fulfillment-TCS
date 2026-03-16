import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import {
  AlertTriangle,
  Clock,
  ArrowRight,
  Mail,
  CheckCircle,
  Calendar,
  RefreshCw,
  MoreVertical,
  Shield
} from 'lucide-react';

const DelayManagementPage = ({ colors, darkMode }) => {
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showETAModal, setShowETAModal] = useState(false);
  const [newETA, setNewETA] = useState('');

  // Fetch Delay Risks
  const { data: risks, isLoading, refetch } = useQuery({
    queryKey: ['delay-risks'],
    queryFn: async () => {
      const response = await api.get('/operations/delay-risks/');
      return response.data;
    },
  });

  // Actions
  const reassignMutation = useMutation({
    mutationFn: (decisionId) => api.post('/operations/reassign-hub/', { decision_id: decisionId }),
    onSuccess: () => {
      queryClient.invalidateQueries(['delay-risks']);
      alert('Hub reassignment triggered erfolgreich!');
    },
  });

  const extendETAMutation = useMutation({
    mutationFn: ({ orderId, date }) => api.post('/operations/extend-eta/', { order_id: orderId, new_date: date }),
    onSuccess: () => {
      queryClient.invalidateQueries(['delay-risks']);
      setShowETAModal(false);
      alert('ETA updated successfully!');
    },
  });

  const notifyMutation = useMutation({
    mutationFn: (orderId) => api.post('/operations/notify-customer/', { order_id: orderId }),
    onSuccess: () => {
      alert('Notification sent to customer.');
    },
  });

  const handleExtendETA = (order) => {
    setSelectedOrder(order);
    setNewETA(order.expected_delivery || '');
    setShowETAModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          className="p-6 rounded-2xl border transition-all duration-300"
          style={{ background: colors.surface, borderColor: colors.border }}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: colors.textMuted }}>Total Risks Detected</p>
              <h3 className="text-2xl font-bold" style={{ color: colors.text }}>{risks?.length || 0}</h3>
            </div>
          </div>
        </div>
        
        <div 
          className="p-6 rounded-2xl border transition-all duration-300"
          style={{ background: colors.surface, borderColor: colors.border }}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-500">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: colors.textMuted }}>Avg. Predicted Delay</p>
              <h3 className="text-2xl font-bold" style={{ color: colors.text }}>
                {risks?.length > 0 
                  ? (risks.reduce((acc, r) => acc + r.predicted_delay_days, 0) / risks.length).toFixed(1)
                  : 0} Days
              </h3>
            </div>
          </div>
        </div>

        <div 
          className="p-6 rounded-2xl border transition-all duration-300 pointer-cursor"
          style={{ background: colors.surface, borderColor: colors.border }}
          onClick={() => refetch()}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
              <RefreshCw size={24} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: colors.textMuted }}>System Status</p>
              <h3 className="text-2xl font-bold" style={{ color: colors.text }}>Analyzing Live</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Main Risk Table */}
      <div 
        className="rounded-3xl border overflow-hidden shadow-xl"
        style={{ background: colors.surface, borderColor: colors.border }}
      >
        <div className="px-6 py-5 border-b" style={{ borderColor: colors.border }}>
          <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: colors.text }}>
            <Shield size={20} className="text-indigo-500" />
            Delay Risk Management
          </h2>
          <p className="text-sm" style={{ color: colors.textMuted }}>AI-detected order delays requiring immediate intervention.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-500/5">
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textMuted }}>Order Details</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textMuted }}>Predicted Delay</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textMuted }}>Risk Cause</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textMuted }}>AI Recommendation</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-right" style={{ color: colors.textMuted }}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ divideColor: colors.border }}>
              {risks?.map((risk) => (
                <tr key={risk.id} className="hover:bg-slate-500/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold" style={{ color: colors.text }}>{risk.order_id}</div>
                    <div className="text-xs" style={{ color: colors.textMuted }}>{risk.current_hub}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-rose-500 font-semibold">
                      <Clock size={14} />
                      +{risk.predicted_delay_days}d
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm" style={{ color: colors.text }}>{risk.risk_reason}</div>
                    <div className="text-[10px] mt-1 uppercase font-bold px-1.5 py-0.5 rounded inline-block bg-amber-500/10 text-amber-500">
                      Confidence: {(risk.ai_confidence * 100).toFixed(0)}%
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium" style={{ color: colors.text }}>{risk.suggested_action}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => reassignMutation.mutate(risk.id)}
                        className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500 hover:text-white transition-all"
                        title="Approve Reassignment"
                      >
                        <RefreshCw size={16} />
                      </button>
                      <button 
                        onClick={() => handleExtendETA(risk)}
                        className="p-2 rounded-lg bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white transition-all"
                        title="Adjust ETA"
                      >
                        <Calendar size={16} />
                      </button>
                      <button 
                        onClick={() => notifyMutation.mutate(risk.order_id)}
                        className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all"
                        title="Notify Customer"
                      >
                        <Mail size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ETA Adjustment Modal */}
      {showETAModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div 
            className="w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in duration-300"
            style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
          >
            <h3 className="text-xl font-bold mb-2" style={{ color: colors.text }}>Adjust Delivery ETA</h3>
            <p className="text-sm mb-6" style={{ color: colors.textMuted }}>
              Manually extend the expected delivery date for Order <strong>{selectedOrder?.order_id}</strong>.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: colors.textMuted }}>New Expected Date</label>
                <input 
                  type="date" 
                  value={newETA}
                  onChange={(e) => setNewETA(e.target.value)}
                  className="w-full p-4 rounded-xl border outline-none font-medium"
                  style={{ background: colors.bg, color: colors.text, borderColor: colors.border }}
                />
              </div>

              <div className="flex gap-3 mt-8">
                <button 
                  onClick={() => setShowETAModal(false)}
                  className="flex-1 py-4 font-bold rounded-2xl"
                  style={{ color: colors.text, background: colors.border }}
                >
                  Cancel
                </button>
                <button 
                  onClick={() => extendETAMutation.mutate({ orderId: selectedOrder.order_id, date: newETA })}
                  className="flex-1 py-4 bg-indigo-500 text-white font-bold rounded-2xl hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20"
                >
                  Confirm Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DelayManagementPage;
