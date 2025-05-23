
'use client';

import NextLink from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SpiralIcon from '@/components/icons/SpiralIcon'; // Keep for potential other uses, though not central logo
import BrandLogoIcon from '@/components/icons/BrandLogoIcon';
import { useState, type FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const { signIn, signUp, loading } = useAuth();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSignUp) {
      await signUp(email, password);
    } else {
      await signIn(email, password);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground font-mono p-8 selection:bg-primary selection:text-primary-foreground">
      <div className="absolute inset-0 overflow-hidden z-0">
        {[...Array(5)].map((_, i) => {
          const bgIconWidth = Math.random() * 150 + 80;
          const bgIconHeight = Math.random() * 150 + 80;
          return (
            <BrandLogoIcon
              key={i}
              className="absolute text-primary/5 animate-spin-slow"
              style={{
                width: `${bgIconWidth}px`,
                height: `${bgIconHeight}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDuration: `${Math.random() * 15 + 12}s`,
                opacity: Math.random() * 0.08 + 0.02,
              }}
              isPriority={false}
            />
          );
        })}
      </div>
      <Card className="w-full max-w-md z-10 bg-card/80 backdrop-blur-sm border-primary/20 shadow-xl shadow-primary/10">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {/* Replaced SpiralIcon with BrandLogoIcon and updated animation */}
            <BrandLogoIcon className="w-16 h-16 text-primary animate-spin-slow" isPriority={true} />
          </div>
          <CardTitle className="text-3xl font-bold text-primary glitch-text">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {isSignUp ? 'Enter your details to join SpiteSpiral.' : 'Enter your credentials to access your SpiteSpiral dashboard.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                  <NextLink href="#" className="text-xs text-accent hover:underline" onClick={(e) => {e.preventDefault(); alert("Password reset not implemented yet.")}}>
                    Forgot password?
                  </NextLink>
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
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSignUp ? 'Sign Up' : 'Login'}
            </Button>
          </form>
          <div className="text-center text-sm text-muted-foreground mt-6">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{' '}
            <Button variant="link" className="font-semibold text-accent hover:underline p-0 h-auto" onClick={() => setIsSignUp(!isSignUp)}>
              {isSignUp ? 'Login' : 'Sign Up'}
            </Button>
          </div>
        </CardContent>
      </Card>
       <footer className="absolute bottom-8 text-sm text-muted-foreground/70 z-10">
        © {new Date().getFullYear()} SpiteSpiral Industries. All rights reserved.
      </footer>
    </div>
  );
}
