import React, { useState } from 'react';
import { X, Clock, MapPin, Package, User, History, Send, Loader2 } from 'lucide-react';

const OrderDetails = ({ order, colors, darkMode, onClose, onUpdateStatus }) => {
    const [newStatus, setNewStatus] = useState(order.status);
    const [notes, setNotes] = useState('');
    const [updating, setUpdating] = useState(false);

    const handleUpdate = async () => {
        setUpdating(true);
        await onUpdateStatus(newStatus, notes);
        setUpdating(false);
        setNotes('');
    };

    const statusOptions = [
        'ORDERED', 'ASSIGNED', 'IN_PRODUCTION', 'QUALITY_CHECK', 'COMPLETED', 'DELAYED', 'CANCELLED'
    ];

    const styles = {
        overlay: {
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            padding: '1rem'
        },
        modal: {
            background: colors.surface, borderRadius: '1.5rem',
            width: '100%', maxWidth: '800px', border: `1px solid ${colors.border}`,
            overflow: 'hidden', display: 'flex', flexDirection: 'column',
            maxHeight: '90vh'
        },
        header: {
            padding: '1.5rem 2rem', borderBottom: `1px solid ${colors.border}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: `${colors.primary}05`
        },
        content: { padding: '2rem', overflowY: 'auto', display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' },
        sectionTitle: { fontSize: '0.75rem', fontWeight: 800, color: colors.textMuted, textTransform: 'uppercase', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' },
        infoCard: { background: colors.bg, padding: '1.25rem', borderRadius: '1rem', border: `1px solid ${colors.border}`, marginBottom: '1.5rem' },
        infoItem: { marginBottom: '1rem' },
        label: { fontSize: '0.7rem', color: colors.textMuted, marginBottom: '0.2rem' },
        value: { fontWeight: 600, fontSize: '0.9rem' },
        timeline: { display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative', paddingLeft: '1.5rem' },
        timelineLine: { position: 'absolute', left: '6px', top: '5px', bottom: '5px', width: '2px', background: colors.border },
        timelineItem: { position: 'relative' },
        timelineDot: { position: 'absolute', left: '-1.5rem', top: '4px', width: '14px', height: '14px', borderRadius: '50%', background: colors.primary, border: `3px solid ${colors.surface}`, zIndex: 2 },
        timelineTime: { fontSize: '0.7rem', color: colors.textMuted },
        updateSection: { marginTop: '1.5rem', padding: '1.5rem', borderTop: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', gap: '1rem' },
        select: { width: '100%', padding: '0.75rem', borderRadius: '0.75rem', background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text, outline: 'none' },
        textarea: { width: '100%', padding: '0.75rem', borderRadius: '0.75rem', background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text, outline: 'none', minHeight: '60px' }
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.header}>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: colors.primary, fontWeight: 800 }}>ORDER DETAILS</div>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>{order.order_id}</h2>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={styles.content}>
                    <div>
                        <div style={styles.sectionTitle}><Package size={14} /> Product & Manufacturing</div>
                        <div style={styles.infoCard}>
                            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: `${colors.primary}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Package color={colors.primary} size={32} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{order.product_details?.name}</div>
                                    <div style={{ color: colors.textMuted, fontSize: '0.8rem' }}>SKU: {order.sku}</div>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
                                <div><div style={styles.label}>Quantity</div><div style={styles.value}>{order.quantity} Units</div></div>
                                <div><div style={styles.label}>Priority</div><div style={{ ...styles.value, color: order.priority === 'HIGH' ? '#ef4444' : 'inherit' }}>{order.priority}</div></div>
                                <div><div style={styles.label}>Assigned Hub</div><div style={styles.value}>{order.hub_details?.name || 'Unassigned'}</div></div>
                                <div><div style={styles.label}>Delivery Date</div><div style={styles.value}>{new Date(order.expected_delivery_date).toLocaleDateString()}</div></div>
                            </div>
                        </div>

                        <div style={styles.sectionTitle}><User size={14} /> Customer Information</div>
                        <div style={styles.infoCard}>
                            <div style={styles.infoItem}><div style={styles.label}>Name</div><div style={styles.value}>{order.customer_name}</div></div>
                            <div style={styles.infoItem}><div style={styles.label}>Email</div><div style={styles.value}>{order.customer_email || 'N/A'}</div></div>
                            <div style={styles.infoItem}><div style={styles.label}>Phone</div><div style={styles.value}>{order.customer_phone}</div></div>
                            <div style={styles.infoItem}><div style={styles.label}>Shipping Address</div><div style={{ ...styles.value, fontWeight: 400 }}>{order.shipping_address}</div></div>
                        </div>
                    </div>

                    <div>
                        <div style={styles.sectionTitle}><History size={14} /> Order Timeline</div>
                        <div style={styles.timeline}>
                            <div style={styles.timelineLine} />
                            {(order.status_history || []).map((history, idx) => (
                                <div key={idx} style={styles.timelineItem}>
                                    <div style={styles.timelineDot} />
                                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{history.status.replace('_', ' ')}</div>
                                    <div style={styles.timelineTime}>{new Date(history.created_at).toLocaleString()}</div>
                                    {history.notes && <div style={{ fontSize: '0.8rem', marginTop: '0.2rem', color: colors.textMuted }}>{history.notes}</div>}
                                </div>
                            ))}
                        </div>

                        <div style={styles.updateSection}>
                            <div style={styles.sectionTitle}><Send size={14} /> Update status</div>
                            <select style={styles.select} value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                                {statusOptions.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                            </select>
                            <textarea
                                style={styles.textarea}
                                placeholder="Add notes for this update..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                            <button
                                style={{
                                    padding: '0.75rem', borderRadius: '0.75rem', background: colors.primary,
                                    color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                                }}
                                onClick={handleUpdate}
                                disabled={updating}
                            >
                                {updating ? <Loader2 size={18} className="animate-spin" /> : 'Update Order Status'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetails;
