import React, { useState, useEffect } from 'react';
import {
    X, Plus, Save, Trash2, Package, Clock,
    Settings, CheckCircle, Ban, Loader2, Search,
    BarChart3, Zap
} from 'lucide-react';
import { hubService, productService } from '../../services/api';

const SKUMappingModal = ({ hub, onCancel, colors, darkMode }) => {
    const [mappings, setMappings] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newMapping, setNewMapping] = useState({
        product: '',
        max_daily_production: 20,
        lead_time_hours: 48,
        priority: 1,
        is_enabled: true
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, [hub.id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [mappingsRes, productsRes] = await Promise.all([
                hubService.getMappings(hub.id),
                productService.getProducts()
            ]);
            setMappings(mappingsRes.data);
            setProducts(productsRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddMapping = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await hubService.createMapping({
                hub: hub.id,
                product: newMapping.product,
                max_daily_production: newMapping.max_daily_production,
                lead_time_hours: newMapping.lead_time_hours,
                priority: newMapping.priority,
                is_enabled: newMapping.is_enabled
            });
            setIsAdding(false);
            setNewMapping({
                product: '',
                max_daily_production: 20,
                lead_time_hours: 48,
                priority: 1,
                is_enabled: true
            });
            fetchData();
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleEnabled = async (mapping) => {
        try {
            await hubService.updateMapping(mapping.id, { is_enabled: !mapping.is_enabled });
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const styles = {
        overlay: {
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)', zIndex: 1100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)'
        },
        container: {
            background: colors.surface, borderRadius: '1.25rem',
            width: '100%', maxWidth: '800px', maxHeight: '85vh',
            border: `1px solid ${colors.border}`,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden'
        },
        header: {
            padding: '1.5rem 2rem', borderBottom: `1px solid ${colors.border}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        },
        content: {
            padding: '1.5rem 2rem', overflowY: 'auto', flex: 1,
            display: 'flex', flexDirection: 'column', gap: '1.5rem'
        },
        footer: {
            padding: '1.25rem 2rem', borderTop: `1px solid ${colors.border}`,
            display: 'flex', justifyContent: 'flex-end'
        },
        mappingItem: {
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '1.25rem', background: colors.bg, borderRadius: '0.75rem',
            border: `1px solid ${colors.border}`
        },
        input: {
            background: colors.surface, border: `1px solid ${colors.border}`,
            color: colors.text, fontSize: '0.875rem', padding: '0.6rem',
            borderRadius: '0.5rem', outline: 'none', width: '100%'
        },
        addForm: {
            display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
            gap: '1rem', alignItems: 'flex-end', padding: '1.5rem',
            background: `${colors.primary}05`, borderRadius: '1rem',
            border: `1px dashed ${colors.primary}50`
        }
    };

    const availableProducts = products.filter(p => !mappings.some(m => m.product === p.id));

    return (
        <div style={styles.overlay}>
            <div style={styles.container}>
                <header style={styles.header}>
                    <div>
                        <h2 style={{ margin: 0, color: colors.text }}>SKU Mapping</h2>
                        <div style={{ fontSize: '0.875rem', color: colors.textMuted }}>Configuring supported products for <strong>{hub.name}</strong></div>
                    </div>
                    <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted }}>
                        <X size={24} />
                    </button>
                </header>

                <div style={styles.content}>
                    {!isAdding ? (
                        <button
                            onClick={() => setIsAdding(true)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                color: colors.primary, fontWeight: 700, background: 'none',
                                border: 'none', cursor: 'pointer', fontSize: '0.875rem'
                            }}
                        >
                            <Plus size={18} /> Add New SKU Capability
                        </button>
                    ) : (
                        <form onSubmit={handleAddMapping} style={styles.addForm}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: colors.textMuted }}>Product</label>
                                <select
                                    required style={styles.input}
                                    value={newMapping.product}
                                    onChange={e => setNewMapping({ ...newMapping, product: e.target.value })}
                                >
                                    <option value="">Select Product...</option>
                                    {availableProducts.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: colors.textMuted }}>Capacity/Day</label>
                                <input
                                    type="number" required style={styles.input}
                                    value={newMapping.max_daily_production}
                                    onChange={e => setNewMapping({ ...newMapping, max_daily_production: parseInt(e.target.value) })}
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: colors.textMuted }}>Lead Time (h)</label>
                                <input
                                    type="number" required style={styles.input}
                                    value={newMapping.lead_time_hours}
                                    onChange={e => setNewMapping({ ...newMapping, lead_time_hours: parseInt(e.target.value) })}
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: colors.textMuted }}>Priority</label>
                                <input
                                    type="number" min="1" max="10" required style={styles.input}
                                    value={newMapping.priority}
                                    onChange={e => setNewMapping({ ...newMapping, priority: parseInt(e.target.value) })}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button type="submit" disabled={isSubmitting} style={{ background: colors.primary, color: 'white', border: 'none', padding: '0.6rem', borderRadius: '0.5rem', cursor: 'pointer' }}>
                                    <Save size={18} />
                                </button>
                                <button type="button" onClick={() => setIsAdding(false)} style={{ background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, padding: '0.6rem', borderRadius: '0.5rem', cursor: 'pointer' }}>
                                    <X size={18} />
                                </button>
                            </div>
                        </form>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '2rem' }}>
                                <Loader2 size={24} className="animate-spin" color={colors.primary} />
                            </div>
                        ) : mappings.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem', color: colors.textMuted, border: `1px dashed ${colors.border}`, borderRadius: '1rem' }}>
                                <Package size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                                <div>No products mapped yet. Add one to enable production capabilities.</div>
                            </div>
                        ) : mappings.map(m => (
                            <div key={m.id} style={styles.mappingItem}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flex: 1 }}>
                                    <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: `${colors.primary}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.primary }}>
                                        <Package size={22} />
                                    </div>
                                    <div style={{ minWidth: '180px' }}>
                                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>{m.product_name}</div>
                                        <div style={{ fontSize: '0.75rem', color: colors.textMuted, fontWeight: 600 }}>SKU: {m.sku_code}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '0.7rem', color: colors.textMuted, fontWeight: 700, textTransform: 'uppercase' }}>Daily Capacity</div>
                                            <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'flex-end', color: colors.text }}>
                                                <BarChart3 size={14} className="text-secondary" /> {m.max_daily_production} units
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '0.7rem', color: colors.textMuted, fontWeight: 700, textTransform: 'uppercase' }}>Lead Time</div>
                                            <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'flex-end', color: colors.text }}>
                                                <Clock size={14} /> {m.lead_time_hours}h
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '0.7rem', color: colors.textMuted, fontWeight: 700, textTransform: 'uppercase' }}>Priority</div>
                                            <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'flex-end', color: colors.primary }}>
                                                <Zap size={14} /> Level {m.priority}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleToggleEnabled(m)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: m.is_enabled ? '#10b981' : colors.textMuted, padding: '0.5rem' }}
                                        title={m.is_enabled ? 'Disable' : 'Enable'}
                                    >
                                        {m.is_enabled ? <CheckCircle size={22} /> : <Ban size={22} />}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <footer style={styles.footer}>
                    <button onClick={onCancel} style={{ padding: '0.8rem 2rem', borderRadius: '0.75rem', background: colors.primary, color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                        Done
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default SKUMappingModal;
