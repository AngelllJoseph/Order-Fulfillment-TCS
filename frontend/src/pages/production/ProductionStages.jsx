import React, { useState } from 'react';
import {
    ArrowLeft,
    CheckCircle,
    Circle,
    Settings,
    ShieldCheck,
    PackageCheck,
    Factory,
    Clock,
    Tag,
    AlertCircle,
    ArrowRight,
    Truck,
    Check,
    AlertTriangle,
    X,
    FileText,
    History
} from 'lucide-react';
import { opsOrderService } from '../../services/orders';

const ProductionStages = ({ colors, darkMode, activeOrder, onBack }) => {
    const [loading, setLoading] = useState(false);
    const [currentOrder, setCurrentOrder] = useState(activeOrder);
    const [notes, setNotes] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    
    // Delay reporting modal state
    const [showDelayModal, setShowDelayModal] = useState(false);
    const [delayReason, setDelayReason] = useState('Material shortage');
    const [delayNotes, setDelayNotes] = useState('');

    const STAGES = [
        { id: 'ASSIGNED', label: 'Assigned', icon: Factory },
        { id: 'MANUFACTURING', label: 'Manufacturing', icon: Settings },
        { id: 'QUALITY_TEST', label: 'Quality Test', icon: ShieldCheck },
        { id: 'COMPLETED_MANUFACTURING', label: 'Completed', icon: PackageCheck },
        { id: 'DESPATCHED_TO_WAREHOUSE', label: 'Warehouse', icon: Factory },
        { id: 'DESPATCHED_TO_CUSTOMER', label: 'Customer', icon: Truck },
        { id: 'COMPLETED', label: 'Closed', icon: CheckCircle }
    ];

    const DELAY_REASONS = [
        'Material shortage',
        'Machine issue',
        'Workforce delay',
        'Quality failure',
        'Other'
    ];

    if (!currentOrder) {
        return (
            <div style={{ padding: '4rem 2rem', textAlign: 'center', background: colors.cardBg, borderRadius: '1rem', border: `1px solid ${colors.border}` }}>
                <div style={{ display: 'inline-flex', padding: '1.5rem', background: colors.surface, borderRadius: '50%', marginBottom: '1rem' }}>
                    <Factory size={48} color={colors.textMuted} />
                </div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: colors.text }}>No Order Selected</h2>
                <p style={{ color: colors.textMuted, marginBottom: '2rem' }}>Please select an order from the Assigned Orders tab to start production.</p>
                <button onClick={onBack} style={{ padding: '0.75rem 1.5rem', borderRadius: '0.75rem', background: colors.primary, color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
                    View Assigned Orders
                </button>
            </div>
        );
    }

    const currentStageIndex = STAGES.findIndex(s => s.id === currentOrder.status);
    const isErrorState = currentOrder.status === 'CANCELLED' || currentOrder.status === 'DELAYED';

    const handleUpdateStatus = async (newStatus, extraData = {}) => {
        try {
            setLoading(true);
            const payload = { status: newStatus, notes, ...extraData };
            const response = await opsOrderService.updateStatus(currentOrder.id, newStatus, payload.notes, extraData);
            setCurrentOrder(response.data);
            setNotes('');
            setSuccessMessage(`Order moved to ${newStatus.replace(/_/g, ' ')}`);
            setTimeout(() => setSuccessMessage(''), 3000);
            if (newStatus === 'DELAYED') setShowDelayModal(false);
        } catch (error) {
            console.error("Failed to update status", error);
            alert("Failed to update status. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleReportDelay = () => {
        const fullNotes = `Reason: ${delayReason}. ${delayNotes}`;
        handleUpdateStatus('DELAYED', { delay_reason: delayReason, notes: fullNotes });
    };

    const styles = {
        container: { display: 'flex', flexDirection: 'column', gap: '1.5rem', fontFamily: "'Inter', sans-serif", position: 'relative' },
        header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: `1px solid ${colors.border}` },
        backBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', background: colors.surface, border: `1px solid ${colors.border}`, color: colors.text, cursor: 'pointer', transition: 'background 0.2s' },
        card: { background: colors.cardBg, borderRadius: '1.25rem', border: `1px solid ${colors.border}`, padding: '1.5rem' },
        stepper: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative', marginTop: '1rem', marginBottom: '2rem', padding: '0 1rem', overflowX: 'auto' },
        stepLine: { position: 'absolute', top: '24px', left: '5%', right: '5%', height: '4px', background: colors.border, zIndex: 0, borderRadius: '2px' },
        stepLineProgress: { position: 'absolute', top: '24px', left: '5%', height: '4px', background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`, zIndex: 1, borderRadius: '2px', transition: 'width 0.5s ease-in-out' },
        step: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', zIndex: 2, position: 'relative', width: '80px', flexShrink: 0 },
        stepIcon: (isCompleted, isCurrent) => ({
            width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: isCompleted ? colors.primary : (isCurrent ? colors.surface : colors.bg),
            border: `2px solid ${isCompleted || isCurrent ? colors.primary : colors.border}`,
            color: isCompleted ? '#fff' : (isCurrent ? colors.primary : colors.textMuted),
            boxShadow: isCurrent ? `0 0 0 4px ${colors.primary}33` : 'none',
            transition: 'all 0.3s ease'
        }),
        actionBtn: (isActive, variant = 'primary') => {
            const bg = variant === 'primary' ? colors.primary : (variant === 'danger' ? '#ef4444' : (variant === 'success' ? '#10b981' : colors.surface));
            const color = (variant === 'outline') ? colors.text : '#fff';
            return {
                padding: '0.875rem 1.25rem', borderRadius: '0.75rem', border: variant === 'outline' ? `1px solid ${colors.border}` : 'none',
                background: isActive ? bg : colors.surface, color: isActive ? color : colors.textMuted,
                fontWeight: 600, fontSize: '0.875rem', cursor: isActive ? 'pointer' : 'not-allowed', opacity: isActive ? 1 : 0.6,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flex: 1, transition: 'all 0.2s'
            };
        },
        modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '1rem' },
        modal: { background: colors.surface, padding: '2rem', borderRadius: '1.25rem', width: '400px', border: `1px solid ${colors.border}`, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }
    };

    const progressWidth = currentStageIndex >= 0 ? `${(currentStageIndex / (STAGES.length - 1)) * 90}%` : '0%';

    return (
        <div style={styles.container}>
            {/* Delay Modal */}
            {showDelayModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modal}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlertTriangle size={20} /> Report Delay</h3>
                            <button onClick={() => setShowDelayModal(false)} style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: colors.textMuted }}>Delay Reason</label>
                            <select value={delayReason} onChange={(e) => setDelayReason(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text, outline: 'none' }}>
                                {DELAY_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: colors.textMuted }}>Comments</label>
                            <textarea value={delayNotes} onChange={(e) => setDelayNotes(e.target.value)} placeholder="Provide additional details..." style={{ width: '100%', minHeight: '80px', padding: '0.75rem', borderRadius: '0.5rem', background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text, outline: 'none', resize: 'vertical' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button onClick={() => setShowDelayModal(false)} style={styles.actionBtn(true, 'outline')}>Cancel</button>
                            <button onClick={handleReportDelay} disabled={loading} style={styles.actionBtn(!loading, 'danger')}>{loading ? 'Reporting...' : 'Confirm Delay'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div style={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button style={styles.backBtn} onClick={onBack}><ArrowLeft size={20} /></button>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', margin: 0, fontWeight: 700 }}>Production Execution: {currentOrder.order_id}</h2>
                        <p style={{ color: colors.textMuted, margin: 0, fontSize: '0.9rem', marginTop: '0.25rem' }}>Manage stages, record progress, and report issues.</p>
                    </div>
                </div>
                {!isErrorState && currentOrder.status !== 'COMPLETED' && (
                    <button onClick={() => setShowDelayModal(true)} style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', background: '#ef444415', color: '#ef4444', border: '1px solid #ef444455', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <AlertTriangle size={16} /> Report Delay
                    </button>
                )}
            </div>

            {successMessage && (
                <div style={{ padding: '1rem', background: '#10b98122', color: '#10b981', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                    <CheckCircle size={20} /> {successMessage}
                </div>
            )}

            {/* Top Stepper */}
            <div style={{ ...styles.card, padding: '2rem 1.5rem 1rem 1.5rem' }}>
                <div style={styles.stepper}>
                    <div style={styles.stepLine} />
                    <div style={{ ...styles.stepLineProgress, width: progressWidth }} />
                    {STAGES.map((stage, index) => {
                        const isCompleted = index < currentStageIndex || currentOrder.status === 'COMPLETED';
                        const isCurrent = index === currentStageIndex && currentOrder.status !== 'COMPLETED';
                        return (
                            <div key={stage.id} style={styles.step}>
                                <div style={styles.stepIcon(isCompleted, isCurrent)}>
                                    {isCompleted ? <Check size={24} /> : <stage.icon size={20} />}
                                </div>
                                <div style={{ textAlign: 'center', fontWeight: isCurrent ? 700 : 500, color: isCurrent || isCompleted ? colors.text : colors.textMuted, fontSize: '0.75rem', marginTop: '0.5rem', lineHeight: 1.2 }}>
                                    {stage.label}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '1.5rem' }}>
                {/* Left Column - Stage Action Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ ...styles.card, flex: 1 }}>
                        <h3 style={{ fontSize: '1.125rem', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Settings size={20} color={colors.primary} /> Stage Actions</h3>

                        {isErrorState && (
                            <div style={{ padding: '1.5rem', background: '#ef444415', border: '1px solid #ef444455', borderRadius: '0.75rem', display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                                <AlertCircle size={24} color="#ef4444" style={{ flexShrink: 0 }} />
                                <div>
                                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#ef4444' }}>Order Exception: {currentOrder.status}</h4>
                                    <p style={{ margin: 0, color: colors.textMuted, fontSize: '0.9rem' }}>
                                        {currentOrder.delay_reason ? `Reason: ${currentOrder.delay_reason}` : 'Normal workflow is suspended.'}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div style={{ padding: '1.5rem', background: colors.surface, borderRadius: '0.75rem', border: `1px solid ${colors.border}` }}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: colors.text }}>
                                    <FileText size={16} color={colors.textMuted} /> Production Notes
                                </label>
                                <textarea
                                    placeholder="Add notes e.g., machine ready, QA issue detected..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    style={{ width: '100%', minHeight: '100px', padding: '1rem', borderRadius: '0.75rem', background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                {currentOrder.status === 'ASSIGNED' && (
                                    <button style={styles.actionBtn(!loading)} onClick={() => handleUpdateStatus('MANUFACTURING')} disabled={loading}>
                                        {loading ? 'Updating...' : 'Start Manufacturing'} <ArrowRight size={18} />
                                    </button>
                                )}
                                {currentOrder.status === 'MANUFACTURING' && (
                                    <button style={styles.actionBtn(!loading)} onClick={() => handleUpdateStatus('QUALITY_TEST')} disabled={loading}>
                                        {loading ? 'Updating...' : 'Send to Quality Test'} <ArrowRight size={18} />
                                    </button>
                                )}
                                {currentOrder.status === 'QUALITY_TEST' && (
                                    <>
                                        <button style={styles.actionBtn(!loading, 'outline')} onClick={() => handleUpdateStatus('MANUFACTURING')} disabled={loading}>
                                            <ArrowLeft size={18} /> Send Back to Manufacturing
                                        </button>
                                        <button style={styles.actionBtn(!loading, 'success')} onClick={() => handleUpdateStatus('COMPLETED_MANUFACTURING')} disabled={loading}>
                                            Approve Quality <CheckCircle size={18} />
                                        </button>
                                    </>
                                )}
                                {currentOrder.status === 'COMPLETED_MANUFACTURING' && (
                                    <button style={styles.actionBtn(!loading)} onClick={() => handleUpdateStatus('DESPATCHED_TO_WAREHOUSE')} disabled={loading}>
                                        {loading ? 'Updating...' : 'Dispatch to Warehouse'} <ArrowRight size={18} />
                                    </button>
                                )}
                                {currentOrder.status === 'DESPATCHED_TO_WAREHOUSE' && (
                                    <button style={styles.actionBtn(!loading)} onClick={() => handleUpdateStatus('DESPATCHED_TO_CUSTOMER')} disabled={loading}>
                                        {loading ? 'Updating...' : 'Dispatch to Customer'} <ArrowRight size={18} />
                                    </button>
                                )}
                                {currentOrder.status === 'DESPATCHED_TO_CUSTOMER' && (
                                    <button style={styles.actionBtn(!loading, 'success')} onClick={() => handleUpdateStatus('COMPLETED')} disabled={loading}>
                                        {loading ? 'Updating...' : 'Mark Order Closed'} <CheckCircle size={18} />
                                    </button>
                                )}
                                {currentOrder.status === 'COMPLETED' && (
                                    <div style={{ padding: '1rem', width: '100%', textAlign: 'center', color: '#10b981', fontWeight: 600, background: '#10b98115', borderRadius: '0.75rem' }}>
                                        Order Production and Dispatch Completed Successfully
                                    </div>
                                )}
                                {isErrorState && (
                                    <button style={styles.actionBtn(!loading, 'outline')} onClick={() => handleUpdateStatus('ASSIGNED')} disabled={loading}>
                                        <ArrowLeft size={18} /> Reset to Assigned
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div style={styles.card}>
                        <h3 style={{ fontSize: '1.125rem', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><History size={20} color={colors.primary} /> Production Timeline</h3>
                        <div style={{ position: 'relative', paddingLeft: '1.5rem' }}>
                            <div style={{ position: 'absolute', top: 0, bottom: 0, left: '6px', width: '2px', background: colors.border }} />
                            
                            {[{ label: 'Assigned', time: currentOrder.created_at },
                              { label: 'Manufacturing Started', time: currentOrder.manufacturing_started_at },
                              { label: 'QA Started', time: currentOrder.qa_started_at },
                              { label: 'Manufacturing Completed', time: currentOrder.completed_manufacturing_at },
                              { label: 'Despatched to Warehouse', time: currentOrder.warehouse_despatched_at },
                              { label: 'Despatched to Customer', time: currentOrder.customer_despatched_at },
                              { label: 'Order Closed', time: currentOrder.completed_at }
                            ].map((event, i) => (
                                <div key={i} style={{ position: 'relative', marginBottom: '1.5rem' }}>
                                    <div style={{ position: 'absolute', left: '-1.5rem', top: '4px', width: '14px', height: '14px', borderRadius: '50%', background: event.time ? colors.primary : colors.surface, border: `2px solid ${event.time ? colors.primary : colors.border}`, zIndex: 1 }} />
                                    <div style={{ fontWeight: 600, color: event.time ? colors.text : colors.textMuted, fontSize: '0.9rem' }}>{event.label}</div>
                                    <div style={{ fontSize: '0.8rem', color: colors.textMuted, marginTop: '0.25rem' }}>
                                        {event.time ? new Date(event.time).toLocaleString() : 'Pending'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column - Order Production Summary */}
                <div style={styles.card}>
                    <h3 style={{ fontSize: '1.125rem', margin: '0 0 1.5rem 0', color: colors.text }}>Order Summary</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Order ID</div>
                            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: colors.primary }}>{currentOrder.order_id}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Product Name</div>
                            <div style={{ fontWeight: 600, fontSize: '1rem' }}>{currentOrder.product_details?.name || 'Unknown Product'}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>SKU</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                <Tag size={14} color={colors.textMuted} /> {currentOrder.sku}
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Quantity</div>
                                <div style={{ fontWeight: 700, fontSize: '1.25rem' }}>{currentOrder.quantity}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Priority</div>
                                <div style={{ fontWeight: 600, color: currentOrder.priority === 'HIGH' ? '#ef4444' : colors.text, fontSize: '1rem' }}>{currentOrder.priority}</div>
                            </div>
                        </div>
                        <hr style={{ border: 'none', borderTop: `1px solid ${colors.border}`, margin: '0.5rem 0' }} />
                        <div>
                            <div style={{ fontSize: '0.75rem', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Expected Delivery</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                <Clock size={16} color={colors.textMuted} /> {currentOrder.expected_delivery_date}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Manufacturing Hub</div>
                            <div style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Factory size={16} color={colors.textMuted} /> {currentOrder.hub_details?.name || 'Assigned'}
                            </div>
                        </div>
                        <div style={{ padding: '0.75rem', background: colors.surface, borderRadius: '0.5rem', border: `1px solid ${colors.border}`, marginTop: '0.5rem' }}>
                            <div style={{ fontSize: '0.75rem', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Current Stage</div>
                            <div style={{ fontWeight: 700, color: colors.primary }}>{currentOrder.status.replace(/_/g, ' ')}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductionStages;
