import { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';
import {
    Download,
    Filter,
    Calendar,
    FileText,
    TrendingUp
} from 'lucide-react';
import { reportsService } from '../../services/reports';

const ReportsPage = ({ colors, darkMode }) => {
    const [stats, setStats] = useState({
        ordersByStatus: [],
        hubUtilization: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const [orderRes, hubRes] = await Promise.all([
                reportsService.getOperationalStats(),
                reportsService.getHubLoadStats()
            ]);

            setStats({
                ordersByStatus: Object.entries(orderRes.data.stats || {}).map(([name, value]) => ({ name, value })),
                hubUtilization: hubRes.data.map(h => ({ name: h.name, utilization: h.usage_percent }))
            });
        } catch (err) {
            console.error("Failed to fetch reports:", err);
        } finally {
            setLoading(false);
        }
    };

    const styles = {
        container: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
        controls: { display: 'flex', gap: '0.75rem' },
        chartCard: {
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: '1.25rem',
            padding: '1.5rem',
        },
        chartTitle: { fontSize: '1rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' },
        btn: {
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
        exportBtn: {
            background: colors.primary,
            color: '#fff',
            border: 'none'
        }
    };

    if (loading) return <div style={{ color: colors.textMuted }}>Generating analytical reports...</div>;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Operational Analytics</h2>
                <div style={styles.controls}>
                    <button style={styles.btn} onClick={() => alert('Date range picker will be available here.')}><Calendar size={18} /> Date Range</button>
                    <button style={styles.btn} onClick={() => alert('Hub filtering options will be available here.')}><Filter size={18} /> Hub Filter</button>
                    <button style={{ ...styles.btn, ...styles.exportBtn }} onClick={() => alert('Excel export feature is coming soon!')}><Download size={18} /> Export Excel</button>
                    <button style={{ ...styles.btn, border: `1px solid ${colors.primary}`, color: colors.primary }} onClick={() => alert('PDF export feature is coming soon!')}><FileText size={18} /> PDF</button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '1.5rem' }}>
                <div style={styles.chartCard}>
                    <h3 style={styles.chartTitle}><TrendingUp size={18} color={colors.primary} /> Order Performance by Status</h3>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={stats.ordersByStatus}>
                                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} />
                                <XAxis dataKey="name" stroke={colors.textMuted} fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke={colors.textMuted} fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    cursor={{ fill: colors.surfaceHover }}
                                    contentStyle={{ background: colors.surface, border: `1px solid ${colors.border}`, color: colors.text }}
                                />
                                <Bar dataKey="value" fill={colors.primary} radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div style={styles.chartCard}>
                    <h3 style={styles.chartTitle}><TrendingUp size={18} color={colors.secondary} /> Hub Capacity Utilization (%)</h3>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={stats.hubUtilization}>
                                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} />
                                <XAxis dataKey="name" stroke={colors.textMuted} fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke={colors.textMuted} fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    cursor={{ fill: colors.surfaceHover }}
                                    contentStyle={{ background: colors.surface, border: `1px solid ${colors.border}`, color: colors.text }}
                                />
                                <Bar dataKey="utilization" fill={colors.secondary} radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div style={{ ...styles.chartCard, gridColumn: 'span 2' }}>
                    <h3 style={styles.chartTitle}>Load & Efficiency Trend</h3>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={[] /* Trend data requires time-series endpoint */}>
                                <defs>
                                    <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={colors.primary} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={colors.primary} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} />
                                <XAxis dataKey="date" stroke={colors.textMuted} fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke={colors.textMuted} fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ background: colors.surface, border: `1px solid ${colors.border}`, color: colors.text }} />
                                <Area type="monotone" dataKey="efficiency" stroke={colors.primary} fillOpacity={1} fill="url(#colorUsage)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;
