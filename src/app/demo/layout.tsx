
'use client';

import type { Metadata } from 'next'; // Keep for metadata, but we'll use client features
import NextLink from 'next/link';
import { Button } from '@/components/ui/button';
import BrandLogoIcon from '@/components/icons/BrandLogoIcon';
import BackgroundAnimationToggle from '@/components/layout/BackgroundAnimationToggle';
import { BackgroundAnimationProvider, useBackgroundAnimation } from '@/contexts/BackgroundAnimationContext';

// Note: This demo layout does NOT use AuthProvider to avoid auth-based redirects.

// export const metadata: Metadata = { // Metadata typically defined in Server Components or page.tsx for client ones
//   title: 'SpiteSpiral - Public Demo',
//   description: 'Public demonstration of SpiteSpiral Tarpit dashboard and logs.',
// };

function DemoLayoutContent({ children }: { children: React.ReactNode; }) {
  const { isAnimationEnabled } = useBackgroundAnimation();

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
      <div className="flex flex-col min-h-screen bg-background font-mono text-foreground">
        <header className="sticky top-0 z-40 w-full border-b border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-20 items-center justify-between py-3">
            <NextLink href="/" className="flex items-center gap-3 group">
              <BrandLogoIcon className="h-12 w-12 md:h-14 md:w-14 text-primary" isPriority />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold font-sans glitch-text">
                  <span className="text-primary-foreground">Spite</span><span className="text-primary">Spiral</span>
                </h1>
                <p className="text-xs text-accent">Public Demo Mode</p>
              </div>
            </NextLink>
            <nav className="flex items-center gap-4"> {/* Increased gap for toggle */}
              <BackgroundAnimationToggle />
               <Button asChild variant="outline" className="border-accent text-accent hover:bg-accent/10 hover:text-accent-foreground">
                  <NextLink href="/">
                      Back to Main Site
                  </NextLink>
              </Button>
               <Button asChild className="bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground">
                  <NextLink href="/login">
                      Deploy Your Own
                  </NextLink>
              </Button>
            </nav>
          </div>
        </header>
        <main className="flex-1 container mx-auto p-6 lg:p-10">
          {children}
        </main>
        <footer className="py-6 md:px-8 md:py-0 border-t border-primary/10 bg-card/50">
          <div className="container flex flex-col items-center justify-center gap-2 md:h-20 text-center">
            <NextLink href="/" className="flex items-center gap-2 group mb-2">
              <BrandLogoIcon className="h-8 w-8 text-primary" />
              <span className="text-sm font-semibold text-primary">SpiteSpiral</span>
            </NextLink>
            <p className="text-xs text-muted-foreground/70">
              © {new Date().getFullYear()} SpiteSpiral. Trap with malice.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}

export default function DemoLayout({ children }: { children: React.ReactNode; }) {
  return (
    <BackgroundAnimationProvider>
      <DemoLayoutContent>{children}</DemoLayoutContent>
    </BackgroundAnimationProvider>
  );
}
