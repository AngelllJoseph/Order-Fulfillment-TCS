import { useState, useEffect } from 'react';
import { 
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    LineChart, Line
} from 'recharts';
import { Truck, Clock, AlertCircle, Calendar } from 'lucide-react';
import axios from 'axios';

const DeliveryTimelines = ({ colors, darkMode }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTimelines = async () => {
            try {
                const response = await axios.get('/api/reports/performance/delivery/');
                setData(Array.isArray(response.data?.delivery_distribution) ? response.data : { ...response.data, delivery_distribution: [] });
            } catch (error) {
                console.error("Error fetching delivery timelines:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTimelines();
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

    if (loading) return <div style={{ color: colors.textMuted }}>Loading delivery performance...</div>;

    const stats = [
        { label: 'Avg Shipping Time', value: data?.avg_shipping_time || 'N/A', icon: Clock, color: colors.primary },
        { label: 'Delayed Deliveries', value: data?.delayed_deliveries || 0, icon: AlertCircle, color: '#ef4444' },
        { label: 'Expected Today', value: 12, icon: Calendar, color: colors.accent },
        { label: 'In Transit', value: 45, icon: Truck, color: colors.secondary },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                {stats.map((stat, index) => (
                    <div key={index} style={cardStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{ color: colors.textMuted, fontSize: '0.875rem' }}>{stat.label}</span>
                            <stat.icon size={18} color={stat.color} />
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stat.value}</div>
                    </div>
                ))}
            </div>

            <div style={cardStyle}>
                <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.125rem', fontWeight: 600 }}>Delivery Time Distribution</h3>
                <div style={{ height: '350px', width: '100%', minWidth: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={Array.isArray(data?.delivery_distribution) ? data.delivery_distribution : []}>
                            <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} />
                            <XAxis dataKey="name" stroke={colors.textMuted} fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke={colors.textMuted} fontSize={12} tickLine={false} axisLine={false} label={{ value: 'Orders', angle: -90, position: 'insideLeft', fill: colors.textMuted }} />
                            <Tooltip 
                                 contentStyle={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '0.5rem' }}
                            />
                            <Bar dataKey="count" fill={colors.primary} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <p style={{ marginTop: '1rem', color: colors.textMuted, fontSize: '0.875rem', textAlign: 'center' }}>
                    Distribution of time taken from hub despatch to final customer delivery.
                </p>
            </div>
        </div>
    );
};

export default DeliveryTimelines;
