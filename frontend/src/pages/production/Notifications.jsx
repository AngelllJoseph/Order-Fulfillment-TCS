// Placeholder for Notifications
import React from 'react';

const Notifications = ({ colors }) => {
    return (
        <div style={{ padding: '2rem', background: colors.cardBg, borderRadius: '1rem', border: `1px solid ${colors.border}` }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Notifications</h2>
            <p style={{ color: colors.textMuted }}>Recent alerts and notifications.</p>
        </div>
    );
};

export default Notifications;
