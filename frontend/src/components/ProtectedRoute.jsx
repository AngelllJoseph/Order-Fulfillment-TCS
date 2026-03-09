import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 35%, #0f172a 65%, #1e293b 100%)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem',
                fontFamily: "'Inter', sans-serif",
            }}>
                <div style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    border: '4px solid rgba(99,102,241,0.3)',
                    borderTopColor: '#6366f1',
                    animation: 'spin 0.8s linear infinite',
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <p style={{ color: 'rgba(148,163,184,0.7)', fontSize: '14px', margin: 0 }}>Authenticating...</p>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        const roleDefaults = {
            ADMIN: '/admin-dashboard',
            PROGRAM_MANAGER: '/operations-dashboard',
            MANUFACTURING_LEAD: '/production-dashboard',
            REPORT_USER: '/reports-dashboard',
        };
        return <Navigate to={roleDefaults[user.role] || '/dashboard'} replace />;
    }

    return children;
};

export default ProtectedRoute;
