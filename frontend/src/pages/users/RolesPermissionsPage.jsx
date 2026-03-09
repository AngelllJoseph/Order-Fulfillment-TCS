import React, { useState, useEffect } from 'react';
import { useRoles } from '../../hooks/useUserManagement';
import { roleService } from '../../services/api';
import { Shield, Plus, Edit2, Trash2, CheckSquare, Square } from 'lucide-react';
import Toast from '../../components/Toast';

const RolesPermissionsPage = ({ colors, darkMode }) => {
    const { roles, permissions, loading, refresh } = useRoles();
    const [selectedRole, setSelectedRole] = useState(null);
    const [localPermissions, setLocalPermissions] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const rolesList = roles;
    const currentRole = selectedRole || rolesList[0];
    const modules = [...new Set(permissions.map(p => p.module))];

    // Initialize local permissions when the selected role changes
    useEffect(() => {
        if (currentRole && currentRole.permissions) {
            setLocalPermissions(currentRole.permissions.map(p => p.id));
        }
    }, [currentRole]);

    const togglePermission = (permId) => {
        setLocalPermissions(prev =>
            prev.includes(permId)
                ? prev.filter(id => id !== permId)
                : [...prev, permId]
        );
    };

    const handleSave = async () => {
        if (!currentRole) return;
        setIsSaving(true);
        try {
            await roleService.updateRole(currentRole.id, {
                permission_ids: localPermissions
            });
            await refresh(); // Refresh roles to get updated data
            setToast({ show: true, message: 'Permissions updated successfully!', type: 'success' });
        } catch (err) {
            console.error('Failed to update permissions:', err);
            setToast({ show: true, message: 'Failed to update permissions. See console for details.', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const styles = {
        container: { display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' },
        sidebar: {
            background: colors.cardBg, border: `1px solid ${colors.border}`,
            borderRadius: '1.25rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem'
        },
        roleItem: (active) => ({
            padding: '1rem', borderRadius: '0.75rem',
            background: active ? `${colors.primary}15` : 'transparent',
            border: active ? `1px solid ${colors.primary}` : `1px solid ${colors.border}`,
            cursor: 'pointer', transition: 'all 0.2s ease', color: active ? colors.text : colors.textMuted
        }),
        permissionGrid: {
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem'
        },
        moduleSection: {
            background: colors.cardBg, border: `1px solid ${colors.border}`,
            borderRadius: '1.25rem', padding: '1.5rem'
        },
        permCard: {
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.75rem', borderRadius: '0.5rem',
            background: colors.surface, border: `1px solid ${colors.border}`,
            cursor: 'pointer', transition: 'background 0.2s',
            userSelect: 'none'
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.sidebar}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem' }}>Roles</h3>
                    <button style={{ background: colors.primary, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.4rem', cursor: 'pointer' }}>
                        <Plus size={16} />
                    </button>
                </div>
                {loading ? <p>Loading roles...</p> : rolesList.map(role => (
                    <div
                        key={role.id}
                        style={styles.roleItem(currentRole?.id === role.id)}
                        onClick={() => setSelectedRole(role)}
                    >
                        <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Shield size={16} /> {role.role_name}
                        </div>
                        <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>{role.description}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={styles.moduleSection}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div>
                            <h2 style={{ margin: 0 }}>{currentRole?.role_name} Permissions</h2>
                            <p style={{ color: colors.textMuted, margin: '0.25rem 0 0' }}>Configure what this role can see and do</p>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            style={{
                                background: colors.primary, color: 'white', border: 'none',
                                padding: '0.6rem 1.25rem', borderRadius: '0.75rem', fontWeight: 600,
                                cursor: isSaving ? 'not-allowed' : 'pointer',
                                opacity: isSaving ? 0.7 : 1
                            }}>
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>

                    {modules.map(module => (
                        <div key={module} style={{ marginBottom: '2rem' }}>
                            <h4 style={{ color: colors.primary, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.1em', marginBottom: '1rem' }}>
                                {module} Module
                            </h4>
                            <div style={styles.permissionGrid}>
                                {permissions.filter(p => p.module === module).map(perm => {
                                    const hasPerm = localPermissions.includes(perm.id);
                                    return (
                                        <div
                                            key={perm.id}
                                            style={styles.permCard}
                                            onClick={() => togglePermission(perm.id)}
                                        >
                                            {hasPerm ?
                                                <CheckSquare size={18} color={colors.primary} /> :
                                                <Square size={18} color={colors.textMuted} />
                                            }
                                            <span style={{ fontSize: '0.875rem' }}>{perm.permission_name.replace(/_/g, ' ')}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
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

export default RolesPermissionsPage;
