import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import type { Role } from '@/data/mockData';
import { ReactNode } from 'react';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function RoleRoute({ children, roles, message }: { children: ReactNode; roles: Role[]; message?: string }) {
  const { user } = useAuthStore();
  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/403" replace state={{ message: message || 'You do not have permission to view this page.' }} />;
  }
  return <>{children}</>;
}
