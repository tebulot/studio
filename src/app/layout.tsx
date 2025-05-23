
import type {Metadata} from 'next';
import { Geist, Geist_Mono } from 'next/font/google'; // Corrected import
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { cn } from '@/lib/utils';
import { AuthProvider } from '@/contexts/AuthContext'; // Added AuthProvider

const geistSans = Geist({ // Corrected instantiation
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({ // Corrected instantiation
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'SpiteSpiral Tarpit',
  description: 'Advanced Tarpit as a Service by SpiteSpiral',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={cn(
        "min-h-screen bg-background font-mono antialiased",
        geistSans.variable,
        geistMono.variable
      )}>
        <AuthProvider> {/* Wrapped children with AuthProvider */}
          {children}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
