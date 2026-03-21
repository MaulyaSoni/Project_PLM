import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Layers, GitPullRequest, BarChart3, Settings, LogOut, Cog } from 'lucide-react';
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
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-sidebar border-r border-sidebar-border flex flex-col z-30">
      {/* Logo */}
      <div className="h-14 flex items-center gap-2.5 px-5 border-b border-sidebar-border">
        <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
          <Cog className="h-4.5 w-4.5 text-primary" />
        </div>
        <span className="font-display font-semibold text-foreground text-base tracking-tight">PLM Control</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
        {visibleItems.map(item => {
          const active = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-functional font-medium transition-all duration-200',
                active
                  ? 'bg-sidebar-accent text-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      {user && (
        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
              <RoleBadge role={user.role} />
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-3 py-2 mt-1 text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 rounded-md transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      )}
    </aside>
  );
}
