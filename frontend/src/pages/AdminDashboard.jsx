import { useState, useEffect } from 'react';
import LogsPages from '../pages/users/LogsPages';
import UserSessionsPage from '../pages/users/UserSessionsPage';
import UsersPage from '../pages/users/UsersPage';
import RolesPermissionsPage from '../pages/users/RolesPermissionsPage';
import HubsPage from '../pages/hubs/HubsPage';
import ProductsPage from '../pages/products/ProductsPage';
import OrdersPage from '../pages/orders/OrdersPage';
import SystemMaintenancePage from '../pages/system/SystemMaintenancePage';
import SettingsPage from '../pages/settings/SettingsPage';
import NotificationApprovalPage from './operations/NotificationApprovalPage';
import CommunicationPage from '../pages/orders/CommunicationPage';
import AIRecommendationsPage from './operations/AIRecommendationsPage';
import AuditLogsPage from './operations/AuditLogsPage';
import { hubService, commonService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/NotificationBell';
import {
    Users,
    Package,
    MapPin,
    Bell,
    LogOut,
    ShieldCheck,
    TrendingUp,
    Activity,
    ChevronDown,
    ChevronRight,
    Settings,
    Search,
    Sun,
    Moon,
    LayoutDashboard,
    Cpu,
    FileSearch,
    Wrench,
    ShieldAlert,
    Menu,
    X,
    ShoppingCart,
    MessageSquare
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    Legend
} from 'recharts';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const [darkMode, setDarkMode] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [expandedMenus, setExpandedMenus] = useState(['user-management']);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState({
        total_orders: 0,
        active_users: 0,
        operating_hubs: 0,
        security_alerts: 0,
        trends: { orders: '0%', users: '0%', hubs: 'Stable', alerts: 'No alerts' },
        daily_orders: [],
        status_distribution: [],
        hub_workload: []
    });

    useEffect(() => {
        if (activeTab === 'dashboard') {
            fetchStats();
        }
    }, [activeTab]);

    const fetchStats = async () => {
        try {
            const res = await commonService.getDashboardStats();
            setStats(res.data);
        } catch (err) {
            console.error('Failed to fetch dashboard stats:', err);
        }
    };

    const toggleTheme = () => setDarkMode(!darkMode);
    const toggleMenu = (menuId) => {
        setExpandedMenus(prev =>
            prev.includes(menuId) ? prev.filter(id => id !== menuId) : [...prev, menuId]
        );
    };

    // Define dynamic colors based on theme
    const colors = {
        bg: darkMode ? '#000000' : '#f8fafc',
        surface: darkMode ? '#0f172a' : '#ffffff',
        surfaceHover: darkMode ? '#1e293b' : '#f1f5f9',
        text: darkMode ? '#f1f5f9' : '#0f172a',
        textMuted: darkMode ? '#94a3b8' : '#64748b',
        primary: '#6366f1', // Indigo/Blue-ish
        secondary: '#a17dfd', // Purple
        accent: '#3b82f6', // Blue
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
            letterSpacing: '-0.025em',
            background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
        },
        navGroup: {
            marginBottom: '1rem',
        },
        navItem: (isActive, isSub = false) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: isSub ? '0.6rem 1rem 0.6rem 2.75rem' : '0.75rem 1rem',
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
            position: 'relative',
        }),
        navIndicator: {
            position: 'absolute',
            left: 0,
            top: '20%',
            bottom: '20%',
            width: '4px',
            background: colors.primary,
            borderRadius: '0 4px 4px 0',
        },
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
        searchBox: {
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            background: colors.bg,
            padding: '0.5rem 1rem',
            borderRadius: '0.75rem',
            width: '320px',
            border: `1px solid ${colors.border}`,
        },
        searchInput: {
            background: 'none',
            border: 'none',
            color: colors.text,
            fontSize: '0.875rem',
            width: '100%',
            outline: 'none',
        },
        topActions: {
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
        },
        iconBtn: {
            background: 'none',
            border: 'none',
            color: colors.textMuted,
            cursor: 'pointer',
            padding: '0.5rem',
            borderRadius: '0.5rem',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        },
        content: {
            padding: '2.5rem',
            overflowY: 'auto',
        },
        header: {
            marginBottom: '2.5rem',
        },
        title: {
            fontSize: '2rem',
            fontWeight: 800,
            margin: 0,
            letterSpacing: '-0.025em',
        },
        statsGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2.5rem',
        },
        statCard: {
            background: colors.cardBg,
            border: `1px solid ${colors.border}`,
            borderRadius: '1.25rem',
            padding: '1.75rem',
            boxShadow: darkMode ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
        },
        statIconWrap: (color) => ({
            width: '48px',
            height: '48px',
            borderRadius: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `${color}15`,
            color: color,
            marginBottom: '0.5rem',
        }),
        statValue: {
            fontSize: '1.75rem',
            fontWeight: 800,
            letterSpacing: '-0.025em',
        },
        chartPlaceholder: {
            background: colors.cardBg,
            border: `1px solid ${colors.border}`,
            borderRadius: '1.25rem',
            padding: '1.75rem',
            minHeight: '300px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: colors.textMuted,
        },
        chartGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2.5rem',
        },
        chartCard: {
            background: colors.cardBg,
            border: `1px solid ${colors.border}`,
            borderRadius: '1.25rem',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
        },
        badge: (type) => {
            const colors = {
                success: { bg: '#10b98115', text: '#10b981' },
                warning: { bg: '#f59e0b15', text: '#f59e0b' },
                danger: { bg: '#ef444415', text: '#ef4444' },
            }[type] || { bg: 'rgba(99, 102, 241, 0.1)', text: '#818cf8' };
            return {
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 700,
                background: colors.bg,
                color: colors.text,
            };
        }
    };

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        {
            id: 'user-management',
            label: 'User Management',
            icon: Users,
            hasSub: true,
            subItems: [
                { id: 'users', label: 'Users' },
                { id: 'roles', label: 'Roles & Permissions' },
                { id: 'login-logs', label: 'Login Logs' },
                { id: 'sessions', label: 'User Sessions' }
            ]
        },
        { id: 'orders', label: 'Orders Management', icon: ShoppingCart },
        { id: 'communication', label: 'Communication', icon: MessageSquare },
        { id: 'hubs', label: 'Manufacturing Hubs', icon: MapPin },
        { id: 'products', label: 'Products & SKUs', icon: Package },
        { id: 'ai-config', label: 'AI Configuration', icon: Cpu },
        { id: 'notification-approval', label: 'Notification Approval', icon: Bell },
        { id: 'audit', label: 'Audit & Compliance', icon: ShieldCheck },
        { id: 'maintenance', label: 'System Maintenance', icon: Wrench },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    return (
        <div style={styles.container}>
            {/* Sidebar */}
            <aside style={styles.sidebar}>
                <div style={styles.logo}>
                    <ShieldCheck size={32} color={colors.primary} />
                    <span style={styles.logoText}>OrderFlow</span>
                </div>

                <nav style={{ flex: 1, overflowY: 'auto' }}>
                    {navItems.map(item => (
                        <div key={item.id} style={styles.navGroup}>
                            <button
                                onClick={() => {
                                    if (item.hasSub) toggleMenu(item.id);
                                    else setActiveTab(item.id);
                                }}
                                style={styles.navItem(activeTab === item.id || (item.hasSub && expandedMenus.includes(item.id)))}
                            >
                                {activeTab === item.id && <div style={styles.navIndicator} />}
                                <item.icon size={20} />
                                <span style={{ flex: 1 }}>{item.label}</span>
                                {item.hasSub && (
                                    expandedMenus.includes(item.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                                )}
                            </button>

                            {item.hasSub && expandedMenus.includes(item.id) && (
                                <div style={{ marginTop: '0.25rem' }}>
                                    {item.subItems.map(sub => (
                                        <button
                                            key={sub.id}
                                            onClick={() => setActiveTab(sub.id)}
                                            style={styles.navItem(activeTab === sub.id, true)}
                                        >
                                            {activeTab === sub.id && <div style={styles.navIndicator} />}
                                            {sub.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </nav>

                <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: `1px solid ${colors.border}` }}>
                    <button
                        onClick={logout}
                        style={{
                            ...styles.navItem(false),
                            color: '#ef4444',
                            borderRadius: '0.75rem',
                            background: 'rgba(239, 68, 68, 0.05)'
                        }}
                    >
                        <LogOut size={20} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div style={styles.mainWrapper}>
                <header style={styles.topbar}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button style={styles.iconBtn} onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                        <div style={styles.searchBox}>
                            <Search size={18} color={colors.textMuted} />
                            <input
                                type="text"
                                placeholder="Search orders, users, audits..."
                                style={styles.searchInput}
                            />
                        </div>
                    </div>

                    <div style={styles.topActions}>
                        <button style={styles.iconBtn} onClick={toggleTheme}>
                            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <div style={styles.iconBtn}>
                            <NotificationBell colors={colors} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '0.5rem' }}>
                            <div style={{
                                width: '36px', height: '36px', borderRadius: '50%',
                                background: `linear-gradient(45deg, ${colors.primary}, ${colors.secondary})`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white', fontWeight: 700, fontSize: '0.875rem'
                            }}>
                                {user?.first_name?.charAt(0) || 'A'}
                            </div>
                            <div style={{ display: 'none', md: 'block' }}>
                                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user?.first_name || 'Admin'}</div>
                                <div style={{ fontSize: '0.75rem', color: colors.textMuted }}>{user?.role}</div>
                            </div>
                        </div>
                        <button
                            style={{ ...styles.iconBtn, color: '#ef4444', padding: '0.5rem', marginLeft: '0.5rem' }}
                            onClick={logout}
                            title="Sign Out"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </header>

                <main style={styles.content}>
                    <div style={styles.header}>
                        <h1 style={styles.title}>
                            {navItems.find(i => i.id === activeTab)?.label || 'Dashboard'}
                        </h1>
                        <p style={{ color: colors.textMuted, marginTop: '0.5rem' }}>
                            TCS Order Fulfillment System • Project Overview
                        </p>
                    </div>

                    {activeTab === 'dashboard' && (
                        <>
                            <div style={styles.statsGrid}>
                                <div style={styles.statCard}>
                                    <div style={styles.statIconWrap('#6366f1')}>
                                        <Package size={24} />
                                    </div>
                                    <span style={{ color: colors.textMuted, fontSize: '0.875rem', fontWeight: 500 }}>Total Orders</span>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
                                        <span style={styles.statValue}>{stats.total_orders.toLocaleString()}</span>
                                        <span style={{ color: '#10b981', fontSize: '0.875rem', fontWeight: 600 }}>{stats.trends.orders}</span>
                                    </div>
                                </div>
                                <div style={styles.statCard}>
                                    <div style={styles.statIconWrap('#a17dfd')}>
                                        <Users size={24} />
                                    </div>
                                    <span style={{ color: colors.textMuted, fontSize: '0.875rem', fontWeight: 500 }}>Active Users</span>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
                                        <span style={styles.statValue}>{stats.active_users.toLocaleString()}</span>
                                        <span style={{ color: '#10b981', fontSize: '0.875rem', fontWeight: 600 }}>{stats.trends.users}</span>
                                    </div>
                                </div>
                                <div style={styles.statCard}>
                                    <div style={styles.statIconWrap('#3b82f6')}>
                                        <MapPin size={24} />
                                    </div>
                                    <span style={{ color: colors.textMuted, fontSize: '0.875rem', fontWeight: 500 }}>Operating Hubs</span>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
                                        <span style={styles.statValue}>{stats.operating_hubs.toLocaleString()}</span>
                                        <span style={{ color: colors.textMuted, fontSize: '0.875rem', fontWeight: 600 }}>{stats.trends.hubs}</span>
                                    </div>
                                </div>
                                <div style={styles.statCard}>
                                    <div style={styles.statIconWrap('#ef4444')}>
                                        <ShieldAlert size={24} />
                                    </div>
                                    <span style={{ color: colors.textMuted, fontSize: '0.875rem', fontWeight: 500 }}>Security Alerts</span>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
                                        <span style={styles.statValue}>{stats.security_alerts.toLocaleString()}</span>
                                        <span style={{ color: '#ef4444', fontSize: '0.875rem', fontWeight: 600 }}>{stats.trends.alerts}</span>
                                    </div>
                                </div>
                            </div>

                            <div style={styles.chartGrid}>
                                {/* Order Velocity Chart */}
                                <div style={{ ...styles.chartCard, gridColumn: 'span 2' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Order Velocity (7 Days)</h3>
                                        <div style={styles.badge('success')}>Real-time</div>
                                    </div>
                                    <div style={{ height: '300px', width: '100%', minWidth: 0, position: 'relative' }}>
                                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                            <AreaChart data={stats.daily_orders}>
                                                <defs>
                                                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor={colors.primary} stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor={colors.primary} stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} vertical={false} />
                                                <XAxis dataKey="date" stroke={colors.textMuted} fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis stroke={colors.textMuted} fontSize={12} tickLine={false} axisLine={false} />
                                                <Tooltip 
                                                    contentStyle={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '0.75rem', color: colors.text }}
                                                    itemStyle={{ color: colors.primary }}
                                                />
                                                <Area type="monotone" dataKey="orders" stroke={colors.primary} strokeWidth={3} fillOpacity={1} fill="url(#colorOrders)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Status Distribution Chart */}
                                <div style={styles.chartCard}>
                                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Order Status Breakdown</h3>
                                    <div style={{ height: '300px', width: '100%', minWidth: 0, position: 'relative' }}>
                                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                            <PieChart>
                                                <Pie
                                                    data={stats.status_distribution}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {stats.status_distribution.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={[colors.primary, colors.secondary, colors.accent, '#f59e0b', '#ef4444'][index % 5]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip 
                                                    contentStyle={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '0.75rem', color: colors.text }}
                                                />
                                                <Legend iconType="circle" />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Hub Workload Chart */}
                                <div style={styles.chartCard}>
                                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Top Manufacturing Hubs</h3>
                                    <div style={{ height: '300px', width: '100%', minWidth: 0, position: 'relative' }}>
                                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                            <BarChart data={stats.hub_workload} layout="vertical">
                                                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} horizontal={false} />
                                                <XAxis type="number" stroke={colors.textMuted} fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis dataKey="name" type="category" stroke={colors.textMuted} fontSize={10} width={100} tickLine={false} axisLine={false} />
                                                <Tooltip 
                                                    contentStyle={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '0.75rem', color: colors.text }}
                                                />
                                                <Bar dataKey="orders" fill={colors.secondary} radius={[0, 4, 4, 0]} barSize={20} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab !== 'dashboard' && (
                        <>
                            {activeTab === 'users' && <UsersPage colors={colors} darkMode={darkMode} />}
                            {activeTab === 'roles' && <RolesPermissionsPage colors={colors} darkMode={darkMode} />}
                            {activeTab === 'login-logs' && <LogsPages colors={colors} darkMode={darkMode} />}
                            {activeTab === 'sessions' && <UserSessionsPage colors={colors} darkMode={darkMode} />}
                            {activeTab === 'orders' && <OrdersPage colors={colors} darkMode={darkMode} />}
                            {activeTab === 'hubs' && <HubsPage colors={colors} darkMode={darkMode} />}
                            {activeTab === 'products' && <ProductsPage colors={colors} darkMode={darkMode} />}
                            {activeTab === 'communication' && <CommunicationPage colors={colors} darkMode={darkMode} />}
                            {activeTab === 'notification-approval' && <NotificationApprovalPage colors={colors} darkMode={darkMode} />}
                            {activeTab === 'maintenance' && <SystemMaintenancePage colors={colors} darkMode={darkMode} />}
                            {activeTab === 'settings' && <SettingsPage colors={colors} darkMode={darkMode} />}
                            {activeTab === 'ai-config' && <AIRecommendationsPage colors={colors} darkMode={darkMode} />}
                            {activeTab === 'audit' && <AuditLogsPage colors={colors} darkMode={darkMode} />}
                        </>
                    )}
                </main>
            </div>

            <style>{`
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: ${colors.border};
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: ${colors.textMuted};
        }
      `}</style>
        </div>
    );
};

export default AdminDashboard;
