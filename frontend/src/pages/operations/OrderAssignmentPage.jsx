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
import { aiService } from '../../services/ai';

const OrderAssignmentPage = ({ colors, darkMode }) => {
    const [unassignedItems, setUnassignedItems] = useState([]);
    const [assignedOrders, setAssignedOrders] = useState([]);
    const [hubs, setHubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState(null);
    const [recommending, setRecommending] = useState(false);
    const [selectedHubs, setSelectedHubs] = useState({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [unassignedRes, assignedRes, hubsRes, aiRes] = await Promise.all([
                opsOrderService.getUnassignedOrders(),
                opsOrderService.getOrders({ status: 'ASSIGNED' }),
                opsHubService.getMonitoringStats(),
                aiService.getDecisions({ status: 'WAITING_APPROVAL' })
            ]);
            
            const orders = unassignedRes.data.results || unassignedRes.data;
            const decisions = aiRes.data.results || aiRes.data;

            // We need to flatten orders into unassigned items
            let items = [];
            orders.forEach(order => {
                order.items.forEach(item => {
                    if (item.assignment_status === 'PENDING' || !item.assigned_hub) {
                        // Find AI decision for this specific item (backward compatible with item.ai_decision)
                        const decision = decisions.find(d => 
                            d.related_item === item.id || d.id === item.ai_decision
                        );
                        items.push({
                            ...item,
                            order_id: order.order_id,
                            order_pk: order.id,
                            customer_name: order.customer_name,
                            ai_decision: decision
                        });
                    }
                });
            });

            // TRIGGER PROACTIVE AI: If any unassigned items lack an AI decision, ideally we would trigger it,
            // but the backend assignment_agent should run on cron or explicit call.
            // For now, we'll just display them.

            setUnassignedItems(items);
            setAssignedOrders(assignedRes.data.results || assignedRes.data);
            setHubs(hubsRes.data);

            const initialSelections = {};
            items.forEach(item => {
                const hubId = item.ai_decision?.recommendation?.recommended_hub_id;
                if (hubId) {
                    initialSelections[item.id] = hubId;
                }
            });
            setSelectedHubs(initialSelections);
        } catch (err) {
            console.error("Failed to fetch assignment data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async (itemId, hubId) => {
        if (!hubId) return;
        try {
            setAssigning(itemId);
            await opsOrderService.reassignItem(itemId, hubId, "Initial assignment");
            fetchData();
        } catch (err) {
            console.error("Assignment failed:", err);
            alert("Failed to assign hub. Please try again.");
        } finally {
            setAssigning(null);
        }
    };

    const handleBulkRecommend = async () => {
        try {
            setRecommending(true);
            await aiService.bulkRecommend();
            fetchData();
        } catch (err) {
            console.error("Bulk recommendation failed:", err);
            alert("Failed to generate AI recommendations.");
        } finally {
            setRecommending(false);
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
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Unassigned Items ({unassignedItems.length})</h2>
                    <button 
                        onClick={handleBulkRecommend} 
                        disabled={recommending || unassignedItems.every(i => i.ai_decision)}
                        style={{ 
                            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', 
                            background: `${colors.primary}15`, color: colors.primary, borderRadius: '2rem', 
                            fontSize: '0.8rem', fontWeight: 600, border: 'none', cursor: 'pointer',
                            opacity: (recommending || unassignedItems.every(i => i.ai_decision)) ? 0.5 : 1
                        }}
                    >
                        <Brain size={14} /> {recommending ? 'Analyzing...' : 'Auto-Generate AI Assignment'}
                    </button>
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
                        {unassignedItems.map(item => (
                            <tr key={item.id}>
                                <td style={styles.td}><span style={{ fontWeight: 700 }}>{item.order_id}</span></td>
                                <td style={styles.td}>
                                    <div style={{ fontWeight: 600 }}>{item.product_name}</div>
                                    <div style={{ fontSize: '0.75rem', color: colors.textMuted }}>{item.product_sku}</div>
                                </td>
                                <td style={styles.td}>{item.quantity}</td>
                                <td style={styles.td}>
                                    {item.ai_decision ? (
                                        <div style={{ 
                                            display: 'flex', 
                                            flexDirection: 'column', 
                                            gap: '0.4rem',
                                            padding: '0.6rem',
                                            paddingBottom: '0.8rem',
                                            background: `${colors.primary}08`,
                                            borderRadius: '0.8rem',
                                            border: `1px solid ${colors.primary}20`,
                                            position: 'relative',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                                                <span style={{...styles.aiBadge, background: colors.primary, color: '#fff', padding: '0.25rem 0.6rem', margin: 0}}>
                                                    <Brain size={12} /> {item.ai_decision.recommendation?.hub_name || 'Recommended Hub'}
                                                </span>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: colors.primary }}>
                                                    {(item.ai_decision.confidence_score * 100).toFixed(0)}% Match
                                                </span>
                                            </div>
                                            <span style={{ fontSize: '0.75rem', color: colors.text, opacity: 0.9, fontStyle: 'italic', lineHeight: '1.2' }}>
                                                "{item.ai_decision.recommendation?.reasoning_text}"
                                            </span>
                                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: colors.primary, opacity: 0.3 }} />
                                        </div>
                                    ) : (
                                        <div style={{ padding: '0.5rem', textAlign: 'center' }}>
                                            <span style={{ color: colors.textMuted, fontSize: '0.8rem' }}>No AI Suggestion Available</span>
                                        </div>
                                    )}
                                </td>
                                <td style={styles.td}>
                                    <select
                                        style={styles.hubSelect}
                                        value={selectedHubs[item.id] || ''}
                                        onChange={(e) => setSelectedHubs({ ...selectedHubs, [item.id]: e.target.value })}
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
                                        style={{ ...styles.assignBtn, opacity: (assigning === item.id || !selectedHubs[item.id]) ? 0.5 : 1 }}
                                        onClick={() => handleAssign(item.id, selectedHubs[item.id])}
                                        disabled={assigning === item.id || !selectedHubs[item.id]}
                                    >
                                        {assigning === item.id ? 'Assigning...' : 'Confirm Assignment'} <ArrowRight size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {unassignedItems.length === 0 && (
                    <div style={{ padding: '3rem', textAlign: 'center' }}>
                        <div style={{ color: colors.primary, marginBottom: '1rem' }}><CheckCircle size={48} /></div>
                        <h3 style={{ fontWeight: 700, fontSize: '1.25rem' }}>All Caught Up!</h3>
                        <p style={{ color: colors.textMuted, fontSize: '0.875rem' }}>No items are currently pending assignment.</p>
                    </div>
                )}
            </div>

            {/* Assigned Orders Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Assigned Orders ({assignedOrders.length})</h2>
            </div>

            <div style={styles.tableContainer}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Order ID</th>
                            <th style={styles.th}>Customer</th>
                            <th style={styles.th}>Items Count</th>
                            <th style={styles.th}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {assignedOrders.map(order => (
                            <tr key={order.order_id}>
                                <td style={styles.td}><span style={{ fontWeight: 700 }}>{order.order_id}</span></td>
                                <td style={styles.td}>
                                    <div style={{ fontWeight: 600 }}>{order.customer_name}</div>
                                </td>
                                <td style={styles.td}>{order.items?.length || 1} items</td>
                                <td style={styles.td}>
                                    <span style={{
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '0.375rem',
                                        background: `${colors.primary}15`,
                                        color: colors.primary,
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                    }}>
                                        {order.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {assignedOrders.length === 0 && (
                    <div style={{ padding: '3rem', textAlign: 'center' }}>
                        <p style={{ color: colors.textMuted, fontSize: '0.875rem' }}>No assigned orders found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderAssignmentPage;
