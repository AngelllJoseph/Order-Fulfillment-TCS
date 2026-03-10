import { useState, useEffect } from 'react';
import {
    Bell,
    CheckCircle,
    XCircle,
    Edit3,
    MessageSquare,
    Send,
    Eye,
    Brain,
    Clock,
    Plus,
    Package,
    Hash
} from 'lucide-react';
import { notificationService } from '../../services/notifications';
import { userService } from '../../services/api';

const NotificationApprovalPage = ({ colors, darkMode }) => {
    const [notifications, setNotifications] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Form state for sending new notification
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        user_id: '',
        title: '',
        message: '',
        type: 'INFO',
        related_order_id: '',
        related_product_name: ''
    });
    const [sending, setSending] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [notifRes, usersRes] = await Promise.all([
                notificationService.getNotifications(),
                userService.getUsers()
            ]);
            setNotifications(notifRes.data);
            setUsers(usersRes.data);
        } catch (err) {
            console.error("Failed to fetch data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSendNotification = async (e) => {
        e.preventDefault();
        try {
            setSending(true);
            const payload = { ...formData };
            if (!payload.user_id) payload.user_id = null; // Broadcast
            
            await notificationService.sendNotification(payload);
            setFormData({ user_id: '', title: '', message: '', type: 'INFO', related_order_id: '', related_product_name: '' });
            setShowForm(false);
            fetchData(); // Refresh list
            alert('Notification sent successfully!');
        } catch (error) {
            console.error("Error sending notification:", error);
            alert('Failed to send notification. ' + (error.response?.data?.error || ''));
        } finally {
            setSending(false);
        }
    };

    const styles = {
        container: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
        tableContainer: {
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: '1.25rem',
            overflowX: 'auto',
        },
        table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1000px' },
        th: {
            padding: '1.25rem 1.5rem',
            borderBottom: `1px solid ${colors.border}`,
            color: colors.textMuted,
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
        },
        td: {
            padding: '1.25rem 1.5rem',
            borderBottom: `1px solid ${colors.border}`,
            fontSize: '0.875rem',
        },
        typeBadge: (type) => ({
            padding: '0.2rem 0.6rem',
            borderRadius: '0.25rem',
            fontSize: '0.65rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            background: type === 'ERROR' ? '#ef444420' : type === 'WARNING' ? '#eab30820' : type === 'SUCCESS' ? '#10b98120' : '#3b82f620',
            color: type === 'ERROR' ? '#ef4444' : type === 'WARNING' ? '#eab308' : type === 'SUCCESS' ? '#10b981' : '#3b82f6',
            border: `1px solid ${type === 'ERROR' ? '#ef4444' : type === 'WARNING' ? '#eab308' : type === 'SUCCESS' ? '#10b981' : '#3b82f6'}40`,
        }),
        actionBtn: {
            padding: '0.5rem 1rem',
            borderRadius: '0.75rem',
            background: colors.primary,
            color: '#fff',
            border: 'none',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.825rem',
            transition: 'all 0.2s'
        },
        formCard: {
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: '1.25rem',
            padding: '1.5rem',
            marginBottom: '1.5rem'
        },
        inputGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '1rem'
        },
        input: {
            width: '100%',
            padding: '0.75rem 1rem',
            background: colors.bg,
            border: `1px solid ${colors.border}`,
            borderRadius: '0.75rem',
            color: colors.text,
            outline: 'none',
        }
    };

    return (
        <div style={styles.container}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Admin Notifications</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem', background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '2rem', fontSize: '0.825rem', fontWeight: 600 }}>
                        <Bell size={16} color={colors.accent} /> {notifications.length} Total Alerts
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button style={styles.actionBtn} onClick={() => setShowForm(!showForm)}>
                        {showForm ? <XCircle size={18} /> : <Plus size={18} />}
                        {showForm ? 'Cancel' : 'Send Notification'}
                    </button>
                </div>
            </div>

            {showForm && (
                <div style={styles.formCard}>
                    <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600 }}>Compose New Notification</h3>
                    <form onSubmit={handleSendNotification}>
                        <div style={styles.inputGrid}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: colors.textMuted, marginBottom: '0.5rem' }}>Recipient</label>
                                <select 
                                    style={styles.input} 
                                    value={formData.user_id}
                                    onChange={(e) => setFormData({...formData, user_id: e.target.value})}
                                >
                                    <option value="">Broadcast to All Users</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.email} ({u.role})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: colors.textMuted, marginBottom: '0.5rem' }}>Notification Type</label>
                                <select 
                                    style={styles.input}
                                    value={formData.type}
                                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                                >
                                    <option value="INFO">Information</option>
                                    <option value="WARNING">Warning</option>
                                    <option value="ERROR">Error</option>
                                    <option value="SUCCESS">Success</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: colors.textMuted, marginBottom: '0.5rem' }}>Related Order ID (Optional)</label>
                                <input 
                                    type="text" 
                                    style={styles.input} 
                                    placeholder="e.g. ORD-20230501-001"
                                    value={formData.related_order_id}
                                    onChange={(e) => setFormData({...formData, related_order_id: e.target.value})}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: colors.textMuted, marginBottom: '0.5rem' }}>Related Product Name (Optional)</label>
                                <input 
                                    type="text" 
                                    style={styles.input} 
                                    placeholder="e.g. Lithium Ion Battery"
                                    value={formData.related_product_name}
                                    onChange={(e) => setFormData({...formData, related_product_name: e.target.value})}
                                />
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: colors.textMuted, marginBottom: '0.5rem' }}>Title</label>
                                <input 
                                    type="text" 
                                    required 
                                    style={styles.input} 
                                    placeholder="Brief subject of the notification"
                                    value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                />
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: colors.textMuted, marginBottom: '0.5rem' }}>Message Content</label>
                                <textarea 
                                    required 
                                    style={{ ...styles.input, minHeight: '100px', resize: 'vertical' }} 
                                    placeholder="Detailed message..."
                                    value={formData.message}
                                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="submit" disabled={sending} style={{ ...styles.actionBtn, opacity: sending ? 0.7 : 1 }}>
                                <Send size={16} /> {sending ? 'Sending...' : 'Dispatch Notification'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div style={styles.tableContainer}>
                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: colors.textMuted }}>Loading system notifications...</div>
                ) : (
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Date</th>
                                <th style={styles.th}>Type</th>
                                <th style={styles.th}>Title</th>
                                <th style={styles.th}>Message Preview</th>
                                <th style={styles.th}>Context</th>
                                <th style={styles.th}>Target User</th>
                                <th style={styles.th}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {notifications.map(notif => (
                                <tr key={notif.id}>
                                    <td style={styles.td}><span style={{ color: colors.textMuted, fontSize: '0.8rem' }}>{new Date(notif.created_at).toLocaleString()}</span></td>
                                    <td style={styles.td}><span style={styles.typeBadge(notif.type)}>{notif.type}</span></td>
                                    <td style={styles.td}><span style={{ fontWeight: 600, color: colors.text }}>{notif.title}</span></td>
                                    <td style={styles.td}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', maxWidth: '300px' }}>
                                            <MessageSquare size={14} color={colors.textMuted} />
                                            <div style={{ fontSize: '0.825rem', color: colors.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {notif.message}
                                            </div>
                                        </div>
                                    </td>
                                    <td style={styles.td}>
                                        {(notif.related_order_id || notif.related_product_name) ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                {notif.related_order_id && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 600, color: colors.text, background: colors.bg, padding: '2px 6px', borderRadius: '4px', border: `1px solid ${colors.border}` }}>
                                                        <Hash size={12} color={colors.accent} /> {notif.related_order_id}
                                                    </div>
                                                )}
                                                {notif.related_product_name && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: colors.textMuted }}>
                                                        <Package size={12} /> {notif.related_product_name}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span style={{ color: colors.textMuted, fontSize: '0.75rem', fontStyle: 'italic' }}>General</span>
                                        )}
                                    </td>
                                    <td style={styles.td}>
                                        <div style={{ fontWeight: 600 }}>{notif.user ? `User ID: ${notif.user}` : <span style={{ color: colors.primary }}>Broadcast (All)</span>}</div>
                                    </td>
                                    <td style={styles.td}>
                                        {notif.is_read ? (
                                            <span style={{ color: colors.textMuted, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}><CheckCircle size={14} /> Read</span>
                                        ) : (
                                            <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}><Clock size={14} /> Unread</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {notifications.length === 0 && (
                                <tr>
                                    <td colSpan="6" style={{ ...styles.td, textAlign: 'center', padding: '3rem', color: colors.textMuted }}>
                                        No notifications found in the system.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default NotificationApprovalPage;
