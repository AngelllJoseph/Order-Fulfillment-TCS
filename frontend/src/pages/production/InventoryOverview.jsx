import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const InventoryOverview = ({ colors, darkMode }) => {
    const { user } = useAuth();
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchInventory = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('access_token');
            const response = await axios.get('http://localhost:8000/api/inventory/my-hub/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setInventory(response.data);
        } catch (err) {
            console.error('Inventory fetch error:', err);
            if (err.response?.status === 400) {
                setError(err.response.data?.error || 'No hub assigned to your account.');
            } else if (err.response?.status === 403) {
                setError('You do not have permission to view inventory.');
            } else {
                setError('Failed to load inventory. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInventory();
    }, []);

    const getStatusInfo = (freeStock) => {
        if (freeStock > 20) {
            return {
                label: 'Healthy',
                color: '#22c55e',
                bgColor: 'rgba(34, 197, 94, 0.1)',
                icon: CheckCircle
            };
        } else if (freeStock > 0) {
            return {
                label: 'Warning',
                color: '#eab308',
                bgColor: 'rgba(234, 179, 8, 0.1)',
                icon: AlertTriangle
            };
        } else {
            return {
                label: 'Critical',
                color: '#ef4444',
                bgColor: 'rgba(239, 68, 68, 0.1)',
                icon: AlertCircle
            };
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: '0.75rem' }}>
                <RefreshCw size={20} color={colors.primary} style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ color: colors.textMuted }}>Loading inventory...</span>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ 
                padding: '1.25rem 1.5rem', 
                borderRadius: '0.75rem', 
                border: '1px solid rgba(239, 68, 68, 0.3)', 
                background: 'rgba(239, 68, 68, 0.07)',
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem',
                color: '#ef4444'
            }}>
                <AlertCircle size={18} />
                <span style={{ flex: 1, fontSize: '0.9rem' }}>{error}</span>
                <button 
                    onClick={fetchInventory}
                    style={{ fontSize: '0.8rem', textDecoration: 'underline', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: colors.text }}>Stock Overview</h3>
                    <p style={{ color: colors.textMuted, marginTop: '0.25rem', fontSize: '0.85rem' }}>
                        Inventory status for your assigned hub
                    </p>
                </div>
                <button 
                    onClick={fetchInventory}
                    title="Refresh"
                    style={{ 
                        padding: '0.5rem', 
                        borderRadius: '0.5rem', 
                        border: `1px solid ${colors.border}`, 
                        background: 'none', 
                        cursor: 'pointer',
                        display: 'flex', 
                        alignItems: 'center'
                    }}
                >
                    <RefreshCw size={16} color={colors.textMuted} />
                </button>
            </div>

            <div style={{ 
                overflowX: 'auto', 
                borderRadius: '0.875rem', 
                border: `1px solid ${colors.border}`, 
                background: colors.surface 
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ 
                            borderBottom: `1px solid ${colors.border}`, 
                            background: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' 
                        }}>
                            {['SKU / Product', 'Available', 'Reserved', 'Free Stock', 'Status'].map(col => (
                                <th key={col} style={{ 
                                    padding: '1rem 1.5rem', 
                                    fontSize: '0.75rem', 
                                    fontWeight: 600, 
                                    textTransform: 'uppercase', 
                                    letterSpacing: '0.075em', 
                                    color: colors.textMuted 
                                }}>
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {inventory.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ 
                                    padding: '3rem 1.5rem', 
                                    textAlign: 'center', 
                                    color: colors.textMuted 
                                }}>
                                    <Package size={36} style={{ marginBottom: '0.75rem', display: 'block', margin: '0 auto 0.75rem' }} />
                                    No inventory records found for this hub.
                                </td>
                            </tr>
                        ) : (
                            inventory.map((item) => {
                                const status = getStatusInfo(item.free_stock);
                                const StatusIcon = status.icon;
                                
                                return (
                                    <tr 
                                        key={item.id} 
                                        style={{ 
                                            borderBottom: `1px solid ${colors.border}`,
                                            transition: 'background 0.15s ease'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{ fontWeight: 600, color: colors.text }}>{item.sku}</div>
                                            <div style={{ fontSize: '0.8rem', color: colors.textMuted, marginTop: '0.15rem' }}>{item.product_name}</div>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem', fontWeight: 500, color: colors.text }}>{item.quantity_available}</td>
                                        <td style={{ padding: '1rem 1.5rem', color: colors.textMuted }}>{item.quantity_reserved}</td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <span style={{ fontWeight: 700, color: status.color }}>{item.free_stock}</span>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{ 
                                                display: 'inline-flex', 
                                                alignItems: 'center', 
                                                gap: '0.4rem', 
                                                padding: '0.3rem 0.75rem', 
                                                borderRadius: '9999px',
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                background: status.bgColor, 
                                                color: status.color 
                                            }}>
                                                <StatusIcon size={11} />
                                                {status.label}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default InventoryOverview;
