import { useState, useEffect } from 'react';
import {
    Brain,
    CheckCircle,
    XCircle,
    Edit3,
    ArrowRight,
    Search,
    Filter,
    Shield,
    TrendingUp,
    BarChart3,
    Percent
} from 'lucide-react';
import { aiService } from '../../services/ai';
import api from '../../services/api';

const AIRecommendationsPage = ({ colors, darkMode }) => {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actioning, setActioning] = useState(null);
    const [metrics, setMetrics] = useState(null);

    useEffect(() => {
        fetchRecommendations();
        fetchMetrics();
    }, []);

    const fetchRecommendations = async () => {
        try {
            setLoading(true);
            const res = await aiService.getDecisions({ status: 'WAITING_APPROVAL' });
            setRecommendations(res.data.results || res.data);
        } catch (err) {
            console.error("Failed to fetch AI recommendations:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMetrics = async () => {
        try {
            const res = await api.get('/reports/ai-metrics/');
            setMetrics(res.data);
        } catch (err) {
            console.error('Failed to fetch AI metrics:', err);
        }
    };

    const handleAction = async (id, action) => {
        try {
            setActioning(id);
            if (action === 'Approved') {
                await aiService.approve(id);
            } else {
                await aiService.reject(id, "Manually rejected via dashboard");
            }
            // Success! Remove from list or refresh
            setRecommendations(prev => prev.filter(r => r.id !== id));
        } catch (err) {
            console.error(`Failed to ${action} recommendation:`, err);
            alert(`Failed to ${action}. Please try again.`);
        } finally {
            setActioning(null);
        }
    };

    const handleBulkApprove = async () => {
        const pending = recommendations.filter(r => r.status === 'WAITING_APPROVAL');
        if (pending.length === 0) return;

        setLoading(true);
        try {
            // Sequential for safety, or Promise.all
            await Promise.all(pending.map(r => aiService.approve(r.id)));
            fetchRecommendations();
        } catch (err) {
            console.error("Bulk approval failed:", err);
            alert("Some approvals failed. Refreshing list.");
            fetchRecommendations();
        } finally {
            setLoading(false);
        }
    };

    const styles = {
        container: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
        tableContainer: {
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: '1.25rem',
            overflowX: 'auto',
        },
        table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1000px' },
        th: {
            padding: '1.25rem 1.5rem',
            borderBottom: `1px solid ${colors.border}`,
            color: colors.textMuted,
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
        },
        td: {
            padding: '1.25rem 1.5rem',
            borderBottom: `1px solid ${colors.border}`,
            fontSize: '0.875rem',
        },
        badge: (status) => ({
            padding: '0.35rem 0.65rem',
            borderRadius: '0.5rem',
            fontSize: '0.75rem',
            fontWeight: 700,
            background: status === 'Approved' ? '#10b98120' : status === 'Rejected' ? '#ef444420' : '#f59e0b20',
            color: status === 'Approved' ? '#10b981' : status === 'Rejected' ? '#ef4444' : '#f59e0b',
        }),
        actionBtn: (type) => ({
            padding: '0.5rem 1rem',
            borderRadius: '0.6rem',
            background: type === 'approve' ? colors.primary : type === 'reject' ? 'transparent' : colors.bg,
            color: type === 'approve' ? '#fff' : type === 'reject' ? '#ef4444' : colors.text,
            fontWeight: 600,
            fontSize: '0.8rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            border: type === 'reject' ? `1px solid #ef444450` : 'none',
            transition: 'all 0.2s',
        })
    };

    return (
        <div style={styles.container}>
            {/* AI Decision Metrics Cards */}
            {metrics && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                    {[
                        { label: 'Total Decisions', value: metrics.total_decisions, color: colors.primary, icon: <BarChart3 size={20}/> },
                        { label: 'Approved', value: metrics.approved, color: '#10b981', icon: <CheckCircle size={20}/> },
                        { label: 'Rejected', value: metrics.rejected, color: '#ef4444', icon: <XCircle size={20}/> },
                        { label: 'Avg Confidence', value: `${metrics.avg_confidence_score}%`, color: '#f59e0b', icon: <Percent size={20}/> },
                    ].map((m) => (
                        <div key={m.label} style={{
                            background: colors.surface,
                            border: `1px solid ${colors.border}`,
                            borderRadius: '1rem',
                            padding: '1.25rem 1.5rem',
                            display: 'flex', alignItems: 'center', gap: '1rem'
                        }}>
                            <div style={{ color: m.color, background: `${m.color}15`, padding: '0.6rem', borderRadius: '0.6rem' }}>{m.icon}</div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: colors.textMuted, fontWeight: 600 }}>{m.label}</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: colors.text }}>{m.value}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>AI Operational Suggestions</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.8rem', background: `${colors.secondary}15`, color: colors.secondary, borderRadius: '2rem', fontSize: '0.8rem', fontWeight: 600 }}>
                        <Brain size={14} /> Intelligence Engine Active
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button style={styles.actionBtn('edit')} onClick={() => alert('Filter Logic panel will open here.')}><Filter size={16} /> Filter Logic</button>
                    <button style={{ ...styles.actionBtn('approve'), background: colors.secondary }} onClick={handleBulkApprove}>Bulk Approve</button>
                </div>
            </div>

            <div style={styles.tableContainer}>
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: colors.textMuted }}>
                        Processing AI log-based recommendations...
                    </div>
                ) : (
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>ID</th>
                                <th style={styles.th}>Entity / Order</th>
                                <th style={styles.th}>AI Action / Suggestion</th>
                                <th style={styles.th}>Conf. Score</th>
                                <th style={styles.th}>Reasoning</th>
                                <th style={styles.th}>Status</th>
                                <th style={styles.th}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recommendations.map(rec => {
                                const currentStatus = rec.status;
                                const isActioning = actioning === rec.id;

                                return (
                                    <tr key={rec.id}>
                                        <td style={styles.td}><span style={{ color: colors.textMuted }}>#{rec.id.toString().slice(0, 5)}</span></td>
                                        <td style={styles.td}>
                                            <span style={{ fontWeight: 700 }}>{rec.order_id || 'SYSTEM'}</span>
                                            {rec.product_name && <div style={{ fontSize: '0.7rem', color: colors.textMuted }}>{rec.product_name}</div>}
                                        </td>
                                        <td style={styles.td}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Shield size={16} color={colors.secondary} />
                                                <span style={{ fontWeight: 600 }}>{rec.decision_type}</span>
                                            </div>
                                        </td>
                                        <td style={styles.td}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                <TrendingUp size={16} color="#10b981" />
                                                <span style={{ fontWeight: 700 }}>{(rec.confidence_score * 100).toFixed(0)}%</span>
                                            </div>
                                        </td>
                                        <td style={styles.td}>
                                            <div style={{ fontSize: '0.8rem', color: colors.textMuted, maxWidth: '250px', lineHeight: '1.4' }}>
                                                {rec.recommendation?.reasoning_text || `AI suggested ${rec.decision_type} based on weighted scoring.`}
                                            </div>
                                        </td>
                                        <td style={styles.td}><span style={styles.badge(currentStatus === 'WAITING_APPROVAL' ? 'Pending' : currentStatus === 'APPROVED' ? 'Approved' : 'Rejected')}>{currentStatus}</span></td>
                                        <td style={styles.td}>
                                            {currentStatus === 'WAITING_APPROVAL' ? (
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button 
                                                        style={{...styles.actionBtn('approve'), opacity: isActioning ? 0.7 : 1}} 
                                                        onClick={() => handleAction(rec.id, 'Approved')}
                                                        disabled={isActioning}
                                                    >
                                                        <CheckCircle size={16} /> {isActioning ? '...' : 'Approve'}
                                                    </button>
                                                    <button 
                                                        style={{...styles.actionBtn('reject'), opacity: isActioning ? 0.7 : 1}} 
                                                        onClick={() => handleAction(rec.id, 'Rejected')}
                                                        disabled={isActioning}
                                                    >
                                                        <XCircle size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span style={{ color: colors.textMuted, fontSize: '0.8rem', fontWeight: 600 }}>
                                                    {currentStatus === 'APPROVED' || currentStatus === 'AUTO_EXECUTED' ? 'Action Applied' : 'Suggestion Dismissed'}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {recommendations.length === 0 && (
                                <tr>
                                    <td colSpan="7" style={{ ...styles.td, textAlign: 'center', padding: '4rem', color: colors.textMuted }}>
                                        No active AI logs found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default AIRecommendationsPage;
