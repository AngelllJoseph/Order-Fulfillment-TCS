import React, { useState, useEffect, useRef } from 'react';
import { productService } from '../../services/api';
import {
    Package, Plus, Search, Edit2, Eye, FileUp,
    Ban, CheckCircle, X, Filter, Loader2, MoreVertical,
    Download, Trash2, Box
} from 'lucide-react';
import Toast from '../../components/Toast';
import ProductForm from './ProductForm';

const ProductsPage = ({ colors, darkMode }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const fileInputRef = useRef(null);

    // Modal states
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await productService.getProducts();
            setProducts(res.data);
        } catch (err) {
            console.error(err);
            setToast({ show: true, message: 'Failed to fetch products', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProduct = async (data) => {
        try {
            if (selectedProduct) {
                await productService.updateProduct(selectedProduct.id, data);
                setToast({ show: true, message: 'Product updated successfully!', type: 'success' });
            } else {
                await productService.createProduct(data);
                setToast({ show: true, message: 'Product created successfully!', type: 'success' });
            }
            setIsFormOpen(false);
            fetchProducts();
        } catch (err) {
            console.error(err);
            setToast({ show: true, message: 'Failed to save product', type: 'error' });
        }
    };

    const handleToggleStatus = async (product) => {
        const newStatus = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        try {
            await productService.updateProduct(product.id, { status: newStatus });
            setToast({ show: true, message: `Product ${newStatus.toLowerCase()} successfully!`, type: 'success' });
            fetchProducts();
        } catch (err) {
            console.error(err);
            setToast({ show: true, message: 'Failed to update status', type: 'error' });
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        try {
            const res = await productService.uploadExcel(file);
            setToast({
                show: true,
                message: `Uploaded: ${res.data.created} created, ${res.data.updated} updated.`,
                type: 'success'
            });
            fetchProducts();
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.error || 'Failed to upload Excel file';
            setToast({ show: true, message: errorMsg, type: 'error' });
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
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
        button: (primary, variant = 'solid') => ({
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.6rem 1.25rem', borderRadius: '0.75rem',
            background: primary ? colors.primary : (variant === 'ghost' ? 'transparent' : colors.surface),
            color: primary ? 'white' : colors.text,
            border: primary ? 'none' : (variant === 'ghost' ? 'none' : `1px solid ${colors.border}`),
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
        statusBadge: (status) => ({
            padding: '0.25rem 0.75rem', borderRadius: '9999px',
            fontSize: '0.75rem', fontWeight: 700,
            background: status === 'ACTIVE' ? '#10b98115' : '#ef444415',
            color: status === 'ACTIVE' ? '#10b981' : '#ef4444'
        }),
        actionBtn: (color) => ({
            background: 'none', border: 'none', cursor: 'pointer',
            color: color || colors.textMuted, padding: '0.4rem',
            borderRadius: '0.4rem', transition: 'all 0.2s ease',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        })
    };

    const filteredProducts = products.filter(p =>
        (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.product_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.category || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div style={styles.container}>
            <div style={styles.actionBar}>
                <div style={styles.searchBox}>
                    <Search size={18} color={colors.textMuted} />
                    <input
                        style={styles.input}
                        placeholder="Search by name, ID, SKU or category..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                        accept=".xlsx, .xls, .csv"
                    />
                    <button style={styles.button(false)} onClick={() => fileInputRef.current?.click()}>
                        <FileUp size={18} /> Upload Excel
                    </button>
                    <button style={styles.button(true)} onClick={() => { setSelectedProduct(null); setIsFormOpen(true); }}>
                        <Plus size={18} /> Add Product
                    </button>
                </div>
            </div>

            <div style={styles.tableContainer}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Product Info</th>
                            <th style={styles.th}>SKU</th>
                            <th style={styles.th}>Category</th>
                            <th style={styles.th}>Price</th>
                            <th style={styles.th}>Status</th>
                            <th style={styles.th}>Created</th>
                            <th style={styles.th}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="7" style={{ ...styles.td, textAlign: 'center', padding: '3rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                        <Loader2 size={32} className="animate-spin" color={colors.primary} />
                                        <span style={{ color: colors.textMuted }}>Loading products catalog...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredProducts.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{ ...styles.td, textAlign: 'center', padding: '3rem' }}>
                                    <div style={{ color: colors.textMuted }}>No products found in the system.</div>
                                </td>
                            </tr>
                        ) : filteredProducts.map(p => (
                            <tr key={p.id}>
                                <td style={styles.td}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{
                                            width: '40px', height: '40px', borderRadius: '10px',
                                            background: `${colors.primary}15`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: colors.primary
                                        }}>
                                            <Package size={20} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{p.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: colors.textMuted }}>ID: {p.product_id}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={styles.td}>
                                    <span style={{ fontFamily: 'monospace', background: colors.surface, padding: '2px 6px', borderRadius: '4px' }}>
                                        {p.sku}
                                    </span>
                                </td>
                                <td style={styles.td}>{p.category}</td>
                                <td style={styles.td}>
                                    <div style={{ fontWeight: 600 }}>${parseFloat(p.price).toFixed(2)}</div>
                                </td>
                                <td style={styles.td}>
                                    <span style={styles.statusBadge(p.status)}>{p.status}</span>
                                </td>
                                <td style={styles.td}>
                                    <div style={{ color: colors.textMuted, fontSize: '0.75rem' }}>
                                        {new Date(p.created_at).toLocaleDateString()}
                                    </div>
                                </td>
                                <td style={styles.td}>
                                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                                        <button
                                            style={styles.actionBtn()}
                                            title="Edit Product"
                                            onClick={() => { setSelectedProduct(p); setIsFormOpen(true); }}
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            style={styles.actionBtn()}
                                            title="View Details"
                                            onClick={() => { setSelectedProduct(p); setIsViewDetailsOpen(true); }}
                                        >
                                            <Eye size={16} />
                                        </button>
                                        <button
                                            style={styles.actionBtn()}
                                            title="Manage Parts"
                                        >
                                            <Box size={16} />
                                        </button>
                                        <button
                                            style={styles.actionBtn(p.status === 'ACTIVE' ? '#ef4444' : '#10b981')}
                                            title={p.status === 'ACTIVE' ? "Deactivate" : "Activate"}
                                            onClick={() => handleToggleStatus(p)}
                                        >
                                            {p.status === 'ACTIVE' ? <Ban size={16} /> : <CheckCircle size={16} />}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isFormOpen && (
                <ProductForm
                    product={selectedProduct}
                    colors={colors}
                    darkMode={darkMode}
                    onSave={handleSaveProduct}
                    onCancel={() => setIsFormOpen(false)}
                />
            )}

            {isViewDetailsOpen && selectedProduct && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{
                        background: colors.surface, borderRadius: '1.5rem',
                        width: '100%', maxWidth: '500px', border: `1px solid ${colors.border}`,
                        overflow: 'hidden'
                    }}>
                        <div style={{ padding: '1.5rem', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Product Details</h3>
                            <button onClick={() => setIsViewDetailsOpen(false)} style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                <div style={{ width: '80px', height: '80px', borderRadius: '1rem', background: colors.primary + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.primary }}>
                                    <Package size={40} />
                                </div>
                                <div>
                                    <h4 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{selectedProduct.name}</h4>
                                    <p style={{ color: colors.textMuted }}>{selectedProduct.product_id}</p>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                                <div><p style={{ fontSize: '0.75rem', fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase' }}>SKU</p><p>{selectedProduct.sku}</p></div>
                                <div><p style={{ fontSize: '0.75rem', fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase' }}>Price</p><p style={{ fontWeight: 800 }}>${selectedProduct.price}</p></div>
                                <div><p style={{ fontSize: '0.75rem', fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase' }}>Category</p><p>{selectedProduct.category}</p></div>
                                <div><p style={{ fontSize: '0.75rem', fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase' }}>Status</p><span style={styles.statusBadge(selectedProduct.status)}>{selectedProduct.status}</span></div>
                            </div>
                            <div style={{ marginTop: '0.5rem' }}>
                                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase' }}>Description</p>
                                <p style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>{selectedProduct.description || 'No description provided.'}</p>
                            </div>
                        </div>
                    </div>
                </div>
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

export default ProductsPage;
