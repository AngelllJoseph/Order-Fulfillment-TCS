import { useState, useEffect } from 'react';
import {
    Factory,
    MapPin,
    TrendingUp,
    ArrowRight,
    AlertCircle,
    CheckCircle,
    Activity
} from 'lucide-react';
import { opsHubService } from '../../services/hubs';

const HubMonitoringPage = ({ colors, darkMode }) => {
    const [hubs, setHubs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHubs();
    }, []);

    const fetchHubs = async () => {
        try {
            setLoading(true);
            const res = await opsHubService.getMonitoringStats();
            setHubs(res.data);
        } catch (err) {
            console.error("Failed to fetch hub monitoring data:", err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (health) => {
        switch (health) {
            case 'GREEN': return '#10b981';
            case 'YELLOW': return '#f59e0b';
            case 'RED': return '#ef4444';
            default: return colors.primary;
        }
    };

    const styles = {
        grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' },
        card: {
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: '1.25rem',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
        },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
        title: { fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.25rem' },
        badge: (health) => ({
            padding: '0.25rem 0.6rem',
            borderRadius: '2rem',
            fontSize: '0.7rem',
            fontWeight: 700,
            background: `${getStatusColor(health)}15`,
            color: getStatusColor(health),
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
        }),
        metric: { flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' },
        metricLabel: { fontSize: '0.75rem', color: colors.textMuted, textTransform: 'uppercase', fontWeight: 700 },
        metricValue: { fontSize: '1.125rem', fontWeight: 700 },
        progressBar: (percent, health) => ({
            height: '8px',
            width: '100%',
            background: colors.bg,
            borderRadius: '4px',
            overflow: 'hidden',
        }),
        progressFill: (percent, health) => ({
            height: '100%',
            width: `${percent}%`,
            background: getStatusColor(health),
            borderRadius: '4px',
        }),
        actionBtn: {
            width: '100%',
            padding: '0.75rem',
            borderRadius: '0.75rem',
            background: colors.bg,
            border: `1px solid ${colors.border}`,
            color: colors.text,
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            marginTop: '0.5rem'
        }
    };

    if (loading) return <div style={{ color: colors.textMuted }}>Initializing hub telemetry...</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Manufacturing Hubs Performance</h2>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: colors.textMuted }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div> Healthy
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></div> Near Capacity
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></div> Overloaded
                    </div>
                </div>
            </div>

            <div style={styles.grid}>
                {hubs.map(hub => (
                    <div key={hub.id} style={styles.card}>
                        <div style={styles.header}>
                            <div>
                                <h3 style={styles.title}>{hub.name}</h3>
                                <div style={{ fontSize: '0.875rem', color: colors.textMuted, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <MapPin size={14} /> {hub.location}
                                </div>
                            </div>
                            <span style={styles.badge(hub.health)}>
                                {hub.health === 'GREEN' ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
                                {hub.health === 'GREEN' ? 'Healthy' : hub.health === 'YELLOW' ? 'Near Capacity' : 'Overloaded'}
                            </span>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div style={styles.metric}>
                                <span style={styles.metricLabel}>Current Load</span>
                                <span style={styles.metricValue}>{hub.current_load}</span>
                            </div>
                            <div style={styles.metric}>
                                <span style={styles.metricLabel}>Max Capacity</span>
                                <span style={styles.metricValue}>{hub.max_capacity}</span>
                            </div>
                            <div style={styles.metric}>
                                <span style={styles.metricLabel}>Active Orders</span>
                                <span style={{ ...styles.metricValue, color: colors.primary }}>{hub.active_orders}</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600 }}>
                                <span style={{ color: colors.textMuted }}>Capacity Utilization</span>
                                <span style={{ color: getStatusColor(hub.health) }}>{hub.usage_percent}%</span>
                            </div>
                            <div style={styles.progressBar(hub.usage_percent, hub.health)}>
                                <div style={styles.progressFill(hub.usage_percent, hub.health)}></div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button style={styles.actionBtn} onClick={() => alert(`Detailed monitoring view for ${hub.name} will be added soon.`)}>
                                <Activity size={16} /> Hub Details
                            </button>
                            <button style={{ ...styles.actionBtn, background: colors.primary, color: '#fff', border: 'none' }} onClick={() => alert(`Reassignment workflow for ${hub.name} is currently unavailable.`)}>
                                <ArrowRight size={16} /> Reassign
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HubMonitoringPage;
