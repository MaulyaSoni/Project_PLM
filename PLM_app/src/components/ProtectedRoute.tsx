import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import type { Role } from '@/data/mockData';
import { ReactNode } from 'react';
import { ShieldX } from 'lucide-react';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function RoleRoute({ children, roles }: { children: ReactNode; roles: Role[] }) {
  const { user } = useAuthStore();
  if (!user || !roles.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-muted-foreground">
        <ShieldX className="h-16 w-16 mb-4 text-destructive/60" />
        <h1 className="text-2xl font-semibold text-foreground">403 — Access Denied</h1>
        <p className="text-sm mt-2">You don't have permission to view this page.</p>
      </div>
    );
  }
  return <>{children}</>;
}
