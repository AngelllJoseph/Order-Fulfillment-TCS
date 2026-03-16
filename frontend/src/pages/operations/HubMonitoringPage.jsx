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
import { opsOrderService } from '../../services/orders';
import { X, Loader2, RefreshCw } from 'lucide-react';

const HubMonitoringPage = ({ colors, darkMode }) => {
    const [hubs, setHubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reassignModal, setReassignModal] = useState({ isOpen: false, hub: null });
    const [hubOrders, setHubOrders] = useState([]);
    const [fetchingOrders, setFetchingOrders] = useState(false);
    const [processingReassignment, setProcessingReassignment] = useState(null);

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

    const fetchHubOrders = async (hubId) => {
        try {
            setFetchingOrders(true);
            const res = await opsOrderService.getOrders({ hub: hubId });
            setHubOrders(res.data.results || res.data);
        } catch (err) {
            console.error("Failed to fetch hub orders:", err);
        } finally {
            setFetchingOrders(false);
        }
    };

    const handleReassign = async (itemId, newHubId) => {
        try {
            setProcessingReassignment(itemId);
            await opsOrderService.reassignItem(itemId, newHubId, "Optimizing hub load");
            await Promise.all([
                fetchHubOrders(reassignModal.hub.id),
                fetchHubs()
            ]);
        } catch (err) {
            console.error("Reassignment failed:", err);
            alert("Failed to reassign item. Please try again.");
        } finally {
            setProcessingReassignment(null);
        }
    };

    const openReassignModal = (hub) => {
        setReassignModal({ isOpen: true, hub });
        fetchHubOrders(hub.id);
    };

    const closeReassignModal = () => {
        setReassignModal({ isOpen: false, hub: null });
        setHubOrders([]);
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
                            <button 
                                style={{ ...styles.actionBtn, background: colors.primary, color: '#fff', border: 'none' }} 
                                onClick={() => openReassignModal(hub)}
                            >
                                <ArrowRight size={16} /> Reassign
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Reassignment Modal */}
            {reassignModal.isOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                    padding: '2rem'
                }}>
                    <div style={{
                        background: colors.surface,
                        borderRadius: '1.5rem',
                        width: '100%', maxWidth: '900px',
                        maxHeight: '90vh',
                        display: 'flex', flexDirection: 'column',
                        border: `1px solid ${colors.border}`,
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                        overflow: 'hidden'
                    }}>
                        <div style={{ 
                            padding: '1.5rem 2rem', 
                            borderBottom: `1px solid ${colors.border}`,
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            background: `${colors.primary}05`
                        }}>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Reassign Orders from {reassignModal.hub?.name}</h3>
                                <p style={{ fontSize: '0.875rem', color: colors.textMuted, margin: '0.25rem 0 0 0' }}>Select an order to move to another manufacturing hub</p>
                            </div>
                            <button onClick={closeReassignModal} style={{ background: 'transparent', border: 'none', color: colors.textMuted, cursor: 'pointer', padding: '0.5rem' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
                            {fetchingOrders ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '1rem' }}>
                                    <Loader2 className="animate-spin" size={32} color={colors.primary} />
                                    <span style={{ color: colors.textMuted }}>Fetching active orders...</span>
                                </div>
                            ) : hubOrders.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '3rem' }}>
                                    <Activity size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                    <h4 style={{ fontWeight: 600, color: colors.textMuted }}>No active orders found in this hub.</h4>
                                </div>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ textAlign: 'left', borderBottom: `1px solid ${colors.border}` }}>
                                            <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase' }}>Order / Item</th>
                                            <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase' }}>Qty</th>
                                            <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase' }}>Current Status</th>
                                            <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase' }}>Target Hub</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {hubOrders.map(order => (
                                            (order.items || [{id: order.id, sku: order.sku, quantity: order.quantity, product_details: order.product_details}]).map(item => (
                                                <tr key={item.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                                                    <td style={{ padding: '1.25rem 1rem' }}>
                                                        <div style={{ fontWeight: 600 }}>{order.order_id}</div>
                                                        <div style={{ fontSize: '0.75rem', color: colors.textMuted }}>{item.sku} - {item.product_details?.name || 'Product'}</div>
                                                    </td>
                                                    <td style={{ padding: '1.25rem 1rem' }}>{item.quantity}</td>
                                                    <td style={{ padding: '1.25rem 1rem' }}>
                                                        <span style={{ 
                                                            padding: '0.25rem 0.6rem', background: `${colors.primary}10`, color: colors.primary, 
                                                            borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 700 
                                                        }}>
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '1.25rem 1rem' }}>
                                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                            <select 
                                                                className="custom-select"
                                                                style={{
                                                                    padding: '0.5rem', borderRadius: '0.5rem', background: colors.bg, 
                                                                    border: `1px solid ${colors.border}`, color: colors.text, fontSize: '0.875rem'
                                                                }}
                                                                onChange={(e) => {
                                                                    const targetHubId = e.target.value;
                                                                    if (targetHubId) handleReassign(item.id, targetHubId);
                                                                }}
                                                                disabled={processingReassignment === item.id}
                                                            >
                                                                <option value="">Move to...</option>
                                                                {hubs.filter(h => h.id !== reassignModal.hub.id).map(h => (
                                                                    <option key={h.id} value={h.id}>{h.name} ({h.usage_percent}%)</option>
                                                                ))}
                                                            </select>
                                                            {processingReassignment === item.id && <Loader2 className="animate-spin" size={20} color={colors.primary} />}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <div style={{ padding: '1.5rem 2rem', borderTop: `1px solid ${colors.border}`, background: colors.bg, display: 'flex', justifyContent: 'flex-end' }}>
                            <button 
                                onClick={closeReassignModal}
                                style={{ 
                                    padding: '0.75rem 1.5rem', borderRadius: '0.75rem', 
                                    background: 'transparent', border: `1px solid ${colors.border}`, color: colors.text,
                                    fontWeight: 600, cursor: 'pointer' 
                                }}
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HubMonitoringPage;
