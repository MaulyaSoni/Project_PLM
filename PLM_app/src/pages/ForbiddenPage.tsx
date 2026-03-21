import { useLocation, Link } from 'react-router-dom';
import { ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/useAuthStore';

export default function ForbiddenPage() {
  const location = useLocation();
  const state = location.state as { message?: string } | null;
  const { user } = useAuthStore();
  const isOperationsRole = user?.role === 'OPERATIONS';
  const isOperationsRestriction = isOperationsRole || (state?.message || '').toLowerCase().includes('operations users');

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="max-w-lg text-center space-y-4">
        <ShieldX className="h-16 w-16 mx-auto text-destructive/70" />
        <h1 className="text-3xl font-display font-bold">{isOperationsRestriction ? 'Access Restricted' : '403 - Access Denied'}</h1>
        <p className="text-muted-foreground">
          {isOperationsRestriction
            ? 'Operations users have read-only access to Products and BOMs.'
            : (state?.message || 'You do not have permission to view this page.')}
        </p>
        {isOperationsRestriction && (
          <p className="text-muted-foreground text-sm">Contact your administrator for elevated access.</p>
        )}
        <Button asChild>
          <Link to={isOperationsRestriction ? '/products' : '/dashboard'}>
            {isOperationsRestriction ? 'Go to Products' : 'Back to Dashboard'}
          </Link>
        </Button>
      </div>
    </div>
  );
}
