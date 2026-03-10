import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import OperationsDashboard from './pages/OperationsDashboard';
import ProductionDashboard from './pages/ProductionDashboard';

const pageStyle = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 35%, #0f172a 65%, #1e293b 100%)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
};
const cardStyle = {
  background: 'rgba(255,255,255,0.05)',
  backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.1)',
  boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
  borderRadius: '1rem', padding: '2.5rem',
  textAlign: 'center', maxWidth: '420px', width: '100%',
};

// ── Placeholder Dashboards ──────────────────────────────────────────────────
const DashboardPlaceholder = ({ title, emoji }) => {
  const { user, logout } = useAuth();
  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{emoji}</div>
        <h2 style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>{title}</h2>
        <p style={{ color: 'rgba(148,163,184,0.8)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Logged in as <strong style={{ color: '#a5b4fc' }}>{user?.email}</strong><br />
          Role: <strong style={{ color: '#a5b4fc' }}>{user?.role}</strong>
        </p>
        <button
          onClick={logout}
          style={{
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            color: '#fff', border: 'none', borderRadius: '0.75rem',
            padding: '0.75rem 1.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

// ── Smart Root Redirect ─────────────────────────────────────────────────────
const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  const roleMap = {
    ADMIN: '/admin-dashboard',
    PROGRAM_MANAGER: '/operations-dashboard',
    MANUFACTURING_LEAD: '/production-dashboard',
    REPORT_USER: '/reports-dashboard',
  };
  return <Navigate to={roleMap[user.role] || '/dashboard'} replace />;
};

import { ToastProvider } from './context/ToastContext';
import ToastContainer from './components/common/ToastContainer';

// ── App ─────────────────────────────────────────────────────────────────────
function App() {
  return (
    <ToastProvider>
      <ToastContainer />
      <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin-dashboard" element={
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/operations-dashboard" element={
        <ProtectedRoute allowedRoles={['PROGRAM_MANAGER']}>
          <OperationsDashboard />
        </ProtectedRoute>
      } />
      <Route path="/production-dashboard" element={
        <ProtectedRoute allowedRoles={['MANUFACTURING_LEAD']}>
          <ProductionDashboard />
        </ProtectedRoute>
      } />
      <Route path="/reports-dashboard" element={
        <ProtectedRoute allowedRoles={['REPORT_USER']}>
          <DashboardPlaceholder title="Reports Dashboard" emoji="📈" />
        </ProtectedRoute>
      } />
      </Routes>
    </ToastProvider>
  );
}

export default App;
