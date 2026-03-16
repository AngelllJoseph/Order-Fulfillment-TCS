import { useState, useEffect } from 'react';
import { History, CheckCircle, XCircle, User, Search } from 'lucide-react';
import { aiService } from '../../services/ai';

const HITLHistoryPage = ({ colors, darkMode }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const res = await aiService.getApprovalHistory();
            setHistory(res.data || []);
        } catch (err) {
            console.error('Failed to fetch approval history:', err);
        } finally {
            setLoading(false);
        }
    };

    const filtered = history.filter(r =>
        !search ||
        r.order_id?.toLowerCase().includes(search.toLowerCase()) ||
        r.actor_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.action?.toLowerCase().includes(search.toLowerCase())
    );

    const cardStyle = {
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: '1.25rem',
        overflowX: 'auto',
    };

    const thStyle = {
        padding: '1rem 1.25rem',
        borderBottom: `1px solid ${colors.border}`,
        color: colors.textMuted,
        fontSize: '0.75rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        textAlign: 'left',
        whiteSpace: 'nowrap',
    };

    const tdStyle = {
        padding: '1rem 1.25rem',
        borderBottom: `1px solid ${colors.border}`,
        fontSize: '0.875rem',
        color: colors.text,
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ padding: '0.6rem', background: `${colors.primary}20`, borderRadius: '0.75rem', color: colors.primary }}>
                        <History size={22} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem', color: colors.text }}>HITL Approval History</h2>
                        <div style={{ fontSize: '0.8rem', color: colors.textMuted }}>All past AI decision approvals and rejections</div>
                    </div>
                </div>
                {/* Search */}
                <div style={{ position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} color={colors.textMuted} />
                    <input
                        type="text"
                        placeholder="Search by order, actor, action…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{
                            paddingLeft: '2.25rem', paddingRight: '1rem', paddingTop: '0.6rem', paddingBottom: '0.6rem',
                            background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '0.75rem',
                            color: colors.text, fontSize: '0.875rem', outline: 'none', width: '280px'
                        }}
                    />
                </div>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                {[
                    { label: 'Total Actions', value: history.length, color: colors.primary },
                    { label: 'Approved', value: history.filter(h => h.action === 'APPROVED').length, color: '#10b981' },
                    { label: 'Rejected', value: history.filter(h => h.action === 'REJECTED').length, color: '#ef4444' },
                ].map(c => (
                    <div key={c.label} style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '1rem', padding: '1.25rem 1.5rem' }}>
                        <div style={{ fontSize: '0.75rem', color: colors.textMuted, fontWeight: 600, marginBottom: '0.25rem' }}>{c.label}</div>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: c.color }}>{c.value}</div>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div style={cardStyle}>
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: colors.textMuted }}>Loading approval history…</div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: colors.textMuted }}>No approval records found.</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                        <thead>
                            <tr>
                                {['Timestamp', 'Actor', 'Order ID', 'Decision Type', 'Action', 'Confidence', 'Comment'].map(h => (
                                    <th key={h} style={thStyle}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((row) => (
                                <tr key={row.id}>
                                    <td style={tdStyle}>{new Date(row.timestamp).toLocaleString()}</td>
                                    <td style={tdStyle}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${colors.primary}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.primary }}>
                                                <User size={14} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{row.actor_name}</div>
                                                <div style={{ fontSize: '0.75rem', color: colors.textMuted }}>{row.actor_email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ ...tdStyle, fontWeight: 700, color: colors.primary }}>{row.order_id}</td>
                                    <td style={tdStyle}>{row.decision_type}</td>
                                    <td style={tdStyle}>
                                        <span style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                                            padding: '0.3rem 0.7rem', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.75rem',
                                            background: row.action === 'APPROVED' ? '#10b98120' : '#ef444420',
                                            color: row.action === 'APPROVED' ? '#10b981' : '#ef4444',
                                        }}>
                                            {row.action === 'APPROVED' ? <CheckCircle size={13} /> : <XCircle size={13} />}
                                            {row.action}
                                        </span>
                                    </td>
                                    <td style={tdStyle}>{row.confidence_score}%</td>
                                    <td style={{ ...tdStyle, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: colors.textMuted }}>
                                        {row.comment || '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default HITLHistoryPage;
