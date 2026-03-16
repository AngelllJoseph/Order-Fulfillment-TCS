import { useState, useEffect } from 'react';
import { 
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    AreaChart, Area, Cell, Legend
} from 'recharts';
import { TrendingUp, Zap, Activity, Info } from 'lucide-react';
import api from '../../services/api';

const DemandSupplyDashboard = ({ colors, darkMode }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get('/reports/analytics/demand-supply/');
                setData(response.data);
            } catch (error) {
                console.error("Error fetching demand/supply data:", error);
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

    if (loading) return <div style={{ color: colors.textMuted }}>Loading demand-supply analysis...</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Quick Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                <div style={cardStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <div style={{ padding: '8px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '8px' }}>
                            <TrendingUp size={20} color={colors.primary} />
                        </div>
                        <span style={{ fontSize: '0.875rem', color: colors.textMuted, fontWeight: 500 }}>Available Capacity</span>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{data?.available_capacity} <span style={{fontSize: '0.875rem', color: colors.textMuted, fontWeight: 400}}>units</span></div>
                </div>
                <div style={cardStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <div style={{ padding: '8px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px' }}>
                            <Zap size={20} color={colors.accent} />
                        </div>
                        <span style={{ fontSize: '0.875rem', color: colors.textMuted, fontWeight: 500 }}>Current Load</span>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{data?.current_load} <span style={{fontSize: '0.875rem', color: colors.textMuted, fontWeight: 400}}>units</span></div>
                </div>
                <div style={cardStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <div style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px' }}>
                            <Activity size={20} color="#10b981" />
                        </div>
                        <span style={{ fontSize: '0.875rem', color: colors.textMuted, fontWeight: 500 }}>System Health</span>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>98.2%</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
                {/* Demand Trend Chart */}
                <div style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>Demand Trend & Forecast</h3>
                        <div style={{ padding: '4px 8px', background: colors.surface, borderRadius: '4px', fontSize: '0.75rem', color: colors.textMuted, border: `1px solid ${colors.border}` }}>
                            Last 30 Days + 7 Day Forecast
                        </div>
                    </div>
                    <div style={{ height: '350px', width: '100%', position: 'relative', minHeight: '350px', minWidth: 0 }}>
                        {data && (
                            <ResponsiveContainer width="100%" height={350} key="demand-chart" debounce={100}>
                                <AreaChart data={Array.isArray(data?.forecasted_demand) ? data.forecasted_demand : []}>
                                    <defs>
                                        <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={colors.primary} stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor={colors.primary} stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} />
                                    <XAxis 
                                        dataKey="date" 
                                        stroke={colors.textMuted} 
                                        fontSize={10} 
                                        tickLine={false} 
                                        axisLine={false}
                                        tickFormatter={(val) => val.split('-').slice(1).join('/')}
                                    />
                                    <YAxis stroke={colors.textMuted} fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip 
                                        contentStyle={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '0.5rem' }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="demand" 
                                        stroke={colors.primary} 
                                        fillOpacity={1} 
                                        fill="url(#colorDemand)" 
                                        strokeWidth={3}
                                        data={data.forecasted_demand.filter(d => d.type === 'actual')}
                                        name="Actual Demand"
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="demand" 
                                        stroke={colors.primary} 
                                        fillOpacity={0.1} 
                                        fill="url(#colorDemand)" 
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                        data={data.forecasted_demand.filter(d => d.type === 'forecast')}
                                        connectNulls={true}
                                        name="Forecasted Demand"
                                    />
                                    <Legend verticalAlign="top" height={36}/>
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Utilization Forecast Chart */}
                <div style={cardStyle}>
                    <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.125rem', fontWeight: 600 }}>Utilization Prediction</h3>
                    <div style={{ height: '350px', width: '100%', position: 'relative', minHeight: '350px', minWidth: 0 }}>
                        {data && (
                            <ResponsiveContainer width="100%" height={350} key="utilization-chart" debounce={100}>
                                <BarChart data={Array.isArray(data?.utilization_prediction) ? data.utilization_prediction : []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} />
                                    <XAxis 
                                        dataKey="date" 
                                        stroke={colors.textMuted} 
                                        fontSize={10} 
                                        tickLine={false} 
                                        axisLine={false}
                                        tickFormatter={(val) => val.split('-').slice(1).join('/')}
                                    />
                                    <YAxis stroke={colors.textMuted} fontSize={12} tickLine={false} axisLine={false} unit="%" />
                                    <Tooltip 
                                        contentStyle={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '0.5rem' }}
                                        formatter={(value) => [`${value}%`, 'Predicted Utilization']}
                                    />
                                    <Bar dataKey="utilization" radius={[4, 4, 0, 0]}>
                                        {Array.isArray(data?.utilization_prediction) && data.utilization_prediction.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.utilization > 85 ? '#ef4444' : entry.utilization > 70 ? '#f59e0b' : colors.accent} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                    <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '0.75rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <Info size={20} color={colors.accent} />
                        <p style={{ margin: 0, fontSize: '0.8125rem', color: colors.textMuted }}>
                            AI models suggest a <span style={{ fontWeight: 700, color: colors.text }}>12% increase</span> in regional demand next week. Consider increasing hub capacity.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DemandSupplyDashboard;
