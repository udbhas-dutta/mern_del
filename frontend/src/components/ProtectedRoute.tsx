import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../app/store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const location = useLocation();

  // 1. Check if User is Logged In
  if (!user || !token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Check if User has the Correct Role
  if (!allowedRoles.includes(user.role)) {
    // Redirect to their appropriate dashboard based on their ACTUAL role
    if (user.role === 'Buyer') return <Navigate to="/buyer" replace />;
    if (user.role === 'Seller') return <Navigate to="/seller" replace />;
    if (user.role === 'Admin') return <Navigate to="/admin" replace />;
    
    return <Navigate to="/login" replace />;
  }

  // 3. If all checks pass, render the page
  return <>{children}</>;
};

export default ProtectedRoute;