import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../context/authStore';
import { PageLoader } from '../ui/Spinner';

// ─── ProtectedRoute: Redirect to login if not authenticated ───────────────────
export function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) return <PageLoader />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role-based guard
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    const redirectTo = user?.role === 'SuperAdmin' ? '/admin' : '/dashboard';
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}

// ─── GuestRoute: Redirect to dashboard if already logged in ──────────────────
export function GuestRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated) {
    const redirectTo = user?.role === 'SuperAdmin' ? '/admin' : '/dashboard';
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
