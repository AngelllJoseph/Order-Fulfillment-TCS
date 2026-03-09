import React, { useState, useEffect } from 'react';
import {
    X, Save, Info, Settings, Clock, Phone, Mail,
    User, MapPin, Activity, AlertCircle
} from 'lucide-react';

const HubForm = ({ hub, onSave, onCancel, colors, darkMode }) => {
    const [formData, setFormData] = useState({
        name: '',
        hub_code: '',
        location: '',
        contact_person: '',
        contact_email: '',
        contact_phone: '',
        max_daily_capacity: 500,
        max_concurrent_orders: 100,
        production_lead_time: '',
        operating_hours: '',
        status: 'ACTIVE',
        auto_assignment_enabled: true,
        priority_level: 1,
        supported_skus: '',
        ...hub
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    const styles = {
        overlay: {
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)'
        },
        container: {
            background: colors.surface, borderRadius: '1.25rem',
            width: '100%', maxWidth: '800px', maxHeight: '90vh',
            border: `1px solid ${colors.border}`,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden'
        },
        header: {
            padding: '1.5rem 2rem', borderBottom: `1px solid ${colors.border}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        },
        content: {
            padding: '2rem', overflowY: 'auto', flex: 1,
            display: 'flex', flexDirection: 'column', gap: '2rem'
        },
        footer: {
            padding: '1.5rem 2rem', borderTop: `1px solid ${colors.border}`,
            display: 'flex', justifyContent: 'flex-end', gap: '1rem'
        },
        section: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
        sectionTitle: {
            fontSize: '1rem', fontWeight: 700, display: 'flex',
            alignItems: 'center', gap: '0.75rem', color: colors.primary
        },
        grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
        formGroup: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
        label: { fontSize: '0.875rem', fontWeight: 600, color: colors.textMuted },
        input: {
            background: colors.bg, border: `1px solid ${colors.border}`,
            color: colors.text, fontSize: '0.875rem', width: '100%',
            outline: 'none', padding: '0.75rem', borderRadius: '0.5rem',
            boxSizing: 'border-box'
        },
        button: (primary) => ({
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.75rem 1.5rem', borderRadius: '0.75rem',
            background: primary ? colors.primary : colors.surface,
            color: primary ? 'white' : colors.text,
            border: primary ? 'none' : `1px solid ${colors.border}`,
            fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
            transition: 'all 0.2s ease',
        }),
        checkboxContainer: {
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.75rem', background: `${colors.bg}`,
            borderRadius: '0.5rem', border: `1px solid ${colors.border}`,
            cursor: 'pointer'
        }
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.container}>
                <header style={styles.header}>
                    <h2 style={{ margin: 0, color: colors.text }}>
                        {hub ? 'Edit Manufacturing Hub' : 'Add New Manufacturing Hub'}
                    </h2>
                    <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted }}>
                        <X size={24} />
                    </button>
                </header>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                    <div style={styles.content}>
                        {/* Basic Information */}
                        <div style={styles.section}>
                            <div style={styles.sectionTitle}>
                                <Info size={18} /> Basic Information
                            </div>
                            <div style={styles.grid}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Hub Name *</label>
                                    <input
                                        name="name" required style={styles.input}
                                        value={formData.name} onChange={handleChange}
                                        placeholder="Regional Hub A"
                                    />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Hub Code / ID *</label>
                                    <input
                                        name="hub_code" required style={styles.input}
                                        value={formData.hub_code} onChange={handleChange}
                                        placeholder="HUB-001"
                                    />
                                </div>
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Location (City, State, Country) *</label>
                                <div style={{ position: 'relative' }}>
                                    <MapPin size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: colors.textMuted }} />
                                    <input
                                        name="location" required style={{ ...styles.input, paddingLeft: '2.5rem' }}
                                        value={formData.location} onChange={handleChange}
                                        placeholder="Brooklyn, NY, USA"
                                    />
                                </div>
                            </div>
                            <div style={styles.grid}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Contact Person</label>
                                    <input
                                        name="contact_person" style={styles.input}
                                        value={formData.contact_person} onChange={handleChange}
                                    />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Contact Email</label>
                                    <input
                                        name="contact_email" type="email" style={styles.input}
                                        value={formData.contact_email} onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Operational Configuration */}
                        <div style={styles.section}>
                            <div style={styles.sectionTitle}>
                                <Settings size={18} /> Operational Configuration
                            </div>
                            <div style={styles.grid}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Max Daily Capacity</label>
                                    <input
                                        name="max_daily_capacity" type="number" style={styles.input}
                                        value={formData.max_daily_capacity} onChange={handleChange}
                                    />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Max Concurrent Orders</label>
                                    <input
                                        name="max_concurrent_orders" type="number" style={styles.input}
                                        value={formData.max_concurrent_orders} onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div style={styles.grid}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Production Lead Time</label>
                                    <input
                                        name="production_lead_time" style={styles.input}
                                        value={formData.production_lead_time} onChange={handleChange}
                                        placeholder="e.g. 24-48 hours"
                                    />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Operating Hours</label>
                                    <input
                                        name="operating_hours" style={styles.input}
                                        value={formData.operating_hours} onChange={handleChange}
                                        placeholder="e.g. 9 AM - 6 PM, Mon-Sat"
                                    />
                                </div>
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Supported SKUs</label>
                                <input
                                    name="supported_skus" style={styles.input}
                                    value={formData.supported_skus} onChange={handleChange}
                                    placeholder="e.g. P001, P002, P003"
                                />
                                <span style={{ fontSize: '0.75rem', color: colors.textMuted }}>Comma-separated list of supported SKUs.</span>
                            </div>
                        </div>

                        {/* System Settings */}
                        <div style={styles.section}>
                            <div style={styles.sectionTitle}>
                                <Activity size={18} /> System Settings
                            </div>
                            <div style={styles.grid}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Hub Status</label>
                                    <select
                                        name="status" style={styles.input}
                                        value={formData.status} onChange={handleChange}
                                    >
                                        <option value="ACTIVE">Active</option>
                                        <option value="INACTIVE">Inactive</option>
                                        <option value="MAINTENANCE">Maintenance</option>
                                    </select>
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Priority Level (AI Assignment)</label>
                                    <input
                                        name="priority_level" type="number" style={styles.input}
                                        value={formData.priority_level} onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                <label style={{ ...styles.checkboxContainer, flex: 1 }}>
                                    <input
                                        type="checkbox" name="auto_assignment_enabled"
                                        checked={formData.auto_assignment_enabled}
                                        onChange={handleChange}
                                    />
                                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Enable AI Auto Assignment</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <footer style={styles.footer}>
                        <button type="button" onClick={onCancel} style={styles.button(false)}>Cancel</button>
                        <button type="submit" style={styles.button(true)}>
                            <Save size={18} /> {hub ? 'Save Changes' : 'Create Hub'}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default HubForm;
