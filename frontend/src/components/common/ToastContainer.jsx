import React from 'react';
import { useToast } from '../../context/ToastContext';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContainer = () => {
    const { toasts, removeToast } = useToast();

    if (toasts.length === 0) return null;

    return (
        <div style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            pointerEvents: 'none'
        }}>
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    style={{
                        minWidth: '300px',
                        maxWidth: '450px',
                        background: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        padding: '16px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        pointerEvents: 'auto',
                        animation: 'slideIn 0.3s ease-out',
                    }}
                >
                    <div style={{ marginTop: '2px' }}>
                        {toast.type === 'success' && <CheckCircle size={20} color="#10b981" />}
                        {toast.type === 'error' && <AlertCircle size={20} color="#ef4444" />}
                        {toast.type === 'info' && <Info size={20} color="#3b82f6" />}
                    </div>
                    
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
                            {toast.type.charAt(0).toUpperCase() + toast.type.slice(1)}
                        </div>
                        <div style={{ fontSize: '14px', color: '#4b5563', lineHeight: 1.5 }}>
                            {toast.message}
                        </div>
                    </div>

                    <button
                        onClick={() => removeToast(toast.id)}
                        style={{
                            background: 'none',
                            border: 'none',
                            padding: '4px',
                            cursor: 'pointer',
                            color: '#9ca3af',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '4px',
                            transition: 'background 0.2s'
                        }}
                    >
                        <X size={16} />
                    </button>
                    
                    <style>{`
                        @keyframes slideIn {
                            from { transform: translateX(100%); opacity: 0; }
                            to { transform: translateX(0); opacity: 1; }
                        }
                    `}</style>
                </div>
            ))}
        </div>
    );
};

export default ToastContainer;
