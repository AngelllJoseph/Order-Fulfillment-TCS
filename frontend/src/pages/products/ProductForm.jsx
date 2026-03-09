import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';

const ProductForm = ({ product, colors, darkMode, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        product_id: '',
        sku: '',
        name: '',
        price: '',
        category: '',
        description: '',
        status: 'ACTIVE'
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (product) {
            setFormData({
                product_id: product.product_id || '',
                sku: product.sku || '',
                name: product.name || '',
                price: product.price || '',
                category: product.category || '',
                description: product.description || '',
                status: product.status || 'ACTIVE'
            });
        }
    }, [product]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(formData);
        } finally {
            setLoading(false);
        }
    };

    const styles = {
        overlay: {
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '1rem'
        },
        modal: {
            background: colors.surface, border: `1px solid ${colors.border}`,
            borderRadius: '1.5rem', width: '100%', maxWidth: '600px',
            maxHeight: '90vh', overflowY: 'auto', position: 'relative',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        },
        header: {
            padding: '1.5rem', borderBottom: `1px solid ${colors.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            position: 'sticky', top: 0, background: colors.surface, zIndex: 10
        },
        body: { padding: '1.5rem' },
        footer: {
            padding: '1.5rem', borderTop: `1px solid ${colors.border}`,
            display: 'flex', justifyContent: 'flex-end', gap: '1rem',
            position: 'sticky', bottom: 0, background: colors.surface, zIndex: 10
        },
        formGrid: {
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem'
        },
        inputGroup: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
        label: {
            fontSize: '0.75rem', fontWeight: 700, color: colors.textMuted,
            textTransform: 'uppercase', letterSpacing: '0.05em'
        },
        input: {
            padding: '0.75rem 1rem', borderRadius: '0.75rem',
            background: darkMode ? 'rgba(255, 255, 255, 0.05)' : '#f8fafc',
            border: `1px solid ${colors.border}`, color: colors.text,
            fontSize: '0.875rem', outline: 'none', transition: 'border-color 0.2s',
            width: '100%'
        },
        textarea: {
            padding: '0.75rem 1rem', borderRadius: '0.75rem',
            background: darkMode ? 'rgba(255, 255, 255, 0.05)' : '#f8fafc',
            border: `1px solid ${colors.border}`, color: colors.text,
            fontSize: '0.875rem', outline: 'none', width: '100%',
            minHeight: '100px', resize: 'vertical'
        },
        button: (primary) => ({
            padding: '0.75rem 1.5rem', borderRadius: '0.75rem',
            background: primary ? colors.primary : 'transparent',
            color: primary ? 'white' : colors.text,
            border: primary ? 'none' : `1px solid ${colors.border}`,
            fontWeight: 600, cursor: 'pointer', display: 'flex',
            alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s'
        })
    };

    return (
        <div style={styles.overlay}>
            <form style={styles.modal} onSubmit={handleSubmit}>
                <div style={styles.header}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                        {product ? 'Edit Product' : 'Add New Product'}
                    </h2>
                    <button type="button" onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={styles.body}>
                    <div style={styles.formGrid}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Product ID *</label>
                            <input
                                style={styles.input}
                                value={formData.product_id}
                                onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                                placeholder="PR01"
                                required
                            />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>SKU *</label>
                            <input
                                style={styles.input}
                                value={formData.sku}
                                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                placeholder="P001"
                                required
                            />
                        </div>
                        <div style={{ ...styles.inputGroup, gridColumn: 'span 2' }}>
                            <label style={styles.label}>Product Name *</label>
                            <input
                                style={styles.input}
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Below Knee Prosthetic Leg"
                                required
                            />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Price ($) *</label>
                            <input
                                style={styles.input}
                                type="number"
                                step="0.01"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                placeholder="99.99"
                                required
                            />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Category *</label>
                            <input
                                style={styles.input}
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                placeholder="Prosthetic type"
                                required
                            />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Status</label>
                            <select
                                style={styles.input}
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="ACTIVE">Active</option>
                                <option value="INACTIVE">Inactive</option>
                            </select>
                        </div>
                        <div style={{ ...styles.inputGroup, gridColumn: 'span 2' }}>
                            <label style={styles.label}>Description</label>
                            <textarea
                                style={styles.textarea}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Add product details here..."
                            />
                        </div>
                    </div>
                </div>

                <div style={styles.footer}>
                    <button type="button" onClick={onCancel} style={styles.button(false)}>Cancel</button>
                    <button type="submit" disabled={loading} style={styles.button(true)}>
                        {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                        {product ? 'Update Product' : 'Save Product'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProductForm;
