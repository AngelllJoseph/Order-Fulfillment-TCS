// Placeholder for PartsStock
import React from 'react';

const PartsStock = ({ colors }) => {
    return (
        <div style={{ padding: '2rem', background: colors.cardBg, borderRadius: '1rem', border: `1px solid ${colors.border}` }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Parts & Stock</h2>
            <p style={{ color: colors.textMuted }}>Track parts availability and stock levels.</p>
        </div>
    );
};

export default PartsStock;
