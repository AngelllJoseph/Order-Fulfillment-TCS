import React, { useState, useEffect } from 'react';
import { X, Check, Loader2, Plus, Trash2, ShoppingCart } from 'lucide-react';

const OrderForm = ({ order, products, colors, darkMode, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        items: [],
        customer_first_name: '',
        customer_last_name: '',
        customer_email: '',
        customer_phone: '',
        shipping_address: '',
        priority: 'NORMAL',
        expected_delivery_date: new Date().toISOString().split('T')[0]
    });
    const [currentItem, setCurrentItem] = useState({ product: '', quantity: 1 });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (order) {
            const nameParts = (order.customer_name || '').split(' ');
            setFormData({
                items: order.items || (order.product ? [{ 
                    product: order.product, 
                    quantity: order.quantity,
                    product_name: order.product_details?.name,
                    product_sku: order.product_details?.sku
                }] : []),
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

    const handleAddItem = () => {
        if (!currentItem.product) return;
        
        const product = products.find(p => p.id === currentItem.product);
        if (!product) return;

        const newItem = {
            product: product.id,
            product_name: product.name,
            product_sku: product.sku,
            quantity: currentItem.quantity
        };

        setFormData(prev => ({
            ...prev,
            items: [...prev.items, newItem]
        }));
        setCurrentItem({ product: '', quantity: 1 });
    };

    const handleRemoveItem = (index) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.items.length === 0) {
            alert("Please add at least one product to the order.");
            return;
        }

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
            width: '100%', maxWidth: '700px', border: `1px solid ${colors.border}`,
            overflow: 'hidden', display: 'flex', flexDirection: 'column',
            maxHeight: '95vh', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        },
        header: {
            padding: '1.25rem 1.5rem', borderBottom: `1px solid ${colors.border}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: colors.surface
        },
        form: { padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' },
        section: {
            padding: '1.25rem', borderRadius: '1rem', background: colors.bg + '50',
            border: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', gap: '1rem'
        },
        sectionTitle: { fontSize: '0.875rem', fontWeight: 800, color: colors.primary, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' },
        fieldGroup: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
        label: { display: 'block', fontSize: '0.75rem', fontWeight: 700, color: colors.textMuted, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' },
        input: {
            width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem',
            background: colors.bg, border: `1px solid ${colors.border}`,
            color: colors.text, fontSize: '0.875rem', outline: 'none', transition: 'all 0.2s'
        },
        textarea: {
            width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem',
            background: colors.bg, border: `1px solid ${colors.border}`,
            color: colors.text, fontSize: '0.875rem', outline: 'none', minHeight: '80px', resize: 'vertical'
        },
        itemCard: {
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0.75rem 1rem', background: colors.surface, borderRadius: '0.75rem',
            border: `1px solid ${colors.border}`, marginBottom: '0.5rem'
        },
        footer: {
            padding: '1.25rem 1.5rem', borderTop: `1px solid ${colors.border}`,
            display: 'flex', justifyContent: 'flex-end', gap: '1rem', background: colors.surface
        },
        button: (primary) => ({
            padding: '0.75rem 1.5rem', borderRadius: '0.75rem',
            background: primary ? colors.primary : 'transparent',
            color: primary ? 'white' : colors.text,
            border: primary ? 'none' : `1px solid ${colors.border}`,
            fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            transition: 'all 0.2s'
        }),
        addButton: {
            padding: '0.75rem', borderRadius: '0.75rem',
            background: colors.primary + '20', color: colors.primary,
            border: `1px dashed ${colors.primary}`, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: '42px', marginTop: '1.6rem'
        }
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ padding: '0.5rem', borderRadius: '0.75rem', background: colors.primary + '20', color: colors.primary }}>
                            <ShoppingCart size={20} />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                            {order ? 'Edit Order' : 'Add New Order'}
                        </h3>
                    </div>
                    <button onClick={onCancel} style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} style={styles.form}>
                    {/* Products Selection Section */}
                    <div style={styles.section}>
                        <div style={styles.sectionTitle}>
                            <ShoppingCart size={16} /> PRODUCTS
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 50px', gap: '0.75rem' }}>
                            <div>
                                <label style={styles.label}>Select Product</label>
                                <select
                                    style={styles.input}
                                    value={currentItem.product}
                                    onChange={(e) => setCurrentItem({ ...currentItem, product: e.target.value })}
                                >
                                    <option value="">Choose a product...</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.sku}) - ${p.price}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={styles.label}>Qty</label>
                                <input
                                    type="number"
                                    style={styles.input}
                                    value={currentItem.quantity}
                                    onChange={(e) => setCurrentItem({ ...currentItem, quantity: parseInt(e.target.value) })}
                                    min="1"
                                />
                            </div>
                            <button type="button" onClick={handleAddItem} style={styles.addButton} title="Add to Order">
                                <Plus size={20} />
                            </button>
                        </div>

                        {/* Selected Items List */}
                        <div style={{ marginTop: '0.5rem' }}>
                            {formData.items.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '1.5rem', color: colors.textMuted, fontSize: '0.875rem', border: `1px dashed ${colors.border}`, borderRadius: '0.75rem' }}>
                                    No products added yet. Add at least one product above.
                                </div>
                            ) : (
                                formData.items.map((item, index) => (
                                    <div key={index} style={styles.itemCard}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{item.product_name}</span>
                                            <span style={{ fontSize: '0.75rem', color: colors.textMuted }}>{item.product_sku}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                            <div style={{ fontWeight: 800, color: colors.primary }}>
                                                x{item.quantity}
                                            </div>
                                            <button 
                                                type="button" 
                                                onClick={() => handleRemoveItem(index)}
                                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Customer Details Section */}
                    <div style={styles.section}>
                        <div style={styles.sectionTitle}>
                            <X size={16} style={{ visibility: 'hidden', width: 0 }} /> CONTACT INFORMATION
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
                    </div>

                    <div style={styles.fieldGroup}>
                        <div style={styles.section}>
                            <label style={styles.label}>Order Priority</label>
                            <select
                                style={styles.input}
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                            >
                                <option value="NORMAL">Normal</option>
                                <option value="HIGH">High Priority</option>
                            </select>
                        </div>
                        <div style={styles.section}>
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
                    <button type="submit" onClick={handleSubmit} style={styles.button(true)} disabled={loading || formData.items.length === 0}>
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                        {order ? 'Update Order' : 'Create Order'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderForm;
