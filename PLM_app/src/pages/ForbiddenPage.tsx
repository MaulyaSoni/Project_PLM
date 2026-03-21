import { useLocation, Link } from 'react-router-dom';
import { ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ForbiddenPage() {
  const location = useLocation();
  const state = location.state as { message?: string } | null;

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="max-w-lg text-center space-y-4">
        <ShieldX className="h-16 w-16 mx-auto text-destructive/70" />
        <h1 className="text-3xl font-display font-bold">403 - Access Denied</h1>
        <p className="text-muted-foreground">{state?.message || 'You do not have permission to view this page.'}</p>
        <Button asChild>
          <Link to="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
