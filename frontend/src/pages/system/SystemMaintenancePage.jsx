import React, { useState } from 'react';
import {
    Activity,
    Database,
    Users,
    FileText,
    Bell,
    Settings,
    ShieldAlert,
    Power,
    RefreshCw,
    Download,
    Upload,
    CheckCircle,
    AlertTriangle,
    Clock,
    Server,
    Cpu,
    HardDrive,
    ShieldCheck
} from 'lucide-react';

const SystemMaintenancePage = ({ colors, darkMode }) => {
    const [maintenanceMode, setMaintenanceMode] = useState(false);

    const sectionStyle = {
        background: colors.cardBg,
        border: `1px solid ${colors.border}`,
        borderRadius: '1.25rem',
        padding: '1.5rem',
        boxShadow: darkMode ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        height: '100%',
    };

    const iconBoxStyle = (bgColor) => ({
        width: '40px',
        height: '40px',
        borderRadius: '0.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `${bgColor}20`,
        color: bgColor,
    });

    const statusBadgeStyle = (type) => {
        const statusColors = {
            online: { bg: '#10b98115', text: '#10b981' },
            offline: { bg: '#ef444415', text: '#ef4444' },
            warning: { bg: '#f59e0b15', text: '#f59e0b' },
        }[type];
        return {
            padding: '0.25rem 0.6rem',
            borderRadius: '9999px',
            fontSize: '0.7rem',
            fontWeight: 700,
            background: statusColors.bg,
            color: statusColors.text,
            textTransform: 'uppercase',
        };
    };

    const MaintenanceGrid = ({ children }) => (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '1.5rem',
        }}>
            {children}
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Maintenance Mode Banner */}
            <div style={{
                background: maintenanceMode ? 'linear-gradient(135deg, #ef4444, #991b1b)' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                borderRadius: '1.25rem',
                padding: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: 'white',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '1rem',
                        background: 'rgba(255, 255, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(10px)',
                    }}>
                        <Power size={32} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>System Maintenance Mode</h2>
                        <p style={{ opacity: 0.9, marginTop: '0.25rem', fontSize: '0.9rem' }}>
                            {maintenanceMode
                                ? "System is currently offline for users. Only administrators can access."
                                : "System is running normally. Activate to perform deep maintenance."}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setMaintenanceMode(!maintenanceMode)}
                    style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: '0.75rem',
                        background: 'white',
                        color: maintenanceMode ? '#ef4444' : '#4f46e5',
                        border: 'none',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    }}
                >
                    {maintenanceMode ? 'Disable Maintenance Mode' : 'Enable Maintenance Mode'}
                </button>
            </div>

            <MaintenanceGrid>
                {/* 1. System Status */}
                <div style={sectionStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={iconBoxStyle('#3b82f6')}><Activity size={20} /></div>
                            <h3 style={{ margin: 0, fontWeight: 700 }}>System Status</h3>
                        </div>
                        <span style={statusBadgeStyle('online')}>Healthy</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                        {[
                            { label: 'API Server', status: 'online', icon: Server },
                            { label: 'Database', status: 'online', icon: Database },
                            { label: 'Storage Service', status: 'online', icon: HardDrive },
                            { label: 'Email Gateway', status: 'warning', icon: Bell }
                        ].map((item, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: colors.textMuted }}>
                                    <item.icon size={16} />
                                    <span>{item.label}</span>
                                </div>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.status === 'online' ? '#10b981' : '#f59e0b' }} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. Database Backup & Restore */}
                <div style={sectionStyle}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={iconBoxStyle('#10b981')}><Database size={20} /></div>
                        <h3 style={{ margin: 0, fontWeight: 700 }}>Backup & Restore</h3>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: colors.textMuted }}>Last backup: 2 hours ago (Auto-sync enabled)</p>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto' }}>
                        <button style={{ flex: 1, padding: '0.6rem', borderRadius: '0.6rem', background: colors.primary, color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.8rem' }}>
                            <Download size={14} /> Backup Now
                        </button>
                        <button style={{ flex: 1, padding: '0.6rem', borderRadius: '0.6rem', background: 'transparent', color: colors.text, border: `1px solid ${colors.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.8rem' }}>
                            <Upload size={14} /> Restore
                        </button>
                    </div>
                </div>

                {/* 3. User Maintenance */}
                <div style={sectionStyle}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={iconBoxStyle('#a17dfd')}><Users size={20} /></div>
                        <h3 style={{ margin: 0, fontWeight: 700 }}>User Maintenance</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div style={{ padding: '0.75rem', borderRadius: '0.75rem', background: 'rgba(161, 125, 253, 0.05)', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>124</div>
                            <div style={{ fontSize: '0.75rem', color: colors.textMuted }}>Active Users</div>
                        </div>
                        <div style={{ padding: '0.75rem', borderRadius: '0.75rem', background: 'rgba(239, 68, 68, 0.05)', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>3</div>
                            <div style={{ fontSize: '0.75rem', color: colors.textMuted }}>Suspended</div>
                        </div>
                    </div>
                    <button style={{ width: '100%', padding: '0.6rem', borderRadius: '0.6rem', background: 'transparent', color: colors.primary, border: `1px solid ${colors.primary}`, cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>
                        Manage Accounts
                    </button>
                </div>

                {/* 4. Logs & Activity */}
                <div style={sectionStyle}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={iconBoxStyle('#f59e0b')}><FileText size={20} /></div>
                        <h3 style={{ margin: 0, fontWeight: 700 }}>Logs & Activity</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {[
                            { event: 'Database migration', time: '10m ago', type: 'info' },
                            { event: 'Failed login attempt', time: '1h ago', type: 'warning' },
                            { event: 'New user registered', time: '3h ago', type: 'info' }
                        ].map((log, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.4rem 0', borderBottom: i < 2 ? `1px solid ${colors.border}` : 'none' }}>
                                <span style={{ color: colors.text }}>{log.event}</span>
                                <span style={{ color: colors.textMuted }}>{log.time}</span>
                            </div>
                        ))}
                    </div>
                    <button style={{ marginTop: 'auto', textAlign: 'center', background: 'none', border: 'none', color: colors.primary, fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>
                        View Full Audit Trail
                    </button>
                </div>

                {/* 5. Notification Settings */}
                <div style={sectionStyle}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={iconBoxStyle('#ec4899')}><Bell size={20} /></div>
                        <h3 style={{ margin: 0, fontWeight: 700 }}>Notifications</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {['Email Alerts', 'SMS Notifications', 'Push Notifications'].map((label, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.9rem', color: colors.text }}>{label}</span>
                                <div style={{ width: '36px', height: '20px', borderRadius: '10px', background: i < 2 ? colors.primary : colors.border, position: 'relative', cursor: 'pointer' }}>
                                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'white', position: 'absolute', top: '2px', left: i < 2 ? '18px' : '2px', transition: '0.2s' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 6. System Configuration */}
                <div style={sectionStyle}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={iconBoxStyle('#64748b')}><Settings size={20} /></div>
                        <h3 style={{ margin: 0, fontWeight: 700 }}>System Config</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div>
                            <label style={{ fontSize: '0.75rem', color: colors.textMuted, marginBottom: '0.25rem', display: 'block' }}>App Name</label>
                            <input type="text" defaultValue="OrderFlow TCS" style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', background: darkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9', border: `1px solid ${colors.border}`, color: colors.text, fontSize: '0.85rem' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.75rem', color: colors.textMuted, marginBottom: '0.25rem', display: 'block' }}>Time Zone</label>
                            <select style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', background: darkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9', border: `1px solid ${colors.border}`, color: colors.text, fontSize: '0.85rem' }}>
                                <option>UTC +5:30 (India)</option>
                                <option>UTC -5:00 (EST)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* 7. Security Settings */}
                <div style={sectionStyle}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={iconBoxStyle('#ef4444')}><ShieldAlert size={20} /></div>
                        <h3 style={{ margin: 0, fontWeight: 700 }}>Security Settings</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ padding: '0.75rem', borderRadius: '0.75rem', border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <ShieldCheck size={20} color="#10b981" />
                            <div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>2FA Required</div>
                                <div style={{ fontSize: '0.75rem', color: colors.textMuted }}>For all admin accounts</div>
                            </div>
                        </div>
                        <button style={{ width: '100%', padding: '0.6rem', borderRadius: '0.6rem', background: 'transparent', color: colors.text, border: `1px solid ${colors.border}`, cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>
                            Update Password Policy
                        </button>
                    </div>
                </div>

                {/* 8. Performance & UI */}
                <div style={sectionStyle}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={iconBoxStyle('#3b82f6')}><Activity size={20} /></div>
                        <h3 style={{ margin: 0, fontWeight: 700 }}>Performance</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981' }}>98%</div>
                            <div style={{ fontSize: '0.7rem', color: colors.textMuted }}>Uptime</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#3b82f6' }}>240ms</div>
                            <div style={{ fontSize: '0.7rem', color: colors.textMuted }}>Avg Latency</div>
                        </div>
                    </div>
                    <button style={{ marginTop: 'auto', padding: '0.6rem', borderRadius: '0.6rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <RefreshCw size={14} /> Clear System Cache
                    </button>
                </div>
            </MaintenanceGrid>

            {/* Version Information */}
            <div style={{ textAlign: 'center', padding: '2rem', borderTop: `1px solid ${colors.border}`, opacity: 0.6 }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>OrderFlow TCS Enterprise v1.2.4-stable</div>
                <div style={{ fontSize: '0.75rem' }}>Build date: March 2026 • Environment: Production</div>
            </div>
        </div>
    );
};

export default SystemMaintenancePage;
