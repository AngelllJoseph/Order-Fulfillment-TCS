import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle } from 'lucide-react';
import { notificationService } from '../services/notifications';

const NotificationBell = ({ colors }) => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            const res = await notificationService.getNotifications();
            setNotifications(res.data);
        } catch (err) {
            console.error("Failed to fetch notifications:", err);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Option to poll every 30s
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAsRead = async (id, e) => {
        e.stopPropagation();
        try {
            await notificationService.markAsRead(id);
            setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (err) {
            console.error("Failed to mark as read", err);
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const styles = {
        container: { position: 'relative', display: 'flex', alignItems: 'center' },
        bellBtn: {
            background: 'none', border: 'none', color: colors.textMuted,
            cursor: 'pointer', padding: '0.5rem', borderRadius: '0.5rem',
            position: 'relative', display: 'flex', alignItems: 'center', transition: 'all 0.2s ease',
        },
        badge: {
            position: 'absolute', top: '2px', right: '4px',
            background: '#ef4444', color: 'white', fontSize: '0.65rem',
            fontWeight: 'bold', width: '16px', height: '16px',
            borderRadius: '50%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', border: `2px solid ${colors.surface}`
        },
        dropdown: {
            position: 'absolute', top: '120%', right: '0',
            width: '320px', background: colors.surface,
            border: `1px solid ${colors.border}`, borderRadius: '1rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 1000,
            overflow: 'hidden', display: isOpen ? 'block' : 'none'
        },
        header: {
            padding: '1rem', borderBottom: `1px solid ${colors.border}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            fontWeight: 600, fontSize: '0.9rem', color: colors.text
        },
        list: {
            maxHeight: '300px', overflowY: 'auto'
        },
        item: (isRead) => ({
            padding: '1rem', borderBottom: `1px solid ${colors.border}`,
            display: 'flex', flexDirection: 'column', gap: '0.25rem',
            background: isRead ? 'transparent' : 'rgba(99, 102, 241, 0.05)',
            cursor: 'pointer', transition: 'background 0.2s'
        }),
        titleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
        title: { fontSize: '0.85rem', fontWeight: 600, color: colors.text },
        time: { fontSize: '0.7rem', color: colors.textMuted },
        message: { fontSize: '0.8rem', color: colors.textMuted },
        empty: { padding: '2rem', textAlign: 'center', color: colors.textMuted, fontSize: '0.875rem' }
    };

    return (
        <div style={styles.container} ref={dropdownRef}>
            <button style={styles.bellBtn} onClick={() => setIsOpen(!isOpen)}>
                <Bell size={20} />
                {unreadCount > 0 && <span style={styles.badge}>{unreadCount}</span>}
            </button>

            {isOpen && (
                <div style={styles.dropdown}>
                    <div style={styles.header}>
                        <span>Notifications</span>
                        <span style={{ fontSize: '0.75rem', color: colors.primary }}>{unreadCount} Unread</span>
                    </div>
                    <div style={styles.list}>
                        {notifications.length === 0 ? (
                            <div style={styles.empty}>No notifications yet</div>
                        ) : (
                            notifications.map(notif => (
                                <div key={notif.id} style={styles.item(notif.is_read)}>
                                    <div style={styles.titleRow}>
                                        <div style={styles.title}>{notif.title}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={styles.time}>{new Date(notif.created_at).toLocaleDateString()}</span>
                                            {!notif.is_read && (
                                                <button 
                                                    onClick={(e) => handleMarkAsRead(notif.id, e)}
                                                    style={{ background: 'none', border: 'none', color: colors.primary, cursor: 'pointer', padding: 0 }}
                                                    title="Mark as read"
                                                >
                                                    <CheckCircle size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div style={styles.message}>{notif.message}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
