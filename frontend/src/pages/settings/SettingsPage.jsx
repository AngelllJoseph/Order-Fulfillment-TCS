import React, { useState } from 'react';
import {
    Settings,
    User,
    Bell,
    Shield,
    Cpu,
    Globe,
    Camera,
    Lock,
    Eye,
    EyeOff,
    Mail,
    Phone,
    Smartphone,
    MessageCircle,
    CheckCircle,
    Save,
    LogOut,
    Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const SettingsPage = ({ colors, darkMode }) => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('general');
    const [showPassword, setShowPassword] = useState(false);

    const tabs = [
        { id: 'general', label: 'General', icon: Globe },
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'system', label: 'System Configuration', icon: Cpu },
    ];

    const styles = {
        container: {
            display: 'flex',
            gap: '2.5rem',
            background: colors.cardBg,
            borderRadius: '1.5rem',
            padding: '2rem',
            minHeight: '600px',
            border: `1px solid ${colors.border}`,
            boxShadow: darkMode ? 'none' : '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        },
        sidebar: {
            width: '260px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            borderRight: `1px solid ${colors.border}`,
            paddingRight: '1.5rem',
        },
        content: {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem',
        },
        tabBtn: (isActive) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem 1.25rem',
            borderRadius: '0.75rem',
            border: 'none',
            background: isActive ? (darkMode ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)') : 'transparent',
            color: isActive ? colors.primary : colors.textMuted,
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.925rem',
            transition: 'all 0.2s ease',
            textAlign: 'left',
        }),
        sectionHeader: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
        },
        title: {
            fontSize: '1.5rem',
            fontWeight: 800,
            margin: 0,
        },
        subtitle: {
            fontSize: '0.875rem',
            color: colors.textMuted,
            marginTop: '0.25rem',
        },
        fieldGroup: {
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
        },
        label: {
            fontSize: '0.875rem',
            fontWeight: 600,
            color: colors.text,
        },
        input: {
            padding: '0.75rem 1rem',
            borderRadius: '0.75rem',
            background: darkMode ? 'rgba(255, 255, 255, 0.05)' : '#f8fafc',
            border: `1px solid ${colors.border}`,
            color: colors.text,
            fontSize: '0.9rem',
            outline: 'none',
            transition: 'border-color 0.2s',
        },
        saveBtn: {
            marginTop: 'auto',
            padding: '0.875rem 2rem',
            borderRadius: '0.75rem',
            background: colors.primary,
            color: 'white',
            border: 'none',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            width: 'fit-content',
            boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.4)',
            transition: 'transform 0.2s',
        },
        toggleBox: {
            padding: '1.25rem',
            borderRadius: '1rem',
            border: `1px solid ${colors.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
        }
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'general':
                return (
                    <>
                        <div style={styles.sectionHeader}>
                            <div>
                                <h3 style={styles.title}>General Settings</h3>
                                <p style={styles.subtitle}>Update your application basic information and identity.</p>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>
                            <div style={styles.fieldGroup}>
                                <label style={styles.label}>Application Name</label>
                                <input style={styles.input} type="text" defaultValue="OrderFlow TCS" />
                            </div>
                            <div style={styles.fieldGroup}>
                                <label style={styles.label}>Organization Name</label>
                                <input style={styles.input} type="text" defaultValue="TCS Logistics Pvt Ltd" />
                            </div>
                            <div style={styles.fieldGroup}>
                                <label style={styles.label}>Time Zone</label>
                                <select style={styles.input}>
                                    <option>Asia/Kolkata (UTC+05:30)</option>
                                    <option>London (UTC+00:00)</option>
                                    <option>New York (UTC-05:00)</option>
                                </select>
                            </div>
                            <div style={styles.fieldGroup}>
                                <label style={styles.label}>Date Format</label>
                                <select style={styles.input}>
                                    <option>DD/MM/YYYY</option>
                                    <option>MM/DD/YYYY</option>
                                    <option>YYYY-MM-DD</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ ...styles.fieldGroup, marginTop: '1.5rem' }}>
                            <label style={styles.label}>App Logo</label>
                            <div style={{
                                padding: '2rem',
                                border: `2px dashed ${colors.border}`,
                                borderRadius: '1rem',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '0.75rem',
                                color: colors.textMuted
                            }}>
                                <ImageIcon size={32} />
                                <span style={{ fontSize: '0.85rem' }}>Drop your logo here or click to upload</span>
                                <button style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: `1px solid ${colors.border}`, background: 'transparent', color: colors.text, cursor: 'pointer', fontSize: '0.8rem' }}>Select File</button>
                            </div>
                        </div>
                    </>
                );
            case 'profile':
                return (
                    <>
                        <div style={styles.sectionHeader}>
                            <div>
                                <h3 style={styles.title}>Account Profile</h3>
                                <p style={styles.subtitle}>Manage your personal information and contact details.</p>
                            </div>
                            <div style={{
                                width: '80px', height: '80px', borderRadius: '1.5rem',
                                background: `linear-gradient(45deg, ${colors.primary}, ${colors.secondary})`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white', fontSize: '2rem', fontWeight: 800, position: 'relative'
                            }}>
                                {user?.first_name?.charAt(0) || 'A'}
                                <div style={{
                                    position: 'absolute', bottom: '-5px', right: '-5px',
                                    background: colors.surface, padding: '5px', borderRadius: '50%',
                                    border: `2px solid ${colors.bg}`, cursor: 'pointer'
                                }}>
                                    <Camera size={16} color={colors.primary} />
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div style={styles.fieldGroup}>
                                <label style={styles.label}>Full Name</label>
                                <input style={styles.input} type="text" defaultValue={user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'Administrator'} />
                            </div>
                            <div style={styles.fieldGroup}>
                                <label style={styles.label}>Email Address</label>
                                <div style={{ position: 'relative' }}>
                                    <input style={{ ...styles.input, width: '100%', paddingLeft: '2.5rem' }} type="email" defaultValue={user?.email || 'admin@tcs.com'} />
                                    <Mail size={18} color={colors.textMuted} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                                </div>
                            </div>
                            <div style={styles.fieldGroup}>
                                <label style={styles.label}>Phone Number</label>
                                <div style={{ position: 'relative' }}>
                                    <input style={{ ...styles.input, width: '100%', paddingLeft: '2.5rem' }} type="tel" defaultValue="+91 98765 43210" />
                                    <Phone size={18} color={colors.textMuted} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                                </div>
                            </div>
                            <div style={styles.fieldGroup}>
                                <label style={styles.label}>Role</label>
                                <input style={{ ...styles.input, opacity: 0.6 }} type="text" readOnly defaultValue={user?.role || 'ADMIN'} />
                            </div>
                        </div>
                        <div style={{ marginTop: '2rem', borderTop: `1px solid ${colors.border}`, paddingTop: '1.5rem' }}>
                            <h4 style={{ color: '#ef4444', marginBottom: '0.5rem', fontWeight: 700 }}>Danger Zone</h4>
                            <p style={{ fontSize: '0.8rem', color: colors.textMuted, marginBottom: '1.25rem' }}>Terminate your current session and securely sign out of the system.</p>
                            <button
                                onClick={logout}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '0.75rem',
                                    background: 'rgba(239, 68, 68, 0.08)',
                                    color: '#ef4444',
                                    border: '1px solid rgba(239, 68, 68, 0.2)',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.6rem',
                                    transition: 'all 0.2s',
                                    fontSize: '0.9rem'
                                }}
                            >
                                <LogOut size={18} /> Sign Out of Account
                            </button>
                        </div>
                    </>
                );
            case 'notifications':
                return (
                    <>
                        <div style={styles.sectionHeader}>
                            <div>
                                <h3 style={styles.title}>Notifications Control</h3>
                                <p style={styles.subtitle}>Choose how you want to be alerted for system events.</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {[
                                { label: 'Email Notifications', desc: 'Receive order updates via email', icon: Mail, enabled: true },
                                { label: 'SMS Alerts', desc: 'Critical system alerts to your phone', icon: Smartphone, enabled: true },
                                { label: 'WhatsApp Updates', desc: 'Real-time order tracking on WhatsApp', icon: MessageCircle, enabled: false },
                                { label: 'In-App Alerts', desc: 'Browser notifications for new orders', icon: Bell, enabled: true }
                            ].map((item, i) => (
                                <div key={i} style={styles.toggleBox}>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <div style={{ padding: '0.75rem', borderRadius: '0.75rem', background: `${colors.primary}10`, color: colors.primary }}>
                                            <item.icon size={20} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{item.label}</div>
                                            <div style={{ fontSize: '0.8rem', color: colors.textMuted }}>{item.desc}</div>
                                        </div>
                                    </div>
                                    <div style={{
                                        width: '44px', height: '24px', borderRadius: '12px',
                                        background: item.enabled ? colors.primary : colors.border,
                                        position: 'relative', cursor: 'pointer'
                                    }}>
                                        <div style={{
                                            width: '20px', height: '20px', borderRadius: '50%',
                                            background: 'white', position: 'absolute', top: '2px',
                                            left: item.enabled ? '22px' : '2px', transition: 'all 0.2s'
                                        }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                );
            case 'security':
                return (
                    <>
                        <div style={styles.sectionHeader}>
                            <div>
                                <h3 style={styles.title}>Privacy & Password</h3>
                                <p style={styles.subtitle}>Ensure your account stays protected.</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ padding: '1.5rem', borderRadius: '1rem', border: `1px solid ${colors.border}`, background: `${colors.primary}05` }}>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <Lock size={24} color={colors.primary} />
                                    <div style={{ fontWeight: 700 }}>Update Password</div>
                                </div>
                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    <div style={styles.fieldGroup}>
                                        <label style={styles.label}>Current Password</label>
                                        <div style={{ position: 'relative' }}>
                                            <input style={{ ...styles.input, width: '100%' }} type={showPassword ? "text" : "password"} placeholder="••••••••" />
                                            <button onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer' }}>
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div style={styles.fieldGroup}>
                                            <label style={styles.label}>New Password</label>
                                            <input style={styles.input} type="password" placeholder="Min. 8 characters" />
                                        </div>
                                        <div style={styles.fieldGroup}>
                                            <label style={styles.label}>Confirm Password</label>
                                            <input style={styles.input} type="password" placeholder="Repeat new password" />
                                        </div>
                                    </div>
                                    <button style={{ ...styles.saveBtn, marginTop: '0.5rem', width: 'auto' }}>Change Password</button>
                                </div>
                            </div>
                            <div style={styles.toggleBox}>
                                <div>
                                    <div style={{ fontWeight: 700 }}>Two-Factor Authentication</div>
                                    <div style={{ fontSize: '0.8rem', color: colors.textMuted }}>Secure your account with an extra verification step.</div>
                                </div>
                                <button style={{ padding: '0.5rem 1rem', borderRadius: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: 'none', fontWeight: 700, cursor: 'pointer' }}>SETUP 2FA</button>
                            </div>
                        </div>
                    </>
                );
            case 'system':
                return (
                    <>
                        <div style={styles.sectionHeader}>
                            <div>
                                <h3 style={styles.title}>System Configuration</h3>
                                <p style={styles.subtitle}>Fine-tune system behaviors and default rules.</p>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div style={styles.fieldGroup}>
                                <label style={styles.label}>Default Order Priority</label>
                                <select style={styles.input}>
                                    <option>Standard</option>
                                    <option>High Priority</option>
                                    <option>Urgent</option>
                                </select>
                            </div>
                            <div style={styles.fieldGroup}>
                                <label style={styles.label}>Inventory Threshold</label>
                                <input style={styles.input} type="number" defaultValue="50" />
                            </div>
                            <div style={styles.fieldGroup}>
                                <label style={styles.label}>Session Timeout (Minutes)</label>
                                <input style={styles.input} type="number" defaultValue="30" />
                            </div>
                            <div style={styles.fieldGroup}>
                                <label style={styles.label}>Defaut View</label>
                                <select style={styles.input}>
                                    <option>Kanban Board</option>
                                    <option>List Grid</option>
                                    <option>Analytics Dashboard</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ ...styles.toggleBox, marginTop: '1rem' }}>
                            <div>
                                <div style={{ fontWeight: 700 }}>Auto-assignment Rules</div>
                                <div style={{ fontSize: '0.8rem', color: colors.textMuted }}>Automatically allocate orders to the nearest available hub.</div>
                            </div>
                            <div style={{
                                width: '44px', height: '24px', borderRadius: '12px',
                                background: colors.primary, position: 'relative', cursor: 'pointer'
                            }}>
                                <div style={{
                                    width: '20px', height: '20px', borderRadius: '50%',
                                    background: 'white', position: 'absolute', top: '2px', left: '22px'
                                }} />
                            </div>
                        </div>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div style={styles.container}>
            <aside style={styles.sidebar}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={styles.tabBtn(activeTab === tab.id)}
                    >
                        <tab.icon size={20} />
                        {tab.label}
                    </button>
                ))}
            </aside>

            <main style={styles.content}>
                {renderTabContent()}
                <button style={styles.saveBtn}>
                    <Save size={18} />
                    Save All Changes
                </button>
            </main>
        </div>
    );
};

export default SettingsPage;
