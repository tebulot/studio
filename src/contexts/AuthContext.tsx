
'use client';

import type { User } from 'firebase/auth';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  verifyBeforeUpdateEmail,
  type AuthError
} from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase/clientApp';
import { doc, onSnapshot, type Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

// Define the structure of the user's profile/subscription data
export interface UserProfile {
  activeTierId: string;
  subscriptionStatus: "active" | "trialing" | "past_due" | "canceled" | "active_until_period_end" | "pending_downgrade" | string;
  managedUrlLimit: number;
  currentPeriodEnd?: Timestamp;
  downgradeToTierId?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  // Add other fields as needed, e.g., displayName if you store it here too
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<User | null>;
  signUp: (email: string, pass: string) => Promise<User | null>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<boolean>;
  updateUserEmail: (newEmail: string) => Promise<boolean>;
  updateUserDisplayName: (newDisplayName: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true); // Initialize as true

  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (!currentUser) {
        setUserProfile(null);
        setProfileLoading(false); // No profile to load if no user
      } else {
        setProfileLoading(true); // Reset profile loading when user changes
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (user && user.uid) {
      console.log(`AuthContext: Attempting to fetch profile for UID: ${user.uid}`); // Log UID
      setProfileLoading(true);
      const profileDocRef = doc(db, "user_profiles", user.uid);
      const unsubscribeProfile = onSnapshot(profileDocRef, (docSnap) => {
        if (docSnap.exists()) {
          setUserProfile(docSnap.data() as UserProfile);
          console.log(`AuthContext: Profile loaded for UID: ${user.uid}`, docSnap.data());
        } else {
          console.warn(`AuthContext: User profile not found for UID: ${user.uid}. Using default.`);
          setUserProfile({
              activeTierId: "window_shopping",
              subscriptionStatus: "active",
              managedUrlLimit: 0,
          });
        }
        setProfileLoading(false);
      }, (error) => {
        console.error(`AuthContext: Error fetching user profile for UID: ${user.uid}. Error:`, error);
        toast({
          title: "Profile Error",
          description: `Could not load your profile data (UID: ${user.uid}). Some features might be limited. Error: ${error.message}`,
          variant: "destructive",
          duration: 7000,
        });
        setUserProfile(null);
        setProfileLoading(false);
      });
      return () => unsubscribeProfile();
    } else if (!user && !authLoading) { // If no user and auth is done loading
        setUserProfile(null);
        setProfileLoading(false);
    }
  }, [user, authLoading, toast]); // Added authLoading as a dependency

  const overallLoading = authLoading || (user != null && profileLoading);

  useEffect(() => {
    const publicPaths = ['/', '/login', '/legal/licenses'];
    const isPublicPath = publicPaths.some(p => pathname === p || (p !== '/' && pathname.startsWith(p + '/'))) ||
                         pathname.startsWith('/_next/') ||
                         pathname.startsWith('/demo');

    if (!overallLoading && !user && !isPublicPath) {
      router.push('/login?redirect=' + encodeURIComponent(pathname));
    }
    if (!overallLoading && user && pathname === '/login') {
        router.push('/dashboard');
    }
  }, [user, overallLoading, router, pathname]);

  const signIn = async (email: string, pass: string): Promise<User | null> => {
    // Local loading state for sign-in operation, not global authLoading
    // setAuthLoading(true); // This is handled by onAuthStateChanged
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      // User state will be set by onAuthStateChanged, which then triggers profile load
      toast({ title: "Signed In", description: "Welcome back!" });
      router.push('/dashboard'); // Explicit redirect after successful sign-in
      return userCredential.user;
    } catch (error) {
      const authError = error as AuthError;
      console.error("Sign-in error", authError);
      toast({ title: "Sign In Failed", description: authError.message || "Could not sign in.", variant: "destructive" });
      return null;
    }
  };

  const signUp = async (email: string, pass: string): Promise<User | null> => {
    // setAuthLoading(true); // Handled by onAuthStateChanged
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      toast({ title: "Signed Up", description: "Welcome to SpiteSpiral!" });
      router.push('/dashboard');
      return userCredential.user;
    } catch (error) {
      const authError = error as AuthError;
      console.error("Sign-up error", authError);
      toast({ title: "Sign Up Failed", description: authError.message || "Could not sign up.", variant: "destructive" });
      return null;
    }
  };

  const signOut = async (): Promise<void> => {
    // setAuthLoading(true); // Handled by onAuthStateChanged
    try {
      await firebaseSignOut(auth);
      setUserProfile(null); // Clear profile on sign out
      toast({ title: "Signed Out", description: "You have been successfully signed out." });
      router.push('/login');
    } catch (error) {
      const authError = error as AuthError;
      console.error("Sign-out error", authError);
      toast({ title: "Sign Out Failed", description: authError.message || "Could not sign out.", variant: "destructive" });
    }
  };

  const sendPasswordReset = async (email: string): Promise<boolean> => {
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
    }
  };

  const updateUserEmail = async (newEmail: string): Promise<boolean> => {
    if (!auth.currentUser) {
      toast({ title: "Error", description: "No user logged in.", variant: "destructive" });
      return false;
    }
    try {
      await verifyBeforeUpdateEmail(auth.currentUser, newEmail);
      toast({
        title: "Verification Email Sent",
        description: `A verification email has been sent to ${newEmail}. Please check your inbox to complete the email change. Your current email remains active until then.`,
        duration: 10000,
      });
      return true;
    } catch (error) {
      const authError = error as AuthError;
      console.error("Update email error", authError);
      toast({ title: "Update Email Failed", description: authError.message || "Could not start email update process.", variant: "destructive" });
      return false;
    }
  };

  const updateUserDisplayName = async (newDisplayName: string): Promise<boolean> => {
    if (!auth.currentUser) {
      toast({ title: "Error", description: "No user logged in.", variant: "destructive" });
      return false;
    }
    try {
      await updateProfile(auth.currentUser, { displayName: newDisplayName });
      setUser(prevUser => prevUser ? { ...prevUser, displayName: newDisplayName } as User : null); // Optimistic update
      toast({ title: "Username Updated", description: "Your username has been successfully updated." });
      return true;
    } catch (error) {
      const authError = error as AuthError;
      console.error("Update display name error", authError);
      toast({ title: "Update Username Failed", description: authError.message || "Could not update username.", variant: "destructive" });
      return false;
    }
  };

  if (overallLoading) { // Simplified condition for global loader
    const publicPathsForLoadingScreen = ['/', '/login', '/legal/licenses'];
    const isPublicLoadingPath = publicPathsForLoadingScreen.some(p => pathname === p || (p !== '/' && pathname.startsWith(p + '/'))) ||
                               pathname.startsWith('/_next/') ||
                               pathname.startsWith('/demo');

    if (!isPublicLoadingPath) {
        return (
        <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
            <div className="flex flex-col items-center space-y-4">
            <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-lg text-muted-foreground">Loading SpiteSpiral Profile...</p>
            </div>
        </div>
        );
    }
  }

  return (
    <AuthContext.Provider value={{ user, userProfile, loading: overallLoading, signIn, signUp, signOut, sendPasswordReset, updateUserEmail, updateUserDisplayName }}>
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

    
