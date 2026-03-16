import { useState, useEffect } from 'react';
import {
    Package,
    Clock,
    AlertTriangle,
    Factory,
    TrendingUp,
    TrendingDown,
    ArrowRight,
    Zap,
    ClipboardList,
    Brain
} from 'lucide-react';
import {
    PieChart, Pie, Cell,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line
} from 'recharts';
import { opsOrderService } from '../../services/orders';
import { opsHubService } from '../../services/hubs';
import { aiService } from '../../services/ai';

const DashboardOverview = ({ colors, darkMode, onNavigate }) => {
    const [stats, setStats] = useState({
        total: 0,
        unassigned: 0,
        in_production: 0,
        delayed: 0,
        active_hubs: 0,
        pending_ai: 0,
        by_status: [],
        hub_utilization: [],
        daily_trend: []
    });
    const [loading, setLoading] = useState(true);
    const [inventoryAlerts, setInventoryAlerts] = useState([]);

    useEffect(() => {
        fetchDashboardData();
        fetchInventoryAlerts();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [orderRes, hubRes, aiRes, trendRes] = await Promise.all([
                opsOrderService.getStats(),
                opsHubService.getMonitoringStats(),
                aiService.getDecisions({ status: 'WAITING_APPROVAL' }),
                import('../../services/api').then(m => m.default.get('/reports/order-trend/?days=30')),
            ]);

            const orderData = orderRes.data;
            const hubData = hubRes.data;
            const aiData = aiRes.data.results || aiRes.data;
            const trendData = trendRes.data || [];

            // Map backend status stats to pie chart format
            const statusMap = {
                'ORDERED': '#f59e0b',
                'ASSIGNED': '#818cf8',
                'IN_PRODUCTION': '#3b82f6',
                'QUALITY_CHECK': '#10b981',
                'COMPLETED': '#10b981',
                'DELAYED': '#ef4444',
                'CANCELLED': '#94a3b8'
            };

            const byStatus = Object.entries(orderData.stats || {}).map(([name, value]) => ({
                name,
                value,
                color: statusMap[name] || '#94a3b8'
            }));

            setStats({
                total: orderData.total_orders || 0,
                unassigned: orderData.unassigned_orders || 0,
                in_production: orderData.stats?.IN_PRODUCTION || 0,
                delayed: orderData.delayed_orders || 0,
                active_hubs: hubData.filter(h => h.status === 'ACTIVE').length,
                pending_ai: aiData.length || 0,
                by_status: byStatus,
                hub_utilization: hubData.map(h => ({ name: h.name, utilization: h.usage_percent, current_load: h.current_load, max_capacity: h.max_capacity })),
                daily_trend: trendData,
            });
        } catch (err) {
            console.error("Failed to fetch dashboard data:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchInventoryAlerts = async () => {
        try {
            const res = await import('../../services/api').then(m => m.default.get('/operations/alerts/'));
            const alerts = (res.data || []).filter(a => a.alert_type === 'INVENTORY');
            setInventoryAlerts(alerts);
        } catch (err) {
            // Non-critical; ignore if fails
        }
    };

    if (loading) return <div style={{ color: colors.textMuted }}>Loading operational overview...</div>;

    const styles = {
        grid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem',
        },
        card: {
            background: colors.cardBg,
            border: `1px solid ${colors.border}`,
            borderRadius: '1.25rem',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
        },
        statIcon: (color) => ({
            width: '40px',
            height: '40px',
            borderRadius: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `${color}15`,
            color: color,
            marginBottom: '0.5rem',
        }),
        statTitle: {
            fontSize: '0.875rem',
            color: colors.textMuted,
            fontWeight: 500,
        },
        statValue: {
            fontSize: '1.5rem',
            fontWeight: 700,
        },
        trend: (isUp) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: isUp ? '#10b981' : '#ef4444',
        }),
        chartCard: {
            background: colors.cardBg,
            border: `1px solid ${colors.border}`,
            borderRadius: '1.25rem',
            padding: '1.5rem',
            minHeight: '350px',
        },
        chartTitle: {
            fontSize: '1.125rem',
            fontWeight: 600,
            marginBottom: '1.5rem',
        },
        quickActions: {
            display: 'flex',
            gap: '1rem',
            marginTop: '2rem',
        },
        actionBtn: {
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem',
            borderRadius: '1rem',
            background: `linear-gradient(135deg, ${colors.primary}10, ${colors.secondary}10)`,
            border: `1px solid ${colors.primary}30`,
            color: colors.text,
            cursor: 'pointer',
            transition: 'transform 0.2s ease',
            textDecoration: 'none',
        }
    };

    return (
        <div>
            {/* Stats Grid */}
            <div style={styles.grid}>
                <div style={styles.card}>
                    <div style={styles.statIcon('#6366f1')}>
                        <Package size={20} />
                    </div>
                    <span style={styles.statTitle}>Total Orders</span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
                        <span style={styles.statValue}>{stats.total.toLocaleString()}</span>
                        <div style={styles.trend(true)}>
                            <TrendingUp size={14} /> +0%
                        </div>
                    </div>
                </div>
                <div style={styles.card}>
                    <div style={styles.statIcon('#f59e0b')}>
                        <Clock size={20} />
                    </div>
                    <span style={styles.statTitle}>Pending Assignment</span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
                        <span style={styles.statValue}>{stats.unassigned}</span>
                        <div style={styles.trend(false)}>
                            <TrendingDown size={14} /> -0%
                        </div>
                    </div>
                </div>
                <div style={styles.card}>
                    <div style={styles.statIcon('#3b82f6')}>
                        <Factory size={20} />
                    </div>
                    <span style={styles.statTitle}>In Production</span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
                        <span style={styles.statValue}>{stats.in_production}</span>
                        <div style={styles.trend(true)}>
                            <TrendingUp size={14} /> +0%
                        </div>
                    </div>
                </div>
                <div style={styles.card}>
                    <div style={styles.statIcon('#ef4444')}>
                        <AlertTriangle size={20} />
                    </div>
                    <span style={styles.statTitle}>Delayed Orders</span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
                        <span style={styles.statValue}>{stats.delayed}</span>
                        <div style={styles.trend(false)}>
                            <TrendingUp size={14} /> +0%
                        </div>
                    </div>
                </div>
                <div style={styles.card}>
                    <div style={styles.statIcon('#10b981')}>
                        <Zap size={20} />
                    </div>
                    <span style={styles.statTitle}>Active Hubs</span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
                        <span style={styles.statValue}>{stats.active_hubs}</span>
                        <span style={{ fontSize: '0.75rem', color: colors.textMuted }}>Full Capacity</span>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                <div style={styles.chartCard}>
                    <h3 style={styles.chartTitle}>Orders by Status</h3>
                    <div style={{ height: '250px' }}>
                        <ResponsiveContainer width="100%" height={250} minWidth={0} minHeight={0}>
                            <PieChart>
                                <Pie
                                    data={stats.by_status.length > 0 ? stats.by_status : [{ name: 'No Orders', value: 1 }]}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.by_status.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ background: colors.surface, border: `1px solid ${colors.border}`, color: colors.text }}
                                />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div style={styles.chartCard}>
                    <h3 style={styles.chartTitle}>Hub Capacity Utilization (%)</h3>
                    <div style={{ height: '250px' }}>
                        <ResponsiveContainer width="100%" height={250} minWidth={0} minHeight={0}>
                            <BarChart data={stats.hub_utilization}>
                                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} />
                                <XAxis dataKey="name" stroke={colors.textMuted} fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke={colors.textMuted} fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    cursor={{ fill: colors.surfaceHover }}
                                    contentStyle={{ background: colors.surface, border: `1px solid ${colors.border}`, color: colors.text }}
                                />
                                <Bar dataKey="utilization" fill={colors.primary} radius={[4, 4, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div style={{ ...styles.chartCard, gridColumn: 'span 1' }}>
                    <h3 style={styles.chartTitle}>Orders Created per Day</h3>
                    <div style={{ height: '250px' }}>
                        <ResponsiveContainer width="100%" height={250} minWidth={0} minHeight={0}>
                            <LineChart data={stats.daily_trend}>
                                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} />
                                <XAxis dataKey="date" stroke={colors.textMuted} fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke={colors.textMuted} fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ background: colors.surface, border: `1px solid ${colors.border}`, color: colors.text }}
                                />
                                <Line type="monotone" dataKey="orders" stroke={colors.secondary} strokeWidth={3} dot={{ r: 4, fill: colors.secondary }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <h3 style={{ ...styles.chartTitle, marginTop: '2.5rem', marginBottom: '1rem' }}>Quick Actions</h3>
            <div style={styles.quickActions}>
                <div style={styles.actionBtn}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ padding: '0.75rem', background: colors.primary, borderRadius: '0.5rem', color: '#fff' }}>
                            <ClipboardList size={20} />
                        </div>
                        <div>
                            <div style={{ fontWeight: 600 }}>Assign Order</div>
                            <div style={{ fontSize: '0.75rem', color: colors.textMuted }}>{stats.unassigned} unassigned orders</div>
                        </div>
                    </div>
                    <ArrowRight size={18} color={colors.textMuted} />
                </div>
                <div style={{ ...styles.actionBtn, cursor: 'pointer' }} onClick={() => onNavigate && onNavigate('delay-management')} role="button" tabIndex={0}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ padding: '0.75rem', background: '#ef4444', borderRadius: '0.5rem', color: '#fff' }}>
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <div style={{ fontWeight: 600 }}>View Delayed Orders</div>
                            <div style={{ fontSize: '0.75rem', color: colors.textMuted }}>15 alerts require attention</div>
                        </div>
                    </div>
                    <ArrowRight size={18} color={colors.textMuted} />
                </div>
                <div style={styles.actionBtn}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ padding: '0.75rem', background: colors.secondary, borderRadius: '0.5rem', color: '#fff' }}>
                            <Brain size={20} />
                        </div>
                        <div>
                            <div style={{ fontWeight: 600 }}>AI Suggestions</div>
                            <div style={{ fontSize: '0.75rem', color: colors.textMuted }}>{stats.pending_ai} optimization suggestions</div>
                        </div>
                    </div>
                    <ArrowRight size={18} color={colors.textMuted} />
                </div>
            </div>

            {/* Hub Performance Summary Table */}
            <h3 style={{ ...styles.chartTitle, marginTop: '2.5rem', marginBottom: '1rem' }}>Hub Performance Summary</h3>
            <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '1rem', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                        <tr>
                            {['Hub Name', 'Active Orders', 'Max Capacity', 'Utilization %', 'Health'].map(h => (
                                <th key={h} style={{ padding: '0.875rem 1.25rem', borderBottom: `1px solid ${colors.border}`, color: colors.textMuted, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'left' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {stats.hub_utilization.map((hub, i) => {
                            const util = hub.utilization ?? Math.round((hub.current_load / hub.max_capacity) * 100);
                            const health = util >= 90 ? { label: 'Overloaded', color: '#ef4444' } : util >= 70 ? { label: 'Near Capacity', color: '#f59e0b' } : { label: 'Healthy', color: '#10b981' };
                            return (
                                <tr key={i} style={{ borderBottom: `1px solid ${colors.border}` }}>
                                    <td style={{ padding: '0.875rem 1.25rem', fontWeight: 600, color: colors.text }}>{hub.name}</td>
                                    <td style={{ padding: '0.875rem 1.25rem', color: colors.text }}>{hub.current_load ?? hub.currentLoad ?? '—'}</td>
                                    <td style={{ padding: '0.875rem 1.25rem', color: colors.textMuted }}>{hub.max_capacity ?? hub.capacity ?? '—'}</td>
                                    <td style={{ padding: '0.875rem 1.25rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ flex: 1, height: '6px', background: colors.border, borderRadius: '3px' }}>
                                                <div style={{ width: `${Math.min(util, 100)}%`, height: '100%', background: health.color, borderRadius: '3px' }} />
                                            </div>
                                            <span style={{ fontWeight: 700, color: colors.text, minWidth: '3rem' }}>{util}%</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '0.875rem 1.25rem' }}>
                                        <span style={{ padding: '0.3rem 0.7rem', borderRadius: '0.4rem', background: `${health.color}20`, color: health.color, fontWeight: 700, fontSize: '0.75rem' }}>{health.label}</span>
                                    </td>
                                </tr>
                            );
                        })}
                        {stats.hub_utilization.length === 0 && (
                            <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: colors.textMuted }}>No hub data available</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Inventory Risk Alerts Panel */}
            {inventoryAlerts.length > 0 && (
                <div>
                    <h3 style={{ ...styles.chartTitle, marginTop: '2rem', marginBottom: '1rem' }}>Inventory Risk Alerts</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {inventoryAlerts.slice(0, 3).map((alert, i) => (
                            <div key={i} style={{
                                background: colors.surface,
                                border: `1px solid ${alert.severity === 'CRITICAL' ? '#ef444450' : alert.severity === 'HIGH' ? '#f59e0b50' : colors.border}`,
                                borderLeft: `4px solid ${alert.severity === 'CRITICAL' ? '#ef4444' : alert.severity === 'HIGH' ? '#f59e0b' : '#3b82f6'}`,
                                borderRadius: '0.75rem',
                                padding: '1rem 1.25rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                            }}>
                                <div>
                                    <div style={{ fontWeight: 600, color: colors.text, fontSize: '0.9rem' }}>{alert.message}</div>
                                    <div style={{ color: colors.textMuted, fontSize: '0.75rem', marginTop: '0.25rem' }}>{alert.related_hub || ''}</div>
                                </div>
                                <span style={{ padding: '0.3rem 0.7rem', borderRadius: '0.4rem', background: alert.severity === 'CRITICAL' ? '#ef444420' : '#f59e0b20', color: alert.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b', fontWeight: 700, fontSize: '0.75rem' }}>{alert.severity}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardOverview;
