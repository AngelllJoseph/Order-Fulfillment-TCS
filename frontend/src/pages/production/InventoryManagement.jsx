// Inventory Management Page for Production Lead
import React from 'react';
import InventoryOverview from './InventoryOverview';

const InventoryManagement = ({ colors, darkMode }) => {
    return (
        <div style={{ 
            padding: '2rem', 
            background: colors.cardBg, 
            borderRadius: '1.25rem', 
            border: `1px solid ${colors.border}`,
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
        }}>
            <InventoryOverview colors={colors} darkMode={darkMode} />
        </div>
    );
};

export default InventoryManagement;
