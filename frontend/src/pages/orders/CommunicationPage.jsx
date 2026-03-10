import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Mail, Search, Clock, User, Send, Loader2, MessageSquare, AlertCircle, FileText, ChevronRight } from 'lucide-react';
import { orderService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const CommunicationPage = ({ colors, darkMode, initialContext }) => {
    const { addToast } = useToast();
    const [emailLogs, setEmailLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Selection state
    const [selectedCustomerEmail, setSelectedCustomerEmail] = useState(initialContext?.customer_email || null);
    
    // Compose state
    const [composeSubject, setComposeSubject] = useState('');
    const [composeMessage, setComposeMessage] = useState('');
    const [sending, setSending] = useState(false);
    
    const messagesEndRef = useRef(null);

    useEffect(() => {
        fetchLogs();
    }, []);
    
    useEffect(() => {
        // Scroll to bottom of messages when selection changes or new logs arrive
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [selectedCustomerEmail, emailLogs]);

    const fetchLogs = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await orderService.getActivityLog();
            const filteredLogs = res.data.filter(log => log.notes && log.notes.includes('Email sent'));
            setEmailLogs(filteredLogs);
            
            // Auto-select first customer if none selected from context
            if (!selectedCustomerEmail && filteredLogs.length > 0 && !initialContext) {
                const firstLogEmail = parseEmailNote(filteredLogs[0].notes).recipient;
                if (firstLogEmail && firstLogEmail !== 'Unknown') {
                    setSelectedCustomerEmail(firstLogEmail);
                }
            }
        } catch (err) {
            console.error('Failed to fetch activity logs:', err);
            setError('Failed to load communication history.');
        } finally {
            setLoading(false);
        }
    };

    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return {
            date: date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
        };
    };

    const parseEmailNote = (note) => {
        if (!note) return { recipient: 'Unknown', subject: 'No Subject' };
        let recipient = 'Unknown';
        let subject = 'No Subject';
        
        const emailMatch = note.match(/\((.*?)\)/);
        if (emailMatch && emailMatch[1]) recipient = emailMatch[1];
        else if (note.includes('customer (')) recipient = note.split('customer (')[1].split(')')[0];
        
        if (note.includes('Subject: ')) subject = note.split('Subject: ')[1];
        return { recipient, subject };
    };

    // Group logs by customer email for the left sidebar
    const customers = useMemo(() => {
        const map = new Map();
        
        // Also ensure initialContext is in the list even if they have no logs yet
        if (initialContext && initialContext.customer_email) {
            map.set(initialContext.customer_email.toLowerCase(), {
                email: initialContext.customer_email,
                name: initialContext.customer_name || 'Unknown',
                logs: [],
                lastContact: new Date(initialContext.created_at || Date.now()),
                latestOrder: initialContext
            });
        }
        
        emailLogs.forEach(log => {
            const { recipient } = parseEmailNote(log.notes);
            if (recipient === 'Unknown') return;
            
            const lowerEmail = recipient.toLowerCase();
            if (!map.has(lowerEmail)) {
                map.set(lowerEmail, {
                    email: recipient,
                    name: log.order?.customer_name || 'Unknown',
                    logs: [],
                    lastContact: new Date(log.created_at),
                    latestOrder: log.order
                });
            }
            map.get(lowerEmail).logs.push(log);
            
            // Update last contact if this log is newer
            const logDate = new Date(log.created_at);
            if (logDate > map.get(lowerEmail).lastContact) {
                map.get(lowerEmail).lastContact = logDate;
                map.get(lowerEmail).latestOrder = log.order; 
            }
        });
        
        // Convert to array and sort by last contact
        return Array.from(map.values())
            .filter(c => 
                c.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
                c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (c.latestOrder?.order_id || '').toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a, b) => b.lastContact - a.lastContact);
    }, [emailLogs, searchTerm, initialContext]);

    const activeCustomerData = useMemo(() => {
        if (!selectedCustomerEmail) return null;
        return customers.find(c => c.email.toLowerCase() === selectedCustomerEmail.toLowerCase());
    }, [selectedCustomerEmail, customers]);
    
    // Auto-fill compose fields when a customer with an active order is selected
    useEffect(() => {
        if (activeCustomerData && activeCustomerData.latestOrder) {
            const order = activeCustomerData.latestOrder;
            const status = order.status;
            
            let defaultSubject = `Update on your Order: ${order.order_id}`;
            let defaultMessage = ``;

            switch(status) {
                case 'ORDERED':
                    defaultSubject = `Order Received: ${order.order_id}`;
                    defaultMessage = `We have successfully received your order for ${order.product?.name || 'the product'}.\n\nOur team is reviewing the details and will begin processing it shortly. We'll notify you as soon as manufacturing begins!`;
                    break;
                case 'ASSIGNED':
                case 'MANUFACTURING':
                    defaultSubject = `Manufacturing Started: ${order.order_id}`;
                    defaultMessage = `Great news! We have routed your order for ${order.product?.name || 'the product'} to our production facility, and manufacturing has begun.\n\nWe are carefully crafting your items and expect to finish production soon.`;
                    break;
                case 'QUALITY_TEST':
                    defaultSubject = `Quality Testing: ${order.order_id}`;
                    defaultMessage = `Your order for ${order.product?.name || 'the product'} has finished manufacturing and is currently undergoing rigorous quality testing.\n\nWe ensure all our products meet the highest standard before shipping.`;
                    break;
                case 'COMPLETED_MANUFACTURING':
                    defaultSubject = `Manufacturing Completed: ${order.order_id}`;
                    defaultMessage = `Your items have passed quality control and are fully manufactured!\n\nWe are now preparing the package for dispatch to our central warehouse.`;
                    break;
                case 'DESPATCHED_TO_WAREHOUSE':
                case 'WAREHOUSE_RECEIVED':
                    defaultSubject = `Processing for Shipment: ${order.order_id}`;
                    defaultMessage = `Your order is currently at our dispatch warehouse undergoing final packaging and labeling.\n\nIt will be handed over to our shipping partner very soon.`;
                    break;
                case 'DESPATCHED_TO_CUSTOMER':
                    defaultSubject = `Your Order has Shipped! ${order.order_id}`;
                    defaultMessage = `Fantastic news! Your order has been dispatched and is on its way to you.\n\nPlease keep an eye out for deliveries at your specified shipping address.`;
                    break;
                case 'COMPLETED':
                    defaultSubject = `Delivery Complete: ${order.order_id}`;
                    defaultMessage = `Your order has been marked as delivered.\n\nThank you for choosing OrderFlow! We hope you love your purchase. If you have any further questions or issues, please don't hesitate to reply to this email.`;
                    break;
                case 'DELAYED':
                    defaultSubject = `Important Update Regarding Your Order: ${order.order_id}`;
                    defaultMessage = `We are writing to inform you that there has been a slight delay with your order due to unforeseen circumstances.\n\nRest assured, our team is working hard to resolve this and we will get your items to you as quickly as possible. We apologize for the inconvenience.`;
                    break;
                default:
                    defaultSubject = `Update on your Order: ${order.order_id}`;
                    defaultMessage = `We are writing to provide a quick update on your order. Please reply if you have any questions!`;
            }

            setComposeSubject(defaultSubject);
            setComposeMessage(defaultMessage);
        }
    }, [activeCustomerData]);

    // Sort logs chronologically for the chat view
    const activeLogs = useMemo(() => {
        if (!activeCustomerData) return [];
        return [...activeCustomerData.logs].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    }, [activeCustomerData]);

    const handleSendEmail = async () => {
        if (!composeSubject || !composeMessage || !activeCustomerData?.latestOrder?.id) return;
        
        setSending(true);
        try {
            await orderService.sendEmailToCustomer(activeCustomerData.latestOrder.id, {
                subject: composeSubject,
                message: composeMessage
            });
            setComposeSubject('');
            setComposeMessage('');
            // Refresh to see new message
            fetchLogs();
            addToast("Email sent successfully!", "success");
        } catch (error) {
            console.error(error);
            addToast("Failed to send email. Please check your SMTP settings.", "error");
        } finally {
            setSending(false);
        }
    };

    return (
        <div style={{ height: 'calc(100vh - 160px)', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ background: `linear-gradient(135deg, ${colors.primary}20, ${colors.secondary}20)`, padding: '0.5rem', borderRadius: '0.5rem' }}>
                            <MessageSquare size={24} color={colors.primary} />
                        </div>
                        Customer Communication
                    </h1>
                    <p style={{ color: colors.textMuted, margin: 0 }}>Manage direct correspondence and historical email logs.</p>
                </div>
            </div>

            {error && (
                <div style={{ padding: '1rem', background: '#ef444415', color: '#ef4444', borderRadius: '0.75rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={20} /><span>{error}</span>
                </div>
            )}

            {/* Split Pane Interface */}
            <div style={{ 
                flex: 1, 
                display: 'flex', 
                background: colors.cardBg, 
                border: `1px solid ${colors.border}`, 
                borderRadius: '1.25rem',
                overflow: 'hidden'
            }}>
                {/* Left Panel: Contacts Sidebar */}
                <div style={{ 
                    width: '350px', 
                    borderRight: `1px solid ${colors.border}`, 
                    display: 'flex', 
                    flexDirection: 'column',
                    background: darkMode ? 'rgba(0,0,0,0.1)' : '#f8fafc' 
                }}>
                    <div style={{ padding: '1.25rem', borderBottom: `1px solid ${colors.border}` }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={16} color={colors.textMuted} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="text"
                                placeholder="Search customers or orders..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%', padding: '0.6rem 1rem 0.6rem 2.5rem',
                                    background: colors.bg, border: `1px solid ${colors.border}`,
                                    borderRadius: '0.75rem', color: colors.text, outline: 'none'
                                }}
                            />
                        </div>
                    </div>
                    
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {loading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                                <Loader2 className="animate-spin" color={colors.primary} size={24} />
                            </div>
                        ) : customers.length === 0 ? (
                            <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: colors.textMuted }}>
                                <User size={32} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                                <p style={{ margin: 0, fontSize: '0.875rem' }}>No communication history found.</p>
                            </div>
                        ) : (
                            customers.map((c) => {
                                const isSelected = selectedCustomerEmail?.toLowerCase() === c.email.toLowerCase();
                                const lastContactDate = formatDateTime(c.lastContact).date;
                                
                                return (
                                    <div 
                                        key={c.email}
                                        onClick={() => setSelectedCustomerEmail(c.email)}
                                        style={{ 
                                            padding: '1.25rem',
                                            borderBottom: `1px solid ${colors.border}`,
                                            cursor: 'pointer',
                                            background: isSelected ? (darkMode ? 'rgba(99, 102, 241, 0.15)' : '#eff6ff') : 'transparent',
                                            borderLeft: isSelected ? `3px solid ${colors.primary}` : '3px solid transparent',
                                            transition: 'background 0.2s',
                                            ':hover': { background: isSelected ? '' : colors.surfaceHover }
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                            <span style={{ fontWeight: 600, fontSize: '0.95rem', color: isSelected ? colors.primary : colors.text }}>
                                                {c.name}
                                            </span>
                                            <span style={{ fontSize: '0.7rem', color: colors.textMuted }}>
                                                {lastContactDate}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: colors.textMuted, marginBottom: '0.4rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {c.email}
                                        </div>
                                        {c.latestOrder && (
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.5rem', background: `${colors.secondary}15`, color: colors.secondary, borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>
                                                <FileText size={10} /> {c.latestOrder.order_id}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Right Panel: Conversation Thread & Compose */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: colors.surface }}>
                    {activeCustomerData ? (
                        <>
                            {/* Thread Header */}
                            <div style={{ padding: '1.25rem 1.5rem', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700 }}>
                                        {activeCustomerData.name.charAt(0) || <User size={20} />}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{activeCustomerData.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: colors.textMuted }}>{activeCustomerData.email}</div>
                                    </div>
                                </div>
                                {activeCustomerData.latestOrder && (
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.75rem', color: colors.textMuted, marginBottom: '0.2rem', textTransform: 'uppercase', fontWeight: 700 }}>Active Order</div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{activeCustomerData.latestOrder.order_id}</div>
                                    </div>
                                )}
                            </div>

                            {/* Thread Body */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {activeLogs.length === 0 ? (
                                    <div style={{ margin: 'auto', textAlign: 'center', color: colors.textMuted, padding: '2rem' }}>
                                        <Mail size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                        <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>No prior emails</h3>
                                        <p style={{ fontSize: '0.9rem', margin: 0 }}>Start the conversation by sending an email below.</p>
                                    </div>
                                ) : (
                                    activeLogs.map(log => {
                                        const { date, time } = formatDateTime(log.created_at);
                                        const { subject } = parseEmailNote(log.notes);
                                        const senderName = log.changed_by?.first_name || 'System Auto';
                                        
                                        return (
                                            <div key={log.id} style={{ display: 'flex', flexDirection: 'column', alignSelf: 'flex-start', maxWidth: '85%' }}>
                                                {/* Meta info */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', paddingLeft: '0.5rem' }}>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: colors.textMuted }}>{senderName}</span>
                                                    <span style={{ fontSize: '0.7rem', color: colors.border }}>•</span>
                                                    <span style={{ fontSize: '0.7rem', color: colors.textMuted }}>{date} at {time}</span>
                                                    {log.order && log.order.id !== activeCustomerData.latestOrder?.id && (
                                                        <span style={{ marginLeft: '1rem', fontSize: '0.7rem', background: `${colors.border}`, padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                                                            Order: {log.order.order_id}
                                                        </span>
                                                    )}
                                                </div>
                                                {/* Email Bubble */}
                                                <div style={{ 
                                                    background: darkMode ? '#1e293b' : '#f1f5f9', 
                                                    border: `1px solid ${colors.border}`,
                                                    borderRadius: '1rem', borderTopLeftRadius: '0.2rem',
                                                    padding: '1rem 1.25rem',
                                                    color: colors.text
                                                }}>
                                                    <div style={{ fontWeight: 700, marginBottom: '0.5rem', color: colors.primary, fontSize: '0.95rem' }}>
                                                        {subject}
                                                    </div>
                                                    <div style={{ fontSize: '0.9rem', lineHeight: 1.5, opacity: 0.9 }}>
                                                        HTML Content dispatched securely via SMTP.
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Composer Footer */}
                            <div style={{ padding: '1.25rem 1.5rem', borderTop: `1px solid ${colors.border}`, background: darkMode ? 'rgba(0,0,0,0.15)' : '#f8fafc' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '1rem', padding: '1rem' }}>
                                    <input 
                                        type="text" 
                                        placeholder="Subject" 
                                        value={composeSubject}
                                        onChange={(e) => setComposeSubject(e.target.value)}
                                        style={{ background: 'none', border: 'none', borderBottom: `1px dashed ${colors.border}`, padding: '0.5rem', color: colors.text, fontWeight: 600, outline: 'none' }}
                                    />
                                    <textarea 
                                        placeholder={`Dear ${activeCustomerData.name},\n\nWrite your message here...`}
                                        value={composeMessage}
                                        onChange={(e) => setComposeMessage(e.target.value)}
                                        style={{ background: 'none', border: 'none', minHeight: '80px', padding: '0.5rem', color: colors.text, outline: 'none', resize: 'vertical' }}
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem' }}>
                                        <span style={{ fontSize: '0.75rem', color: colors.textMuted }}>
                                            Sending regarding: <strong style={{ color: colors.text }}>{activeCustomerData.latestOrder?.order_id || 'Unknown Order'}</strong>
                                        </span>
                                        <button 
                                            onClick={handleSendEmail}
                                            disabled={sending || !composeSubject || !composeMessage || !activeCustomerData?.latestOrder?.id}
                                            style={{
                                                background: colors.primary, color: 'white', border: 'none', borderRadius: '0.75rem',
                                                padding: '0.6rem 1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                cursor: (sending || !composeSubject || !composeMessage || !activeCustomerData?.latestOrder?.id) ? 'not-allowed' : 'pointer',
                                                opacity: (sending || !composeSubject || !composeMessage || !activeCustomerData?.latestOrder?.id) ? 0.6 : 1,
                                                transition: 'opacity 0.2s'
                                            }}
                                        >
                                            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                            Send Email
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: colors.textMuted }}>
                            <MessageSquare size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                            <h3 style={{ margin: '0', fontWeight: 500 }}>No Conversation Selected</h3>
                            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>Select a customer from the left to view history and compose messages.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CommunicationPage;
