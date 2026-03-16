import { useState, useEffect } from 'react';
import { 
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
    BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { CheckCircle2, Clock, AlertTriangle, Timer } from 'lucide-react';
import axios from 'axios';

const FulfillmentPerformance = ({ colors, darkMode }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await axios.get('/api/reports/performance/fulfillment/');
                setStats(response.data);
            } catch (error) {
                console.error("Error fetching performance stats:", error);
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
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(8px)',
        minWidth: 0,
    };

    if (loading) return <div style={{ color: colors.textMuted }}>Loading performance metrics...</div>;

    const data = [
        { name: 'On-Time', value: stats?.on_time_rate || 0, color: '#10b981' },
        { name: 'Delayed', value: stats?.delayed_rate || 0, color: '#f59e0b' },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {/* On-Time vs Delayed Rate */}
                <div style={cardStyle}>
                    <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.125rem', fontWeight: 600 }}>Fulfillment Efficiency</h3>
                    <div style={{ height: '300px', width: '100%', minWidth: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                     contentStyle={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '0.5rem' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1rem' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>{stats?.on_time_rate}%</div>
                            <div style={{ color: colors.textMuted, fontSize: '0.875rem' }}>On-Time</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b' }}>{stats?.delayed_rate}%</div>
                            <div style={{ color: colors.textMuted, fontSize: '0.875rem' }}>Delayed</div>
                        </div>
                    </div>
                </div>

                {/* KPIs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ ...cardStyle, flex: 1, justifyContent: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ padding: '1rem', borderRadius: '1rem', background: 'rgba(16, 185, 129, 0.1)' }}>
                                <CheckCircle2 size={32} color="#10b981" />
                            </div>
                            <div>
                                <div style={{ color: colors.textMuted, fontSize: '0.875rem' }}>Service Level Agreement</div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: colors.text }}>94.2%</div>
                            </div>
                        </div>
                    </div>
                    <div style={{ ...cardStyle, flex: 1, justifyContent: 'center' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ padding: '1rem', borderRadius: '1rem', background: 'rgba(245, 158, 11, 0.1)' }}>
                                <Timer size={32} color="#f59e0b" />
                            </div>
                            <div>
                                <div style={{ color: colors.textMuted, fontSize: '0.875rem' }}>Avg Production Delay</div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: colors.text }}>2.4 hrs</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stage Durations (Placeholder for future breakdown) */}
            <div style={cardStyle}>
                <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.125rem', fontWeight: 600 }}>Production Stage Durations</h3>
                <div style={{ height: '250px', width: '100%', minWidth: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                            { stage: 'Order Processing', time: 1.5 },
                            { stage: 'Manufacturing', time: 14.2 },
                            { stage: 'Quality Test', time: 3.8 },
                            { stage: 'Despatch', time: 5.1 },
                        ]}>
                            <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} />
                            <XAxis dataKey="stage" stroke={colors.textMuted} fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke={colors.textMuted} fontSize={12} tickLine={false} axisLine={false} label={{ value: 'Hours', angle: -90, position: 'insideLeft', fill: colors.textMuted }} />
                            <Tooltip 
                                 contentStyle={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '0.5rem' }}
                            />
                            <Bar dataKey="time" fill={colors.secondary} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default FulfillmentPerformance;
