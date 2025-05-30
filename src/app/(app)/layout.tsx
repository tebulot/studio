
'use client';

import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarTrigger, SidebarFooter } from "@/components/ui/sidebar";
import AppHeaderContent from '@/components/layout/AppHeaderContent';
import BackgroundAnimationToggle from '@/components/layout/BackgroundAnimationToggle';
import { LayoutDashboard, Link2, Menu, LogOut, UserCog } from 'lucide-react';
import NextLink from 'next/link';
import { Button } from '@/components/ui/button';
import BrandLogoIcon from '@/components/icons/BrandLogoIcon';
import { useAuth } from "@/contexts/AuthContext";
import { BackgroundAnimationProvider, useBackgroundAnimation } from "@/contexts/BackgroundAnimationContext";

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const { signOut, loading } = useAuth();
  const { isAnimationEnabled } = useBackgroundAnimation();

  const handleSignOut = async () => {
    await signOut();
    // Navigation to /login is handled by AuthContext or explicitly in signOut function
  };

  return (
    <>
      {isAnimationEnabled && (
        <div className="fixed inset-0 -z-10 flex items-center justify-center overflow-hidden pointer-events-none">
          <BrandLogoIcon
            className="w-[500vw] h-[500vh] opacity-5 animate-spin-slow"
            isPriority={false}
          />
        </div>
      )}
      <SidebarProvider defaultOpen>
        <div className="flex min-h-screen bg-background font-mono text-foreground">
          <Sidebar collapsible="icon" variant="sidebar" side="left" className="border-r-2 border-primary/20">
            <SidebarHeader className="p-4 border-b border-primary/20 flex items-center justify-between">
              <AppHeaderContent />
              <div className="group-data-[state=collapsed]:hidden">
                <BackgroundAnimationToggle />
              </div>
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
                  <SidebarMenuButton asChild tooltip={{content:"Account", side:"right", className:"bg-popover text-popover-foreground border-primary/50"}} className="justify-start">
                    <NextLink href="/account" className="flex items-center">
                      <UserCog className="mr-2 h-5 w-5 text-accent" />
                      <span className="text-base">Account</span>
                    </NextLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarContent>
            <SidebarFooter className="mt-auto p-2 border-t border-primary/20">
               <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip={{content:"Sign Out", side:"right", className:"bg-popover text-popover-foreground border-primary/50"}}
                    className="justify-start w-full"
                    onClick={handleSignOut}
                    disabled={loading}
                  >
                    <LogOut className="mr-2 h-5 w-5 text-destructive" />
                    <span className="text-base text-destructive">Sign Out</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {/* <div className="h-10 bg-sidebar-primary rounded-md mx-[-0.5rem] mb-[-0.5rem]"></div> Removed this line */}
            </SidebarFooter>
          </Sidebar>
          <SidebarInset>
            <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6 md:hidden">
              <NextLink href="/" className="flex items-center gap-2 text-lg font-semibold md:text-base">
                <BrandLogoIcon className="h-8 w-8 text-primary" /> {/* Adjusted size for mobile header */}
                <span className="glitch-text text-primary">SpiteSpiral</span>
              </NextLink>
              <div className="flex items-center gap-2">
                <BackgroundAnimationToggle />
                <SidebarTrigger asChild>
                   <Button variant="outline" size="icon" className="shrink-0 md:hidden border-primary text-primary hover:bg-primary/10">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle navigation menu</span>
                  </Button>
                </SidebarTrigger>
              </div>
            </header>
            <main className="flex-1 p-6 lg:p-10 overflow-auto">
              {children}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <BackgroundAnimationProvider>
      <AppLayoutContent>{children}</AppLayoutContent>
    </BackgroundAnimationProvider>
  );
}
