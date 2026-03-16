import { useState, useEffect } from 'react';
import { Package, AlertTriangle, Filter, RefreshCw } from 'lucide-react';
import api from '../../services/api';

const InventoryMonitoringPage = ({ colors, darkMode }) => {
    const [inventory, setInventory] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hubFilter, setHubFilter] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        try {
            setLoading(true);
            setError(null);
            const [invRes, alertRes] = await Promise.all([
                api.get('/inventory/my-hub/'),
                api.get('/operations/alerts/'),
            ]);
            setInventory(invRes.data || []);
            setAlerts((alertRes.data || []).filter(a => a.alert_type === 'INVENTORY'));
        } catch (err) {
            console.error('Failed to load inventory:', err);
            setError('Unable to load inventory data. Ensure you have the correct role permissions.');
        } finally {
            setLoading(false);
        }
    };

    const hubs = [...new Set(inventory.map(i => i.hub_name || i.hub?.name || 'Unknown').filter(Boolean))];
    const filtered = hubFilter ? inventory.filter(i => (i.hub_name || i.hub?.name) === hubFilter) : inventory;

    const thStyle = {
        padding: '0.875rem 1.25rem',
        borderBottom: `1px solid ${colors.border}`,
        color: colors.textMuted,
        fontSize: '0.75rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        textAlign: 'left',
        whiteSpace: 'nowrap',
    };

    const tdStyle = {
        padding: '0.875rem 1.25rem',
        borderBottom: `1px solid ${colors.border}`,
        fontSize: '0.875rem',
        color: colors.text,
    };

    const lowStock = filtered.filter(i => (i.quantity_available ?? 0) < 20);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ padding: '0.6rem', background: `${colors.accent}20`, borderRadius: '0.75rem', color: colors.accent }}>
                        <Package size={22} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem', color: colors.text }}>Inventory Monitoring</h2>
                        <div style={{ fontSize: '0.8rem', color: colors.textMuted }}>Cross-hub stock levels and risk alerts</div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    {hubs.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.75rem', borderRadius: '0.75rem', background: colors.surface, border: `1px solid ${colors.border}` }}>
                            <Filter size={15} color={colors.textMuted} />
                            <select value={hubFilter} onChange={e => setHubFilter(e.target.value)}
                                style={{ background: 'none', border: 'none', color: colors.text, fontSize: '0.8rem', outline: 'none' }}>
                                <option value="">All Hubs</option>
                                {hubs.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                        </div>
                    )}
                    <button onClick={fetchAll} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '0.75rem', background: colors.primary, border: 'none', color: '#fff', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                        <RefreshCw size={15} /> Refresh
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                {[
                    { label: 'Total SKUs', value: filtered.length, color: colors.primary },
                    { label: 'Low Stock Items', value: lowStock.length, color: '#f59e0b' },
                    { label: 'Inventory Alerts', value: alerts.length, color: '#ef4444' },
                ].map(c => (
                    <div key={c.label} style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '1rem', padding: '1.25rem 1.5rem' }}>
                        <div style={{ fontSize: '0.75rem', color: colors.textMuted, fontWeight: 600, marginBottom: '0.25rem' }}>{c.label}</div>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: c.color }}>{c.value}</div>
                    </div>
                ))}
            </div>

            {/* Inventory Alerts Panel */}
            {alerts.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase' }}>Active Inventory Alerts</div>
                    {alerts.map((alert, i) => (
                        <div key={i} style={{
                            background: colors.surface,
                            border: `1px solid ${alert.severity === 'CRITICAL' ? '#ef444440' : '#f59e0b40'}`,
                            borderLeft: `4px solid ${alert.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b'}`,
                            borderRadius: '0.75rem',
                            padding: '0.875rem 1.25rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <AlertTriangle size={18} color={alert.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b'} />
                                <div>
                                    <div style={{ fontWeight: 600, color: colors.text, fontSize: '0.875rem' }}>{alert.message}</div>
                                    {alert.related_hub && <div style={{ fontSize: '0.75rem', color: colors.textMuted }}>{alert.related_hub}</div>}
                                </div>
                            </div>
                            <span style={{ padding: '0.25rem 0.6rem', borderRadius: '0.375rem', background: alert.severity === 'CRITICAL' ? '#ef444420' : '#f59e0b20', color: alert.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b', fontWeight: 700, fontSize: '0.75rem' }}>{alert.severity}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Stock Table */}
            {loading ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: colors.textMuted }}>Loading inventory data…</div>
            ) : error ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444', background: '#ef444410', borderRadius: '1rem', border: '1px solid #ef444430' }}>{error}</div>
            ) : (
                <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '1.25rem', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                        <thead>
                            <tr>
                                {['Hub', 'Product / SKU', 'Qty Available', 'Qty Reserved', 'Stock Status'].map(h => (
                                    <th key={h} style={thStyle}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan={5} style={{ padding: '2.5rem', textAlign: 'center', color: colors.textMuted }}>No inventory records found.</td></tr>
                            ) : filtered.map((item, idx) => {
                                const isLow = (item.quantity_available ?? 0) < 20;
                                return (
                                    <tr key={idx}>
                                        <td style={tdStyle}>{item.hub_name || item.hub?.name || '—'}</td>
                                        <td style={tdStyle}>
                                            <div style={{ fontWeight: 600 }}>{item.product_name || item.product?.name || '—'}</div>
                                            <div style={{ fontSize: '0.75rem', color: colors.textMuted }}>{item.sku || item.product?.sku || ''}</div>
                                        </td>
                                        <td style={{ ...tdStyle, fontWeight: 700, color: isLow ? '#ef4444' : '#10b981' }}>
                                            {item.quantity_available ?? '—'}
                                        </td>
                                        <td style={{ ...tdStyle, color: colors.textMuted }}>{item.quantity_reserved ?? '—'}</td>
                                        <td style={tdStyle}>
                                            <span style={{
                                                padding: '0.25rem 0.65rem', borderRadius: '0.4rem', fontWeight: 700, fontSize: '0.75rem',
                                                background: isLow ? '#ef444420' : '#10b98120',
                                                color: isLow ? '#ef4444' : '#10b981'
                                            }}>
                                                {isLow ? '⚠ Low Stock' : 'In Stock'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default InventoryMonitoringPage;
