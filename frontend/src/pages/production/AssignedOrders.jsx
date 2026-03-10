import React, { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    ArrowRight,
    Play,
    Tag,
    Calendar,
    ArrowUpDown,
    Settings
} from 'lucide-react';
import { opsOrderService } from '../../services/orders';

const AssignedOrders = ({ colors, darkMode, onOpenProduction }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchOrders();
    }, [searchQuery]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const params = {
                status__in: 'ASSIGNED,MANUFACTURING,QUALITY_TEST,COMPLETED_MANUFACTURING,DESPATCHED_TO_WAREHOUSE,DELAYED',
                sku: searchQuery || undefined,
            };
            const res = await opsOrderService.getOrders(params);
            setOrders(res.data);
        } catch (err) {
            console.error("Failed to fetch assigned orders:", err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyle = (status) => {
        let bg = '#818cf8';
        if (status === 'DELAYED') bg = '#ef4444';
        else if (status === 'COMPLETED_MANUFACTURING' || status === 'DESPATCHED_TO_WAREHOUSE') bg = '#f59e0b';
        else if (status !== 'ASSIGNED') bg = '#10b981';

        return {
            padding: '0.25rem 0.5rem',
            borderRadius: '0.375rem',
            fontSize: '0.7rem',
            fontWeight: 700,
            background: bg,
            color: '#fff'
        };
    };

    const styles = {
        container: { display: 'flex', flexDirection: 'column', gap: '1.5rem', fontFamily: "'Inter', sans-serif" },
        filters: { display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' },
        searchWrap: { position: 'relative', flex: 1, maxWidth: '400px' },
        searchInput: {
            width: '100%',
            padding: '0.6rem 1rem 0.6rem 2.5rem',
            borderRadius: '0.75rem',
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            color: colors.text,
            outline: 'none',
            fontSize: '0.875rem'
        },
        filterBtn: {
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1rem',
            borderRadius: '0.75rem',
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            color: colors.text,
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer'
        },
        tableContainer: {
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: '1.25rem',
            overflowX: 'auto'
        },
        table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1000px' },
        th: {
            padding: '1.25rem 1.5rem',
            borderBottom: `1px solid ${colors.border}`,
            color: colors.textMuted,
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase'
        },
        td: {
            padding: '1.25rem 1.5rem',
            borderBottom: `1px solid ${colors.border}`,
            fontSize: '0.875rem'
        },
        actionBtn: {
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1.25rem',
            borderRadius: '0.75rem',
            border: 'none',
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
        }
    };

    return (
        <div style={styles.container}>
            <div style={{ marginBottom: '0.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem 0', fontWeight: 700 }}>Active Production Orders</h2>
                <p style={{ color: colors.textMuted, margin: 0, fontSize: '0.9rem' }}>
                    Review orders assigned to your hub and manage their production workflow.
                </p>
            </div>

            {/* Filters Bar */}
            <div style={styles.filters}>
                <div style={styles.searchWrap}>
                    <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} size={16} color={colors.textMuted} />
                    <input
                        style={styles.searchInput}
                        placeholder="Search by SKU..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button style={styles.filterBtn}><Calendar size={18} /> Date Range</button>
                    <button style={styles.filterBtn}><ArrowUpDown size={18} /> Sort</button>
                </div>
            </div>

            {/* Orders Table */}
            <div style={styles.tableContainer}>
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: colors.textMuted }}>
                        Loading assigned orders...
                    </div>
                ) : (
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Order ID</th>
                                <th style={styles.th}>Product & SKU</th>
                                <th style={styles.th}>Qty</th>
                                <th style={styles.th}>Status</th>
                                <th style={styles.th}>Priority</th>
                                <th style={styles.th}>Expected Delivery</th>
                                <th style={styles.th}>Created Date</th>
                                <th style={styles.th}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => (
                                <tr key={order.order_id} style={{ transition: 'background 0.2s', ':hover': { background: colors.surfaceHover } }}>
                                    <td style={styles.td}>
                                        <span style={{ fontWeight: 700, color: colors.primary }}>{order.order_id}</span>
                                    </td>
                                    <td style={styles.td}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                            <span style={{ fontWeight: 600, color: colors.text }}>{order.product_details?.name || 'Unknown Product'}</span>
                                            <span style={{ fontSize: '0.75rem', color: colors.textMuted, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <Tag size={12} /> {order.sku}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={styles.td}>
                                        <div style={{ fontWeight: 600 }}>{order.quantity}</div>
                                    </td>
                                    <td style={styles.td}>
                                        <span style={getStatusStyle(order.status)}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td style={styles.td}>
                                        <span style={{ 
                                            color: order.priority === 'HIGH' ? '#ef4444' : colors.text,
                                            fontWeight: order.priority === 'HIGH' ? 700 : 500,
                                            display: 'flex', alignItems: 'center', gap: '0.25rem'
                                        }}>
                                            {order.priority === 'HIGH' && <div style={{width: 6, height: 6, borderRadius: '50%', background: '#ef4444'}} />}
                                            {order.priority}
                                        </span>
                                    </td>
                                    <td style={styles.td}>{order.expected_delivery_date}</td>
                                    <td style={styles.td}>{new Date(order.created_at).toLocaleDateString()}</td>
                                    <td style={styles.td}>
                                        <button 
                                            style={{
                                                ...styles.actionBtn, 
                                                background: order.status === 'ASSIGNED' ? `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` : colors.surface,
                                                color: order.status === 'ASSIGNED' ? '#ffffff' : colors.primary,
                                                border: order.status === 'ASSIGNED' ? 'none' : `1px solid ${colors.border}`,
                                                boxShadow: order.status === 'ASSIGNED' ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none'
                                            }}
                                            onClick={() => onOpenProduction(order)}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                if (order.status !== 'ASSIGNED') e.currentTarget.style.background = colors.surfaceHover;
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                if (order.status !== 'ASSIGNED') e.currentTarget.style.background = colors.surface;
                                            }}
                                        >
                                            {order.status === 'ASSIGNED' ? (
                                                <><Play size={16} fill="currentColor" /> <span>Start Production</span></>
                                            ) : (
                                                <><Settings size={16} /> <span>Manage Production</span></>
                                            )}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {orders.length === 0 && (
                                <tr>
                                    <td colSpan="8" style={{ ...styles.td, textAlign: 'center', padding: '4rem', color: colors.textMuted }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ padding: '1rem', background: colors.bg, borderRadius: '50%' }}>
                                                <Tag size={32} opacity={0.5} />
                                            </div>
                                            <div>No assigned orders found in the queue.</div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default AssignedOrders;
