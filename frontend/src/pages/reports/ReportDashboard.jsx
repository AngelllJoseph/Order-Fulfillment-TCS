import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../../components/NotificationBell';
import {
    LayoutDashboard,
    BarChart3,
    Activity,
    Clock,
    Zap,
    Download,
    User,
    LogOut,
    Sun,
    Moon,
    Menu,
    X,
    Search,
    TrendingUp,
    FileText
} from 'lucide-react';

// Import sub-pages
import DashboardOverview from './DashboardOverview';
import OrderAnalytics from './OrderAnalytics';
import FulfillmentPerformance from './FulfillmentPerformance';
import CapacityUtilization from './CapacityUtilization';
import DeliveryTimelines from './DeliveryTimelines';
import DemandSupplyDashboard from './DemandSupplyDashboard';
import ExportReports from './ExportReports';

const ReportDashboard = () => {
    const { user, logout } = useAuth();
    const [darkMode, setDarkMode] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');

    const toggleTheme = () => setDarkMode(!darkMode);

    const colors = {
        bg: darkMode ? '#000000' : '#f8fafc',
        surface: darkMode ? '#0f172a' : '#ffffff',
        text: darkMode ? '#f1f5f9' : '#0f172a',
        textMuted: darkMode ? '#94a3b8' : '#64748b',
        primary: '#6366f1',
        secondary: '#a17dfd',
        accent: '#3b82f6',
        border: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        cardBg: darkMode ? 'rgba(30, 41, 59, 0.5)' : '#ffffff',
    };

    const styles = {
        container: {
            minHeight: '100vh',
            background: colors.bg,
            color: colors.text,
            fontFamily: "'Inter', sans-serif",
            transition: 'background 0.3s ease, color 0.3s ease',
        },
        sidebar: {
            position: 'fixed',
            top: 0,
            left: 0,
            width: isSidebarOpen ? '280px' : '0px',
            height: '100vh',
            background: colors.surface,
            borderRight: `1px solid ${colors.border}`,
            display: 'flex',
            flexDirection: 'column',
            padding: isSidebarOpen ? '1.5rem 1rem' : '0',
            overflow: 'hidden',
            transition: 'width 0.3s ease, padding 0.3s ease',
            zIndex: 100,
        },
        logo: {
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0 0.5rem',
            marginBottom: '2rem',
        },
        logoText: {
            fontSize: '1.5rem',
            fontWeight: 800,
            background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
        },
        navItem: (isActive) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.875rem 1.25rem',
            borderRadius: '0.75rem',
            color: isActive ? colors.text : colors.textMuted,
            background: isActive ? (darkMode ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)') : 'transparent',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            marginBottom: '0.25rem',
            border: 'none',
            width: '100%',
            textAlign: 'left',
            fontSize: '0.925rem',
            fontWeight: isActive ? 600 : 500,
        }),
        mainWrapper: {
            marginLeft: isSidebarOpen ? '280px' : '0px',
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            transition: 'margin-left 0.3s ease',
        },
        topbar: {
            height: '70px',
            background: colors.surface,
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 2rem',
            position: 'sticky',
            top: 0,
            zIndex: 90,
        },
        content: {
            padding: '2.5rem',
            flex: 1,
        }
    };

    const navItems = [
        { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
        { id: 'analytics', label: 'Order Analytics', icon: BarChart3 },
        { id: 'performance', label: 'Fulfillment Performance', icon: Activity },
        { id: 'timelines', label: 'Delivery Timelines', icon: Clock },
        { id: 'demand-supply', label: 'Demand & Supply', icon: Zap },
        { id: 'capacity', label: 'Capacity Utilization', icon: Activity },
        { id: 'export', label: 'Export Reports', icon: Download },
        { id: 'profile', label: 'My Profile', icon: User },
    ];

    return (
        <div style={styles.container}>
            <aside style={styles.sidebar}>
                <div style={styles.logo}>
                    <TrendingUp size={32} color={colors.primary} />
                    <span style={styles.logoText}>ReportHub</span>
                </div>
                <nav style={{ flex: 1, overflowY: 'auto' }}>
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            style={styles.navItem(activeTab === item.id)}
                        >
                            <item.icon size={20} />
                            <span style={{ flex: 1 }}>{item.label}</span>
                        </button>
                    ))}
                </nav>
                <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: `1px solid ${colors.border}` }}>
                    <button onClick={logout} style={{ ...styles.navItem(false), color: '#ef4444' }}>
                        <LogOut size={20} /> Sign Out
                    </button>
                </div>
            </aside>

            <div style={styles.mainWrapper}>
                <header style={styles.topbar}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button style={{ background: 'none', border: 'none', color: colors.text, cursor: 'pointer' }} onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Analytics Center</h2>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <button style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer' }} onClick={toggleTheme}>
                            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <NotificationBell colors={colors} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                                width: '36px', height: '36px', borderRadius: '50%',
                                background: `linear-gradient(45deg, ${colors.primary}, ${colors.secondary})`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white', fontWeight: 700
                            }}>
                                {user?.first_name?.charAt(0) || 'R'}
                            </div>
                            <div style={{ lineHeight: 1.2 }}>
                                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user?.first_name || 'Report User'}</div>
                                <div style={{ fontSize: '0.75rem', color: colors.textMuted }}>Data Analyst</div>
                            </div>
                        </div>
                    </div>
                </header>

                <main style={styles.content}>
                    <div style={{ marginBottom: '2.5rem' }}>
                        <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>{navItems.find(i => i.id === activeTab)?.label}</h1>
                        <p style={{ color: colors.textMuted, marginTop: '0.5rem' }}>Read-only Analytical Profile • {new Date().toLocaleDateString()}</p>
                    </div>

                    {activeTab === 'dashboard' && <DashboardOverview colors={colors} darkMode={darkMode} />}
                    {activeTab === 'analytics' && <OrderAnalytics colors={colors} darkMode={darkMode} />}
                    {activeTab === 'performance' && <FulfillmentPerformance colors={colors} darkMode={darkMode} />}
                    { activeTab === 'timelines' && <DeliveryTimelines colors={colors} darkMode={darkMode} /> }
                    { activeTab === 'demand-supply' && <DemandSupplyDashboard colors={colors} darkMode={darkMode} /> }
                    { activeTab === 'capacity' && <CapacityUtilization colors={colors} darkMode={darkMode} /> }
                    {activeTab === 'export' && <ExportReports colors={colors} darkMode={darkMode} />}
                    {activeTab === 'profile' && <div>Profile settings coming soon...</div>}
                </main>
            </div>
            <style>{`
                 ::-webkit-scrollbar { width: 6px; }
                 ::-webkit-scrollbar-track { background: transparent; }
                 ::-webkit-scrollbar-thumb { background: ${colors.border}; border-radius: 10px; }
            `}</style>
        </div>
    );
};

export default ReportDashboard;
