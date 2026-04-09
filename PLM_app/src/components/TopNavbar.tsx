import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useThemeStore } from '@/stores/useThemeStore';
import { RoleBadge } from '@/components/RoleBadge';
import { Sun, Moon, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import api from '@/services/api';

export function TopNavbar() {
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const res = await api.get('/reports/notifications');
        if (active) setNotifications(res.data?.data || []);
      } catch {
        if (active) setNotifications([]);
      }
    };

    load();
    const timer = window.setInterval(load, 20000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const unread = notifications.filter((n) => !n.readAt).length;

  const markAsRead = async (id: string) => {
    try {
      await api.post(`/reports/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)));
    } catch {
      // no-op
    }
  };

  if (!user) return null;

  return (
    <header className="h-16 border-b border-border bg-background flex items-center justify-between px-6 sticky top-0 z-50 font-sans shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-full border border-border">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-foreground text-xs font-medium tracking-wide uppercase">
            NIYANTRAK AI Workspace
          </span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="relative h-9 w-9 rounded-full border-border bg-transparent">
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 h-4 min-w-4 rounded-full bg-red-500 px-1 text-[10px] leading-4 text-white">
                  {Math.min(unread, 9)}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 border-border bg-popover p-0">
            <div className="border-b border-border px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notifications</div>
            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-3 py-6 text-center text-xs text-muted-foreground">No notifications</p>
              ) : (
                notifications.slice(0, 12).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => markAsRead(item.id)}
                    className="w-full border-b border-border px-3 py-2 text-left hover:bg-muted/50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium text-foreground truncate">{item.title}</p>
                      {!item.readAt && <Badge variant="outline" className="text-[10px]">new</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{item.message}</p>
                  </button>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9 text-muted-foreground border-border bg-transparent hover:bg-muted rounded-full transition-colors"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-popover text-popover-foreground border-border text-xs font-medium">
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </TooltipContent>
        </Tooltip>

        <div className="flex items-center gap-2 border border-border bg-muted/30 px-3 py-1.5 rounded-md text-sm">
          <span className="text-muted-foreground">User:</span>
          <span className="text-foreground font-medium">{user.name}</span>
        </div>

        <div>
          <RoleBadge role={user.role} />
        </div>
      </div>
    </header>
  );
}
