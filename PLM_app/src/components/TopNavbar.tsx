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
    <header className="h-16 border-b border-white/10 bg-white/[0.02] backdrop-blur-2xl flex items-center justify-between px-6 sticky top-0 z-20 font-sans shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-[#FF00FF] animate-pulse shadow-[0_0_10px_rgba(0,212,255,0.8)]" />
          <span className="text-white text-xs font-bold tracking-wide uppercase">
            Active
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
              className="h-9 w-9 text-white border-white/10 bg-white/5 hover:bg-white/10 hover:text-white rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.5)] transition-all duration-300"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-black/50 backdrop-blur-xl text-white border border-white/10 font-sans rounded-xl text-xs font-bold">
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </TooltipContent>
        </Tooltip>

        <div className="flex items-center gap-2 border border-white/10 bg-white/5 px-4 py-1.5 rounded-full text-sm font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
          <span className="text-white/50">User</span>
          <span className="text-white font-bold drop-shadow-sm">{user.name}</span>
        </div>

        <div className="opacity-90">
          <RoleBadge role={user.role} />
        </div>
      </div>
    </header>
  );
}
