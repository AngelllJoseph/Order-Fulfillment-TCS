import React, { useState, useEffect, useRef } from 'react';
import { orderService, productService, hubService } from '../../services/api';
import {
    ShoppingBag, Plus, Search, Edit2, Eye, FileUp,
    CheckCircle, X, Filter, Loader2, MoreVertical,
    Clock, MapPin, AlertCircle, History, ArrowRight, Ban
} from 'lucide-react';
import Toast from '../../components/Toast';
import OrderForm from './OrderForm';
import OrderDetails from './OrderDetails';

const OrdersPage = ({ colors, darkMode, onNavigate }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total_orders: 0, stats: {} });
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({ status: '', hub: '', priority: '' });
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const fileInputRef = useRef(null);

    // Modal states
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    // Reference data
    const [products, setProducts] = useState([]);
    const [hubs, setHubs] = useState([]);

    useEffect(() => {
        fetchOrders();
        fetchStats();
        fetchReferenceData();
    }, [filters]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const params = {
                ...filters,
                sku: searchQuery
            };
            const res = await orderService.getOrders(params);
            setOrders(res.data);
        } catch (err) {
            console.error(err);
            setToast({ show: true, message: 'Failed to fetch orders', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await orderService.getStats();
            setStats(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchReferenceData = async () => {
        try {
            const [prodRes, hubRes] = await Promise.all([
                productService.getProducts(),
                hubService.getHubs()
            ]);
            setProducts(prodRes.data);
            setHubs(hubRes.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSaveOrder = async (data) => {
        try {
            if (selectedOrder) {
                await orderService.updateOrder(selectedOrder.id, data);
                setToast({ show: true, message: 'Order updated successfully!', type: 'success' });
            } else {
                await orderService.createOrder(data);
                setToast({ show: true, message: 'Order created successfully!', type: 'success' });
            }
            setIsFormOpen(false);
            fetchOrders();
            fetchStats();
        } catch (err) {
            console.error(err);
            setToast({ show: true, message: 'Failed to save order', type: 'error' });
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        try {
            const res = await orderService.uploadExcel(file);
            setToast({
                show: true,
                message: `Uploaded: ${res.data.created_count} orders created.`,
                type: 'success'
            });
            fetchOrders();
            fetchStats();
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.error || 'Failed to upload Excel file';
            setToast({ show: true, message: errorMsg, type: 'error' });
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const styles = {
        container: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
        statsGrid: {
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem', marginBottom: '0.5rem'
        },
        statCard: (borderColor) => ({
            background: colors.cardBg, border: `1px solid ${colors.border}`,
            borderLeft: `4px solid ${borderColor || colors.primary}`,
            padding: '1.25rem', borderRadius: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem'
        }),
        actionBar: {
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            gap: '1rem', flexWrap: 'wrap', background: colors.surface,
            padding: '1rem', borderRadius: '1rem', border: `1px solid ${colors.border}`
        },
        filterGroup: { display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' },
        searchBox: {
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            background: colors.bg, border: `1px solid ${colors.border}`,
            padding: '0.5rem 1rem', borderRadius: '0.75rem', width: '280px'
        },
        select: {
            background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text,
            padding: '0.5rem', borderRadius: '0.75rem', outline: 'none', fontSize: '0.875rem'
        },
        button: (primary, variant = 'solid') => ({
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.6rem 1.25rem', borderRadius: '0.75rem',
            background: primary ? colors.primary : (variant === 'ghost' ? 'transparent' : colors.surface),
            color: primary ? 'white' : colors.text,
            border: primary ? 'none' : (variant === 'ghost' ? 'none' : `1px solid ${colors.border}`),
            fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
            transition: 'all 0.2s ease',
        }),
        tableContainer: {
            background: colors.cardBg, border: `1px solid ${colors.border}`,
            borderRadius: '1.25rem', overflowX: 'auto'
        },
        table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1000px' },
        th: {
            padding: '1.25rem 1.5rem', background: colors.surface,
            color: colors.textMuted, fontSize: '0.75rem', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.05em',
            borderBottom: `1px solid ${colors.border}`
        },
        td: {
            padding: '1.25rem 1.5rem', borderBottom: `1px solid ${colors.border}`,
            fontSize: '0.875rem'
        },
        statusBadge: (status) => {
            const statusMap = {
                'ORDERED': { bg: '#6366f115', color: '#6366f1' },
                'ASSIGNED': { bg: '#8b5cf615', color: '#8b5cf6' },
                'IN_PRODUCTION': { bg: '#3b82f615', color: '#3b82f6' },
                'COMPLETED': { bg: '#10b98115', color: '#10b981' },
                'DELAYED': { bg: '#ef444415', color: '#ef4444' }
            };
            const style = statusMap[status] || { bg: '#94a3b815', color: '#94a3b8' };
            return {
                padding: '0.25rem 0.75rem', borderRadius: '9999px',
                fontSize: '0.75rem', fontWeight: 700,
                background: style.bg, color: style.color
            };
        },
        priorityBadge: (priority) => ({
            padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800,
            background: priority === 'HIGH' ? '#ef444420' : '#94a3b820',
            color: priority === 'HIGH' ? '#ef4444' : '#64748b',
            border: `1px solid ${priority === 'HIGH' ? '#ef444440' : '#94a3b840'}`
        }),
        textActionBtn: (color, bg) => ({
            background: bg || 'none', border: `1px solid ${color}`, cursor: 'pointer',
            color: color || colors.textMuted, padding: '0.25rem 0.5rem',
            borderRadius: '0.3rem', transition: 'all 0.2s ease',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.7rem', fontWeight: 600, gap: '0.25rem',
            whiteSpace: 'nowrap'
        })
    };

    const handleToggleStatus = async (order) => {
        // Find if order doesn't have an active/inactive status, we might manage this differently
        // Usually orders are cancelled, not "deactivated", but let's assume we want to toggle cancellation
        // For now, toggle between CANCELLED and ORDERED/COMPLETED
        // Let's implement active/deactivate as cancelling/restoring
        const isCancelled = order.status === 'CANCELLED';
        const newStatus = isCancelled ? 'ORDERED' : 'CANCELLED';
        
        try {
            await orderService.updateStatus(order.id, newStatus, `Order ${isCancelled ? 'restored' : 'cancelled'} by user`);
            setToast({ show: true, message: `Order ${isCancelled ? 'activated' : 'deactivated'} successfully!`, type: 'success' });
            fetchOrders();
            fetchStats();
        } catch (err) {
            console.error(err);
            setToast({ show: true, message: 'Failed to update order status', type: 'error' });
        }
    };

    const filteredOrders = orders.filter(o =>
        (o.order_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.sku || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.customer_email || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div style={styles.container}>
            <div style={styles.statsGrid}>
                <div style={styles.statCard('#6366f1')}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: colors.textMuted }}>TOTAL ORDERS</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.total_orders}</span>
                </div>
                <div style={styles.statCard('#3b82f6')}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: colors.textMuted }}>IN PRODUCTION</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.stats?.IN_PRODUCTION || 0}</span>
                </div>
                <div style={styles.statCard('#10b981')}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: colors.textMuted }}>COMPLETED</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.stats?.COMPLETED || 0}</span>
                </div>
                <div style={styles.statCard('#ef4444')}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: colors.textMuted }}>DELAYED</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.stats?.DELAYED || 0}</span>
                </div>
            </div>

            <div style={styles.actionBar}>
                <div style={styles.filterGroup}>
                    <div style={styles.searchBox}>
                        <Search size={18} color={colors.textMuted} />
                        <input
                            style={{ background: 'none', border: 'none', color: colors.text, fontSize: '0.875rem', width: '100%', outline: 'none' }}
                            placeholder="Search Order ID, SKU, Customer..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <select
                        style={styles.select}
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    >
                        <option value="">All Statuses</option>
                        <option value="ORDERED">Ordered</option>
                        <option value="ASSIGNED">Assigned</option>
                        <option value="IN_PRODUCTION">In Production</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="DELAYED">Delayed</option>
                    </select>
                    <select
                        style={styles.select}
                        value={filters.hub}
                        onChange={(e) => setFilters({ ...filters, hub: e.target.value })}
                    >
                        <option value="">All Hubs</option>
                        {hubs.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                    </select>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                        accept=".xlsx, .xls, .csv"
                    />
                    <button style={styles.button(false)} onClick={() => fileInputRef.current?.click()}>
                        <FileUp size={18} /> Import Excel
                    </button>
                    <button style={styles.button(true)} onClick={() => { setSelectedOrder(null); setIsFormOpen(true); }}>
                        <Plus size={18} /> Add Order
                    </button>
                </div>
            </div>

            <div style={styles.tableContainer}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Order ID</th>
                            <th style={styles.th}>Products</th>
                            <th style={styles.th}>Total Qty</th>
                            <th style={styles.th}>Customer</th>
                            <th style={styles.th}>Hub</th>
                            <th style={styles.th}>Status</th>
                            <th style={styles.th}>Priority</th>
                            <th style={styles.th}>Expected Delivery</th>
                            <th style={styles.th}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="9" style={{ ...styles.td, textAlign: 'center', padding: '3rem' }}>
                                    <Loader2 size={32} className="animate-spin" color={colors.primary} />
                                </td>
                            </tr>
                        ) : filteredOrders.length === 0 ? (
                            <tr>
                                <td colSpan="9" style={{ ...styles.td, textAlign: 'center', padding: '3rem', color: colors.textMuted }}>
                                    No orders found.
                                </td>
                            </tr>
                        ) : filteredOrders.map(o => (
                            <tr key={o.id}>
                                <td style={styles.td}>
                                    <div style={{ fontWeight: 700, color: colors.primary }}>{o.order_id}</div>
                                    <div style={{ fontSize: '0.7rem', color: colors.textMuted }}>{new Date(o.created_at).toLocaleString()}</div>
                                </td>
                                <td style={styles.td}>
                                    {o.items && o.items.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                            {o.items.map((item, idx) => (
                                                <div key={idx} style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ fontWeight: 600 }}>{item.product_name}</span>
                                                    <span style={{ fontSize: '0.75rem', color: colors.textMuted, marginLeft: '0.5rem' }}>x{item.quantity}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <>
                                            <div style={{ fontWeight: 600 }}>{o.product_details?.name || 'Unknown'}</div>
                                            <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: colors.textMuted }}>{o.sku}</div>
                                        </>
                                    )}
                                </td>
                                <td style={styles.td}>
                                    {o.items && o.items.length > 0 
                                        ? o.items.reduce((sum, item) => sum + item.quantity, 0) 
                                        : o.quantity} units
                                </td>
                                <td style={styles.td}>
                                    <div style={{ fontWeight: 600 }}>{o.customer_name}</div>
                                    <div style={{ fontSize: '0.75rem', color: colors.textMuted }}>{o.customer_email || 'N/A'}</div>
                                </td>
                                <td style={styles.td}>
                                    {o.hub_details ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <MapPin size={14} color={colors.primary} />
                                            <span>{o.hub_details.name}</span>
                                        </div>
                                    ) : (
                                        <span style={{ color: colors.textMuted }}>Pending Assignment</span>
                                    )}
                                </td>
                                <td style={styles.td}>
                                    <span style={styles.statusBadge(o.status)}>{o.status.replace('_', ' ')}</span>
                                </td>
                                <td style={styles.td}>
                                    <span style={styles.priorityBadge(o.priority)}>{o.priority}</span>
                                </td>
                                <td style={styles.td}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <Clock size={14} color={colors.textMuted} />
                                        <span>{new Date(o.expected_delivery_date).toLocaleDateString()}</span>
                                    </div>
                                </td>
                                <td style={styles.td}>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer' }}
                                            onClick={() => { setSelectedOrder(o); setIsDetailsOpen(true); }}
                                            title="View Details"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        <button
                                            style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer' }}
                                            onClick={() => { setSelectedOrder(o); setIsFormOpen(true); }}
                                            title="Edit Order"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            style={styles.textActionBtn(
                                                o.status !== 'CANCELLED' ? '#ef4444' : '#10b981',
                                                o.status !== 'CANCELLED' ? '#ef444415' : '#10b98115'
                                            )}
                                            title={o.status !== 'CANCELLED' ? "Deactivate Order" : "Activate Order"}
                                            onClick={() => handleToggleStatus(o)}
                                        >
                                            {o.status !== 'CANCELLED' ? (
                                                <><Ban size={12} /> Deactivate</>
                                            ) : (
                                                <><CheckCircle size={12} /> Activate</>
                                            )}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isFormOpen && (
                <OrderForm
                    order={selectedOrder}
                    products={products}
                    colors={colors}
                    darkMode={darkMode}
                    onSave={handleSaveOrder}
                    onCancel={() => setIsFormOpen(false)}
                />
            )}

            {isDetailsOpen && selectedOrder && (
                <OrderDetails
                    order={selectedOrder}
                    colors={colors}
                    darkMode={darkMode}
                    onNavigate={onNavigate}
                    onClose={() => setIsDetailsOpen(false)}
                    onUpdateStatus={async (status, notes) => {
                        await orderService.updateStatus(selectedOrder.id, status, notes);
                        fetchOrders();
                        fetchStats();
                    }}
                />
            )}

            {toast.show && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    colors={colors}
                    onClose={() => setToast({ ...toast, show: false })}
                />
            )}
        </div>
    );
};

export default OrdersPage;
