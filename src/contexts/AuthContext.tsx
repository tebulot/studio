
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
import { auth, db } from '@/lib/firebase/clientApp'; // Added db
import { doc, onSnapshot, type DocumentData, type Timestamp } from 'firebase/firestore'; // Added Firestore imports
import { useToast } from '@/hooks/use-toast';

// Define the structure of the user's profile/subscription data
export interface UserProfile {
  activeTierId: string; // e.g., "window_shopping", "set_and_forget", "analytics"
  subscriptionStatus: "active" | "trialing" | "past_due" | "canceled" | "active_until_period_end" | "pending_downgrade" | string;
  managedUrlLimit: number;
  currentPeriodEnd?: Timestamp; // Firestore Timestamp
  downgradeToTierId?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  // Add other fields as needed
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null; // Added userProfile
  loading: boolean; // True if auth state or profile is loading
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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null); // State for user profile
  const [authLoading, setAuthLoading] = useState(true); // Loading for Firebase Auth state
  const [profileLoading, setProfileLoading] = useState(true); // Loading for Firestore profile

  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (!currentUser) {
        // If user logs out or no user, clear profile and set profileLoading to false
        setUserProfile(null);
        setProfileLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Effect to fetch/listen to user profile from Firestore
  useEffect(() => {
    if (user && user.uid) {
      setProfileLoading(true); // Start loading profile
      const profileDocRef = doc(db, "user_profiles", user.uid);
      const unsubscribeProfile = onSnapshot(profileDocRef, (docSnap) => {
        if (docSnap.exists()) {
          setUserProfile(docSnap.data() as UserProfile);
        } else {
          // Handle case where profile doesn't exist (e.g., new user, default to a base profile)
          // For now, setting to null. Backend should create a default profile on user creation or first subscription.
          console.warn(`User profile not found for UID: ${user.uid}. Consider creating a default profile.`);
          setUserProfile({ // Default to a window_shopping like profile if none exists
              activeTierId: "window_shopping",
              subscriptionStatus: "active", // Or "trialing" if you have trials
              managedUrlLimit: 0,
          });
        }
        setProfileLoading(false); // Profile loaded or confirmed not to exist
      }, (error) => {
        console.error("Error fetching user profile:", error);
        toast({ title: "Error", description: "Could not load user profile.", variant: "destructive" });
        setUserProfile(null);
        setProfileLoading(false);
      });
      return () => unsubscribeProfile();
    } else {
      // No user, so no profile to fetch
      setUserProfile(null);
      setProfileLoading(false); // Not loading if no user
    }
  }, [user, toast]);


  const overallLoading = authLoading || (user != null && profileLoading); // Overall loading is true if auth is loading OR if there's a user but their profile is still loading

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
    setAuthLoading(true);
    setProfileLoading(true); // Expect profile to load after sign-in
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      // User state will be set by onAuthStateChanged, which then triggers profile load
      toast({ title: "Signed In", description: "Welcome back!" });
      router.push('/dashboard');
      return userCredential.user;
    } catch (error) {
      const authError = error as AuthError;
      console.error("Sign-in error", authError);
      toast({ title: "Sign In Failed", description: authError.message || "Could not sign in.", variant: "destructive" });
      setAuthLoading(false);
      setProfileLoading(false);
      return null;
    }
    // Loading state is managed by onAuthStateChanged and profile listener
  };

  const signUp = async (email: string, pass: string): Promise<User | null> => {
    setAuthLoading(true);
    setProfileLoading(true); // Expect profile to load or default profile logic to run
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      // User state set by onAuthStateChanged. Backend should create a default user_profile on new user creation.
      toast({ title: "Signed Up", description: "Welcome to SpiteSpiral!" });
      router.push('/dashboard');
      return userCredential.user;
    } catch (error) {
      const authError = error as AuthError;
      console.error("Sign-up error", authError);
      toast({ title: "Sign Up Failed", description: authError.message || "Could not sign up.", variant: "destructive" });
      setAuthLoading(false);
      setProfileLoading(false);
      return null;
    }
  };

  const signOut = async (): Promise<void> => {
    setAuthLoading(true);
    setUserProfile(null); // Clear profile immediately on sign out attempt
    setProfileLoading(true);
    try {
      await firebaseSignOut(auth);
      // User state will be set to null by onAuthStateChanged
      toast({ title: "Signed Out", description: "You have been successfully signed out." });
      router.push('/login');
    } catch (error) {
      const authError = error as AuthError;
      console.error("Sign-out error", authError);
      toast({ title: "Sign Out Failed", description: authError.message || "Could not sign out.", variant: "destructive" });
    } finally {
      setAuthLoading(false); // Auth state change will handle final loading state
      setProfileLoading(false);
    }
  };

  const sendPasswordReset = async (email: string): Promise<boolean> => {
    // This loading is local to the operation, not global auth state
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
    // This loading is local to the operation
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
    // This loading is local to the operation
    try {
      await updateProfile(auth.currentUser, { displayName: newDisplayName });
      // Manually trigger a refresh of user state if needed, though onAuthStateChanged might pick it up
      // For immediate UI update, consider updating local user state if AuthContext manages a copy
      // For now, Firebase backend change should eventually propagate to onAuthStateChanged listener.
      setUser(auth.currentUser); // Optimistic update for displayName
      toast({ title: "Username Updated", description: "Your username has been successfully updated." });
      return true;
    } catch (error) {
      const authError = error as AuthError;
      console.error("Update display name error", authError);
      toast({ title: "Update Username Failed", description: authError.message || "Could not update username.", variant: "destructive" });
      return false;
    }
  };

  if (overallLoading && !userProfile) { // Show global loader if auth is loading or if user exists but profile isn't loaded yet
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

    