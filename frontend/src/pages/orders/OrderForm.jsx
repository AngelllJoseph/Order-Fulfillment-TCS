import React, { useState, useEffect } from 'react';
import { X, Check, Loader2 } from 'lucide-react';

const OrderForm = ({ order, products, colors, darkMode, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        product: '',
        quantity: 1,
        customer_first_name: '',
        customer_last_name: '',
        customer_email: '',
        customer_phone: '',
        shipping_address: '',
        priority: 'NORMAL',
        expected_delivery_date: new Date().toISOString().split('T')[0]
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (order) {
            const nameParts = (order.customer_name || '').split(' ');
            setFormData({
                product: order.product,
                quantity: order.quantity,
                customer_first_name: nameParts[0] || '',
                customer_last_name: nameParts.slice(1).join(' ') || '',
                customer_email: order.customer_email || '',
                customer_phone: order.customer_phone,
                shipping_address: order.shipping_address,
                priority: order.priority,
                expected_delivery_date: order.expected_delivery_date
            });
        }
    }, [order]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const dataToSave = {
            ...formData,
            customer_name: `${formData.customer_first_name} ${formData.customer_last_name}`.trim()
        };
        await onSave(dataToSave);
        setLoading(false);
    };

    const styles = {
        overlay: {
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            padding: '1rem'
        },
        modal: {
            background: colors.surface, borderRadius: '1.5rem',
            width: '100%', maxWidth: '600px', border: `1px solid ${colors.border}`,
            overflow: 'hidden', display: 'flex', flexDirection: 'column',
            maxHeight: '90vh'
        },
        header: {
            padding: '1.25rem 1.5rem', borderBottom: `1px solid ${colors.border}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        },
        form: { padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' },
        fieldGroup: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
        label: { display: 'block', fontSize: '0.75rem', fontWeight: 700, color: colors.textMuted, marginBottom: '0.5rem', textTransform: 'uppercase' },
        input: {
            width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem',
            background: colors.bg, border: `1px solid ${colors.border}`,
            color: colors.text, fontSize: '0.875rem', outline: 'none', transition: 'border-color 0.2s'
        },
        textarea: {
            width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem',
            background: colors.bg, border: `1px solid ${colors.border}`,
            color: colors.text, fontSize: '0.875rem', outline: 'none', minHeight: '80px', resize: 'vertical'
        },
        footer: {
            padding: '1.25rem 1.5rem', borderTop: `1px solid ${colors.border}`,
            display: 'flex', justifyContent: 'flex-end', gap: '1rem'
        },
        button: (primary) => ({
            padding: '0.75rem 1.5rem', borderRadius: '0.75rem',
            background: primary ? colors.primary : 'transparent',
            color: primary ? 'white' : colors.text,
            border: primary ? 'none' : `1px solid ${colors.border}`,
            fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.5rem'
        })
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.header}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                        {order ? 'Edit Order' : 'Add New Order'}
                    </h3>
                    <button onClick={onCancel} style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.fieldGroup}>
                        <div>
                            <label style={styles.label}>Product</label>
                            <select
                                style={styles.select || styles.input}
                                value={formData.product}
                                onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                                required
                            >
                                <option value="">Select Product</option>
                                {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={styles.label}>Quantity</label>
                            <input
                                type="number"
                                style={styles.input}
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                                min="1"
                                required
                            />
                        </div>
                    </div>

                    <div style={styles.fieldGroup}>
                        <div>
                            <label style={styles.label}>Customer First Name</label>
                            <input
                                type="text"
                                style={styles.input}
                                value={formData.customer_first_name}
                                onChange={(e) => setFormData({ ...formData, customer_first_name: e.target.value })}
                                placeholder="John"
                                required
                            />
                        </div>
                        <div>
                            <label style={styles.label}>Customer Last Name</label>
                            <input
                                type="text"
                                style={styles.input}
                                value={formData.customer_last_name}
                                onChange={(e) => setFormData({ ...formData, customer_last_name: e.target.value })}
                                placeholder="Doe"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label style={styles.label}>Shipping Address</label>
                        <textarea
                            style={styles.textarea}
                            value={formData.shipping_address}
                            onChange={(e) => setFormData({ ...formData, shipping_address: e.target.value })}
                            placeholder="Complete street address, city, state, zip"
                            required
                        />
                    </div>

                    <div style={styles.fieldGroup}>
                        <div>
                            <label style={styles.label}>Customer Email</label>
                            <input
                                type="email"
                                style={styles.input}
                                value={formData.customer_email}
                                onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                                placeholder="john.doe@example.com"
                            />
                        </div>
                        <div>
                            <label style={styles.label}>Customer Phone</label>
                            <input
                                type="text"
                                style={styles.input}
                                value={formData.customer_phone}
                                onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                                placeholder="+1 234 567 890"
                                required
                            />
                        </div>
                    </div>

                    <div style={styles.fieldGroup}>
                        <div>
                            <label style={styles.label}>Priority</label>
                            <select
                                style={styles.input}
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                            >
                                <option value="NORMAL">Normal</option>
                                <option value="HIGH">High Priority</option>
                            </select>
                        </div>
                        <div>
                            <label style={styles.label}>Expected Delivery</label>
                            <input
                                type="date"
                                style={styles.input}
                                value={formData.expected_delivery_date}
                                onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                </form>
                <div style={styles.footer}>
                    <button type="button" onClick={onCancel} style={styles.button(false)}>Cancel</button>
                    <button type="submit" onClick={handleSubmit} style={styles.button(true)} disabled={loading}>
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                        {order ? 'Update Order' : 'Create Order'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderForm;
