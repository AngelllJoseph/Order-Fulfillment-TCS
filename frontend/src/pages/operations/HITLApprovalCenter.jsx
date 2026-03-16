import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    ShieldCheck, 
    CheckCircle, 
    XCircle, 
    Clock, 
    AlertCircle,
    Info,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import api from '../../services/api';
import { aiService } from '../../services/ai';

const HITLApprovalCenter = ({ colors, darkMode }) => {
    const queryClient = useQueryClient();
    const [selectedDecision, setSelectedDecision] = useState(null);
    const [actionModal, setActionModal] = useState({ isOpen: false, type: null, decision: null });
    const [comment, setComment] = useState("");

    // Fetch pending decisions
    const { data: decisions = [], isLoading, isError, error } = useQuery({
        queryKey: ['pendingDecisions'],
        queryFn: async () => {
            const response = await api.get('/ai/pending-decisions/');
            return response.data;
        },
        refetchInterval: 30000, // Refresh every 30s
    });

    // Fetch live accuracy stat
    const { data: accuracyData } = useQuery({
        queryKey: ['aiAccuracyStats'],
        queryFn: () => aiService.getAccuracyStats().then(r => r.data),
        refetchInterval: 60000,
    });

    const approveMutation = useMutation({
        mutationFn: async ({ id, data }) => {
            // ✅ ViewSet action — resumes LangGraph orchestrator correctly
            const response = await api.post(`/ai/decisions/${id}/approve/`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pendingDecisions'] });
            queryClient.invalidateQueries({ queryKey: ['aiAccuracyStats'] });
            closeModal();
        }
    });

    const rejectMutation = useMutation({
        mutationFn: async ({ id, data }) => {
            // ✅ ViewSet action — resumes LangGraph orchestrator correctly
            const response = await api.post(`/ai/decisions/${id}/reject/`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pendingDecisions'] });
            queryClient.invalidateQueries({ queryKey: ['aiAccuracyStats'] });
            closeModal();
        }
    });

    const handleAction = (decision, type) => {
        setActionModal({ isOpen: true, type, decision });
        setComment("");
    };

    const closeModal = () => {
        setActionModal({ isOpen: false, type: null, decision: null });
        setComment("");
    };

    const submitAction = () => {
        const { type, decision } = actionModal;
        const payload = { comment };
        if (type === 'APPROVE') {
            approveMutation.mutate({ id: decision.id, data: payload });
        } else if (type === 'REJECT') {
            rejectMutation.mutate({ id: decision.id, data: payload });
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Header Cards */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                gap: '1.5rem' 
            }}>
                <div style={{ 
                    background: colors.surface, 
                    borderRadius: '1rem', 
                    padding: '1.5rem', 
                    border: `1px solid ${colors.border}`,
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '1.5rem' 
                }}>
                    <div style={{ padding: '1rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '0.75rem', color: colors.primary }}>
                        <Clock size={28} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.875rem', color: colors.textMuted, marginBottom: '0.25rem' }}>Pending Approvals</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: colors.text }}>{decisions.length}</div>
                    </div>
                </div>

                <div style={{ 
                    background: colors.surface, 
                    borderRadius: '1rem', 
                    padding: '1.5rem', 
                    border: `1px solid ${colors.border}`,
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '1.5rem' 
                }}>
                    <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '0.75rem', color: '#10b981' }}>
                        <ShieldCheck size={28} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.875rem', color: colors.textMuted, marginBottom: '0.25rem' }}>Automated Accuracy</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: colors.text }}>
                            {accuracyData ? `${accuracyData.automated_accuracy}%` : '—'}
                        </div>
                    </div>
                </div>
            </div>

            {/* List Section */}
            <div style={{ 
                background: colors.surface, 
                borderRadius: '1rem', 
                border: `1px solid ${colors.border}`,
                overflow: 'hidden'
            }}>
                <div style={{ 
                    padding: '1.5rem', 
                    borderBottom: `1px solid ${colors.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>Decisions Requiring Approval</h2>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    {isLoading ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: colors.textMuted }}>
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                            Loading pending decisions...
                        </div>
                    ) : isError ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: '#ef4444' }}>
                            <AlertCircle size={32} className="mx-auto mb-4" />
                            Error loading decisions: {error.message}
                        </div>
                    ) : decisions.length === 0 ? (
                        <div style={{ padding: '4rem', textAlign: 'center', color: colors.textMuted }}>
                            <ShieldCheck size={48} className="mx-auto mb-4" style={{ opacity: 0.5 }} />
                            <div style={{ fontSize: '1.125rem', fontWeight: 500 }}>All Caught Up</div>
                            <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>No AI decisions currently awaiting your approval.</div>
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: colors.surfaceHover, borderBottom: `1px solid ${colors.border}` }}>
                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Decision ID / Type</th>
                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Related Order</th>
                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Confidence</th>
                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {decisions.map(decision => (
                                    <React.Fragment key={decision.id}>
                                        <tr 
                                            style={{ 
                                                borderBottom: `1px solid ${colors.border}`,
                                                background: selectedDecision === decision.id ? colors.surfaceHover : 'transparent',
                                                transition: 'background 0.2s'
                                            }}
                                        >
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <div style={{ fontWeight: 600 }}>{decision.decision_type.replace('_', ' ')}</div>
                                                <div style={{ fontSize: '0.75rem', color: colors.textMuted, marginTop: '0.25rem', fontFamily: 'monospace' }}>
                                                    {decision.id.substring(0, 8)}...
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <div style={{ fontWeight: 500, color: colors.primary }}>#{decision.order_id}</div>
                                                <div style={{ fontSize: '0.875rem', color: colors.textMuted, marginTop: '0.25rem' }}>
                                                    {decision.product_name || 'N/A'}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ fontWeight: 600 }}>{(decision.confidence_score * 100).toFixed(1)}%</div>
                                                    {decision.confidence_score > 0.9 ? (
                                                        <span style={{ padding: '0.125rem 0.5rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: 600 }}>HIGH</span>
                                                    ) : decision.confidence_score > 0.7 ? (
                                                        <span style={{ padding: '0.125rem 0.5rem', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: 600 }}>MEDIUM</span>
                                                    ) : (
                                                        <span style={{ padding: '0.125rem 0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: 600 }}>LOW</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                                    <button 
                                                        onClick={() => setSelectedDecision(selectedDecision === decision.id ? null : decision.id)}
                                                        style={{ 
                                                            display: 'flex', alignItems: 'center', gap: '0.375rem',
                                                            padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
                                                            background: colors.surfaceHover, color: colors.text,
                                                            border: `1px solid ${colors.border}`, cursor: 'pointer',
                                                            fontSize: '0.875rem', fontWeight: 500
                                                        }}
                                                    >
                                                        Details
                                                        {selectedDecision === decision.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                    </button>
                                                    <button 
                                                        onClick={() => handleAction(decision, 'APPROVE')}
                                                        style={{ 
                                                            display: 'flex', alignItems: 'center', gap: '0.375rem',
                                                            padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
                                                            background: 'rgba(16, 185, 129, 0.1)', color: '#10b981',
                                                            border: '1px solid rgba(16, 185, 129, 0.2)', cursor: 'pointer',
                                                            fontSize: '0.875rem', fontWeight: 500
                                                        }}
                                                    >
                                                        <CheckCircle size={16} /> Approve
                                                    </button>
                                                    <button 
                                                        onClick={() => handleAction(decision, 'REJECT')}
                                                        style={{ 
                                                            display: 'flex', alignItems: 'center', gap: '0.375rem',
                                                            padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
                                                            background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                                                            border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer',
                                                            fontSize: '0.875rem', fontWeight: 500
                                                        }}
                                                    >
                                                        <XCircle size={16} /> Reject
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {selectedDecision === decision.id && (
                                            <tr style={{ background: 'rgba(0,0,0,0.02)' }}>
                                                <td colSpan={4} style={{ padding: '1.5rem', borderBottom: `1px solid ${colors.border}` }}>
                                                    <div style={{ display: 'flex', gap: '2rem' }}>
                                                        <div style={{ flex: 1, background: colors.surfaceHover, padding: '1rem', borderRadius: '0.75rem', border: `1px solid ${colors.border}` }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: colors.textMuted, marginBottom: '0.75rem', fontSize: '0.875rem', fontWeight: 600 }}>
                                                                <Info size={16} /> AI Recommendation Details
                                                            </div>
                                                            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.875rem', color: colors.text }}>
                                                                {JSON.stringify(decision.recommendation, null, 2)}
                                                            </pre>
                                                        </div>
                                                        <div style={{ flex: 1, background: colors.surfaceHover, padding: '1rem', borderRadius: '0.75rem', border: `1px solid ${colors.border}` }}>
                                                            <div style={{ color: colors.textMuted, marginBottom: '0.75rem', fontSize: '0.875rem', fontWeight: 600 }}>
                                                                Context & Context
                                                            </div>
                                                            <p style={{ fontSize: '0.875rem', color: colors.text, margin: 0, lineHeight: 1.5 }}>
                                                                This decision was flagged for human review because the confidence score ({(decision.confidence_score * 100).toFixed(1)}%) is below the automatic execution threshold, or it meets specific administrative criteria requiring Program Manager oversight.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Action Modal */}
            {actionModal.isOpen && (
                <div style={{ 
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
                }}>
                    <div style={{ 
                        background: colors.surface, 
                        borderRadius: '1rem', 
                        width: '100%', maxWidth: '480px', 
                        border: `1px solid ${colors.border}`,
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        overflow: 'hidden'
                    }}>
                        <div style={{ 
                            padding: '1.5rem', 
                            borderBottom: `1px solid ${colors.border}`,
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                            background: actionModal.type === 'APPROVE' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)'
                        }}>
                            {actionModal.type === 'APPROVE' ? (
                                <CheckCircle size={24} color="#10b981" />
                            ) : (
                                <XCircle size={24} color="#ef4444" />
                            )}
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
                                Confirm {actionModal.type === 'APPROVE' ? 'Approval' : 'Rejection'}
                            </h3>
                        </div>

                        <div style={{ padding: '1.5rem' }}>
                            <p style={{ margin: '0 0 1.5rem 0', color: colors.textMuted, fontSize: '0.925rem', lineHeight: 1.5 }}>
                                Are you sure you want to {actionModal.type.toLowerCase()} this {actionModal.decision?.decision_type.replace('_', ' ').toLowerCase()} decision for order <span style={{ fontWeight: 600, color: colors.text }}>#{actionModal.decision?.order_id}</span>?
                            </p>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: colors.text }}>
                                    Comment (Optional)
                                </label>
                                <textarea 
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder={`Add a note about why you are ${actionModal.type === 'APPROVE' ? 'approving' : 'rejecting'} this decision...`}
                                    style={{ 
                                        width: '100%', padding: '0.75rem', 
                                        background: colors.bg, color: colors.text,
                                        border: `1px solid ${colors.border}`, borderRadius: '0.5rem',
                                        minHeight: '100px', resize: 'vertical',
                                        fontFamily: 'inherit', fontSize: '0.875rem'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button 
                                    onClick={closeModal}
                                    style={{ 
                                        padding: '0.625rem 1.25rem', borderRadius: '0.5rem',
                                        background: 'transparent', color: colors.text,
                                        border: `1px solid ${colors.border}`, cursor: 'pointer',
                                        fontSize: '0.875rem', fontWeight: 500
                                    }}
                                    disabled={approveMutation.isPending || rejectMutation.isPending}
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={submitAction}
                                    style={{ 
                                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                                        padding: '0.625rem 1.25rem', borderRadius: '0.5rem',
                                        background: actionModal.type === 'APPROVE' ? '#10b981' : '#ef4444', 
                                        color: 'white', border: 'none', cursor: 'pointer',
                                        fontSize: '0.875rem', fontWeight: 600,
                                        opacity: (approveMutation.isPending || rejectMutation.isPending) ? 0.7 : 1
                                    }}
                                    disabled={approveMutation.isPending || rejectMutation.isPending}
                                >
                                    {(approveMutation.isPending || rejectMutation.isPending) ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    ) : actionModal.type === 'APPROVE' ? (
                                        <CheckCircle size={16} />
                                    ) : (
                                        <XCircle size={16} />
                                    )}
                                    Confirm {actionModal.type === 'APPROVE' ? 'Approval' : 'Rejection'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HITLApprovalCenter;
