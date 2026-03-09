import { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    MoreVertical,
    Eye,
    ExternalLink,
    ArrowUpDown,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Tag,
    Factory
} from 'lucide-react';
import { opsOrderService } from '../../services/orders';

const OrdersPage = ({ colors, darkMode }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchOrders();
    }, [statusFilter, searchQuery]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const params = {
                status: statusFilter || undefined,
                sku: searchQuery || undefined,
            };
            const res = await opsOrderService.getOrders(params);
            setOrders(res.data);
        } catch (err) {
            console.error("Failed to fetch orders:", err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyle = (status) => {
        const statusMap = {
            'COMPLETED': { bg: '#10b981', color: '#fff' },
            'IN_PRODUCTION': { bg: '#3b82f6', color: '#fff' },
            'ORDERED': { bg: '#f59e0b', color: '#fff' },
            'ASSIGNED': { bg: '#818cf8', color: '#fff' },
            'DELAYED': { bg: '#ef4444', color: '#fff' },
            'CANCELLED': { bg: '#94a3b8', color: '#fff' }
        };
        const style = statusMap[status] || { bg: colors.border, color: colors.text };
        return {
            padding: '0.25rem 0.5rem',
            borderRadius: '0.375rem',
            fontSize: '0.7rem',
            fontWeight: 700,
            background: style.bg,
            color: style.color
        };
    };

    const styles = {
        container: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
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
            padding: '0.5rem',
            borderRadius: '0.5rem',
            border: 'none',
            background: 'transparent',
            color: colors.textMuted,
            cursor: 'pointer',
            transition: 'all 0.2s'
        }
    };

    return (
        <div style={styles.container}>
            {/* Filters Bar */}
            <div style={styles.filters}>
                <div style={{ display: 'flex', gap: '1rem', flex: 1 }}>
                    <div style={styles.searchWrap}>
                        <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} size={16} color={colors.textMuted} />
                        <input
                            style={styles.searchInput}
                            placeholder="Search SKU..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <select
                        style={styles.filterBtn}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        <option value="ORDERED">Ordered</option>
                        <option value="ASSIGNED">Assigned</option>
                        <option value="IN_PRODUCTION">In Production</option>
                        <option value="DELAYED">Delayed</option>
                        <option value="COMPLETED">Completed</option>
                    </select>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button style={styles.filterBtn}><Calendar size={18} /> Date Range</button>
                    <button style={styles.filterBtn}><ArrowUpDown size={18} /> Sort</button>
                </div>
            </div>

            {/* Orders Table */}
            <div style={styles.tableContainer}>
                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: colors.textMuted }}>Loading orders...</div>
                ) : (
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Order ID</th>
                                <th style={styles.th}>Product & SKU</th>
                                <th style={styles.th}>Customer</th>
                                <th style={styles.th}>Qty</th>
                                <th style={styles.th}>Date</th>
                                <th style={styles.th}>Hub</th>
                                <th style={styles.th}>Status</th>
                                <th style={styles.th}>Delivery</th>
                                <th style={styles.th}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => (
                                <tr key={order.order_id}>
                                    <td style={styles.td}>
                                        <span style={{ fontWeight: 700, color: colors.primary }}>{order.order_id}</span>
                                    </td>
                                    <td style={styles.td}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: 600 }}>{order.product_details?.name || 'Unknown Product'}</span>
                                            <span style={{ fontSize: '0.75rem', color: colors.textMuted, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <Tag size={10} /> {order.sku}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={styles.td}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span>{order.customer_name}</span>
                                            <span style={{ fontSize: '0.75rem', color: colors.textMuted }}>{order.customer_email || 'N/A'}</span>
                                            <span style={{ fontSize: '0.75rem', color: colors.textMuted }}>{order.customer_phone}</span>
                                        </div>
                                    </td>
                                    <td style={styles.td}>{order.quantity}</td>
                                    <td style={styles.td}>{new Date(order.created_at).toLocaleDateString()}</td>
                                    <td style={styles.td}>
                                        {order.hub_details ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <Factory size={14} color={colors.textMuted} />
                                                <span>{order.hub_details.name}</span>
                                            </div>
                                        ) : <span style={{ color: colors.textMuted, fontSize: '0.75rem' }}>Not Assigned</span>}
                                    </td>
                                    <td style={styles.td}>
                                        <span style={getStatusStyle(order.status)}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td style={styles.td}>{order.expected_delivery_date}</td>
                                    <td style={styles.td}>
                                        <button style={styles.actionBtn}>
                                            <MoreVertical size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {orders.length === 0 && (
                                <tr>
                                    <td colSpan="9" style={{ ...styles.td, textAlign: 'center', padding: '3rem', color: colors.textMuted }}>
                                        No orders found matching the criteria.
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

export default OrdersPage;
