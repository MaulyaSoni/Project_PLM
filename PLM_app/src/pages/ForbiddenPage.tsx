import { useLocation, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/useAuthStore';

export default function ForbiddenPage() {
  const location = useLocation();
  const state = location.state as { message?: string } | null;
  const { logout } = useAuthStore();

  useEffect(() => {
    // Ensure stale auth state does not keep the user trapped in a forbidden loop.
    logout();
  }, [logout]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="max-w-lg text-center space-y-4">
        <ShieldX className="h-16 w-16 mx-auto text-destructive/70" />
        <h1 className="text-3xl font-semibold">403 - Access Denied</h1>
        <p className="text-muted-foreground">
          {state?.message || 'Your session does not have permission to view this page. Please login again.'}
        </p>
        <p className="text-muted-foreground text-sm">Contact your administrator if this persists after re-authentication.</p>
        <Button asChild>
          <Link to="/login">Go to Login</Link>
        </Button>
      </div>
    </div>
  );
}
