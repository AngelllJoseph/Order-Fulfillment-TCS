import { useState, useEffect } from 'react';
import {
    History,
    Search,
    Calendar,
    Filter,
    ArrowRight,
    User,
    Shield
} from 'lucide-react';
import { auditService } from '../../services/audit';

const AuditLogsPage = ({ colors, darkMode }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [moduleFilter, setModuleFilter] = useState('');

    useEffect(() => {
        fetchLogs();
    }, [searchQuery, dateFrom, dateTo, moduleFilter]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const params = {
                action: searchQuery || undefined,
                timestamp_after: dateFrom || undefined,
                timestamp_before: dateTo || undefined,
                module: moduleFilter || undefined,
            };
            const res = await auditService.getLogs(params);
            setLogs(res.data.results || res.data || []);
        } catch (err) {
            console.error("Failed to fetch audit logs:", err);
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
        table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' },
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
        aiBadge: {
            padding: '0.2rem 0.5rem',
            borderRadius: '0.375rem',
            background: `${colors.secondary}15`,
            color: colors.secondary,
            fontSize: '0.7rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
        }
    };

    return (
        <div style={styles.container}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: '350px' }}>
                    <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} size={16} color={colors.textMuted} />
                    <input
                        style={{ width: '100%', background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '0.75rem', padding: '0.6rem 0.75rem 0.6rem 2.25rem', color: colors.text, outline: 'none' }}
                        placeholder="Search logs by action..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.75rem', borderRadius: '0.75rem', background: colors.surface, border: `1px solid ${colors.border}` }}>
                        <Calendar size={16} color={colors.textMuted} />
                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                            style={{ background: 'none', border: 'none', color: colors.text, fontSize: '0.8rem', outline: 'none' }} />
                        <span style={{ color: colors.textMuted, fontSize: '0.8rem' }}>→</span>
                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                            style={{ background: 'none', border: 'none', color: colors.text, fontSize: '0.8rem', outline: 'none' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.75rem', borderRadius: '0.75rem', background: colors.surface, border: `1px solid ${colors.border}` }}>
                        <Filter size={16} color={colors.textMuted} />
                        <select value={moduleFilter} onChange={e => setModuleFilter(e.target.value)}
                            style={{ background: 'none', border: 'none', color: colors.text, fontSize: '0.8rem', outline: 'none' }}>
                            <option value="">All Modules</option>
                            <option value="AI">AI</option>
                            <option value="ORDERS">Orders</option>
                            <option value="INVENTORY">Inventory</option>
                            <option value="HUBS">Hubs</option>
                        </select>
                    </div>
                </div>
            </div>

            <div style={styles.tableContainer}>
                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: colors.textMuted }}>Fetching system events...</div>
                ) : (
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Timestamp</th>
                                <th style={styles.th}>User</th>
                                <th style={styles.th}>Action</th>
                                <th style={styles.th}>Module</th>
                                <th style={styles.th}>Details</th>
                                <th style={styles.th}>AI</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log.id}>
                                    <td style={styles.td}><div style={{ color: colors.textMuted, fontSize: '0.825rem' }}>{new Date(log.timestamp).toLocaleString()}</div></td>
                                    <td style={styles.td}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <User size={14} color={colors.textMuted} />
                                            </div>
                                            <span style={{ fontWeight: 600 }}>{log.user_details?.full_name || log.user}</span>
                                        </div>
                                    </td>
                                    <td style={styles.td}><span style={{ fontWeight: 500 }}>{log.action}</span></td>
                                    <td style={styles.td}><span style={{ color: colors.primary, fontWeight: 600 }}>{log.module}</span></td>
                                    <td style={styles.td}><div style={{ fontSize: '0.825rem', color: colors.textMuted }}>{log.new_value}</div></td>
                                    <td style={styles.td}>
                                        {log.module === 'AI' && <span style={styles.aiBadge}><Shield size={10} /> AI Enhanced</span>}
                                    </td>
                                </tr>
                            ))}
                            {logs.length === 0 && (
                                <tr>
                                    <td colSpan="6" style={{ ...styles.td, textAlign: 'center', padding: '3rem', color: colors.textMuted }}>No audit logs found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default AuditLogsPage;
