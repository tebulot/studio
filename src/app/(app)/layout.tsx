import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import AppHeaderContent from '@/components/layout/AppHeaderContent';
import { LayoutDashboard, Link2, ShieldAlert, Menu } from 'lucide-react';
import NextLink from 'next/link'; // Renamed to avoid conflict
import { Button } from '@/components/ui/button';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen bg-background font-mono text-foreground">
        <Sidebar collapsible="icon" variant="sidebar" side="left" className="border-r-2 border-primary/20">
          <SidebarHeader className="p-4 border-b border-primary/20">
            <AppHeaderContent />
          </SidebarHeader>
          <SidebarContent className="p-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={{content:"Dashboard", side:"right", className:"bg-popover text-popover-foreground border-primary/50"}} className="justify-start">
                  <NextLink href="/dashboard" className="flex items-center">
                    <LayoutDashboard className="mr-2 h-5 w-5 text-accent" />
                    <span className="text-base">Dashboard</span>
                  </NextLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={{content:"Managed URLs", side:"right", className:"bg-popover text-popover-foreground border-primary/50"}} className="justify-start">
                  <NextLink href="/managed-urls" className="flex items-center">
                    <Link2 className="mr-2 h-5 w-5 text-accent" />
                    <span className="text-base">Managed URLs</span>
                  </NextLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={{content:"Anomaly Detection", side:"right", className:"bg-popover text-popover-foreground border-primary/50"}} className="justify-start">
                  <NextLink href="/anomaly-detection" className="flex items-center">
                    <ShieldAlert className="mr-2 h-5 w-5 text-accent" />
                    <span className="text-base">Anomaly Detection</span>
                  </NextLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6 md:hidden">
            {/* Mobile Header: Show app name/logo and sidebar trigger */}
            <NextLink href="/" className="flex items-center gap-2 text-lg font-semibold md:text-base">
              <SpiralIcon className="h-6 w-6 text-primary" />
              <span className="glitch-text text-primary">SpiteSpiral</span>
            </NextLink>
            <SidebarTrigger asChild>
               <Button variant="outline" size="icon" className="shrink-0 md:hidden border-primary text-primary hover:bg-primary/10">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SidebarTrigger>
          </header>
          <main className="flex-1 p-6 lg:p-10 overflow-auto">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
