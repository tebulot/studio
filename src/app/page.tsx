
'use client'; 

import NextLink from 'next/link';
import { Button } from '@/components/ui/button';
import BrandLogoIcon from '@/components/icons/BrandLogoIcon';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useState, useEffect } from 'react';

export default function HomePage() {
  const [backgroundIconStyles, setBackgroundIconStyles] = useState<React.CSSProperties[]>([]);

   useEffect(() => {
    const generateStyles = () => {
      const newStyles = Array.from({ length: 1 }).map(() => ({ // Changed to 1 for a single large icon
        width: `500vw`, 
        height: `500vh`, 
        top: `50%`, 
        left: `50%`,
        transform: 'translate(-50%, -50%)', // Centering
        animationDuration: `${Math.random() * 10 + 10}s`, // Randomize spin speed slightly
        opacity: 0.05, // Low opacity
      }));
      setBackgroundIconStyles(newStyles);
    };
    generateStyles();
  }, []);

  const faqData = [
    {
      question: "What are these AI crawlers and scrapers you're talking about?",
      answer: "They're automated software scripts that roam the internet. Some are legitimate, like search engine crawlers (Googlebot, Bingbot). Many others are a nuisance or outright malicious. Think content scrapers stealing your articles, price bots undercutting your store, spambots filling your forms, vulnerability scanners looking for weaknesses, or just aggressive bots hogging your server resources and slowing your site down for real people."
    },
    {
      question: "Realistically, what damage can these unwanted crawlers do to my website?",
      answer: (
        <>
          More than you might think.
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Increased Server Load & Higher Costs:</strong> They consume your bandwidth and CPU, potentially making your site sluggish for actual users and driving up your hosting expenses.</li>
            <li><strong>Content & Data Theft:</strong> Your original blog posts, product descriptions, images, or pricing can be lifted and reused elsewhere, hurting your SEO and competitive edge.</li>
            <li><strong>Skewed Analytics:</strong> Bot traffic makes it hard to understand who your real audience is and how they behave, messing up your marketing data.</li>
            <li><strong>Spam & Annoyance:</strong> Flooding contact forms, comment sections, or attempting fake sign-ups.</li>
            <li><strong>Reconnaissance for Attacks:</strong> Some bots are purely scanning for outdated software or security holes to exploit. While SpiteSpiral is primarily a deterrent for nuisance bots, reducing their presence can sometimes limit this initial probing.</li>
          </ul>
        </>
      )
    },
    {
      question: "What exactly is a Tarpit and how does it stop them?",
      answer: "Imagine digital flypaper for bots. When a crawler accesses one of our special Managed URLs that you've placed on your site, our SpiteSpiral tarpit servers deliberately engage with it very, very slowly. We might feed it data at a snail's pace, send it an endless stream of trivial information, or make it think it's found something interesting that requires many slow requests. The goal isn't to block it with a \"403 Forbidden\" (it might just try again from a different IP), but to waste its time and computational resources, making your site an incredibly inefficient and frustrating target."
    },
    {
      question: "So, what is SpiteSpiral and how does it fit in?",
      answer: "We manage the \"digital flypaper\" for you. You sign up, we give you unique URLs (your Managed URLs). You embed these discreetly on your website using simple HTML snippets we provide. When bots hit these URLs, they're directed to our specialized SpiteSpiral tarpit infrastructure, which bogs them down. Your website continues to operate normally for your human visitors, while the nuisance bots get stuck dealing with us."
    },
    {
      question: "Let's be brutally honest: Why should I pay for SpiteSpiral? Can't I just set up my own tarpit?",
      answer: (
        <>
          Yes, you absolutely can. There are open-source tarpit solutions available. If you have the technical expertise to install, configure, secure, monitor, and maintain such software on a server, and you're willing to dedicate the time, that's a valid option.
          <p className="mt-2">Here’s why SpiteSpiral exists and why you'd pay for it:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>It’s a Hassle We Handle:</strong> Setting up a tarpit correctly involves more than just installing software. You need to manage server resources, deal with operating system updates, patch the tarpit software, ensure it doesn't crash, and make sure its resource consumption doesn't accidentally impact your primary website if hosted on the same server. SpiteSpiral takes care of all this infrastructure and maintenance.</li>
            <li><strong>Expert Configuration:</strong> We optimize our tarpits to be effective without becoming a liability. A poorly configured DIY tarpit could consume too many of your own server resources or even be fingerprinted and bypassed more easily.</li>
            <li><strong>Dedicated & Isolated Infrastructure:</strong> Our tarpits run on servers separate from your website. This means when a bot is being bogged down, it's our server resources being used, not your website's, ensuring your site performance for real users remains unaffected.</li>
            <li><strong>Simplicity & Ease of Use:</strong> You get a URL and a snippet. That's your involvement. No server admin, no command lines, no software updates for you to worry about in this regard.</li>
            <li><strong>Actionable Analytics (Planned/Included):</strong> SpiteSpiral aims to provide a dashboard showing you what's hitting your Managed URLs. Setting up effective logging, aggregation, and a user-friendly display for a DIY solution is a significant extra project.</li>
            <li><strong>Focus:</strong> You probably have a business to run that isn't "tarpit administration." SpiteSpiral lets you offload this specific, niche task so you can focus on your core activities. It's like email – you could run your own mail server, but most businesses pay for a managed service.</li>
          </ul>
        </>
      )
    },
     {
      question: "Will SpiteSpiral make my website slower for my actual human visitors?",
      answer: "No. The Managed URL you embed is designed to be unobtrusive (e.g., a 1x1 pixel image, an invisible stylesheet link). Your website loads from your server as usual. The \"slowing down\" effect is only experienced by the bot when it specifically requests that Managed URL, and that interaction happens with our separate SpiteSpiral tarpit servers."
    },
    {
      question: "Could SpiteSpiral mess with my SEO or get my site penalized by Google?",
      answer: "Highly unlikely, and SpiteSpiral is designed to avoid this. The methods for embedding the Managed URLs are chosen to be ignored by or irrelevant to legitimate search engine crawlers like Googlebot when they are indexing your actual content. We're not cloaking or doing anything deceptive to search engines. In fact, by reducing server load from junk traffic, you might even see slight indirect improvements in site performance, which is a positive SEO signal. However, no one can offer absolute 100% guarantees with SEO, as search engine algorithms are complex and ever-changing."
    },
    {
      question: "What kinds of bots will SpiteSpiral actually catch? Is it a silver bullet?",
      answer: "SpiteSpiral is effective against a broad range of automated, less sophisticated bots – common content scrapers, basic price bots, indiscriminate vulnerability scanners, and other general nuisance crawlers that just blindly follow links and try to fetch all resources. It is NOT a silver bullet. No single tool is. Highly advanced bots, determined human attackers, or very targeted scraping efforts might use techniques to bypass simpler tarpits. This service is an excellent layer in your website's defense and a great way to reduce the noise from common \"drive-by\" bot traffic. It's not a replacement for a comprehensive security posture, which might include a Web Application Firewall (WAF), strong password policies, and regular software updates."
    },
    {
      question: "What insights will I get from SpiteSpiral? Do I see which bots are caught?",
      answer: "Our goal is to provide you with a dashboard showing activity on your Managed URLs. You'll typically see data like the IP addresses of caught bots, their reported user-agents, timestamps, and which of your Managed URLs they hit. This helps you see SpiteSpiral working and understand the background noise your site experiences."
    },
    {
      question: "How easy is it to get started with SpiteSpiral and implement it on my site?",
      answer: (
        <>
          Very easy.
          <ol className="list-decimal pl-5 space-y-1 mt-2">
            <li>Sign up for an account with SpiteSpiral.</li>
            <li>From your dashboard, you'll get your unique Managed URL(s).</li>
            <li>SpiteSpiral provides you with a small HTML snippet. Copy it.</li>
            <li>Paste this snippet into your website's HTML (e.g., in your site footer or header template). We give clear instructions.</li>
            <li>That’s it! You can then monitor activity via your SpiteSpiral dashboard.</li>
          </ol>
        </>
      )
    },
    {
      question: "What if a \"good\" bot, like Googlebot, accidentally hits a SpiteSpiral Managed URL?",
      answer: "The recommended embedding methods are designed to make this unlikely for major search engine crawlers that are focused on your primary content. Our SpiteSpiral tarpits are also generally configured to be less immediately aggressive, so an accidental hit from a known, reputable crawler (which often identify themselves clearly) is unlikely to cause them significant, lasting issues. The primary targets are the persistent, unidentified, or clearly unwanted crawlers."
    },
    {
      question: "So, why the name SpiteSpiral?",
      answer: "I'm sure if you've read this far, you're either already pretty pissed off, or you're starting to get pretty annoyed. The creator of Nepenthes, the Tarpit SpiteSpiral utilises heavily as it's original codebase under the MIT license, speaks of AI crawlers with such a distaste and frustration, that I was moved to build this site and this service to allow those without the technical knowledge, infrastructure or time to set a Tarpit up for themselves on their own website. In some regards, it's an act of desperation, self damaging, and can lead to your website disappearing off of search engine results. The point is to do damage. It's a destructive, malicious, and spiteful measure to implement. SpiteSpiral allows us to take the punches, burn our CPU cycles and power to trap these things in a purgatory of endless recursion, and protect your website from the negative effects. And between you and me, this kind of abstract, compute based warfare is so darn interesting. So you can be sure I'm going to be utilising everything at my disposal to continue to mutate, adapt, and abstract SpiteSpiral to ensure we're on the front lines, ensuring we do as much damage as we possibly can."
    }
  ];


  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-background text-foreground font-mono p-8 selection:bg-primary selection:text-primary-foreground">
      <div className="absolute inset-0 overflow-hidden z-0 flex items-center justify-center">
        {/* Single large, centered, slowly rotating logo */}
        {backgroundIconStyles.map((style, index) => (
          <BrandLogoIcon
            key={index}
            className="animate-spin-slow opacity-5" // Removed text-primary/5
            style={style}
            isPriority={false}
          />
        ))}
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
        <div className="flex flex-col sm:flex-row gap-4 mb-20">
            <Button
              asChild
              size="lg"
              className="px-10 py-6 text-lg bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-100 ease-in-out shadow-[0_0_15px_hsl(var(--primary)),_0_0_30px_hsl(var(--primary)/0.7)] hover:shadow-[0_0_20px_hsl(var(--accent)),_0_0_40px_hsl(var(--accent)/0.7)] rounded-lg border-b-4 border-primary/60 active:translate-y-0.5 active:border-b-2 active:[box-shadow:inset_0_3px_5px_rgba(0,0,0,0.3)] active:brightness-90"
            >
              <NextLink href="/dashboard">Deploy</NextLink>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="px-10 py-6 text-lg text-accent border-accent hover:text-accent-foreground hover:bg-accent/90 transition-all duration-100 ease-in-out shadow-[0_0_15px_hsl(var(--accent)/0.5),_0_0_30px_hsl(var(--accent)/0.3)] hover:shadow-[0_0_20px_hsl(var(--accent)),_0_0_40px_hsl(var(--accent)/0.7)] rounded-lg border-b-4 border-accent/60 active:translate-y-0.5 active:border-b-2 active:[box-shadow:inset_0_3px_5px_rgba(0,0,0,0.2)] active:brightness-90"
            >
              <NextLink href="/demo/dashboard">View Live Demo</NextLink>
            </Button>
        </div>


        <div className="mt-20 mb-20 w-full max-w-5xl px-4">
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <Card className="border-primary/30 shadow-lg shadow-primary/10 bg-card/80 backdrop-blur-sm">
              <CardHeader className="p-6">
                <CardTitle className="text-2xl text-accent glitch-text min-h-12 flex items-center">What is a Tarpit?</CardTitle>
              </CardHeader>
              <CardContent className="text-foreground/80 space-y-3">
                <p>A digital snare designed to slow down and neutralize malicious web crawlers and bots.</p>
                <p>By presenting an endless maze of data or excruciatingly slow responses, tarpits waste the resources of automated threats, effectively turning their own persistence against them in a form of recursive resource warfare.</p>
              </CardContent>
            </Card>

            <Card className="border-accent/30 shadow-lg shadow-accent/10 bg-card/80 backdrop-blur-sm">
              <CardHeader className="p-6">
                <CardTitle className="text-2xl text-accent glitch-text min-h-12 flex items-center">How SpiteSpiral Works</CardTitle>
              </CardHeader>
              <CardContent className="text-foreground/80 space-y-3">
                <p>Embedding SpiteSpiral is effortless. Just add a simple, unique link generated for you to your website's codebase.</p>
                <p>Each plan provides a dedicated, isolated tarpit instance. All interactions are captured in your private logs, giving you clear insights into the unwelcome visitors it ensnares.</p>
              </CardContent>
            </Card>

            <Card className="border-primary/30 shadow-lg shadow-primary/10 bg-card/80 backdrop-blur-sm">
              <CardHeader className="p-6">
                <CardTitle className="text-2xl text-accent glitch-text min-h-12 flex items-center">Tarpits as a Service (TaaS)</CardTitle>
              </CardHeader>
              <CardContent className="text-foreground/80 space-y-3">
                <p>Manually setting up a tarpit often means your server bears the brunt of the crawler's wasted compute, impacting your own resource costs and potentially SEO.</p>
                <p>SpiteSpiral's TaaS provides managed, scalable instances that absorb this load, trapping crawlers and letting them thrash against the rocks on our infrastructure, without adversely affecting your server performance or SEO.</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-10 mb-20 w-full max-w-4xl px-4">
          <Card className="border-primary/30 shadow-lg shadow-primary/10 bg-card/80 backdrop-blur-sm">
            <CardHeader className="p-6 text-center">
              <CardTitle className="text-4xl text-primary glitch-text">Frequently Asked Questions</CardTitle>
              <p className="text-muted-foreground mt-2">The Honest Truth</p>
            </CardHeader>
            <CardContent className="text-left text-foreground/80">
              <Accordion type="single" collapsible className="w-full">
                {faqData.map((item, index) => (
                  <AccordionItem value={`item-${index + 1}`} key={index} className="border-primary/20">
                    <AccordionTrigger className="text-lg text-accent hover:text-primary hover:no-underline text-left py-5">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 pt-2 text-base leading-relaxed">
                      {typeof item.answer === 'string' ? <p>{item.answer}</p> : item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>

      </div>

      <footer className="relative bottom-8 text-sm text-muted-foreground/70 z-10 flex flex-col items-center space-y-1">
        <span>© {new Date().getFullYear()} SpiteSpiral Industries. All rights reserved.</span>
        <NextLink href="/legal/licenses" className="hover:text-accent hover:underline animate-link-glow">
          Licenses & Acknowledgements
        </NextLink>
      </footer>
    </div>
  );
}

