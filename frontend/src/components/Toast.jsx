import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose, duration = 3000, colors }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger entrance animation shortly after mount
        const timer = setTimeout(() => setIsVisible(true), 10);

        // Auto-close after duration
        const closeTimer = setTimeout(() => {
            handleClose();
        }, duration);

        return () => {
            clearTimeout(timer);
            clearTimeout(closeTimer);
        };
    }, [duration]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for exit animation before unmounting
    };

    const isSuccess = type === 'success';

    const styles = {
        container: {
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem 1.25rem',
            backgroundColor: colors ? colors.surface : '#fff',
            border: `1px solid ${colors ? colors.border : '#eef2f6'}`,
            borderRadius: '0.75rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            zIndex: 9999,
            transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
            opacity: isVisible ? 1 : 0,
            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        },
        icon: {
            flexShrink: 0,
            color: isSuccess ? '#10b981' : '#ef4444', // Green or Red
        },
        text: {
            color: colors ? colors.text : '#1f2937',
            fontSize: '0.875rem',
            fontWeight: 500,
            margin: 0,
        },
        closeButton: {
            background: 'none',
            border: 'none',
            color: colors ? colors.textMuted : '#9ca3af',
            cursor: 'pointer',
            padding: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: '0.5rem',
            transition: 'color 0.2s',
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.icon}>
                {isSuccess ? <CheckCircle size={20} /> : <XCircle size={20} />}
            </div>
            <p style={styles.text}>{message}</p>
            <button
                onClick={handleClose}
                style={styles.closeButton}
                onMouseOver={(e) => e.currentTarget.style.color = colors ? colors.text : '#4b5563'}
                onMouseOut={(e) => e.currentTarget.style.color = colors ? colors.textMuted : '#9ca3af'}
            >
                <X size={16} />
            </button>
        </div>
    );
};

export default Toast;
