
import NextLink from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SpiralIcon from '@/components/icons/SpiralIcon';

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground font-mono p-8 selection:bg-primary selection:text-primary-foreground">
      <div className="absolute inset-0 overflow-hidden z-0">
        {[...Array(5)].map((_, i) => (
          <SpiralIcon
            key={i}
            className="absolute text-primary/5 animate-spin-slow"
            style={{
              width: `${Math.random() * 150 + 80}px`,
              height: `${Math.random() * 150 + 80}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 15 + 12}s`,
              opacity: Math.random() * 0.08 + 0.02,
            }}
          />
        ))}
      </div>
      <Card className="w-full max-w-md z-10 bg-card/80 backdrop-blur-sm border-primary/20 shadow-xl shadow-primary/10">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <SpiralIcon className="w-16 h-16 text-primary animate-spiral-spin" style={{ animationDuration: '5s' }} />
          </div>
          <CardTitle className="text-3xl font-bold text-primary glitch-text">Welcome Back</CardTitle>
          <CardDescription className="text-muted-foreground">
            Enter your credentials to access your SpiteSpiral dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground/80">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" className="bg-input border-border focus:ring-primary" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-foreground/80">Password</Label>
              <NextLink href="#" className="text-xs text-accent hover:underline">
                Forgot password?
              </NextLink>
            </div>
            <Input id="password" type="password" placeholder="••••••••" className="bg-input border-border focus:ring-primary" />
          </div>
          <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground shadow-[0_0_10px_hsl(var(--primary)/0.5)] hover:shadow-[0_0_15px_hsl(var(--accent)/0.7)]">
            Login
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <NextLink href="#" className="font-semibold text-accent hover:underline">
              Sign Up
            </NextLink>
          </div>
        </CardContent>
      </Card>
       <footer className="absolute bottom-8 text-sm text-muted-foreground/70 z-10">
        © {new Date().getFullYear()} SpiteSpiral Industries. All rights reserved.
      </footer>
    </div>
  );
}
