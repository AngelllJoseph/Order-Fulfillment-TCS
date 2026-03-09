import React, { useState, useEffect } from 'react';
import { hubService } from '../../services/api';
import {
    MapPin, Plus, Search, Edit2, Package, TrendingUp,
    Settings, Ban, CheckCircle, MoreVertical, X,
    Filter, Loader2, FileUp
} from 'lucide-react';
import Toast from '../../components/Toast';
import HubForm from './HubForm';
import SKUMappingModal from './SKUMappingModal';
import HubCapacityModal from './HubCapacityModal';

const HubsPage = ({ colors, darkMode }) => {
    const [hubs, setHubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    // Modal states
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSKUMappingOpen, setIsSKUMappingOpen] = useState(false);
    const [isCapacityOpen, setIsCapacityOpen] = useState(false);
    const [selectedHub, setSelectedHub] = useState(null);

    useEffect(() => {
        fetchHubs();
    }, []);

    const fetchHubs = async () => {
        setLoading(true);
        try {
            const res = await hubService.getHubs();
            setHubs(res.data);
        } catch (err) {
            console.error(err);
            setToast({ show: true, message: 'Failed to fetch hubs', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveHub = async (data) => {
        try {
            if (selectedHub) {
                await hubService.updateHub(selectedHub.id, data);
                setToast({ show: true, message: 'Hub updated successfully!', type: 'success' });
            } else {
                await hubService.createHub(data);
                setToast({ show: true, message: 'Hub created successfully!', type: 'success' });
            }
            setIsFormOpen(false);
            fetchHubs();
        } catch (err) {
            console.error(err);
            setToast({ show: true, message: 'Failed to save hub', type: 'error' });
        }
    };

    const handleToggleStatus = async (hub) => {
        const newStatus = hub.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        try {
            await hubService.updateHub(hub.id, { status: newStatus });
            setToast({ show: true, message: `Hub ${newStatus.toLowerCase()} successfully!`, type: 'success' });
            fetchHubs();
        } catch (err) {
            console.error(err);
            setToast({ show: true, message: 'Failed to update hub status', type: 'error' });
        }
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const res = await hubService.uploadExcel(file);
            setToast({
                show: true,
                message: `Successfully processed ${res.data.created + res.data.updated} hubs!`,
                type: 'success'
            });
            fetchHubs();
        } catch (err) {
            console.error(err);
            setToast({
                show: true,
                message: err.response?.data?.error || 'Failed to upload Excel',
                type: 'error'
            });
        } finally {
            setUploading(false);
            event.target.value = ''; // Reset file input
        }
    };

    const styles = {
        container: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
        actionBar: {
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            gap: '1rem', flexWrap: 'wrap'
        },
        searchBox: {
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            background: colors.surface, border: `1px solid ${colors.border}`,
            padding: '0.5rem 1rem', borderRadius: '0.75rem', width: '320px'
        },
        input: {
            background: 'none', border: 'none', color: colors.text,
            fontSize: '0.875rem', width: '100%', outline: 'none'
        },
        button: (primary) => ({
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.6rem 1.25rem', borderRadius: '0.75rem',
            background: primary ? colors.primary : colors.surface,
            color: primary ? 'white' : colors.text,
            border: primary ? 'none' : `1px solid ${colors.border}`,
            fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
            transition: 'all 0.2s ease',
        }),
        tableContainer: {
            background: colors.cardBg, border: `1px solid ${colors.border}`,
            borderRadius: '1.25rem', overflowX: 'auto'
        },
        table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1000px' },
        th: {
            padding: '1.25rem 1.5rem', background: colors.surface,
            color: colors.textMuted, fontSize: '0.75rem', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.05em',
            borderBottom: `1px solid ${colors.border}`
        },
        td: {
            padding: '1.25rem 1.5rem', borderBottom: `1px solid ${colors.border}`,
            fontSize: '0.875rem'
        },
        statusBadge: (status) => {
            const config = {
                ACTIVE: { bg: '#10b98115', text: '#10b981', label: 'Active' },
                INACTIVE: { bg: '#ef444415', text: '#ef4444', label: 'Inactive' },
                MAINTENANCE: { bg: '#f59e0b15', text: '#f59e0b', label: 'Maintenance' },
            }[status] || { bg: '#64748b15', text: '#64748b', label: status };
            return {
                padding: '0.25rem 0.75rem', borderRadius: '9999px',
                fontSize: '0.75rem', fontWeight: 700,
                background: config.bg, color: config.text
            };
        },
        utilizationBar: (percent) => ({
            width: '100px', height: '6px', background: `${colors.border}`,
            borderRadius: '3px', position: 'relative', overflow: 'hidden'
        }),
        utilizationFill: (percent) => {
            const color = percent > 90 ? '#ef4444' : percent > 70 ? '#f59e0b' : '#10b981';
            return {
                width: `${percent}%`, height: '100%', background: color,
                transition: 'width 0.3s ease'
            };
        },
        actionBtn: (color) => ({
            background: 'none', border: 'none', cursor: 'pointer',
            color: color || colors.textMuted, padding: '0.4rem',
            borderRadius: '0.4rem', transition: 'all 0.2s ease',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }),
        textActionBtn: (color, bg) => ({
            background: bg || 'none', border: `1px solid ${color}`, cursor: 'pointer',
            color: color || colors.textMuted, padding: '0.25rem 0.5rem',
            borderRadius: '0.3rem', transition: 'all 0.2s ease',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.7rem', fontWeight: 600, gap: '0.25rem'
        })
    };

    const filteredHubs = hubs.filter(h =>
        (h.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (h.hub_code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (h.location || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div style={styles.container}>
            <div style={styles.actionBar}>
                <div style={styles.searchBox}>
                    <Search size={18} color={colors.textMuted} />
                    <input
                        style={styles.input}
                        placeholder="Search hubs by name, code or location..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <input
                        type="file"
                        id="excel-upload"
                        style={{ display: 'none' }}
                        accept=".xlsx, .xls, .csv"
                        onChange={handleFileUpload}
                    />
                    <button
                        style={styles.button(false)}
                        onClick={() => document.getElementById('excel-upload').click()}
                        disabled={uploading}
                    >
                        {uploading ? <Loader2 size={18} className="animate-spin" /> : <FileUp size={18} />}
                        Import Excel
                    </button>
                    <button style={styles.button(false)}><Filter size={18} /> Filters</button>
                    <button style={styles.button(true)} onClick={() => { setSelectedHub(null); setIsFormOpen(true); }}>
                        <Plus size={18} /> Add Hub
                    </button>
                </div>
            </div>

            <div style={styles.tableContainer}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Hub Info</th>
                            <th style={styles.th}>Location</th>
                            <th style={styles.th}>Capacity & Load</th>
                            <th style={styles.th}>Utilization</th>
                            <th style={styles.th}>Status</th>
                            <th style={styles.th}>Last Updated</th>
                            <th style={styles.th}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="7" style={{ ...styles.td, textAlign: 'center', padding: '3rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                        <Loader2 size={32} className="animate-spin" color={colors.primary} />
                                        <span style={{ color: colors.textMuted }}>Loading manufacturing hubs...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredHubs.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{ ...styles.td, textAlign: 'center', padding: '3rem' }}>
                                    <div style={{ color: colors.textMuted }}>No hubs found matching your criteria.</div>
                                </td>
                            </tr>
                        ) : filteredHubs.map(h => {
                            const util = Math.round(h.capacity_utilization || 0);
                            return (
                                <tr key={h.id}>
                                    <td style={styles.td}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{
                                                width: '40px', height: '40px', borderRadius: '10px',
                                                background: `${colors.primary}15`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: colors.primary
                                            }}>
                                                <MapPin size={20} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{h.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: colors.textMuted }}>ID: {h.hub_code}</div>
                                                {h.supported_skus && (
                                                    <div style={{ fontSize: '0.70rem', color: colors.textMuted, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Package size={10} /> SKUs: {h.supported_skus}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td style={styles.td}>{h.location}</td>
                                    <td style={styles.td}>
                                        <div style={{ fontWeight: 600 }}>{h.current_load} / {h.max_daily_capacity}</div>
                                        <div style={{ fontSize: '0.75rem', color: colors.textMuted }}>Orders Today</div>
                                    </td>
                                    <td style={styles.td}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={styles.utilizationBar(util)}>
                                                <div style={styles.utilizationFill(util)} />
                                            </div>
                                            <span style={{ fontWeight: 700, fontSize: '0.75rem', minWidth: '35px' }}>{util}%</span>
                                        </div>
                                    </td>
                                    <td style={styles.td}>
                                        <span style={styles.statusBadge(h.status)}>{h.status}</span>
                                    </td>
                                    <td style={styles.td}>
                                        <div style={{ color: colors.textMuted, fontSize: '0.75rem' }}>
                                            {new Date(h.updated_at).toLocaleDateString()}
                                            <br />
                                            {new Date(h.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
                                    <td style={styles.td}>
                                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                                            <button
                                                style={styles.actionBtn()}
                                                title="Edit Hub"
                                                onClick={() => { setSelectedHub(h); setIsFormOpen(true); }}
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                style={styles.actionBtn()}
                                                title="View Capacity"
                                                onClick={() => { setSelectedHub(h); setIsCapacityOpen(true); }}
                                            >
                                                <Package size={16} />
                                            </button>
                                            <button
                                                style={styles.actionBtn()}
                                                title="View Performance"
                                                onClick={() => { setSelectedHub(h); setIsCapacityOpen(true); }} // Reusing for now
                                            >
                                                <TrendingUp size={16} />
                                            </button>
                                            <button
                                                style={styles.actionBtn()}
                                                title="Configure SKUs"
                                                onClick={() => { setSelectedHub(h); setIsSKUMappingOpen(true); }}
                                            >
                                                <Settings size={16} />
                                            </button>
                                            <button
                                                style={styles.textActionBtn(
                                                    h.status === 'ACTIVE' ? '#ef4444' : '#10b981',
                                                    h.status === 'ACTIVE' ? '#ef444415' : '#10b98115'
                                                )}
                                                title={h.status === 'ACTIVE' ? "Deactivate Hub" : "Activate Hub"}
                                                onClick={() => handleToggleStatus(h)}
                                            >
                                                {h.status === 'ACTIVE' ? (
                                                    <><Ban size={14} /> Deactivate</>
                                                ) : (
                                                    <><CheckCircle size={14} /> Activate</>
                                                )}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {isFormOpen && (
                <HubForm
                    hub={selectedHub}
                    colors={colors}
                    darkMode={darkMode}
                    onSave={handleSaveHub}
                    onCancel={() => setIsFormOpen(false)}
                />
            )}

            {isSKUMappingOpen && (
                <SKUMappingModal
                    hub={selectedHub}
                    colors={colors}
                    darkMode={darkMode}
                    onCancel={() => { setIsSKUMappingOpen(false); fetchHubs(); }}
                />
            )}

            {isCapacityOpen && (
                <HubCapacityModal
                    hub={selectedHub}
                    colors={colors}
                    darkMode={darkMode}
                    onCancel={() => setIsCapacityOpen(false)}
                />
            )}

            {toast.show && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    colors={colors}
                    onClose={() => setToast({ ...toast, show: false })}
                />
            )}
        </div>
    );
};

export default HubsPage;
