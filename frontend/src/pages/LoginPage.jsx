import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Shield, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ROLE_REDIRECTS = {
    ADMIN: '/admin-dashboard',
    PROGRAM_MANAGER: '/operations-dashboard',
    MANUFACTURING_LEAD: '/production-dashboard',
    REPORT_USER: '/reports-dashboard',
};

const styles = {
    page: {
        minHeight: '100vh',
        width: '100%',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 35%, #0f172a 65%, #1e293b 100%)',
        backgroundSize: '400% 400%',
        animation: 'gradientShift 12s ease infinite',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
    orb1: {
        position: 'absolute', borderRadius: '50%', filter: 'blur(80px)', opacity: 0.18,
        pointerEvents: 'none', width: '400px', height: '400px',
        background: 'rgb(99,102,241)', top: '-100px', left: '-100px',
    },
    orb2: {
        position: 'absolute', borderRadius: '50%', filter: 'blur(80px)', opacity: 0.12,
        pointerEvents: 'none', width: '350px', height: '350px',
        background: 'rgb(124,58,237)', bottom: '-80px', right: '-80px',
    },
    orb3: {
        position: 'absolute', borderRadius: '50%', filter: 'blur(100px)', opacity: 0.08,
        pointerEvents: 'none', width: '300px', height: '300px',
        background: 'rgb(59,130,246)', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
    },
    card: {
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
        borderRadius: '1rem',
        width: '100%',
        maxWidth: '420px',
        padding: '2.5rem',
        position: 'relative',
        zIndex: 10,
        animation: 'fadeInUp 0.6s ease forwards',
    },
    logoWrap: {
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '64px', height: '64px', borderRadius: '1rem', margin: '0 auto 1rem',
        background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
        boxShadow: '0 8px 25px rgba(99,102,241,0.4)',
    },
    h1: { color: '#ffffff', fontSize: '1.5rem', fontWeight: 700, textAlign: 'center', letterSpacing: '-0.02em', margin: 0 },
    subtitle: { color: 'rgba(148,163,184,0.8)', fontSize: '0.875rem', textAlign: 'center', marginTop: '0.25rem', marginBottom: 0 },
    errorBox: {
        background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
        color: '#fca5a5', borderRadius: '0.75rem', padding: '0.75rem 1rem',
        fontSize: '0.875rem', fontWeight: 500, marginBottom: '1.25rem',
    },
    label: { display: 'block', color: 'rgba(226,232,240,0.9)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' },
    inputWrap: { position: 'relative', marginBottom: '1rem' },
    input: {
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.12)',
        color: '#f1f5f9', borderRadius: '0.75rem',
        padding: '0.75rem 1rem', fontSize: '0.875rem',
        width: '100%', outline: 'none', boxSizing: 'border-box',
        transition: 'all 0.3s ease', fontFamily: 'inherit',
    },
    inputPR: {
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.12)',
        color: '#f1f5f9', borderRadius: '0.75rem',
        padding: '0.75rem 3rem 0.75rem 1rem', fontSize: '0.875rem',
        width: '100%', outline: 'none', boxSizing: 'border-box',
        transition: 'all 0.3s ease', fontFamily: 'inherit',
    },
    eyeBtn: {
        position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'rgba(148,163,184,0.7)', padding: '0.25rem', display: 'flex', alignItems: 'center',
    },
    row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' },
    rememberLabel: { display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none' },
    rememberText: { color: 'rgba(148,163,184,0.8)', fontSize: '0.875rem' },
    forgotBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#818cf8', fontSize: '0.875rem', fontWeight: 500, padding: 0 },
    btn: {
        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
        color: '#ffffff', fontWeight: 600, fontSize: '0.875rem',
        width: '100%', padding: '0.85rem', borderRadius: '0.75rem',
        border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '0.5rem', boxShadow: '0 4px 15px rgba(99,102,241,0.4)',
        transition: 'all 0.3s ease', fontFamily: 'inherit',
    },
    btnDisabled: {
        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
        color: '#ffffff', fontWeight: 600, fontSize: '0.875rem',
        width: '100%', padding: '0.85rem', borderRadius: '0.75rem',
        border: 'none', cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '0.5rem', opacity: 0.6, fontFamily: 'inherit',
    },
    footer: { color: 'rgba(100,116,139,0.8)', fontSize: '0.75rem', textAlign: 'center', marginTop: '1.5rem', marginBottom: 0 },
};

const LoginPage = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({ email: '', password: '', remember: false });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [hovering, setHovering] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        if (error) setError('');
    };

    const handleFocus = (e) => {
        e.target.style.borderColor = 'rgba(99,102,241,0.7)';
        e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)';
        e.target.style.background = 'rgba(255,255,255,0.08)';
    };
    const handleBlur = (e) => {
        e.target.style.borderColor = 'rgba(255,255,255,0.12)';
        e.target.style.boxShadow = 'none';
        e.target.style.background = 'rgba(255,255,255,0.05)';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.email || !form.password) {
            setError('Please enter your email and password.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const user = await login(form.email, form.password);
            const redirect = ROLE_REDIRECTS[user.role] || '/dashboard';
            navigate(redirect, { replace: true });
        } catch (err) {
            if (err.response?.status === 403) {
                setError('Your account has been deactivated. Please contact your administrator.');
            } else if (err.response?.status === 401) {
                setError('Invalid email or password. Please try again.');
            } else {
                setError('Unable to connect to the server. Please try again later.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .login-spinner { animation: spin 0.8s linear infinite; }
        input::placeholder { color: rgba(148,163,184,0.5); }
        html, body, #root { height: 100%; margin: 0; }
      `}</style>
            <div style={styles.page}>
                {/* Background Orbs */}
                <div style={styles.orb1} />
                <div style={styles.orb2} />
                <div style={styles.orb3} />

                <div style={styles.card}>
                    {/* Logo */}
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <div style={styles.logoWrap}>
                            <Shield size={30} color="white" />
                        </div>
                        <h1 style={styles.h1}>Order Fulfillment System</h1>
                        <p style={styles.subtitle}>Sign in to your account to continue</p>
                    </div>

                    {/* Error Alert */}
                    {error && <div style={styles.errorBox}>{error}</div>}

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                        {/* Email */}
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={styles.label} htmlFor="email">Email Address</label>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                autoComplete="email"
                                placeholder="you@company.com"
                                value={form.email}
                                onChange={handleChange}
                                onFocus={handleFocus}
                                onBlur={handleBlur}
                                style={styles.input}
                            />
                        </div>

                        {/* Password */}
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={styles.label} htmlFor="password">Password</label>
                            <div style={styles.inputWrap}>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    value={form.password}
                                    onChange={handleChange}
                                    onFocus={handleFocus}
                                    onBlur={handleBlur}
                                    style={styles.inputPR}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    style={styles.eyeBtn}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Remember Me & Forgot */}
                        <div style={styles.row}>
                            <label style={styles.rememberLabel}>
                                <input
                                    id="remember"
                                    type="checkbox"
                                    name="remember"
                                    checked={form.remember}
                                    onChange={handleChange}
                                    style={{ accentColor: '#6366f1' }}
                                />
                                <span style={styles.rememberText}>Remember me</span>
                            </label>
                            <button type="button" style={styles.forgotBtn}>Forgot password?</button>
                        </div>

                        {/* Submit */}
                        <button
                            id="login-button"
                            type="submit"
                            disabled={loading}
                            style={loading ? styles.btnDisabled : styles.btn}
                            onMouseEnter={() => !loading && setHovering(true)}
                            onMouseLeave={() => setHovering(false)}
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={18} className="login-spinner" />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    <LogIn size={18} />
                                    Sign In
                                </>
                            )}
                        </button>
                    </form>

                    <p style={styles.footer}>
                        &copy; {new Date().getFullYear()} TCS Order Fulfillment. All rights reserved.
                    </p>
                </div>
            </div>
        </>
    );
};

export default LoginPage;
