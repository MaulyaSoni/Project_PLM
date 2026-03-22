import { Outlet } from 'react-router-dom';
import { AppSidebar } from '@/components/AppSidebar';
import { TopNavbar } from '@/components/TopNavbar';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background font-sans relative flex text-foreground">
      <AppSidebar />
      <div className="flex-1 ml-64 flex flex-col min-h-screen border-l border-border">
        <TopNavbar />
        <main className="flex-1 p-8 bg-muted/30">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
