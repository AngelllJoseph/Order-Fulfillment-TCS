import { useState, useEffect } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    Cell 
} from 'recharts';
import { Factory, Zap, PieChart as PieIcon, Activity } from 'lucide-react';
import axios from 'axios';

const CapacityUtilization = ({ colors, darkMode }) => {
    const [hubs, setHubs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHubs = async () => {
            try {
                const response = await axios.get('/api/reports/capacity/utilization/');
                setHubs(Array.isArray(response.data) ? response.data : []);
            } catch (error) {
                console.error("Error fetching capacity data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchHubs();
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

    if (loading) return <div style={{ color: colors.textMuted }}>Loading capacity insights...</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Hub Utilization Bars */}
            <div style={cardStyle}>
                <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.125rem', fontWeight: 600 }}>Hub Capacity Utilization</h3>
                <div style={{ height: '400px', width: '100%', minWidth: 0, position: 'relative' }}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <BarChart data={hubs}>
                            <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} />
                            <XAxis dataKey="name" stroke={colors.textMuted} fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke={colors.textMuted} fontSize={12} tickLine={false} axisLine={false} unit="%" />
                            <Tooltip 
                                 contentStyle={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '0.5rem' }}
                                 formatter={(value) => [`${value}%`, 'Utilization']}
                            />
                            <Bar dataKey="utilization" radius={[6, 6, 0, 0]}>
                                {Array.isArray(hubs) && hubs.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.utilization > 80 ? '#ef4444' : entry.utilization > 50 ? '#f59e0b' : colors.primary} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Hub Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {Array.isArray(hubs) && hubs.map((hub, index) => (
                    <div key={index} style={cardStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div>
                                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{hub.name}</h4>
                                <span style={{ fontSize: '0.75rem', color: colors.textMuted }}>Manufacturing Hub</span>
                            </div>
                            <div style={{ 
                                padding: '4px 10px', 
                                borderRadius: '20px', 
                                fontSize: '0.75rem', 
                                fontWeight: 700,
                                background: hub.utilization > 80 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                color: hub.utilization > 80 ? '#ef4444' : '#10b981'
                            }}>
                                {hub.utilization > 80 ? 'High Load' : 'Optimal'}
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                <span style={{ color: colors.textMuted }}>Current Load:</span>
                                <span style={{ fontWeight: 600 }}>{hub.current_load} units</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                <span style={{ color: colors.textMuted }}>Daily Capacity:</span>
                                <span style={{ fontWeight: 600 }}>{hub.capacity} units</span>
                            </div>
                            <div style={{ width: '100%', height: '8px', background: colors.border, borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ 
                                    width: `${hub.utilization}%`, 
                                    height: '100%', 
                                    background: hub.utilization > 80 ? '#ef4444' : hub.utilization > 50 ? '#f59e0b' : colors.primary,
                                    transition: 'width 1s ease-in-out'
                                }} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CapacityUtilization;
