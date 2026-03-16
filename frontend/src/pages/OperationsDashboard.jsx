import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/NotificationBell';
import {
    LayoutDashboard,
    ShoppingCart,
    ClipboardList,
    Activity,
    Brain,
    Bell,
    FileText,
    History,
    User,
    LogOut,
    Search,
    Sun,
    Moon,
    Menu,
    X,
    ChevronDown,
    ChevronRight,
    TrendingUp,
    ShieldCheck,
    AlertTriangle
} from 'lucide-react';
import DashboardOverview from './operations/DashboardOverview';
import OrdersPage from './operations/OrdersPage';
import OrderAssignmentPage from './operations/OrderAssignmentPage';
import HubMonitoringPage from './operations/HubMonitoringPage';
import AIRecommendationsPage from './operations/AIRecommendationsPage';
import ReportDashboard from './reports/ReportDashboard';
import AuditLogsPage from './operations/AuditLogsPage';
import ProfileSettingsPage from './operations/ProfileSettingsPage';
import HITLApprovalCenter from './operations/HITLApprovalCenter';
import DelayManagementPage from './operations/DelayManagementPage';
import DemandSupplyDashboard from './reports/DemandSupplyDashboard';
import OperationsAlertsCenter from './operations/OperationsAlertsCenter';
import HITLHistoryPage from './operations/HITLHistoryPage';
import InventoryMonitoringPage from './operations/InventoryMonitoringPage';
import ConfidenceSettingsPage from './operations/ConfidenceSettingsPage';

// Sub-components (to be implemented in separate files later for better organization)
// For now, these will be placeholders within this file or referenced if I create them.

const OperationsDashboard = () => {
    const { user, logout } = useAuth();
    const [darkMode, setDarkMode] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');

    const toggleTheme = () => setDarkMode(!darkMode);

    const colors = {
        bg: darkMode ? '#000000' : '#f8fafc',
        surface: darkMode ? '#0f172a' : '#ffffff',
        surfaceHover: darkMode ? '#1e293b' : '#f1f5f9',
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
            letterSpacing: '-0.025em',
            background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
        },
        navItem: (isActive) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
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
            flex: 1,
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
    };

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'orders', label: 'Orders', icon: ShoppingCart },
        { id: 'assignment', label: 'Order Assignment', icon: ClipboardList },
        { id: 'hitl-approval', label: 'Approval Center', icon: ShieldCheck },
        { id: 'hitl-history', label: 'Approval History', icon: History },
        { id: 'monitoring', label: 'Hub Monitoring', icon: Activity },
        { id: 'delay-management', label: 'Delay Management', icon: AlertTriangle },
        { id: 'alerts', label: 'Operations Alerts', icon: AlertTriangle },
        { id: 'inventory', label: 'Inventory', icon: Brain },
        { id: 'ai-recommendations', label: 'AI Log', icon: Brain },
        { id: 'reports', label: 'Reports', icon: FileText },
        { id: 'demand-supply', label: 'Demand & Supply', icon: TrendingUp },
        { id: 'audit-logs', label: 'Audit Logs', icon: History },
        { id: 'ai-settings', label: 'AI Settings', icon: Brain },
        { id: 'profile', label: 'Profile / Settings', icon: User },
    ];

    return (
        <div style={styles.container}>
            {/* Sidebar */}
            <aside style={styles.sidebar}>
                <div style={styles.logo}>
                    <Activity size={32} color={colors.primary} />
                    <span style={styles.logoText}>OpsCenter</span>
                </div>

                <nav style={{ flex: 1, overflowY: 'auto' }}>
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            style={styles.navItem(activeTab === item.id)}
                        >
                            {activeTab === item.id && <div style={styles.navIndicator} />}
                            <item.icon size={20} />
                            <span style={{ flex: 1 }}>{item.label}</span>
                        </button>
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
                                placeholder="Search orders, hubs, reports..."
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
                                {user?.first_name?.charAt(0) || 'P'}
                            </div>
                            <div style={{ display: 'none', md: 'block' }}>
                                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user?.first_name || 'Manager'}</div>
                                <div style={{ fontSize: '0.75rem', color: colors.textMuted }}>Program Manager</div>
                            </div>
                        </div>
                    </div>
                </header>

                <main style={styles.content}>
                    <div style={styles.header}>
                        <h1 style={styles.title}>
                            {navItems.find(i => i.id === activeTab)?.label || 'Dashboard'}
                        </h1>
                        <p style={{ color: colors.textMuted, marginTop: '0.5rem' }}>
                            Operational Workflows • {user?.role || 'Program Manager'}
                        </p>
                    </div>

                    {/* Page Content Rendered Here */}
                    <div style={{ marginTop: '1rem' }}>
                        {activeTab === 'dashboard' && <DashboardOverview colors={colors} darkMode={darkMode} onNavigate={setActiveTab} />}
                        {activeTab === 'orders' && <OrdersPage colors={colors} darkMode={darkMode} />}
                        {activeTab === 'assignment' && <OrderAssignmentPage colors={colors} darkMode={darkMode} />}
                        {activeTab === 'hitl-approval' && <HITLApprovalCenter colors={colors} darkMode={darkMode} />}
                        { activeTab === 'delay-management' && <DelayManagementPage colors={colors} darkMode={darkMode} />}
                        { activeTab === 'alerts' && <OperationsAlertsCenter colors={colors} darkMode={darkMode} />}
                        { activeTab === 'monitoring' && <HubMonitoringPage colors={colors} darkMode={darkMode} />}
                        {activeTab === 'ai-recommendations' && <AIRecommendationsPage colors={colors} darkMode={darkMode} />}
                        {activeTab === 'reports' && <ReportDashboard colors={colors} darkMode={darkMode} />}
                        {activeTab === 'demand-supply' && <DemandSupplyDashboard colors={colors} darkMode={darkMode} />}
                        {activeTab === 'audit-logs' && <AuditLogsPage colors={colors} darkMode={darkMode} />}
                        {activeTab === 'profile' && <ProfileSettingsPage colors={colors} darkMode={darkMode} />}
                        {activeTab === 'hitl-history' && <HITLHistoryPage colors={colors} darkMode={darkMode} />}
                        {activeTab === 'inventory' && <InventoryMonitoringPage colors={colors} darkMode={darkMode} />}
                        {activeTab === 'ai-settings' && <ConfidenceSettingsPage colors={colors} darkMode={darkMode} />}
                    </div>
                </main>
            </div>

            <style>{`
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: ${colors.border}; border-radius: 10px; }
                ::-webkit-scrollbar-thumb:hover { background: ${colors.textMuted}; }
            `}</style>
        </div>
    );
};

export default OperationsDashboard;
