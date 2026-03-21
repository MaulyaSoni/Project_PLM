import { Outlet } from 'react-router-dom';
import { AppSidebar } from '@/components/AppSidebar';
import { TopNavbar } from '@/components/TopNavbar';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <div className="ml-60">
        <TopNavbar />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
