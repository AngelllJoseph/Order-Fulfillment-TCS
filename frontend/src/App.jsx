import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import OperationsDashboard from './pages/OperationsDashboard';
import ProductionDashboard from './pages/ProductionDashboard';
import ReportDashboard from './pages/reports/ReportDashboard';

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
          <ReportDashboard />
        </ProtectedRoute>
      } />
      </Routes>
    </ToastProvider>
  );
}

export default App;
