
'use client';

import NextLink from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import BrandLogoIcon from '@/components/icons/BrandLogoIcon';
import { useState, type FormEvent, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Mail, Home } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isPasswordResetMode, setIsPasswordResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const { signIn, signUp, loading: authContextLoading, sendPasswordReset } = useAuth();
  const [resetLoading, setResetLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const directTarpitUrl = "https://api.spitespiral.com/trap/a218a364-aec0-4e17-a218-321d59dd29d2";


  useEffect(() => {
    setIsMounted(true);
  }, []);

  // For JS-injected footer link
  useEffect(() => {
    if (isMounted) {
      const container = document.getElementById('spite-footer-container-login');
      if (container && !container.querySelector('a')) {
        const link = document.createElement('a');
        link.href = "/sneedsfeedandseed/";
        link.title = "Internal Archive JS Redirect - Login Page";
        link.setAttribute('aria-hidden', 'true');
        link.setAttribute('tabindex', '-1');
        link.style.cssText = "font-size:1px; color:transparent; opacity:0.01;";
        link.innerHTML = ".";
        container.appendChild(link);
      }
    }
  }, [isMounted]);


  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsPasswordResetMode(false); // Ensure we are not in password reset mode on main submission
    if (isSignUp) {
      await signUp(email, password);
    } else {
      await signIn(email, password);
    }
  };

  const handlePasswordResetRequest = async (event: FormEvent) => {
    event.preventDefault();
    setResetLoading(true);
    const success = await sendPasswordReset(resetEmail);
    setResetLoading(false);
    if (success) {
      setIsPasswordResetMode(false);
      setResetEmail('');
    }
  };

  const handleAuthModeToggle = () => {
    setIsSignUp(prev => !prev);
    setIsPasswordResetMode(false);
  };

  return (
    <>
      {/* Invisible direct tarpit link for header area */}
      <a
        href={directTarpitUrl}
        rel="nofollow noopener noreferrer"
        aria-hidden="true"
        tabIndex={-1}
        style={{
          opacity: 0.01,
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          fontSize: '1px',
          color: 'transparent',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
        }}
        title="SpiteSpiral Internal Data - Login Page"
      >
        .
      </a>
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground font-mono p-4 sm:p-6 md:p-8 selection:bg-primary selection:text-primary-foreground">
        {isMounted && (
          <div className="fixed inset-0 overflow-hidden z-0 flex items-center justify-center">
            <BrandLogoIcon
              className="w-[500vw] h-[500vh] opacity-5 animate-spin-slow"
              isPriority={false}
            />
          </div>
        )}
        <Card className="w-full max-w-md z-10 bg-card/80 backdrop-blur-sm border-primary/20 shadow-xl shadow-primary/10">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <BrandLogoIcon className="w-16 h-16 animate-spin-slow" style={{animationDuration: '5s'}} isPriority={true} />
            </div>
            <CardTitle className="text-3xl font-bold text-primary glitch-text">
              {isPasswordResetMode ? 'Reset Password' : isSignUp ? 'Create Account' : 'Welcome Back'}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {isPasswordResetMode
                ? 'Enter your email to receive a password reset link.'
                : isSignUp
                ? 'Enter your details to join SpiteSpiral.'
                : 'Enter your credentials to access your SpiteSpiral dashboard.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isMounted ? (
              <div className="space-y-6 py-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : isPasswordResetMode ? (
              <form onSubmit={handlePasswordResetRequest} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="text-foreground/80">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="you@example.com"
                    className="bg-input border-border focus:ring-primary"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground shadow-[0_0_10px_hsl(var(--primary)/0.5)] hover:shadow-[0_0_15px_hsl(var(--accent)/0.7)]"
                  disabled={resetLoading || authContextLoading}
                >
                  {(resetLoading || authContextLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Reset Email
                </Button>
                <div className="text-center text-sm">
                  <Button variant="link" className="font-semibold text-accent hover:underline p-0 h-auto" onClick={() => setIsPasswordResetMode(false)}>
                    Back to Login
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground/80">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="bg-input border-border focus:ring-primary"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-foreground/80">Password</Label>
                    {!isSignUp && (
                      <Button variant="link" className="text-xs text-accent hover:underline p-0 h-auto" onClick={(e) => {e.preventDefault(); setIsPasswordResetMode(true);}}>
                        Forgot password?
                      </Button>
                    )}
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="bg-input border-border focus:ring-primary"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground shadow-[0_0_10px_hsl(var(--primary)/0.5)] hover:shadow-[0_0_15px_hsl(var(--accent)/0.7)]"
                  disabled={authContextLoading}
                >
                  {authContextLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSignUp ? 'Sign Up' : 'Login'}
                </Button>
                <div className="text-center text-sm text-muted-foreground">
                  {isSignUp ? "Already have an account?" : "Don't have an account?"}{' '}
                  <Button variant="link" className="font-semibold text-accent hover:underline p-0 h-auto" onClick={handleAuthModeToggle}>
                    {isSignUp ? 'Login' : 'Sign Up'}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
         <footer className="py-6 md:px-8 md:py-0 border-t border-primary/10 bg-card/50 mt-auto">
          <div className="container flex flex-col items-center justify-center gap-2 md:h-20 text-center">
            <NextLink href="/" className="flex items-center gap-2 group mb-1">
              <BrandLogoIcon className="h-8 w-8 text-primary" />
              <span className="text-sm font-semibold text-primary">SpiteSpiral</span>
            </NextLink>
            <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
              <NextLink href="/" className="hover:text-accent animate-link-glow flex items-center">
                <Home className="mr-1 h-3 w-3" /> Back to Home
              </NextLink>
              <span>|</span>
              <NextLink href="/legal/licenses" className="hover:text-accent animate-link-glow">
                Licenses & Acknowledgements
              </NextLink>
            </div>
            <p className="text-xs text-muted-foreground/70">
              © {new Date().getFullYear()} SpiteSpiral. Trap with malice.
            </p>
          </div>
          {/* Invisible JS-injected redirect tarpit link for footer area */}
          {isMounted && (
            <div id="spite-footer-container-login" aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: '-9999px', opacity: 0, width: '1px', height: '1px', overflow: 'hidden' }}>
              {/* JS will inject here */}
            </div>
          )}
        </footer>
      </div>
    </>
  );
}
