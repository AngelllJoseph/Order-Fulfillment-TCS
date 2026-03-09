import React, { useState, useEffect } from 'react';
import { sessionService } from '../../services/api';
import { Monitor, Globe, Clock, Power, ShieldCheck } from 'lucide-react';

const UserSessionsPage = ({ colors, darkMode }) => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchSessions = async () => {
        setLoading(true);
        try {
            const res = await sessionService.getSessions();
            setSessions(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const terminate = async (id) => {
        if (window.confirm('Are you sure you want to terminate this session?')) {
            await sessionService.terminateSession(id);
            fetchSessions();
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    const styles = {
        grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' },
        card: {
            background: colors.cardBg, border: `1px solid ${colors.border}`,
            borderRadius: '1.25rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem'
        },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
        userInfo: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
        infoRow: { display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem', color: colors.textMuted },
        actionBtn: {
            padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none',
            background: '#ef444415', color: '#ef4444', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem'
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ color: colors.textMuted, margin: 0 }}>Active sessions across all devices</p>
                <button onClick={fetchSessions} style={{
                    background: 'none', color: colors.primary, border: `1px solid ${colors.primary}`,
                    padding: '0.5rem 1rem', borderRadius: '0.75rem', cursor: 'pointer'
                }}>Refresh</button>
            </div>

            <div style={styles.grid}>
                {loading ? <p>Loading sessions...</p> : sessions.map(session => (
                    <div key={session.id} style={styles.card}>
                        <div style={styles.header}>
                            <div style={styles.userInfo}>
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '50%',
                                    background: `linear-gradient(45deg, ${colors.primary}, ${colors.secondary})`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                                }}>
                                    <ShieldCheck size={20} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700 }}>{session.user_details?.email}</div>
                                    <div style={{ fontSize: '0.75rem', color: colors.textMuted }}>{session.user_details?.role}</div>
                                </div>
                            </div>
                            <button onClick={() => terminate(session.id)} style={styles.actionBtn}>
                                <Power size={14} /> Terminate
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem', borderTop: `1px solid ${colors.border}`, paddingTop: '1rem' }}>
                            <div style={styles.infoRow}>
                                <Monitor size={16} />
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {session.device?.substring(0, 40)}...
                                </span>
                            </div>
                            <div style={styles.infoRow}>
                                <Globe size={16} /> {session.ip_address}
                            </div>
                            <div style={styles.infoRow}>
                                <Clock size={16} /> Last active: {new Date(session.last_activity).toLocaleString()}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UserSessionsPage;
