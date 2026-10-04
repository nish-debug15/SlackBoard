import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import { AppShell } from './AppShell';

export function ProtectedRoute() {
  const { token, loading } = useAuth();
  
  if (loading) {
    return <div className="p-8 text-center" style={{ color: 'var(--color-text-3)' }}>Loading...</div>;
  }
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
