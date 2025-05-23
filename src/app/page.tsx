
import NextLink from 'next/link'; // Renamed to avoid conflict
import { Button } from '@/components/ui/button';
import BrandLogoIcon from '@/components/icons/BrandLogoIcon';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Added Card imports

export default function HomePage() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-background text-foreground font-mono p-8 selection:bg-primary selection:text-primary-foreground">
      <div className="absolute inset-0 overflow-hidden z-0">
        {[...Array(10)].map((_, i) => {
          const bgIconWidth = Math.random() * 200 + 100;
          const bgIconHeight = Math.random() * 200 + 100;
          return (
            <BrandLogoIcon
              key={i}
              className="absolute text-primary/5 animate-spin-slow"
              style={{
                // width and height are controlled by className now
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDuration: `${Math.random() * 10 + 10}s`,
                opacity: Math.random() * 0.1 + 0.02,
              }}
              isPriority={false}
            />
          );
        })}
      </div>

      <div className="relative z-10 text-center flex flex-col items-center w-full">
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

        {/* New Informational Section */}
        <div className="mt-20 mb-20 w-full max-w-5xl px-4"> {/* Added mb-20 here */}
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <Card className="border-primary/30 shadow-lg shadow-primary/10 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl text-accent glitch-text">What is a Tarpit?</CardTitle>
              </CardHeader>
              <CardContent className="text-foreground/80 space-y-3">
                <p>A digital snare designed to slow down and neutralize malicious web crawlers and bots.</p>
                <p>By presenting an endless maze of data or excruciatingly slow responses, tarpits waste the resources of automated threats, effectively turning their own persistence against them in a form of recursive resource warfare.</p>
              </CardContent>
            </Card>

            <Card className="border-accent/30 shadow-lg shadow-accent/10 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl text-accent glitch-text">How SpiteSpiral Works</CardTitle>
              </CardHeader>
              <CardContent className="text-foreground/80 space-y-3">
                <p>Embedding SpiteSpiral is effortless. Just add a simple, unique link generated for you to your website's codebase.</p>
                <p>Each plan provides a dedicated, isolated tarpit instance. All interactions are captured in your private logs, giving you clear insights into the unwelcome visitors it ensnares.</p>
              </CardContent>
            </Card>

            <Card className="border-primary/30 shadow-lg shadow-primary/10 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl text-accent glitch-text">Tarpits as a Service (TaaS)</CardTitle>
              </CardHeader>
              <CardContent className="text-foreground/80 space-y-3">
                <p>Manually setting up a tarpit often means your server bears the brunt of the crawler's wasted compute, impacting your own resource costs and potentially SEO.</p>
                <p>SpiteSpiral's TaaS provides managed, scalable instances that absorb this load, trapping crawlers and letting them thrash against the rocks on our infrastructure, without adversely affecting your server performance or SEO.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <footer className="absolute bottom-8 text-sm text-muted-foreground/70 z-10">
        © {new Date().getFullYear()} SpiteSpiral Industries. All rights reserved.
      </footer>
    </div>
  );
}
