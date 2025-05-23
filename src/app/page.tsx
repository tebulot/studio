
import NextLink from 'next/link'; // Renamed to avoid conflict
import { Button } from '@/components/ui/button';
import BrandLogoIcon from '@/components/icons/BrandLogoIcon';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground font-mono p-8 selection:bg-primary selection:text-primary-foreground">
      <div className="absolute inset-0 overflow-hidden z-0">
        {[...Array(10)].map((_, i) => {
          const bgIconWidth = Math.random() * 200 + 100;
          const bgIconHeight = Math.random() * 200 + 100;
          return (
            <BrandLogoIcon
              key={i}
              className="absolute text-primary/5 animate-spin-slow"
              style={{
                width: `${bgIconWidth}px`,
                height: `${bgIconHeight}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDuration: `${Math.random() * 10 + 10}s`,
                opacity: Math.random() * 0.1 + 0.02,
              }}
              isPriority={false} // Explicitly false for background icons
            />
          );
        })}
      </div>

      <div className="relative z-10 text-center flex flex-col items-center">
        <div className="mb-4 transform transition-transform hover:scale-110 active:scale-95">
          <BrandLogoIcon className="w-56 h-56 md:w-72 md:h-72" isPriority={true} />
        </div>
        <h1 className="text-5xl md:text-7xl font-black font-sans mb-10 glitch-text tracking-wider">
          <span className="text-primary-foreground">Spite</span><span className="text-primary">Spiral</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl md:max-w-2xl leading-relaxed">
          AI crawlers nuking your operating costs? Robots.txt being ignored? Your hard work feeding their AI, royalty-free? Lead them down the garden path, towards endless, recursive slop and make them choke on it.
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
