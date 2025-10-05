import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import SidebarContent from '@/components/chat/sidebar-content';

export default function ChatAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent />
      </Sidebar>
      <SidebarInset className="flex flex-col h-screen max-h-screen overflow-hidden">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
