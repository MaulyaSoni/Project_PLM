import { Outlet } from 'react-router-dom';
import { AppSidebar } from '@/components/AppSidebar';
import { TopNavbar } from '@/components/TopNavbar';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-[#050514] font-sans relative overflow-hidden text-foreground">
      {/* Soft Cyber Glowing Orbs Background */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full mix-blend-screen filter blur-[120px] opacity-60 pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#FF00FF]/10 rounded-full mix-blend-screen filter blur-[140px] opacity-50 pointer-events-none" />

      <div className="relative z-10 flex min-h-screen">
        <AppSidebar />
        <div className="flex-1 ml-60 flex flex-col min-h-screen">
          <TopNavbar />
          <main className="flex-1 p-6 relative">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
