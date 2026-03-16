import { useState, useEffect, useRef } from 'react';
import {
    Search,
    Filter,
    ArrowUpDown,
    Calendar,
    ChevronDown,
    ChevronUp,
    Tag,
    Factory,
    CheckCircle,
    Clock,
    Truck,
    Package,
    AlertTriangle,
    XCircle,
    MoreVertical
} from 'lucide-react';
import { opsOrderService } from '../../services/orders';
import api from '../../services/api';

/* ─────────────────────────────────────────── helpers ── */
const STATUS_TIMELINE = ['ORDERED', 'ASSIGNED', 'IN_PRODUCTION', 'QUALITY_CHECK', 'COMPLETED'];

const STATUS_CONFIG = {
    ORDERED:        { color: '#f59e0b', Icon: Package,      label: 'Ordered' },
    ASSIGNED:       { color: '#818cf8', Icon: Truck,        label: 'Assigned' },
    IN_PRODUCTION:  { color: '#3b82f6', Icon: Factory,      label: 'In Production' },
    QUALITY_CHECK:  { color: '#10b981', Icon: CheckCircle,  label: 'Quality Check' },
    COMPLETED:      { color: '#10b981', Icon: CheckCircle,  label: 'Completed' },
    DELAYED:        { color: '#ef4444', Icon: AlertTriangle, label: 'Delayed' },
    CANCELLED:      { color: '#94a3b8', Icon: XCircle,      label: 'Cancelled' },
};

function getStatusStyle(status) {
    const c = STATUS_CONFIG[status] || { color: '#94a3b8' };
    return {
        padding: '0.25rem 0.6rem',
        borderRadius: '0.375rem',
        fontSize: '0.7rem',
        fontWeight: 700,
        background: `${c.color}25`,
        color: c.color,
    };
}

/* Order Timeline shown inside the expanded row */
function OrderTimeline({ order, colors }) {
    const currentIdx = STATUS_TIMELINE.indexOf(order.status);
    const isDelayed  = order.status === 'DELAYED';
    const isCancelled = order.status === 'CANCELLED';

    const steps = STATUS_TIMELINE.map((step, i) => {
        let state;
        if (isCancelled) { state = 'inactive'; }
        else if (isDelayed && step === 'IN_PRODUCTION') { state = 'delayed'; }
        else if (i < currentIdx || (i === STATUS_TIMELINE.length - 1 && currentIdx === i)) { state = 'done'; }
        else if (i === currentIdx) { state = 'active'; }
        else { state = 'inactive'; }
        return { step, state };
    });

    const dotColor = { done: '#10b981', active: '#6366f1', delayed: '#ef4444', inactive: colors.border };

    return (
        <div style={{ padding: '1.25rem 1.5rem', background: colors.bg, borderTop: `1px solid ${colors.border}` }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: colors.textMuted, marginBottom: '1rem', textTransform: 'uppercase' }}>
                Order Timeline
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'nowrap', overflowX: 'auto' }}>
                {steps.map(({ step, state }, i) => {
                    const cfg = STATUS_CONFIG[step];
                    const Icon = cfg.Icon;
                    return (
                        <div key={step} style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: '100px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: '50%',
                                    background: dotColor[state],
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    opacity: state === 'inactive' ? 0.35 : 1,
                                    boxShadow: state === 'active' ? `0 0 0 4px ${dotColor[state]}30` : 'none',
                                    transition: 'all 0.3s',
                                }}>
                                    <Icon size={16} color="#fff" />
                                </div>
                                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: state === 'inactive' ? colors.textMuted : colors.text, textAlign: 'center', whiteSpace: 'nowrap' }}>
                                    {cfg.label}
                                </div>
                            </div>
                            {i < steps.length - 1 && (
                                <div style={{ flex: 1, height: 2, background: state === 'done' ? '#10b981' : colors.border, margin: '0 4px', marginBottom: '1.2rem', transition: 'all 0.3s' }} />
                            )}
                        </div>
                    );
                })}
            </div>
            {/* Extra meta */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: '0.75rem', marginTop: '1.25rem' }}>
                {[
                    { label: 'Order Date',    value: order.created_at ? new Date(order.created_at).toLocaleDateString() : '—' },
                    { label: 'Expected Delivery', value: order.expected_delivery_date || '—' },
                    { label: 'Assigned Hub',  value: order.hub_details?.name || 'Not Assigned' },
                    { label: 'Priority',      value: order.priority || 'NORMAL' },
                ].map(({ label, value }) => (
                    <div key={label}>
                        <div style={{ fontSize: '0.7rem', color: colors.textMuted, fontWeight: 600 }}>{label}</div>
                        <div style={{ fontSize: '0.875rem', color: colors.text, fontWeight: 600, marginTop: '0.2rem' }}>{value}</div>
                    </div>
                ))}
            </div>

            {/* Status Override Section */}
            <StatusOverrideControl order={order} colors={colors} />
        </div>
    );
}

/* ─ Status Override Control (P3) ─ */
const OVERRIDEABLE = ['ORDERED', 'ASSIGNED', 'IN_PRODUCTION', 'DELAYED'];
const OVERRIDE_TARGETS = {
    ORDERED:       ['ASSIGNED'],
    ASSIGNED:      ['IN_PRODUCTION', 'ORDERED'],
    IN_PRODUCTION: ['QUALITY_CHECK', 'DELAYED', 'ASSIGNED'],
    DELAYED:       ['IN_PRODUCTION', 'ASSIGNED'],
};

function StatusOverrideControl({ order, colors }) {
    const [selected, setSelected] = useState('');
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const targets = OVERRIDE_TARGETS[order.status] || [];
    if (!OVERRIDEABLE.includes(order.status) || targets.length === 0) return null;

    const handleOverride = async () => {
        if (!selected) return;
        setLoading(true);
        setResult(null);
        try {
            await api.patch(`/orders/${order.order_id}/`, { status: selected, override_note: note });
            setResult({ ok: true, msg: `Status updated to ${selected}.` });
            setSelected('');
            setNote('');
        } catch (err) {
            setResult({ ok: false, msg: err?.response?.data?.detail || 'Override failed.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ marginTop: '1.25rem', padding: '0.875rem 1rem', background: 'rgba(239,68,68,0.05)', borderRadius: '0.75rem', border: `1px solid rgba(239,68,68,0.15)` }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ef4444', marginBottom: '0.75rem', textTransform: 'uppercase' }}>⚠ Program Manager Status Override</div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div>
                    <div style={{ fontSize: '0.7rem', color: colors.textMuted, marginBottom: '0.3rem' }}>Force Status To</div>
                    <select value={selected} onChange={e => setSelected(e.target.value)}
                        style={{ padding: '0.5rem 0.75rem', borderRadius: '0.5rem', background: colors.surface, border: `1px solid ${colors.border}`, color: colors.text, fontSize: '0.85rem' }}>
                        <option value="">Select…</option>
                        {targets.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div style={{ flex: 1, minWidth: '160px' }}>
                    <div style={{ fontSize: '0.7rem', color: colors.textMuted, marginBottom: '0.3rem' }}>Override Note</div>
                    <input value={note} onChange={e => setNote(e.target.value)} placeholder="Reason for override…"
                        style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', background: colors.surface, border: `1px solid ${colors.border}`, color: colors.text, fontSize: '0.85rem', outline: 'none' }} />
                </div>
                <button onClick={handleOverride} disabled={!selected || loading}
                    style={{ padding: '0.5rem 1.25rem', borderRadius: '0.5rem', background: selected ? '#ef4444' : colors.border, color: '#fff', fontWeight: 700, fontSize: '0.85rem', border: 'none', cursor: selected ? 'pointer' : 'not-allowed' }}>
                    {loading ? 'Updating…' : 'Apply Override'}
                </button>
            </div>
            {result && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: result.ok ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                    {result.ok ? '✅' : '❌'} {result.msg}
                </div>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────── main page ── */
const SORT_OPTIONS = [
    { label: 'Date ↓ (Newest)', value: '-created_at' },
    { label: 'Date ↑ (Oldest)', value: 'created_at' },
    { label: 'Delivery Date ↑', value: 'expected_delivery_date' },
    { label: 'Delivery Date ↓', value: '-expected_delivery_date' },
    { label: 'Order ID A–Z',    value: 'order_id' },
];

const OrdersPage = ({ colors, darkMode }) => {
    const [orders, setOrders]         = useState([]);
    const [loading, setLoading]       = useState(true);
    const [statusFilter, setStatus]   = useState('');
    const [searchQuery, setSearch]    = useState('');
    const [dateFrom, setDateFrom]     = useState('');
    const [dateTo, setDateTo]         = useState('');
    const [sortBy, setSortBy]         = useState('-created_at');
    const [expandedRow, setExpanded]  = useState(null);

    useEffect(() => { fetchOrders(); }, [statusFilter, searchQuery, dateFrom, dateTo, sortBy]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const params = {
                status:            statusFilter || undefined,
                sku:               searchQuery  || undefined,
                created_at_after:  dateFrom     || undefined,
                created_at_before: dateTo       || undefined,
                ordering:          sortBy        || undefined,
            };
            const res = await opsOrderService.getOrders(params);
            setOrders(res.data.results || res.data);
        } catch (err) {
            console.error('Failed to fetch orders:', err);
        } finally {
            setLoading(false);
        }
    };

    const filterBtn = {
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        padding: '0.5rem 0.75rem', borderRadius: '0.75rem',
        background: colors.surface, border: `1px solid ${colors.border}`,
        color: colors.text, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
    };

    const th = {
        padding: '1rem 1.25rem', borderBottom: `1px solid ${colors.border}`,
        color: colors.textMuted, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase',
    };
    const td = {
        padding: '1rem 1.25rem', borderBottom: `1px solid ${colors.border}`, fontSize: '0.875rem',
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* ── Filter Bar ── */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                {/* Left: search + status */}
                <div style={{ display: 'flex', gap: '0.75rem', flex: 1, flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', minWidth: '220px', flex: 1, maxWidth: '360px' }}>
                        <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} size={15} color={colors.textMuted} />
                        <input
                            placeholder="Search SKU or order ID…"
                            value={searchQuery}
                            onChange={e => setSearch(e.target.value)}
                            style={{ width: '100%', padding: '0.55rem 1rem 0.55rem 2.25rem', borderRadius: '0.75rem', background: colors.surface, border: `1px solid ${colors.border}`, color: colors.text, outline: 'none', fontSize: '0.85rem' }}
                        />
                    </div>
                    <select value={statusFilter} onChange={e => setStatus(e.target.value)} style={filterBtn}>
                        <option value="">All Statuses</option>
                        {['ORDERED','ASSIGNED','IN_PRODUCTION','DELAYED','COMPLETED','CANCELLED'].map(s => (
                            <option key={s} value={s}>{s.replace('_',' ')}</option>
                        ))}
                    </select>
                </div>
                {/* Right: date range + sort */}
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {/* Date Range */}
                    <div style={{ ...filterBtn, gap: '0.5rem' }}>
                        <Calendar size={15} color={colors.textMuted} />
                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                            style={{ background: 'none', border: 'none', color: colors.text, fontSize: '0.8rem', outline: 'none', cursor: 'pointer' }} />
                        <span style={{ color: colors.textMuted }}>→</span>
                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                            style={{ background: 'none', border: 'none', color: colors.text, fontSize: '0.8rem', outline: 'none', cursor: 'pointer' }} />
                    </div>
                    {/* Sort */}
                    <div style={{ ...filterBtn }}>
                        <ArrowUpDown size={15} color={colors.textMuted} />
                        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                            style={{ background: 'none', border: 'none', color: colors.text, fontSize: '0.8rem', outline: 'none', cursor: 'pointer' }}>
                            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* ── Table ── */}
            <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '1.25rem', overflowX: 'auto' }}>
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: colors.textMuted }}>Loading orders…</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '960px' }}>
                        <thead>
                            <tr>
                                <th style={th}></th>
                                <th style={th}>Order ID</th>
                                <th style={th}>Product & SKU</th>
                                <th style={th}>Customer</th>
                                <th style={th}>Qty</th>
                                <th style={th}>Date</th>
                                <th style={th}>Hub</th>
                                <th style={th}>Status</th>
                                <th style={th}>Delivery</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => (
                                <>
                                    <tr key={order.order_id}
                                        onClick={() => setExpanded(expandedRow === order.order_id ? null : order.order_id)}
                                        style={{ cursor: 'pointer', background: expandedRow === order.order_id ? (darkMode ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.04)') : 'transparent' }}>
                                        <td style={{ ...td, width: 36, paddingRight: 0 }}>
                                            <div style={{ color: colors.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {expandedRow === order.order_id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </div>
                                        </td>
                                        <td style={td}>
                                            <span style={{ fontWeight: 700, color: '#6366f1' }}>{order.order_id}</span>
                                        </td>
                                        <td style={td}>
                                            <div style={{ fontWeight: 600, color: colors.text }}>{order.product_details?.name || '—'}</div>
                                            <div style={{ fontSize: '0.72rem', color: colors.textMuted, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                                <Tag size={10} /> {order.sku}
                                            </div>
                                        </td>
                                        <td style={td}>
                                            <div style={{ color: colors.text }}>{order.customer_name}</div>
                                            <div style={{ fontSize: '0.72rem', color: colors.textMuted }}>{order.customer_email || ''}</div>
                                        </td>
                                        <td style={td}>{order.quantity}</td>
                                        <td style={td}>{order.created_at ? new Date(order.created_at).toLocaleDateString() : '—'}</td>
                                        <td style={td}>
                                            {order.hub_details
                                                ? <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: colors.text }}><Factory size={13} color={colors.textMuted} />{order.hub_details.name}</div>
                                                : <span style={{ fontSize: '0.75rem', color: colors.textMuted }}>Unassigned</span>}
                                        </td>
                                        <td style={td}><span style={getStatusStyle(order.status)}>{order.status?.replace('_',' ')}</span></td>
                                        <td style={td}>{order.expected_delivery_date || '—'}</td>
                                    </tr>
                                    {/* Expanded Timeline Row */}
                                    {expandedRow === order.order_id && (
                                        <tr key={`${order.order_id}-timeline`}>
                                            <td colSpan={9} style={{ padding: 0 }}>
                                                <OrderTimeline order={order} colors={colors} />
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))}
                            {orders.length === 0 && (
                                <tr>
                                    <td colSpan={9} style={{ ...td, textAlign: 'center', padding: '3rem', color: colors.textMuted }}>
                                        No orders match the current filters.
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
