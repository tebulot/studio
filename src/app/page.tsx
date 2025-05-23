
import NextLink from 'next/link'; // Renamed to avoid conflict
import { Button } from '@/components/ui/button';
import SpiralIcon from '@/components/icons/SpiralIcon';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground font-mono p-8 selection:bg-primary selection:text-primary-foreground">
      <div className="absolute inset-0 overflow-hidden z-0">
        {[...Array(10)].map((_, i) => (
          <SpiralIcon 
            key={i} 
            className="absolute text-primary/5 animate-spin-slow" 
            style={{
              width: `${Math.random() * 200 + 100}px`,
              height: `${Math.random() * 200 + 100}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 10 + 10}s`,
              opacity: Math.random() * 0.1 + 0.02,
            }}
          />
        ))}
      </div>
      
      <div className="relative z-10 text-center flex flex-col items-center">
        <div className="mb-8 transform transition-transform hover:scale-110 active:scale-95">
          <SpiralIcon className="w-28 h-28 md:w-36 md:h-36 text-primary animate-spiral-spin" />
        </div>
        <h1 className="text-5xl md:text-7xl font-black mb-6 glitch-text text-primary uppercase tracking-wider">
          SpiteSpiral
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl md:max-w-2xl leading-relaxed">
          Deploy intelligent network traps. Entangle malicious bots and crawlers in a digital labyrinth, safeguarding your resources.
        </p>
        <Button asChild size="lg" className="px-10 py-6 text-lg bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-300 ease-in-out shadow-[0_0_15px_hsl(var(--primary)),_0_0_30px_hsl(var(--primary)/0.7)] hover:shadow-[0_0_20px_hsl(var(--accent)),_0_0_40px_hsl(var(--accent)/0.7)] rounded-lg">
          <NextLink href="/dashboard">Deploy</NextLink>
        </Button>
      </div>
      
      <footer className="absolute bottom-8 text-sm text-muted-foreground/70 z-10">
        © {new Date().getFullYear()} SpiteSpiral Industries. All rights reserved.
      </footer>
    </div>
  );
}

