import { useState, useEffect } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import { Filter, Download, Search } from 'lucide-react';
import axios from 'axios';

const OrderAnalytics = ({ colors, darkMode }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('/api/reports/analytics/orders/');
                setData(response.data);
            } catch (error) {
                console.error("Error fetching order analytics:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const cardStyle = {
        background: colors.cardBg,
        padding: '1.5rem',
        borderRadius: '1rem',
        border: `1px solid ${colors.border}`,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(8px)',
        minWidth: 0,
    };

    if (loading) return <div style={{ color: colors.textMuted }}>Loading order trends...</div>;

    const STATUS_COLORS = {
        'ORDERED': '#6366f1',
        'ASSIGNED': '#a17dfd',
        'MANUFACTURING': '#3b82f6',
        'QUALITY_TEST': '#06b6d4',
        'COMPLETED': '#10b981',
        'DELAYED': '#f59e0b',
        'CANCELLED': '#ef4444',
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
                {/* Orders per Day */}
                <div style={cardStyle}>
                    <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.125rem', fontWeight: 600 }}>Daily Order Volume</h3>
                    <div style={{ height: '300px', width: '100%', minWidth: 0, position: 'relative' }}>
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <LineChart data={data?.orders_per_day}>
                                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} />
                                <XAxis dataKey="day" stroke={colors.textMuted} fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke={colors.textMuted} fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '0.5rem' }}
                                />
                                <Line type="monotone" dataKey="count" stroke={colors.primary} strokeWidth={3} dot={{ r: 4, fill: colors.primary }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Orders by Status */}
                <div style={cardStyle}>
                    <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.125rem', fontWeight: 600 }}>Distribution by Status</h3>
                    <div style={{ height: '300px', width: '100%', minWidth: 0, position: 'relative' }}>
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <PieChart>
                                <Pie
                                    data={Array.isArray(data?.orders_by_status) ? data.orders_by_status : []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="count"
                                    nameKey="status"
                                >
                                    {Array.isArray(data?.orders_by_status) && data.orders_by_status.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || colors.primary} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                     contentStyle={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '0.5rem' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Orders per Hub */}
            <div style={cardStyle}>
                <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.125rem', fontWeight: 600 }}>Order Distribution by Hub</h3>
                <div style={{ height: '300px', width: '100%', minWidth: 0, position: 'relative' }}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <BarChart data={data?.orders_per_hub} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke={colors.border} horizontal={false} />
                            <XAxis type="number" stroke={colors.textMuted} fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis dataKey="hub__name" type="category" stroke={colors.textMuted} fontSize={12} tickLine={false} axisLine={false} width={100} />
                            <Tooltip 
                                 contentStyle={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '0.5rem' }}
                            />
                            <Bar dataKey="count" fill={colors.accent} radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default OrderAnalytics;
