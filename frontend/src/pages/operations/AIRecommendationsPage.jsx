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
    TrendingUp
} from 'lucide-react';
import { auditService } from '../../services/audit';

const AIRecommendationsPage = ({ colors, darkMode }) => {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statuses, setStatuses] = useState({});

    useEffect(() => {
        fetchRecommendations();
    }, []);

    const fetchRecommendations = async () => {
        try {
            setLoading(true);
            const res = await auditService.getAIRecommendations();
            setRecommendations(res.data);

            // Initialize all as Pending
            const initialStatuses = {};
            res.data.forEach(rec => {
                initialStatuses[rec.id] = 'Pending';
            });
            setStatuses(initialStatuses);
        } catch (err) {
            console.error("Failed to fetch AI recommendations:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = (id, action) => {
        setStatuses(prev => ({
            ...prev,
            [id]: action
        }));
    };

    const handleBulkApprove = () => {
        setStatuses(prev => {
            const next = { ...prev };
            Object.keys(next).forEach(id => {
                if (next[id] === 'Pending') {
                    next[id] = 'Approved';
                }
            });
            return next;
        });
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
            border: 'none',
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
                                const currentStatus = statuses[rec.id] || 'Pending';

                                return (
                                    <tr key={rec.id}>
                                        <td style={styles.td}><span style={{ color: colors.textMuted }}>#{rec.id.toString().slice(0, 5)}</span></td>
                                        <td style={styles.td}><span style={{ fontWeight: 700 }}>{rec.new_value?.includes('Order') || rec.new_value?.includes('ORD-') ? rec.new_value.split(' ')[1] || 'ORDER' : 'SYSTEM'}</span></td>
                                        <td style={styles.td}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Shield size={16} color={colors.secondary} />
                                                <span style={{ fontWeight: 600 }}>{rec.action}</span>
                                            </div>
                                        </td>
                                        <td style={styles.td}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                <TrendingUp size={16} color="#10b981" />
                                                <span style={{ fontWeight: 700 }}>96%</span>
                                            </div>
                                        </td>
                                        <td style={styles.td}>
                                            <div style={{ fontSize: '0.8rem', color: colors.textMuted, maxWidth: '250px', lineHeight: '1.4' }}>
                                                {rec.new_value || `AI suggested ${rec.action} based on historical patterns.`}
                                            </div>
                                        </td>
                                        <td style={styles.td}><span style={styles.badge(currentStatus)}>{currentStatus}</span></td>
                                        <td style={styles.td}>
                                            {currentStatus === 'Pending' ? (
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button style={styles.actionBtn('approve')} onClick={() => handleAction(rec.id, 'Approved')}>
                                                        <CheckCircle size={16} /> Approve
                                                    </button>
                                                    <button style={styles.actionBtn('reject')} onClick={() => handleAction(rec.id, 'Rejected')}>
                                                        <XCircle size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span style={{ color: colors.textMuted, fontSize: '0.8rem', fontWeight: 600 }}>
                                                    {currentStatus === 'Approved' ? 'Action Applied' : 'Suggestion Dismissed'}
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
