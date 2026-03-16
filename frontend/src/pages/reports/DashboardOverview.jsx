import { useState, useEffect } from 'react';
import { 
    LayoutDashboard, 
    ShoppingCart, 
    CheckCircle, 
    Clock, 
    AlertTriangle, 
    TrendingUp, 
    BarChart3, 
    PieChart as PieIcon 
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import axios from 'axios';

const DashboardOverview = ({ colors, darkMode }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await axios.get('/api/reports/dashboard/');
                setStats(response.data);
            } catch (error) {
                console.error("Error fetching dashboard stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const cardStyle = {
        background: colors.cardBg,
        padding: '1.5rem',
        borderRadius: '1rem',
        border: `1px solid ${colors.border}`,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(8px)',
        minWidth: 0,
    };

    if (loading) return <div style={{ color: colors.textMuted }}>Loading analytics...</div>;

    const kpiData = [
        { label: 'Total Orders', value: stats?.total_orders || 0, icon: LayoutDashboard, color: colors.primary },
        { label: 'Orders Completed', value: stats?.completed_orders || 0, icon: CheckCircle, color: '#10b981' },
        { label: 'In Production', value: stats?.in_production || 0, icon: Clock, color: colors.accent },
        { label: 'Delayed Orders', value: stats?.delayed_orders || 0, icon: AlertTriangle, color: '#f59e0b' },
        { label: 'Avg Fulfillment Time', value: stats?.avg_fulfillment_time || 'N/A', icon: TrendingUp, color: colors.secondary },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                {kpiData.map((kpi, index) => (
                    <div key={index} style={cardStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: colors.textMuted, fontSize: '0.875rem', fontWeight: 500 }}>{kpi.label}</span>
                            <kpi.icon size={18} color={kpi.color} />
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: colors.text }}>{kpi.value}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                <div style={cardStyle}>
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem', fontWeight: 600 }}>Performance Overview</h3>
                    <div style={{ height: '300px', width: '100%', minWidth: 0, position: 'relative' }}>
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <BarChart data={[
                                { name: 'Completed', value: stats?.completed_orders },
                                { name: 'In Production', value: stats?.in_production },
                                { name: 'Delayed', value: stats?.delayed_orders },
                            ]}>
                                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} />
                                <XAxis dataKey="name" stroke={colors.textMuted} fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke={colors.textMuted} fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '0.5rem' }}
                                />
                                <Bar dataKey="value" fill={colors.primary} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div style={cardStyle}>
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem', fontWeight: 600 }}>Fulfillment Speed</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', alignItems: 'center', gap: '1rem' }}>
                        <Clock size={48} color={colors.secondary} style={{ opacity: 0.5 }} />
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: colors.secondary }}>{stats?.avg_fulfillment_time || 'N/A'}</div>
                            <div style={{ color: colors.textMuted }}>Average time from order to delivery</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardOverview;
