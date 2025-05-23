
'use client';

import type { User } from 'firebase/auth';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut, // Renamed to avoid conflict
  sendPasswordResetEmail, // Added for password reset
  type AuthError 
} from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import type { ReactNode, Dispatch, SetStateAction } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/lib/firebase/clientApp';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<User | null>;
  signUp: (email: string, pass: string) => Promise<User | null>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<boolean>; // Added
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const publicPaths = ['/', '/login'];
    const isPublicPath = publicPaths.includes(pathname) || pathname.startsWith('/_next/');

    if (!loading && !user && !isPublicPath) {
      router.push('/login?redirect=' + encodeURIComponent(pathname));
    }
    if (!loading && user && (pathname === '/login' || pathname === '/')) {
        router.push('/dashboard');
    }
  }, [user, loading, router, pathname]);

  const signIn = async (email: string, pass: string): Promise<User | null> => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      setUser(userCredential.user);
      toast({ title: "Signed In", description: "Welcome back!" });
      router.push('/dashboard'); // Explicit redirect
      return userCredential.user;
    } catch (error) {
      const authError = error as AuthError;
      console.error("Sign-in error", authError);
      toast({ title: "Sign In Failed", description: authError.message || "Could not sign in.", variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, pass: string): Promise<User | null> => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      setUser(userCredential.user);
      toast({ title: "Signed Up", description: "Welcome to SpiteSpiral!" });
      router.push('/dashboard'); // Explicit redirect
      return userCredential.user;
    } catch (error) {
      const authError = error as AuthError;
      console.error("Sign-up error", authError);
      toast({ title: "Sign Up Failed", description: authError.message || "Could not sign up.", variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setUser(null);
      toast({ title: "Signed Out", description: "You have been successfully signed out." });
      router.push('/login');
    } catch (error) {
      const authError = error as AuthError;
      console.error("Sign-out error", authError);
      toast({ title: "Sign Out Failed", description: authError.message || "Could not sign out.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordReset = async (email: string): Promise<boolean> => {
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "Password Reset Email Sent",
        description: "Check your inbox (and spam folder) for a link to reset your password.",
      });
      return true;
    } catch (error) {
      const authError = error as AuthError;
      console.error("Password reset error", authError);
      toast({
        title: "Password Reset Failed",
        description: authError.message || "Could not send password reset email.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };


  if (loading && !user) { // Show loading screen only if truly loading initial auth state or during auth operations
    const publicPaths = ['/', '/login'];
    const isPublicPath = publicPaths.includes(pathname) || pathname.startsWith('/_next/');
    if (!isPublicPath || (pathname === '/login' && user)) { // Avoid showing loader on public pages unnecessarily
        return (
        <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
            <div className="flex flex-col items-center space-y-4">
            <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-lg text-muted-foreground">Loading SpiteSpiral...</p>
            </div>
        </div>
        );
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, sendPasswordReset }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
