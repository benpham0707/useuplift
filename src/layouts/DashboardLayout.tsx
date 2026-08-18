import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/dashboard/AppSidebar';

export default function DashboardLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <MobileSidebarTrigger />
        <main className="flex-1">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function MobileSidebarTrigger() {
  const { openMobile } = useSidebar();
  if (openMobile) return null;

  return (
    <SidebarTrigger className="fixed bottom-4 left-4 z-40 h-11 w-11 rounded-full border border-slate-200 bg-white shadow-lg md:hidden" />
  );
}
