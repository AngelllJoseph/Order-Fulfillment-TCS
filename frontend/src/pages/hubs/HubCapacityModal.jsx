import React from 'react';
import {
    X, Package, TrendingUp, CheckCircle,
    AlertCircle, BarChart3, PieChart, Activity
} from 'lucide-react';

const HubCapacityModal = ({ hub, onCancel, colors, darkMode }) => {
    const total = hub.max_daily_capacity || 0;
    const current = hub.current_load || 0;
    const available = total - current;
    const utilization = Math.round(hub.capacity_utilization || 0);

    const styles = {
        overlay: {
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)', zIndex: 1100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)'
        },
        container: {
            background: colors.surface, borderRadius: '1.25rem',
            width: '100%', maxWidth: '600px',
            border: `1px solid ${colors.border}`,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden'
        },
        header: {
            padding: '1.5rem 2rem', borderBottom: `1px solid ${colors.border}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        },
        content: {
            padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem'
        },
        grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' },
        metricCard: {
            padding: '1.25rem', background: colors.bg, borderRadius: '1rem',
            border: `1px solid ${colors.border}`, display: 'flex',
            flexDirection: 'column', gap: '0.5rem'
        },
        metricValue: { fontSize: '1.5rem', fontWeight: 800, color: colors.text },
        metricLabel: { fontSize: '0.75rem', fontWeight: 600, color: colors.textMuted },
        progressSection: {
            padding: '1.5rem', background: `${colors.primary}05`,
            borderRadius: '1rem', border: `1px solid ${colors.border}`,
            display: 'flex', flexDirection: 'column', gap: '1rem'
        },
        progressBarCont: {
            height: '12px', background: colors.border, borderRadius: '6px',
            overflow: 'hidden', position: 'relative'
        },
        progressBarFill: {
            height: '100%', width: `${utilization}%`,
            background: utilization > 90 ? '#ef4444' : utilization > 70 ? '#f59e0b' : colors.primary,
            transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
        }
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.container}>
                <header style={styles.header}>
                    <div>
                        <h2 style={{ margin: 0, color: colors.text }}>Capacity Monitoring</h2>
                        <div style={{ fontSize: '0.875rem', color: colors.textMuted }}>Live metrics for <strong>{hub.name}</strong></div>
                    </div>
                    <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted }}>
                        <X size={24} />
                    </button>
                </header>

                <div style={styles.content}>
                    <div style={styles.grid}>
                        <div style={styles.metricCard}>
                            <span style={styles.metricLabel}>Total Capacity</span>
                            <span style={styles.metricValue}>{total} <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>orders</span></span>
                        </div>
                        <div style={styles.metricCard}>
                            <span style={styles.metricLabel}>Current Orders</span>
                            <span style={styles.metricValue}>{current}</span>
                        </div>
                        <div style={styles.metricCard}>
                            <span style={styles.metricLabel}>Available Capacity</span>
                            <span style={{ ...styles.metricValue, color: '#10b981' }}>{available}</span>
                        </div>
                        <div style={styles.metricCard}>
                            <span style={styles.metricLabel}>Utilization Rate</span>
                            <span style={{ ...styles.metricValue, color: utilization > 90 ? '#ef4444' : colors.primary }}>{utilization}%</span>
                        </div>
                    </div>

                    <div style={styles.progressSection}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Activity size={18} color={colors.primary} /> Usage Overview
                            </span>
                            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: utilization > 90 ? '#ef4444' : colors.textMuted }}>
                                {utilization > 90 ? 'Critical Load' : utilization > 70 ? 'High Load' : 'Stable'}
                            </span>
                        </div>
                        <div style={styles.progressBarCont}>
                            <div style={styles.progressBarFill} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: colors.textMuted }}>
                            <span>0%</span>
                            <span>50%</span>
                            <span>100%</span>
                        </div>
                    </div>
                </div>

                <footer style={{ padding: '1.5rem 2rem', borderTop: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={onCancel} style={{ padding: '0.75rem 1.5rem', borderRadius: '0.75rem', background: colors.primary, color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                        Close Monitor
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default HubCapacityModal;
