import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Layers, GitPullRequest, BarChart3, Settings, LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { RoleBadge } from '@/components/RoleBadge';
import { cn } from '@/lib/utils';
import type { Role } from '@/data/mockData';

const navItems: { label: string; path: string; icon: React.ElementType; roles?: Role[] }[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'ENGINEERING', 'APPROVER', 'OPERATIONS'] },
  { label: 'Products', path: '/products', icon: Package, roles: ['ADMIN', 'ENGINEERING', 'APPROVER', 'OPERATIONS'] },
  { label: 'Bills of Materials', path: '/boms', icon: Layers, roles: ['ADMIN', 'ENGINEERING', 'APPROVER', 'OPERATIONS'] },
  { label: 'Change Orders', path: '/ecos', icon: GitPullRequest, roles: ['ADMIN', 'ENGINEERING', 'APPROVER'] },
  { label: 'Reports', path: '/reports', icon: BarChart3, roles: ['ADMIN'] },
  { label: 'Settings', path: '/settings', icon: Settings, roles: ['ADMIN'] },
];

export function AppSidebar() {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const visibleItems = navItems.filter(item => !item.roles || (user && item.roles.includes(user.role)));

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border flex flex-col z-30 font-sans shadow-sm">
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-border">
        <span className="font-semibold text-foreground text-lg tracking-tight flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          PLM Enterprise
        </span>
      </div>

      <div className="px-4 pt-6 pb-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2">Navigation</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {visibleItems.map(item => {
          const active = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              )}
            >
              <item.icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      {user && (
        <div className="p-4 border-t border-border bg-muted/20">
          <div className="flex items-center gap-3 mb-4 px-1">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
              <div className="mt-0.5">
                <RoleBadge role={user.role} />
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium text-muted-foreground bg-transparent border border-border hover:bg-muted rounded-md transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      )}
    </aside>
  );
}
