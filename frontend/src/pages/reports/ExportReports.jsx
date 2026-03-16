import { useState } from 'react';
import { Download, FileText, Table as TableIcon, FileJson, FileSpreadsheet, Filter } from 'lucide-react';
import axios from 'axios';

const ExportReports = ({ colors, darkMode }) => {
    const [exporting, setExporting] = useState(false);
    const [filters, setFilters] = useState({
        dateRange: 'last7',
        format: 'csv'
    });

    const handleExport = async () => {
        setExporting(true);
        try {
            const response = await axios.get(`/api/reports/export/?format=${filters.format}`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `orders_report_${new Date().toISOString().split('T')[0]}.${filters.format}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Export failed:", error);
        } finally {
            setExporting(false);
        }
    };

    const cardStyle = {
        background: colors.cardBg,
        padding: '2rem',
        borderRadius: '1.25rem',
        border: `1px solid ${colors.border}`,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(8px)',
        maxWidth: '800px',
        margin: '0 auto'
    };

    const formatOptions = [
        { id: 'csv', label: 'CSV Spreadsheet', icon: FileSpreadsheet, color: '#10b981' },
        { id: 'excel', label: 'Excel (XLSX)', icon: TableIcon, color: '#3b82f6' },
        { id: 'pdf', label: 'PDF Document', icon: FileText, color: '#ef4444' },
    ];

    return (
        <div style={{ padding: '2rem 0' }}>
            <div style={cardStyle}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{ 
                        width: '64px', height: '64px', borderRadius: '1rem', 
                        background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1.5rem auto', color: 'white'
                    }}>
                        <Download size={32} />
                    </div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>Generate Analytical Reports</h2>
                    <p style={{ color: colors.textMuted }}>Select your filters and export format to download the dataset.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 600, color: colors.text }}>Date Range</label>
                        <select 
                            value={filters.dateRange}
                            onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
                            style={{ 
                                padding: '0.75rem', borderRadius: '0.75rem', 
                                background: colors.surface, border: `1px solid ${colors.border}`,
                                color: colors.text, outline: 'none'
                            }}
                        >
                            <option value="last7">Last 7 Days</option>
                            <option value="last30">Last 30 Days</option>
                            <option value="quarter">This Quarter</option>
                            <option value="year">Full Year</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 600, color: colors.text }}>Data Format</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {formatOptions.map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => setFilters({...filters, format: opt.id})}
                                    style={{
                                        flex: 1, padding: '1rem 0.5rem', borderRadius: '0.75rem',
                                        background: filters.format === opt.id ? `${opt.color}20` : 'transparent',
                                        border: `1.5px solid ${filters.format === opt.id ? opt.color : colors.border}`,
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                                        transition: 'all 0.2s ease', cursor: 'pointer'
                                    }}
                                >
                                    <opt.icon size={20} color={filters.format === opt.id ? opt.color : colors.textMuted} />
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: filters.format === opt.id ? opt.color : colors.textMuted }}>{opt.id.toUpperCase()}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleExport}
                    disabled={exporting}
                    style={{
                        width: '100%', padding: '1.25rem', borderRadius: '1rem',
                        background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})`,
                        color: 'white', border: 'none', fontWeight: 700, fontSize: '1rem',
                        cursor: exporting ? 'not-allowed' : 'pointer',
                        opacity: exporting ? 0.7 : 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                        boxShadow: `0 10px 15px -3px ${colors.primary}40`
                    }}
                >
                    {exporting ? 'Processing...' : (
                        <>
                            <Download size={20} />
                            Generate & Download Report
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default ExportReports;
