import { useState, useEffect } from 'react';
import {
    Search,
    Factory,
    Brain,
    CheckCircle,
    AlertCircle,
    ChevronRight,
    ArrowRight,
    Info
} from 'lucide-react';
import { opsOrderService } from '../../services/orders';
import { opsHubService } from '../../services/hubs';

const OrderAssignmentPage = ({ colors, darkMode }) => {
    const [unassignedOrders, setUnassignedOrders] = useState([]);
    const [hubs, setHubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState(null);
    const [selectedHubs, setSelectedHubs] = useState({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [ordersRes, hubsRes] = await Promise.all([
                opsOrderService.getUnassignedOrders(),
                opsHubService.getMonitoringStats()
            ]);
            setUnassignedOrders(ordersRes.data);
            setHubs(hubsRes.data);
        } catch (err) {
            console.error("Failed to fetch assignment data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async (orderId, hubId) => {
        if (!hubId) return;
        try {
            setAssigning(orderId);
            await opsOrderService.assignHub(orderId, hubId);
            // Refresh counts
            fetchData();
        } catch (err) {
            console.error("Assignment failed:", err);
            alert("Failed to assign hub. Please try again.");
        } finally {
            setAssigning(null);
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
        aiBadge: {
            padding: '0.25rem 0.5rem',
            borderRadius: '0.375rem',
            background: `${colors.secondary}15`,
            color: colors.secondary,
            fontSize: '0.7rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
        },
        hubSelect: {
            padding: '0.5rem',
            borderRadius: '0.5rem',
            background: colors.bg,
            border: `1px solid ${colors.border}`,
            color: colors.text,
            fontSize: '0.875rem',
            outline: 'none',
            width: '180px'
        },
        assignBtn: {
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            background: colors.primary,
            color: '#fff',
            border: 'none',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.825rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
        }
    };

    if (loading) return <div style={{ color: colors.textMuted }}>Loading assignment workflows...</div>;

    return (
        <div style={styles.container}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Unassigned Orders ({unassignedOrders.length})</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.75rem', background: `${colors.primary}15`, color: colors.primary, borderRadius: '2rem', fontSize: '0.8rem', fontWeight: 600 }}>
                        <Brain size={14} /> AI Recommendation Ready
                    </div>
                </div>
                <div style={styles.aiBadge}><Info size={14} /> View Hub Capacity</div>
            </div>

            <div style={styles.tableContainer}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Order ID</th>
                            <th style={styles.th}>Product & SKU</th>
                            <th style={styles.th}>Qty</th>
                            <th style={styles.th}>AI Recommendation</th>
                            <th style={styles.th}>Select Hub</th>
                            <th style={styles.th}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {unassignedOrders.map(order => (
                            <tr key={order.order_id}>
                                <td style={styles.td}><span style={{ fontWeight: 700 }}>{order.order_id}</span></td>
                                <td style={styles.td}>
                                    <div style={{ fontWeight: 600 }}>{order.product_details?.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: colors.textMuted }}>{order.sku}</div>
                                </td>
                                <td style={styles.td}>{order.quantity}</td>
                                <td style={styles.td}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        <span style={styles.aiBadge}><Brain size={12} /> Hub B (Confidence 94%)</span>
                                        <span style={{ fontSize: '0.7rem', color: colors.textMuted }}>Reason: Lowest current load & closest to shipping address.</span>
                                    </div>
                                </td>
                                <td style={styles.td}>
                                    <select
                                        style={styles.hubSelect}
                                        value={selectedHubs[order.id] || ''}
                                        onChange={(e) => setSelectedHubs({ ...selectedHubs, [order.id]: e.target.value })}
                                    >
                                        <option value="">Select Hub</option>
                                        {hubs.map(hub => (
                                            <option key={hub.id} value={hub.id}>
                                                {hub.name} ({hub.usage_percent}%)
                                            </option>
                                        ))}
                                    </select>
                                </td>
                                <td style={styles.td}>
                                    <button
                                        style={{ ...styles.assignBtn, opacity: (assigning === order.id || !selectedHubs[order.id]) ? 0.5 : 1 }}
                                        onClick={() => handleAssign(order.id, selectedHubs[order.id])}
                                        disabled={assigning === order.id || !selectedHubs[order.id]}
                                    >
                                        {assigning === order.id ? 'Assigning...' : 'Confirm Assignment'} <ArrowRight size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {unassignedOrders.length === 0 && (
                    <div style={{ padding: '3rem', textAlign: 'center' }}>
                        <div style={{ color: colors.primary, marginBottom: '1rem' }}><CheckCircle size={48} /></div>
                        <h3 style={{ fontWeight: 700, fontSize: '1.25rem' }}>All Caught Up!</h3>
                        <p style={{ color: colors.textMuted, fontSize: '0.875rem' }}>No orders are currently pending assignment.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderAssignmentPage;
