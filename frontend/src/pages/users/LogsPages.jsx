import React, { useState, useEffect } from 'react';
import { logService } from '../../services/api';
import { Activity, Clock, Shield, Search, Filter } from 'lucide-react';

const LogsPages = ({ colors, darkMode }) => {
    const [activeTab, setActiveTab] = useState('access');
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = activeTab === 'access' ?
                await logService.getAccessLogs() :
                await logService.getAuditLogs();
            setLogs(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [activeTab]);

    const styles = {
        container: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
        tabs: { display: 'flex', gap: '1rem', borderBottom: `1px solid ${colors.border}`, paddingBottom: '1rem' },
        tab: (active) => ({
            padding: '0.6rem 1.25rem', borderRadius: '0.75rem', cursor: 'pointer',
            background: active ? `${colors.primary}15` : 'transparent',
            color: active ? colors.primary : colors.textMuted,
            fontWeight: 600, border: 'none', transition: 'all 0.2s ease'
        }),
        tableContainer: {
            background: colors.cardBg, border: `1px solid ${colors.border}`,
            borderRadius: '1.25rem', overflowX: 'auto'
        },
        table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' },
        th: {
            padding: '1.25rem 1.5rem', background: colors.surface,
            color: colors.textMuted, fontSize: '0.75rem', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.05em',
            borderBottom: `1px solid ${colors.border}`
        },
        td: {
            padding: '1.25rem 1.5rem', borderBottom: `1px solid ${colors.border}`,
            fontSize: '0.875rem'
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.tabs}>
                <button style={styles.tab(activeTab === 'access')} onClick={() => setActiveTab('access')}>
                    Access Logs
                </button>
                <button style={styles.tab(activeTab === 'audit')} onClick={() => setActiveTab('audit')}>
                    Audit Logs
                </button>
            </div>

            <div style={styles.tableContainer}>
                <table style={styles.table}>
                    <thead>
                        {activeTab === 'access' ? (
                            <tr>
                                <th style={styles.th}>User</th>
                                <th style={styles.th}>Login Time</th>
                                <th style={styles.th}>Status</th>
                                <th style={styles.th}>IP & Device</th>
                            </tr>
                        ) : (
                            <tr>
                                <th style={styles.th}>Timestamp</th>
                                <th style={styles.th}>User</th>
                                <th style={styles.th}>Action</th>
                                <th style={styles.th}>Module</th>
                            </tr>
                        )}
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" style={{ ...styles.td, textAlign: 'center' }}>Loading logs...</td></tr>
                        ) : logs.map(log => (
                            <tr key={log.id}>
                                {activeTab === 'access' ? (
                                    <>
                                        <td style={styles.td}>{log.user_details?.email || 'Unknown'}</td>
                                        <td style={styles.td}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Clock size={14} color={colors.textMuted} />
                                                {new Date(log.login_time).toLocaleString()}
                                            </div>
                                        </td>
                                        <td style={styles.td}>
                                            <span style={{
                                                color: log.login_status === 'SUCCESS' ? '#10b981' : '#ef4444',
                                                fontWeight: 600
                                            }}>{log.login_status}</span>
                                        </td>
                                        <td style={styles.td}>
                                            <div style={{ fontSize: '0.75rem' }}>{log.ip_address}</div>
                                            <div style={{ fontSize: '0.7rem', color: colors.textMuted }} title={log.device}>
                                                {log.device?.substring(0, 30)}...
                                            </div>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td style={styles.td}>{new Date(log.timestamp).toLocaleString()}</td>
                                        <td style={styles.td}>{log.user_details?.email || 'System'}</td>
                                        <td style={styles.td}>
                                            <span style={{ fontWeight: 600 }}>{log.action}</span>
                                        </td>
                                        <td style={styles.td}>
                                            <span style={{
                                                padding: '0.2rem 0.5rem', background: `${colors.secondary}15`,
                                                color: colors.secondary, borderRadius: '4px', fontSize: '0.75rem'
                                            }}>{log.module}</span>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LogsPages;
