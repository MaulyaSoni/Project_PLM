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
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-white/[0.02] backdrop-blur-3xl border-r border-white/10 shadow-[4px_0_24px_rgba(0,0,0,0.5)] flex flex-col z-30 font-sans">
      {/* Logo */}
      <div className="h-20 flex items-center justify-center border-b border-white/10 relative">
        <span className="font-extrabold text-white text-xl tracking-tight flex items-center gap-2 drop-shadow-md">
          <Layers className="h-6 w-6 text-[#FF00FF]" />
          PLM_CONTROL
        </span>
      </div>

      <div className="px-6 pt-8 pb-3">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-widest px-2">Navigation</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-2 space-y-2 overflow-y-auto">
        {visibleItems.map(item => {
          const active = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-2xl transition-all duration-300 relative',
                active
                  ? 'text-white bg-gradient-to-r from-primary/30 to-[#FF00FF]/30 shadow-[0_4px_12px_rgba(0,212,255,0.2)] border border-white/10'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              )}
            >
              <item.icon className={cn("h-5 w-5", active ? "text-white" : "text-white/50")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      {user && (
        <div className="p-5 border-t border-white/10 bg-white/[0.01]">
          <div className="flex items-center gap-3 mb-5 px-1">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary to-[#FF00FF] flex items-center justify-center text-sm font-bold text-white shadow-[0_4px_10px_rgba(255,0,255,0.3)]">
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{user.name}</p>
              <div className="mt-0.5 opacity-90">
                <RoleBadge role={user.role} />
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-bold text-white bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl hover:shadow-[0_4px_12px_rgba(255,255,255,0.05)] transition-all"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      )}
    </aside>
  );
}
