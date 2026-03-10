// Placeholder for InventoryManagement
import React from 'react';

const InventoryManagement = ({ colors }) => {
    return (
        <div style={{ padding: '2rem', background: colors.cardBg, borderRadius: '1rem', border: `1px solid ${colors.border}` }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Inventory Management</h2>
            <p style={{ color: colors.textMuted }}>Manage raw materials and product inventory.</p>
        </div>
    );
};

export default InventoryManagement;
