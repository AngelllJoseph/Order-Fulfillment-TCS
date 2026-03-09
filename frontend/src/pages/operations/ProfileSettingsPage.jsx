import { useState, useEffect } from 'react';
import {
    User,
    Mail,
    Lock,
    Bell,
    Shield,
    Save,
    Camera,
    Phone
} from 'lucide-react';
import { profileService } from '../../services/profile';

const ProfileSettingsPage = ({ colors, darkMode }) => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const res = await profileService.getProfile();
            setProfile(res.data);
        } catch (err) {
            console.error("Failed to fetch profile:", err);
        } finally {
            setLoading(false);
        }
    };

    const styles = {
        container: { display: 'flex', flexDirection: 'column', gap: '2rem' },
        card: {
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: '1.25rem',
            padding: '2rem',
        },
        sectionTitle: { fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' },
        inputGroup: { display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' },
        label: { fontSize: '0.875rem', fontWeight: 600, color: colors.textMuted },
        input: {
            padding: '0.75rem 1rem',
            borderRadius: '0.75rem',
            background: colors.bg,
            border: `1px solid ${colors.border}`,
            color: colors.text,
            fontSize: '0.875rem',
            outline: 'none',
        },
        button: {
            padding: '0.75rem 1.5rem',
            borderRadius: '0.75rem',
            background: colors.primary,
            color: '#fff',
            border: 'none',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            width: 'fit-content',
        },
        avatarUpload: {
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: `linear-gradient(45deg, ${colors.primary}, ${colors.secondary})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            marginBottom: '2rem',
        }
    };

    if (loading) return <div style={{ color: colors.textMuted }}>Loading profile settings...</div>;

    return (
        <div style={styles.container}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                {/* Left Side: Basic Info */}
                <div style={styles.card}>
                    <h3 style={styles.sectionTitle}><User size={20} color={colors.primary} /> Profile Information</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={styles.avatarUpload}>
                            <User size={48} color="#fff" />
                            <button style={{ position: 'absolute', bottom: 0, right: 0, padding: '0.5rem', borderRadius: '50%', background: colors.surface, border: `1px solid ${colors.border}`, cursor: 'pointer' }}>
                                <Camera size={14} color={colors.text} />
                            </button>
                        </div>
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Full Name</label>
                        <input style={styles.input} defaultValue={profile?.full_name} />
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Email Address</label>
                        <input style={styles.input} value={profile?.email} readOnly />
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Phone Number</label>
                        <input style={styles.input} defaultValue={profile?.phone || ''} placeholder="+1 000 000 0000" />
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Role</label>
                        <input style={styles.input} value={profile?.role_display || 'Program Manager'} readOnly />
                    </div>
                    <button style={styles.button} onClick={() => alert('Profile update functionality is not yet implemented.')}><Save size={18} /> Update Profile</button>
                </div>

                {/* Right Side: Security & Notifications */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div style={styles.card}>
                        <h3 style={styles.sectionTitle}><Lock size={20} color={colors.secondary} /> Security</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>New Password</label>
                                <input style={styles.input} type="password" placeholder="••••••••" />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Confirm Password</label>
                                <input style={styles.input} type="password" placeholder="••••••••" />
                            </div>
                        </div>
                        <button style={{ ...styles.button, background: colors.secondary }} onClick={() => alert('Password change functionality is not yet implemented.')}><Shield size={18} /> Change Password</button>
                    </div>

                    <div style={styles.card}>
                        <h3 style={styles.sectionTitle}><Bell size={20} color={colors.accent} /> Notification Preferences</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {[
                                { id: 'email', label: 'Email Alerts on Delay', desc: 'Get notified when an order is marked as delayed.' },
                                { id: 'wa', label: 'WhatsApp for Priority Orders', desc: 'Receive high-priority updates on WhatsApp.' },
                                { id: 'app', label: 'In-App Dashboard Alerts', desc: 'Show toast notifications for every new order.' }
                            ].map(pref => (
                                <div key={pref.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: colors.bg, borderRadius: '1rem' }}>
                                    <div>
                                        <div style={{ fontSize: '0.925rem', fontWeight: 600 }}>{pref.label}</div>
                                        <div style={{ fontSize: '0.75rem', color: colors.textMuted }}>{pref.desc}</div>
                                    </div>
                                    <input type="checkbox" defaultChecked style={{ width: '20px', height: '20px', accentColor: colors.primary }} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileSettingsPage;
