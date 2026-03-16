import React, { useState, useEffect } from 'react';
import { 
    AlertTriangle, 
    Zap, 
    Box, 
    Clock, 
    CheckCircle, 
    Info, 
    ChevronRight,
    Filter,
    RefreshCw
} from 'lucide-react';
import { opsService } from '../../services/operations';

const OperationsAlertsCenter = ({ colors, darkMode }) => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');

    useEffect(() => {
        fetchAlerts();
    }, []);

    const fetchAlerts = async () => {
        try {
            setLoading(true);
            const res = await opsService.getAlerts();
            setAlerts(res.data);
        } catch (err) {
            console.error("Failed to fetch alerts:", err);
        } finally {
            setLoading(false);
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'CRITICAL': return '#ef4444';
            case 'HIGH': return '#f97316';
            case 'MEDIUM': return '#f59e0b';
            case 'LOW': return '#3b82f6';
            default: return colors.textMuted;
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'CAPACITY': return <Zap size={18} />;
            case 'INVENTORY': return <Box size={18} />;
            case 'DELAY': return <Clock size={18} />;
            default: return <Info size={18} />;
        }
    };

    const filteredAlerts = filter === 'ALL' 
        ? alerts 
        : alerts.filter(a => a.type === filter);

    const styles = {
        container: {
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
        },
        controls: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
        },
        filterBar: {
            display: 'flex',
            gap: '0.75rem',
        },
        filterBtn: (active) => ({
            padding: '0.5rem 1rem',
            borderRadius: '0.75rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
            border: `1px solid ${active ? colors.primary : colors.border}`,
            background: active ? `${colors.primary}15` : colors.surface,
            color: active ? colors.primary : colors.textMuted,
            transition: 'all 0.2s ease',
        }),
        refreshBtn: {
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            borderRadius: '0.75rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
            border: `1px solid ${colors.border}`,
            background: colors.surface,
            color: colors.text,
        },
        alertList: {
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
        },
        alertCard: (severity) => ({
            background: colors.cardBg,
            border: `1px solid ${colors.border}`,
            borderLeft: `4px solid ${getSeverityColor(severity)}`,
            borderRadius: '1rem',
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            cursor: 'pointer',
            ':hover': {
                transform: 'translateX(4px)',
                boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.05)',
            }
        }),
        iconWrapper: (type, severity) => ({
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `${getSeverityColor(severity)}15`,
            color: getSeverityColor(severity),
        }),
        content: {
            flex: 1,
        },
        msg: {
            fontSize: '0.95rem',
            fontWeight: 500,
            color: colors.text,
            marginBottom: '0.25rem',
        },
        meta: {
            fontSize: '0.8rem',
            color: colors.textMuted,
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
        },
        badge: (severity) => ({
            padding: '0.25rem 0.6rem',
            borderRadius: '6px',
            fontSize: '0.7rem',
            fontWeight: 700,
            background: `${getSeverityColor(severity)}20`,
            color: getSeverityColor(severity),
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
        }),
        empty: {
            padding: '4rem',
            textAlign: 'center',
            color: colors.textMuted,
            background: colors.cardBg,
            borderRadius: '1.5rem',
            border: `1px dashed ${colors.border}`,
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.controls}>
                <div style={styles.filterBar}>
                    {['ALL', 'CAPACITY', 'INVENTORY', 'DELAY'].map(f => (
                        <button 
                            key={f} 
                            style={styles.filterBtn(filter === f)}
                            onClick={() => setFilter(f)}
                        >
                            {f.charAt(0) + f.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>
                <button style={styles.refreshBtn} onClick={fetchAlerts} disabled={loading}>
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {loading ? (
                <div style={{ color: colors.textMuted }}>Scanning for operational risks...</div>
            ) : filteredAlerts.length > 0 ? (
                <div style={styles.alertList}>
                    {filteredAlerts.map(alert => (
                        <div key={alert.id} style={styles.alertCard(alert.severity)}>
                            <div style={styles.iconWrapper(alert.type, alert.severity)}>
                                {getTypeIcon(alert.type)}
                            </div>
                            <div style={styles.content}>
                                <div style={styles.msg}>{alert.message}</div>
                                <div style={styles.meta}>
                                    <span style={styles.badge(alert.severity)}>{alert.severity}</span>
                                    <span>•</span>
                                    <span>{new Date(alert.created_at).toLocaleString()}</span>
                                    {alert.related_entity.hub_code && (
                                        <>
                                            <span>•</span>
                                            <span style={{ color: colors.primary }}>Hub: {alert.related_entity.hub_code}</span>
                                        </>
                                    )}
                                    {alert.related_entity.order_id && (
                                        <>
                                            <span>•</span>
                                            <span style={{ color: colors.secondary }}>Order: {alert.related_entity.order_id}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                            <ChevronRight size={20} color={colors.border} />
                        </div>
                    ))}
                </div>
            ) : (
                <div style={styles.empty}>
                    <CheckCircle size={48} color="#10b981" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <h3>System Healthy</h3>
                    <p style={{ marginTop: '0.5rem' }}>No critical operational alerts detected at this time.</p>
                </div>
            )}
            
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
            `}</style>
        </div>
    );
};

export default OperationsAlertsCenter;
