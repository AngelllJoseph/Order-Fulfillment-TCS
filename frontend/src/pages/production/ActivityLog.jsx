import React, { useState, useEffect } from 'react';
import { RefreshCw, Activity, ArrowRight, Clock, Tag, Factory, Settings, ShieldCheck, PackageCheck, Truck, CheckCircle, AlertTriangle } from 'lucide-react';
import { opsOrderService } from '../../services/orders';

const ActivityLog = ({ colors, darkMode }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const STAGE_ICONS = {
        'ASSIGNED': Factory,
        'MANUFACTURING': Settings,
        'QUALITY_TEST': ShieldCheck,
        'COMPLETED_MANUFACTURING': PackageCheck,
        'DESPATCHED_TO_WAREHOUSE': Factory,
        'DESPATCHED_TO_CUSTOMER': Truck,
        'COMPLETED': CheckCircle,
        'DELAYED': AlertTriangle,
    };

    const getStageColor = (status) => {
        if (status === 'COMPLETED') return '#10b981';
        if (status === 'DELAYED' || status === 'CANCELLED') return '#ef4444';
        if (['MANUFACTURING', 'QUALITY_TEST', 'COMPLETED_MANUFACTURING'].includes(status)) return colors.secondary;
        return colors.primary;
    };

    const fetchLogs = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await opsOrderService.getActivityLog();
            setLogs(response.data);
        } catch (err) {
            console.error("Failed to fetch activity logs", err);
            setError("Unable to load activity history. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const styles = {
        container: { padding: '1rem', fontFamily: "'Inter', sans-serif" },
        headerCard: {
            background: colors.cardBg,
            borderRadius: '1.25rem',
            border: `1px solid ${colors.border}`,
            padding: '1.5rem 2rem',
            marginBottom: '2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        },
        titleContainer: { display: 'flex', alignItems: 'center', gap: '1rem' },
        iconWrapper: {
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: `linear-gradient(135deg, ${colors.primary}22, ${colors.secondary}22)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: colors.primary
        },
        refreshBtn: {
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.25rem',
            borderRadius: '0.75rem',
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            color: colors.text,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
        },
        timelineContainer: {
            background: colors.cardBg,
            borderRadius: '1.25rem',
            border: `1px solid ${colors.border}`,
            padding: '2rem',
            position: 'relative'
        },
        timelineLine: {
            position: 'absolute',
            left: '3.5rem',
            top: '2rem',
            bottom: '2rem',
            width: '2px',
            background: colors.border,
            zIndex: 1
        },
        logItem: {
            display: 'flex',
            gap: '1.5rem',
            marginBottom: '2rem',
            position: 'relative',
            zIndex: 2
        },
        logIcon: (status) => ({
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: colors.surface,
            border: `2px solid ${getStageColor(status)}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: getStageColor(status),
            flexShrink: 0,
            boxShadow: `0 0 0 4px ${colors.bg}`
        }),
        logContent: {
            flex: 1,
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: '1rem',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
        },
        logHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start'
        },
        orderIdBadge: {
            padding: '0.25rem 0.75rem',
            background: `${colors.primary}22`,
            color: colors.primary,
            borderRadius: '2rem',
            fontSize: '0.75rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem'
        },
        statusBadge: (status) => ({
            padding: '0.25rem 0.75rem',
            background: `${getStageColor(status)}22`,
            color: getStageColor(status),
            borderRadius: '2rem',
            fontSize: '0.75rem',
            fontWeight: 700,
        }),
        timeText: {
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            color: colors.textMuted,
            fontSize: '0.8rem'
        },
        notesBox: {
            marginTop: '0.5rem',
            padding: '1rem',
            background: colors.bg,
            borderRadius: '0.75rem',
            border: `1px solid ${colors.border}`,
            fontSize: '0.9rem',
            color: colors.text,
            fontStyle: 'italic'
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.headerCard}>
                <div style={styles.titleContainer}>
                    <div style={styles.iconWrapper}>
                        <Activity size={24} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: colors.text, margin: 0 }}>Production Activity Log</h2>
                        <p style={{ color: colors.textMuted, margin: 0, marginTop: '0.25rem', fontSize: '0.9rem' }}>
                            A chronological history of all stage changes across the manufacturing lifecycle.
                        </p>
                    </div>
                </div>
                <button 
                    style={styles.refreshBtn} 
                    onClick={fetchLogs} 
                    disabled={loading}
                    onMouseEnter={(e) => e.currentTarget.style.background = colors.surfaceHover}
                    onMouseLeave={(e) => e.currentTarget.style.background = colors.surface}
                >
                    <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    {loading ? 'Refreshing...' : 'Refresh Logs'}
                </button>
            </div>

            <div style={styles.timelineContainer}>
                {loading && logs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: colors.textMuted }}>Loading activity history...</div>
                ) : error ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#ef4444' }}>{error}</div>
                ) : logs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: colors.textMuted }}>
                        <Activity size={48} opacity={0.5} style={{ margin: '0 auto 1rem auto' }} />
                        No production activity found yet.
                    </div>
                ) : (
                    <>
                        <div style={styles.timelineLine} />
                        {logs.map((log, index) => {
                            const IconCmp = STAGE_ICONS[log.status] || Settings;
                            return (
                                <div key={log.id} style={{ ...styles.logItem, marginBottom: index === logs.length - 1 ? 0 : '2rem' }}>
                                    <div style={styles.logIcon(log.status)}>
                                        <IconCmp size={24} />
                                    </div>
                                    <div style={styles.logContent}>
                                        <div style={styles.logHeader}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <span style={styles.orderIdBadge}>
                                                    <Tag size={12} /> {log.order_id}
                                                </span>
                                                <span style={styles.statusBadge(log.status)}>
                                                    Moved to {log.status.replace(/_/g, ' ')}
                                                </span>
                                            </div>
                                            <span style={styles.timeText}>
                                                <Clock size={14} />
                                                {new Date(log.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                        
                                        <div style={{ marginTop: '0.25rem', fontWeight: 600, color: colors.text }}>
                                            {log.product_name} <span style={{ color: colors.textMuted, fontWeight: 400, marginLeft: '0.5rem' }}>({log.sku})</span>
                                        </div>
                                        
                                        <div style={{ fontSize: '0.85rem', color: colors.textMuted, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            Initiated by: <strong style={{ color: colors.text }}>{log.changed_by_name || 'System Auto-Assignment'}</strong>
                                        </div>

                                        {log.notes && (
                                            <div style={styles.notesBox}>
                                                "{log.notes}"
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </>
                )}
            </div>
            <style>{`
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default ActivityLog;
