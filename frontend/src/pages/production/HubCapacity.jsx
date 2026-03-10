// Placeholder for HubCapacity
import React from 'react';

const HubCapacity = ({ colors }) => {
    return (
        <div style={{ padding: '2rem', background: colors.cardBg, borderRadius: '1rem', border: `1px solid ${colors.border}` }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Hub Capacity</h2>
            <p style={{ color: colors.textMuted }}>View and optimize manufacturing hub capacity.</p>
        </div>
    );
};

export default HubCapacity;
