import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { 
    ClipboardList, 
    PlayCircle, 
    CheckCircle, 
    AlertTriangle, 
    Factory, 
    BarChart2, 
    PieChart as PieChartIcon, 
    Clock, 
    History,
    ArrowUpRight
} from 'lucide-react';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer, 
    PieChart, 
    Pie, 
    Cell, 
    Legend 
} from 'recharts';

const ProductionOverview = ({ colors, darkMode }) => {
    const [overviewData, setOverviewData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOverviewData = async () => {
            try {
                setLoading(true);
                const response = await api.get('/dashboard/production-overview/');
                setOverviewData(response.data);
            } catch (err) {
                console.error("Failed to fetch production overview:", err);
                setError("Failed to load dashboard data. Please try again later.");
                // Mock data for demonstration if API fails (since we are in development)
                setOverviewData({
                    kpis: {
                        totalOrders: 154,
                        inProduction: 28,
                        completedToday: 12,
                        delayedOrders: 5,
                        activeHubs: 8
                    },
                    ordersByHub: [
                        { hubId: 'Hub Alpha', count: 45 },
                        { hubId: 'Hub Beta', count: 32 },
                        { hubId: 'Hub Gamma', count: 28 },
                        { hubId: 'Hub Delta', count: 25 },
                        { hubId: 'Hub Epsilon', count: 24 }
                    ],
                    stageDistribution: [
                        { stage: 'In Queue', count: 40 },
                        { stage: 'In Production', count: 28 },
                        { stage: 'Quality Test', count: 22 },
                        { stage: 'Completed', count: 35 },
                        { stage: 'Warehouse', count: 15 },
                        { stage: 'Closed', count: 14 }
                    ],
                    recentUpdates: [
                        { orderId: 'ORD-2024-001', hubId: 'Hub Alpha', productionStage: 'Quality Test', updatedAt: new Date().toISOString() },
                        { orderId: 'ORD-2024-002', hubId: 'Hub Beta', productionStage: 'In Production', updatedAt: new Date(Date.now() - 3600000).toISOString() },
                        { orderId: 'ORD-2024-003', hubId: 'Hub Gamma', productionStage: 'Completed', updatedAt: new Date(Date.now() - 7200000).toISOString() },
                        { orderId: 'ORD-2024-004', hubId: 'Hub Alpha', productionStage: 'Warehouse', updatedAt: new Date(Date.now() - 10800000).toISOString() },
                        { orderId: 'ORD-2024-005', hubId: 'Hub Delta', productionStage: 'In Queue', updatedAt: new Date(Date.now() - 14400000).toISOString() }
                    ]
                });
            } finally {
                setLoading(false);
            }
        };

        fetchOverviewData();
    }, []);

    const chartColors = useMemo(() => [
        '#6366f1', '#a17dfd', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'
    ], []);

    const styles = {
        grid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
        },
        card: {
            background: colors.cardBg,
            border: `1px solid ${colors.border}`,
            borderRadius: '1.25rem',
            padding: '1.5rem',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            cursor: 'pointer',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            }
        },
        analyticsGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2.5rem'
        },
        chartCard: {
            background: colors.cardBg,
            border: `1px solid ${colors.border}`,
            borderRadius: '1.25rem',
            padding: '1.5rem',
            minHeight: '400px'
        },
        tableCard: {
            background: colors.cardBg,
            border: `1px solid ${colors.border}`,
            borderRadius: '1.25rem',
            padding: '1.5rem',
            overflow: 'hidden'
        },
        table: {
            width: '100%',
            borderCollapse: 'separate',
            borderSpacing: '0 0.5rem',
            marginTop: '1rem'
        },
        th: {
            textAlign: 'left',
            color: colors.textMuted,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            padding: '0 1rem 0.5rem 1rem'
        },
        tr: {
            background: colors.surface,
            borderRadius: '1rem',
            transition: 'background 0.2s'
        },
        td: {
            padding: '1rem',
            fontSize: '0.875rem',
            color: colors.text
        },
        tag: (stage) => {
            const colorsMap = {
                'In Queue': { bg: '#3b82f615', color: '#3b82f6' },
                'Ordered': { bg: '#3b82f615', color: '#3b82f6' },
                'Assigned to Hub': { bg: '#3b82f615', color: '#3b82f6' },
                'In Production': { bg: '#a855f715', color: '#a855f7' },
                'Manufacturing': { bg: '#a855f715', color: '#a855f7' },
                'Quality Test': { bg: '#f59e0b15', color: '#f59e0b' },
                'Completed Manufacturing': { bg: '#10b98115', color: '#10b981' },
                'Completed': { bg: '#10b98115', color: '#10b981' },
                'Warehouse': { bg: '#6366f115', color: '#6366f1' },
                'Despatched to Warehouse': { bg: '#6366f115', color: '#6366f1' },
                'Despatched to Customer': { bg: '#6366f115', color: '#6366f1' },
                'Closed': { bg: colors.border, color: colors.textMuted },
                'Delayed': { bg: '#ef444415', color: '#ef4444' }
            };
            const style = colorsMap[stage] || { bg: colors.border, color: colors.textMuted };
            return {
                padding: '0.25rem 0.75rem',
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                background: style.bg,
                color: style.color,
                display: 'inline-block'
            };
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={styles.grid}>
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} style={{ ...styles.card, height: '140px', background: `${colors.border}22`, animatePresence: 'pulse' }}></div>
                    ))}
                </div>
                <div style={styles.analyticsGrid}>
                    <div style={{ ...styles.chartCard, background: `${colors.border}22` }}></div>
                    <div style={{ ...styles.chartCard, background: `${colors.border}22` }}></div>
                </div>
            </div>
        );
    }

    const { kpis, ordersByHub, stageDistribution, recentUpdates } = overviewData || {};

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* KPI Cards */}
            <div style={styles.grid}>
                <KPICard 
                    icon={ClipboardList} 
                    label="Total Orders" 
                    value={kpis?.totalOrders || 0} 
                    color="#6366f1" 
                    colors={colors}
                />
                <KPICard 
                    icon={PlayCircle} 
                    label="In Production" 
                    value={kpis?.inProduction || 0} 
                    color="#a855f7" 
                    colors={colors}
                />
                <KPICard 
                    icon={CheckCircle} 
                    label="Completed Today" 
                    value={kpis?.completedToday || 0} 
                    color="#10b981" 
                    colors={colors}
                />
                <KPICard 
                    icon={AlertTriangle} 
                    label="Delayed Orders" 
                    value={kpis?.delayedOrders || 0} 
                    color="#ef4444" 
                    colors={colors}
                />
                <KPICard 
                    icon={Factory} 
                    label="Active Hubs" 
                    value={kpis?.activeHubs || 0} 
                    color="#3b82f6" 
                    colors={colors}
                />
            </div>

            {/* Analytics Charts */}
            <div style={styles.analyticsGrid}>
                {/* Orders by Hub - Bar Chart */}
                <div style={styles.chartCard}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                        <BarChart2 size={20} color={colors.primary} />
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Orders by Hub</h2>
                    </div>
                    <div style={{ width: '100%', height: '300px' }}>
                        <ResponsiveContainer>
                            <BarChart data={ordersByHub}>
                                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} />
                                <XAxis 
                                    dataKey="hubId" 
                                    stroke={colors.textMuted} 
                                    fontSize={12} 
                                    tickLine={false} 
                                    axisLine={false} 
                                />
                                <YAxis 
                                    stroke={colors.textMuted} 
                                    fontSize={12} 
                                    tickLine={false} 
                                    axisLine={false} 
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        background: colors.surface, 
                                        border: `1px solid ${colors.border}`,
                                        borderRadius: '0.75rem',
                                        color: colors.text
                                    }}
                                />
                                <Bar dataKey="count" fill={colors.primary} radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Stage Distribution - Pie Chart */}
                <div style={styles.chartCard}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                        <PieChartIcon size={20} color={colors.secondary} />
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Production Stage Distribution</h2>
                    </div>
                    <div style={{ width: '100%', height: '300px' }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={stageDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="count"
                                    nameKey="stage"
                                >
                                    {stageDistribution?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ 
                                        background: colors.surface, 
                                        border: `1px solid ${colors.border}`,
                                        borderRadius: '0.75rem',
                                        color: colors.text
                                    }}
                                />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Recent Production Activity */}
            <div style={styles.tableCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <History size={20} color={colors.primary} />
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Recent Production Activity</h2>
                    </div>
                    <button style={{ color: colors.primary, fontSize: '0.875rem', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        View All <ArrowUpRight size={16} />
                    </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Order ID</th>
                                <th style={styles.th}>Hub</th>
                                <th style={styles.th}>Current Stage</th>
                                <th style={styles.th}>Last Updated</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentUpdates?.length > 0 ? (
                                recentUpdates.map((update, index) => (
                                    <tr key={index} style={styles.tr}>
                                        <td style={{ ...styles.td, fontWeight: 700, color: colors.primary }}>{update.orderId}</td>
                                        <td style={styles.td}>{update.hubId}</td>
                                        <td style={styles.td}>
                                            <span style={styles.tag(update.productionStage)}>
                                                {update.productionStage}
                                            </span>
                                        </td>
                                        <td style={{ ...styles.td, color: colors.textMuted }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Clock size={14} />
                                                {new Date(update.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: colors.textMuted }}>
                                        No recent activity recorded.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const KPICard = ({ icon: Icon, label, value, color, colors }) => {
    return (
        <div style={{
            background: colors.cardBg,
            border: `1px solid ${colors.border}`,
            borderRadius: '1.25rem',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
        }} onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
        }} onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
        }}>
            <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: `${color}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: color
            }}>
                <Icon size={24} />
            </div>
            <div>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: colors.text }}>
                    {value}
                </h3>
                <p style={{ color: colors.textMuted, margin: '0.25rem 0 0 0', fontWeight: 500, fontSize: '0.875rem' }}>
                    {label}
                </p>
            </div>
        </div>
    );
};

export default ProductionOverview;
