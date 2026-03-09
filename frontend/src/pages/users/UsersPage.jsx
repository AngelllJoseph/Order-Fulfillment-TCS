import React, { useState } from 'react';
import { useUsers } from '../../hooks/useUserManagement';
import { logService } from '../../services/api';
import {
    Search, UserPlus, FileDown, MoreVertical, Edit2,
    UserX, Key, Activity, Shield, UserCheck, X, Clock
} from 'lucide-react';
import Toast from '../../components/Toast';

const UsersPage = ({ colors, darkMode }) => {
    const { users, loading, refresh, createUser, updateUser, toggleStatus, resetPassword } = useUsers();
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [isEditUserOpen, setIsEditUserOpen] = useState(false);
    const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
    const [isActivityOpen, setIsActivityOpen] = useState(false);
    const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false);

    const [selectedUser, setSelectedUser] = useState(null);
    const [userLogs, setUserLogs] = useState([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [newUser, setNewUser] = useState({
        first_name: '',
        last_name: '',
        email: '',
        role: 'REPORT_USER',
        password: ''
    });

    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const styles = {
        container: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
        actionBar: {
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            gap: '1rem', flexWrap: 'wrap'
        },
        searchBox: {
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            background: colors.surface, border: `1px solid ${colors.border}`,
            padding: '0.5rem 1rem', borderRadius: '0.75rem', width: '320px'
        },
        input: {
            background: 'none', border: 'none', color: colors.text,
            fontSize: '0.875rem', width: '100%', outline: 'none'
        },
        button: (primary) => ({
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.6rem 1.25rem', borderRadius: '0.75rem',
            background: primary ? colors.primary : colors.surface,
            color: primary ? 'white' : colors.text,
            border: primary ? 'none' : `1px solid ${colors.border}`,
            fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
            transition: 'all 0.2s ease',
            opacity: isSubmitting ? 0.7 : 1
        }),
        tableContainer: {
            background: colors.cardBg, border: `1px solid ${colors.border}`,
            borderRadius: '1.25rem', overflowX: 'auto'
        },
        table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1000px' },
        th: {
            padding: '1.25rem 1.5rem', background: colors.surface,
            color: colors.textMuted, fontSize: '0.75rem', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.05em',
            borderBottom: `1px solid ${colors.border}`
        },
        td: {
            padding: '1.25rem 1.5rem', borderBottom: `1px solid ${colors.border}`,
            fontSize: '0.875rem'
        },
        badge: (status) => ({
            padding: '0.25rem 0.75rem', borderRadius: '9999px',
            fontSize: '0.75rem', fontWeight: 700,
            background: status ? '#10b98115' : '#ef444415',
            color: status ? '#10b981' : '#ef4444'
        }),
        roleBadge: {
            padding: '0.2rem 0.6rem', background: `${colors.primary}15`,
            color: colors.primary, borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600
        },
        modalOverlay: {
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)'
        },
        modalContent: {
            background: colors.surface, padding: '2rem', borderRadius: '1.25rem',
            width: '100%', maxWidth: '500px', border: `1px solid ${colors.border}`,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            position: 'relative'
        },
        label: { display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: colors.textMuted },
        formInput: {
            background: colors.bg,
            border: `1px solid ${colors.border}`,
            color: colors.text,
            fontSize: '0.875rem',
            width: '100%',
            outline: 'none',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            boxSizing: 'border-box'
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const result = await createUser(newUser);
        if (result.success) {
            setIsAddUserOpen(false);
            setNewUser({ first_name: '', last_name: '', email: '', role: 'REPORT_USER', password: '' });
            setToast({ show: true, message: 'User created successfully!', type: 'success' });
        } else {
            setToast({ show: true, message: 'Failed to create user: ' + JSON.stringify(result.error), type: 'error' });
        }
        setIsSubmitting(false);
    };

    const handleEditUser = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const result = await updateUser(selectedUser.id, {
            first_name: selectedUser.first_name,
            last_name: selectedUser.last_name,
            role: selectedUser.role
        });
        if (result.success) {
            setIsEditUserOpen(false);
            setToast({ show: true, message: 'User updated successfully!', type: 'success' });
        } else {
            setToast({ show: true, message: 'Failed to update user', type: 'error' });
        }
        setIsSubmitting(false);
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!newPassword) return;
        setIsSubmitting(true);
        const result = await resetPassword(selectedUser.id, newPassword);
        if (result.success) {
            setIsResetPasswordOpen(false);
            setNewPassword('');
            setToast({ show: true, message: 'Password reset successfully!', type: 'success' });
        } else {
            setToast({ show: true, message: 'Failed to reset password', type: 'error' });
        }
        setIsSubmitting(false);
    };

    const handleToggleStatus = async () => {
        setIsSubmitting(true);
        const result = await toggleStatus(selectedUser.id);
        if (result.success) {
            setIsStatusConfirmOpen(false);
            setToast({
                show: true,
                message: `User ${selectedUser.is_active ? 'deactivated' : 'activated'} successfully!`,
                type: 'success'
            });
        } else {
            setToast({ show: true, message: 'Failed to change user status', type: 'error' });
        }
        setIsSubmitting(false);
    };

    const fetchUserActivity = async (user) => {
        setSelectedUser(user);
        setIsActivityOpen(true);
        setLogsLoading(true);
        try {
            const res = await logService.getAccessLogs();
            // Filter logs for this specific user
            const filteredLogs = res.data.filter(log => log.user_details?.email === user.email);
            setUserLogs(filteredLogs);
        } catch (err) {
            console.error(err);
            setToast({ show: true, message: 'Failed to fetch activity logs', type: 'error' });
        } finally {
            setLogsLoading(false);
        }
    };


    const filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div style={styles.container}>
            <div style={styles.actionBar}>
                <div style={styles.searchBox}>
                    <Search size={18} color={colors.textMuted} />
                    <input
                        style={styles.input}
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button style={styles.button(false)}><FileDown size={18} /> Export</button>
                    <button style={styles.button(true)} onClick={() => setIsAddUserOpen(true)}>
                        <UserPlus size={18} /> Add User
                    </button>
                </div>
            </div>

            <div style={styles.tableContainer}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>User</th>
                            <th style={styles.th}>Role</th>
                            <th style={styles.th}>Status</th>
                            <th style={styles.th}>Last Login</th>
                            <th style={styles.th}>MFA</th>
                            <th style={styles.th}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{ ...styles.td, textAlign: 'center' }}>Loading users...</td></tr>
                        ) : filteredUsers.map(u => (
                            <tr key={u.id}>
                                <td style={styles.td}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{
                                            width: '32px', height: '32px', borderRadius: '50%',
                                            background: `linear-gradient(45deg, ${colors.primary}, ${colors.secondary})`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'white', fontWeight: 700, fontSize: '0.75rem'
                                        }}>
                                            {u.first_name?.charAt(0) || u.email.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{u.first_name} {u.last_name}</div>
                                            <div style={{ fontSize: '0.75rem', color: colors.textMuted }}>{u.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={styles.td}>
                                    <span style={styles.roleBadge}>{u.role}</span>
                                </td>
                                <td style={styles.td}>
                                    <span style={styles.badge(u.is_active)}>{u.is_active ? 'Active' : 'Inactive'}</span>
                                </td>
                                <td style={styles.td}>
                                    <span style={{ color: colors.textMuted }}>
                                        {u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}
                                    </span>
                                </td>
                                <td style={styles.td}>
                                    {u.mfa_enabled ?
                                        <Shield size={16} color="#10b981" /> :
                                        <Shield size={16} color={colors.textMuted} />
                                    }
                                </td>
                                <td style={styles.td}>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            title="Edit"
                                            onClick={() => { setSelectedUser(u); setIsEditUserOpen(true); }}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted }}
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            title="Reset Password"
                                            onClick={() => { setSelectedUser(u); setIsResetPasswordOpen(true); }}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted }}
                                        >
                                            <Key size={16} />
                                        </button>
                                        <button
                                            title="View Activity"
                                            onClick={() => fetchUserActivity(u)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted }}
                                        >
                                            <Activity size={16} />
                                        </button>
                                        <button
                                            title={u.is_active ? "Deactivate" : "Activate"}
                                            onClick={() => { setSelectedUser(u); setIsStatusConfirmOpen(true); }}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: u.is_active ? '#ef4444' : '#10b981' }}
                                        >
                                            {u.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modals Container */}

            {/* Add User Modal */}
            {isAddUserOpen && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: colors.text }}>Add New User</h2>
                        <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={styles.label}>First Name</label>
                                    <input
                                        required type="text"
                                        style={styles.formInput}
                                        value={newUser.first_name}
                                        onChange={e => setNewUser({ ...newUser, first_name: e.target.value })}
                                        placeholder="John"
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={styles.label}>Last Name</label>
                                    <input
                                        required type="text"
                                        style={styles.formInput}
                                        value={newUser.last_name}
                                        onChange={e => setNewUser({ ...newUser, last_name: e.target.value })}
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={styles.label}>Email</label>
                                <input
                                    required type="email"
                                    style={styles.formInput}
                                    value={newUser.email}
                                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                    placeholder="john.doe@example.com"
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={styles.label}>Role</label>
                                    <select
                                        style={{ ...styles.formInput, color: colors.text }}
                                        value={newUser.role}
                                        onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                                    >
                                        <option value="ADMIN">Admin</option>
                                        <option value="PROGRAM_MANAGER">Program Manager</option>
                                        <option value="MANUFACTURING_LEAD">Manufacturing Lead</option>
                                        <option value="REPORT_USER">Report User</option>
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={styles.label}>Password</label>
                                    <input
                                        required type="password"
                                        style={styles.formInput}
                                        value={newUser.password}
                                        onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                        placeholder="Secure password"
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setIsAddUserOpen(false)} style={styles.button(false)}>Cancel</button>
                                <button type="submit" disabled={isSubmitting} style={styles.button(true)}>{isSubmitting ? 'Creating...' : 'Create User'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {isEditUserOpen && selectedUser && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: colors.text }}>Edit User</h2>
                        <form onSubmit={handleEditUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={styles.label}>First Name</label>
                                    <input
                                        required type="text"
                                        style={styles.formInput}
                                        value={selectedUser.first_name}
                                        onChange={e => setSelectedUser({ ...selectedUser, first_name: e.target.value })}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={styles.label}>Last Name</label>
                                    <input
                                        required type="text"
                                        style={styles.formInput}
                                        value={selectedUser.last_name}
                                        onChange={e => setSelectedUser({ ...selectedUser, last_name: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={styles.label}>Role</label>
                                <select
                                    style={{ ...styles.formInput, color: colors.text }}
                                    value={selectedUser.role}
                                    onChange={e => setSelectedUser({ ...selectedUser, role: e.target.value })}
                                >
                                    <option value="ADMIN">Admin</option>
                                    <option value="PROGRAM_MANAGER">Program Manager</option>
                                    <option value="MANUFACTURING_LEAD">Manufacturing Lead</option>
                                    <option value="REPORT_USER">Report User</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setIsEditUserOpen(false)} style={styles.button(false)}>Cancel</button>
                                <button type="submit" disabled={isSubmitting} style={styles.button(true)}>{isSubmitting ? 'Saving...' : 'Save Changes'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {isResetPasswordOpen && selectedUser && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: colors.text }}>Reset Password</h2>
                        <p style={{ color: colors.textMuted, fontSize: '0.875rem', marginBottom: '1rem' }}>
                            Resetting password for <strong>{selectedUser.first_name} {selectedUser.last_name}</strong> ({selectedUser.email})
                        </p>
                        <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={styles.label}>New Password</label>
                                <input
                                    required type="password"
                                    style={styles.formInput}
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    placeholder="Enter new secure password"
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setIsResetPasswordOpen(false)} style={styles.button(false)}>Cancel</button>
                                <button type="submit" disabled={isSubmitting} style={styles.button(true)}>{isSubmitting ? 'Resetting...' : 'Reset Password'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Activity Modal */}
            {isActivityOpen && selectedUser && (
                <div style={styles.modalOverlay}>
                    <div style={{ ...styles.modalContent, maxWidth: '700px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0, color: colors.text }}>User Activity</h2>
                            <button onClick={() => setIsActivityOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted }}>
                                <X size={24} />
                            </button>
                        </div>
                        <p style={{ color: colors.textMuted, fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                            Recent login history for <strong>{selectedUser.email}</strong>
                        </p>

                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            {logsLoading ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: colors.textMuted }}>Loading activity logs...</div>
                            ) : userLogs.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: colors.textMuted }}>No recent activity found.</div>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ position: 'sticky', top: 0, background: colors.surface }}>
                                        <tr>
                                            <th style={{ ...styles.th, padding: '0.75rem' }}>Time</th>
                                            <th style={{ ...styles.th, padding: '0.75rem' }}>Status</th>
                                            <th style={{ ...styles.th, padding: '0.75rem' }}>IP & Device</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {userLogs.map(log => (
                                            <tr key={log.id}>
                                                <td style={{ ...styles.td, padding: '0.75rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <Clock size={14} color={colors.textMuted} />
                                                        {new Date(log.login_time).toLocaleString()}
                                                    </div>
                                                </td>
                                                <td style={{ ...styles.td, padding: '0.75rem' }}>
                                                    <span style={{ color: log.login_status === 'SUCCESS' ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                                                        {log.login_status}
                                                    </span>
                                                </td>
                                                <td style={{ ...styles.td, padding: '0.75rem' }}>
                                                    <div style={{ fontSize: '0.75rem' }}>{log.ip_address}</div>
                                                    <div style={{ fontSize: '0.7rem', color: colors.textMuted }}>{log.device?.substring(0, 20)}...</div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Status Toggle Confirmation Modal */}
            {isStatusConfirmOpen && selectedUser && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h2 style={{ marginTop: 0, marginBottom: '1rem', color: colors.text }}>
                            {selectedUser.is_active ? 'Deactivate' : 'Activate'} User?
                        </h2>
                        <p style={{ color: colors.textMuted, marginBottom: '1.5rem' }}>
                            Are you sure you want to {selectedUser.is_active ? 'deactivate' : 'activate'} <strong>{selectedUser.first_name} {selectedUser.last_name}</strong>?
                            {selectedUser.is_active && " The user will no longer be able to log in to the system."}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button type="button" onClick={() => setIsStatusConfirmOpen(false)} style={styles.button(false)}>Cancel</button>
                            <button
                                onClick={handleToggleStatus}
                                disabled={isSubmitting}
                                style={{ ...styles.button(true), background: selectedUser.is_active ? '#ef4444' : '#10b981' }}
                            >
                                {isSubmitting ? 'Processing...' : (selectedUser.is_active ? 'Deactivate User' : 'Activate User')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast.show && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    colors={colors}
                    onClose={() => setToast({ ...toast, show: false })}
                />
            )}
        </div>
    );
};

export default UsersPage;

