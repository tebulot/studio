
'use client';

import NextLink from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import BrandLogoIcon from '@/components/icons/BrandLogoIcon';
import { useState, type FormEvent, useEffect } from 'react'; 
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Mail } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isPasswordResetMode, setIsPasswordResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  
  const { signIn, signUp, loading: authContextLoading, sendPasswordReset } = useAuth(); // Renamed loading from useAuth
  const [resetLoading, setResetLoading] = useState(false);
  const [backgroundIconStyle, setBackgroundIconStyle] = useState<React.CSSProperties | null>(null);

  useEffect(() => {
    setBackgroundIconStyle({
      animationDuration: `${Math.random() * 10 + 10}s`,
    });
  }, []);


  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
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
    setIsPasswordResetMode(false); // Explicitly exit password reset mode
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground font-mono p-8 selection:bg-primary selection:text-primary-foreground">
      <div className="absolute inset-0 overflow-hidden z-0 flex items-center justify-center">
        {backgroundIconStyle && (
           <BrandLogoIcon
            className="w-[500vw] h-[500vh] opacity-5 animate-spin-slow"
            style={backgroundIconStyle} // style prop is used here for animation duration
            isPriority={false}
          />
        )}
      </div>
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
          {isPasswordResetMode ? (
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
       <footer className="absolute bottom-8 text-sm text-muted-foreground/70 z-10 flex flex-col items-center space-y-1">
          <span>© {new Date().getFullYear()} SpiteSpiral. All rights reserved.</span>
          <NextLink href="/legal/licenses" className="hover:text-accent hover:underline animate-link-glow">
            Licenses & Acknowledgements
          </NextLink>
      </footer>
    </div>
  );
}

    
