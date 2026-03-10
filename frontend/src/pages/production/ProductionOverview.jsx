import React from 'react';
import { Clock, PlayCircle, AlertTriangle, TrendingUp, Activity, Inbox, Target, Zap } from 'lucide-react';

const ProductionOverview = ({ colors }) => {
    // Mock data for the dashboard
    const metrics = [
        { title: 'Orders In Queue', value: '42', icon: Inbox, color: '#3b82f6', trend: '+5 since yesterday' },
        { title: 'In Production', value: '18', icon: PlayCircle, color: '#a855f7', trend: 'On schedule' },
        { title: 'Delayed Orders', value: '3', icon: AlertTriangle, color: '#ef4444', trend: 'Requires attention' },
    ];

    const alerts = [
        { id: 1, message: 'Stock for Part A running low in Hub 1', time: '10m ago', severity: 'warning' },
        { id: 2, message: 'Production line 3 efficiency dropped by 15%', time: '1h ago', severity: 'critical' },
        { id: 3, message: 'Maintenance recommended for CNC machine', time: '2h ago', severity: 'info' },
    ];

    const getSeverityColor = (severity) => {
        switch(severity) {
            case 'critical': return '#ef4444';
            case 'warning': return '#f59e0b';
            default: return '#3b82f6';
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Top Metrics Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                {metrics.map((metric, index) => (
                    <div key={index} style={{
                        background: colors.cardBg,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '1rem',
                        padding: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        transition: 'transform 0.2s',
                        cursor: 'pointer'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '12px',
                                background: `${metric.color}20`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: metric.color
                            }}>
                                <metric.icon size={24} />
                            </div>
                            <span style={{ fontSize: '0.875rem', color: colors.textMuted, fontWeight: 500 }}>
                                {metric.trend}
                            </span>
                        </div>
                        <div>
                            <h3 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, color: colors.text }}>
                                {metric.value}
                            </h3>
                            <p style={{ color: colors.textMuted, margin: '0.25rem 0 0 0', fontWeight: 500 }}>
                                {metric.title}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Middle Section: Workload & Capacity */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                
                {/* Today's Workload */}
                <div style={{
                    background: colors.cardBg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '1rem',
                    padding: '1.5rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <Target size={20} color={colors.primary} />
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Today's Workload</h2>
                    </div>
                    
                    <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ color: colors.textMuted, fontSize: '0.875rem' }}>Target: 60 Orders</span>
                            <span style={{ color: colors.primary, fontWeight: 600, fontSize: '0.875rem' }}>35% Completed</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: `${colors.border}`, borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: '35%', height: '100%', background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`, borderRadius: '4px' }}></div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: `${colors.bg}`, borderRadius: '0.75rem', border: `1px solid ${colors.border}` }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>21</span>
                            <span style={{ fontSize: '0.75rem', color: colors.textMuted }}>Completed Today</span>
                        </div>
                        <div style={{ height: '40px', width: '1px', background: colors.border }}></div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>39</span>
                            <span style={{ fontSize: '0.75rem', color: colors.textMuted }}>Remaining</span>
                        </div>
                    </div>
                </div>

                {/* Hub Capacity */}
                <div style={{
                    background: colors.cardBg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '1rem',
                    padding: '1.5rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <Activity size={20} color="#10b981" />
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Hub Capacity</h2>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                        {/* Circular Progress Simulation */}
                        <div style={{
                            position: 'relative', width: '140px', height: '140px', borderRadius: '50%',
                            background: `conic-gradient(#10b981 78%, ${colors.border} 78%)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <div style={{
                                width: '110px', height: '110px', borderRadius: '50%',
                                background: colors.cardBg,
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <span style={{ fontSize: '2rem', fontWeight: 800 }}>78%</span>
                                <span style={{ fontSize: '0.75rem', color: colors.textMuted }}>Utilized</span>
                            </div>
                        </div>
                    </div>
                    <p style={{ textAlign: 'center', color: colors.textMuted, fontSize: '0.875rem', margin: 0 }}>
                        Currently operating at optimal efficiency. Capacity is sufficient for queued orders.
                    </p>
                </div>
            </div>

            {/* Bottom Section: AI Alerts */}
            <div style={{
                background: colors.cardBg,
                border: `1px solid ${colors.border}`,
                borderRadius: '1rem',
                padding: '1.5rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <Zap size={20} color="#f59e0b" />
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>AI Alerts & Insights</h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {alerts.map(alert => (
                        <div key={alert.id} style={{
                            display: 'flex', alignItems: 'flex-start', gap: '1rem',
                            padding: '1rem', borderRadius: '0.75rem',
                            background: `${getSeverityColor(alert.severity)}10`,
                            border: `1px solid ${getSeverityColor(alert.severity)}30`
                        }}>
                            <div style={{ color: getSeverityColor(alert.severity), marginTop: '2px' }}>
                                <AlertTriangle size={18} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ margin: '0 0 0.25rem 0', fontWeight: 500, color: colors.text }}>
                                    {alert.message}
                                </p>
                                <span style={{ fontSize: '0.75rem', color: colors.textMuted }}>
                                    {alert.time} • System generated
                                </span>
                            </div>
                            <button style={{
                                background: 'transparent',
                                border: `1px solid ${colors.border}`,
                                color: colors.text,
                                padding: '0.25rem 0.75rem',
                                borderRadius: '0.5rem',
                                fontSize: '0.75rem',
                                cursor: 'pointer'
                            }}>
                                Review
                            </button>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
};

export default ProductionOverview;
