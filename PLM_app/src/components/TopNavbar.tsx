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
    <header className="h-16 border-b border-border bg-background flex items-center justify-between px-6 sticky top-0 z-50 font-sans shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-full border border-border">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-foreground text-xs font-medium tracking-wide uppercase">
            Active Workspace
          </span>
        </div>
      </div>
      <div className="flex items-center gap-4">
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
