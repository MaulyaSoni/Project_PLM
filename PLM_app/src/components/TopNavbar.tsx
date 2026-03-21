import { useAuthStore } from '@/stores/useAuthStore';
import { useThemeStore } from '@/stores/useThemeStore';
import { RoleBadge } from '@/components/RoleBadge';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function TopNavbar() {
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  if (!user) return null;

  return (
    <header className="h-14 border-b border-border bg-topbar flex items-center justify-end px-6 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          </TooltipContent>
        </Tooltip>
        <RoleBadge role={user.role} />
        <span className="text-sm font-medium">{user.name}</span>
        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
          {user.name.split(' ').map(n => n[0]).join('')}
        </div>
      </div>
    </header>
  );
}
