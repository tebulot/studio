
'use client';

import NextLink from 'next/link';
import { Button } from '@/components/ui/button';
import BrandLogoIcon from '@/components/icons/BrandLogoIcon';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const faqData = [
  {
    question: "What are these AI crawlers and scrapers you're talking about?",
    answer: "They're automated software scripts that roam the internet. Some are legitimate, like search engine crawlers (Googlebot, Bingbot). Many others are a nuisance or outright malicious. Think content scrapers stealing your articles, price bots undercutting your store, spambots filling your forms, vulnerability scanners looking for weaknesses, or just aggressive bots hogging your server resources and slowing your site down for real people."
  },
  {
    question: "Realistically, what damage can these unwanted crawlers do to my website?",
    answer: (
      <>
        <p>More than you might think.</p>
        <ul className="list-disc pl-5 space-y-1 mt-2 text-foreground/80">
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
    question: "What is \"LLM-Powered Intelligent Babble\" and why is it better?",
    answer: "Instead of simple repetitive text, SpiteSpiral uses small but sophisticated Large Language Models (LLMs) to generate unique, grammatically correct, and contextually-aware (based on fake URL paths) nonsense. This \"intelligent babble\" is much harder for scrapers to identify as a trap compared to basic generated content. It's more likely to be ingested into their datasets, effectively devaluing the information they're trying to steal."
  },
  {
    question: "Is this just about \"spite\"? What's the tangible benefit for my business/website?",
    answer: (
      <>
        <p>While there's definitely satisfaction in outsmarting scrapers (that's our origin!), the tangible benefits are serious:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2 text-foreground/80">
          <li><strong>Deterrence:</strong> Makes your site an unattractive and costly target for data thieves.</li>
          <li><strong>Resource Protection (Indirect):</strong> By tying up bad bots, you reduce the load they might otherwise put on your actual content servers.</li>
          <li><strong>Data Devaluation:</strong> Actively works to pollute datasets that might be used to train AI models on your (or similar) content without consent.</li>
          <li><strong>Competitive Edge:</strong> Makes it harder and more expensive for competitors to scrape your data for their advantage.</li>
        </ul>
      </>
    )
  },
  {
    question: "What kind of bots does SpiteSpiral target?",
    answer: (
      <>
        <p>SpiteSpiral primarily targets automated bots, AI crawlers, and data scrapers that:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2 text-foreground/80">
          <li>Ignore `robots.txt` directives.</li>
          <li>Are designed for large-scale, indiscriminate content harvesting.</li>
          <li>Are often used for AI model training, competitive data aggregation, or other forms of unauthorized data extraction.</li>
        </ul>
      </>
    )
  },
  {
    question: "Is it complicated to set up?",
    answer: "We aim for simplicity. The basic setup involves adding a specially crafted link to your website, pointing to our service. We provide clear instructions, including the crucial `robots.txt` configurations to protect your SEO."
  },
  {
    question: "What if they figure it out?",
    answer: "The beauty of LLM-generated content and dynamically structured pages is that it's much harder to create a simple \"signature\" for detection. While no trap is foolproof forever against the most sophisticated adversaries, SpiteSpiral is designed to be a constantly shifting, deeply frustrating, and resource-intensive quagmire. We aim to make the cost of \"figuring it out\" higher than the value of the data they're trying to steal from you."
  },
  {
    question: "How easy is it to get started and implement on my site?",
    answer: (
        <>
            <p>Very easy.</p>
            <ol className="list-decimal pl-5 space-y-1 mt-2 text-foreground/80">
                <li>Sign up for an account with SpiteSpiral.</li>
                <li>From your dashboard, you'll get your unique Managed URL(s).</li>
                <li>We provide you with a small HTML snippet. Copy it.</li>
                <li>Paste this snippet into your website's HTML (e.g., in your site footer or header template). We give clear instructions.</li>
                <li>That’s it! You can then monitor activity via your dashboard.</li>
            </ol>
        </>
    )
  },
  {
    question: "What if a \"good\" bot, like Googlebot, accidentally hits a Managed URL?",
    answer: "The recommended embedding methods are designed to make this unlikely for major search engine crawlers that are focused on your primary content. Our tarpits are also generally configured to be less immediately aggressive, so an accidental hit from a known, reputable crawler (which often identify themselves clearly) is unlikely to cause them significant, lasting issues. The primary targets are the persistent, unidentified, or clearly unwanted crawlers."
  },
  {
    question: "So, why the name SpiteSpiral?",
    answer: "I'm sure if you've read this far, you're either already pretty pissed off, or you're starting to get pretty annoyed. The creator of Nepenthes, the Tarpit SpiteSpiral utilises heavily as its original codebase under the MIT license, speaks of AI crawlers with such a distaste and frustration, that I was moved to build this site and this service to allow those without the technical knowledge, infrastructure or time to set a Tarpit up for themselves on their own website. In some regards, it's an act of desperation, self damaging, and can lead to your website disappearing off of search engine results. The point is to do damage. It's a destructive, malicious, and spiteful measure to implement. SpiteSpiral allows us to take the punches, burn our CPU cycles and power to trap these things in a purgatory of endless recursion, and protect your website from the negative effects. And between you and me, this kind of abstract, compute based warfare is so darn interesting. So you can be sure I'm going to be utilising everything at my disposal to continue to mutate, adapt, and abstract SpiteSpiral to ensure we're on the front lines, ensuring we do as much damage as we possibly can."
  }
];


export default function HomePage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-background text-foreground font-mono p-8 selection:bg-primary selection:text-primary-foreground">
      {isMounted && (
          <div className="absolute inset-0 overflow-hidden z-0 flex items-center justify-center">
            <BrandLogoIcon
                className="w-[500vw] h-[500vh] opacity-5 animate-spin-slow"
                isPriority={false}
            />
          </div>
      )}

      <div className="relative z-10 text-center flex flex-col items-center w-full flex-grow">
        <div className="mb-4 transform transition-transform hover:scale-110 active:scale-95">
          <BrandLogoIcon className="w-56 h-56 md:w-72 md:h-72" isPriority={true} />
        </div>
        
        <div className="mb-10"> {/* Container for H1 and new tagline */}
          <h1 className="text-5xl md:text-7xl font-black font-sans glitch-text tracking-wider">
            <span className="text-primary-foreground">Spite</span><span className="text-primary">Spiral</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mt-2 max-w-xl md:max-w-2xl mx-auto">
            Active Defense Against Persistent AI Crawlers & Data Scrapers.
          </p>
        </div>

        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl md:max-w-3xl leading-relaxed">
          Standard defenses like <code>robots.txt</code> are routinely ignored by aggressive AI crawlers and data scrapers. SpiteSpiral offers a potent second line of defense. We don&apos;t just try to turn them away; we invite them into a digital labyrinth designed to waste their resources, pollute their datasets with LLM-generated &apos;intelligent babble,&apos; and make scraping your content an expensive, fruitless endeavor.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mb-20">
            <Button
              asChild
              size="lg"
              className="px-10 py-6 text-lg bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-100 ease-in-out shadow-[0_0_15px_hsl(var(--primary)),_0_0_30px_hsl(var(--primary)/0.7)] hover:shadow-[0_0_20px_hsl(var(--accent)),_0_0_40px_hsl(var(--accent)/0.7)] rounded-lg border-b-4 border-primary/60 active:translate-y-0.5 active:border-b-2 active:[box-shadow:inset_0_3px_5px_rgba(0,0,0,0.3)] active:brightness-90"
            >
              <NextLink href="/login">Deploy Your Trap</NextLink>
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

        {/* Informational Cards Section */}
        <div className="mt-10 mb-20 w-full max-w-5xl px-4 grid md:grid-cols-2 gap-6 text-left">
          <Card className="border-primary/30 shadow-lg shadow-primary/10 bg-card/80 backdrop-blur-sm">
            <CardHeader className="p-6 flex items-center min-h-12">
              <CardTitle className="text-2xl text-accent glitch-text min-h-12 flex items-center">The Problem: When Scrapers Ignore the Rules</CardTitle>
            </CardHeader>
            <CardContent className="text-foreground/80 space-y-3">
              <p>Your valuable content, data, and intellectual property are prime targets for automated bots. Many of these scrapers brazenly ignore <code>robots.txt</code> and bypass conventional blocking techniques, constantly draining your server resources and stealing your work for AI training models or competitive analysis. Simply blocking isn&apos;t enough for these persistent threats.</p>
            </CardContent>
          </Card>

          <Card className="border-accent/30 shadow-lg shadow-accent/10 bg-card/80 backdrop-blur-sm">
            <CardHeader className="p-6 flex items-center min-h-12">
              <CardTitle className="text-2xl text-accent glitch-text min-h-12 flex items-center">The SpiteSpiral Solution: Active Deterrence & Data Devaluation</CardTitle>
            </CardHeader>
            <CardContent className="text-foreground/80 space-y-3">
              <p>SpiteSpiral isn&apos;t a passive shield; it&apos;s an active trap. By strategically embedding a SpiteSpiral link, you redirect these rule-ignoring bots into a carefully constructed digital maze:</p>
              <ul className="list-disc pl-5 space-y-2 text-foreground/80">
                  <li><strong>LLM-Powered Deception:</strong> Our core uses advanced, small language models (like DistilGPT-2) to generate vast quantities of unique, contextually plausible (yet ultimately nonsensical) content. This &apos;intelligent babble&apos; is far more convincing than simple repeated text, making it harder for scrapers to detect the trap and more likely to be ingested into their datasets.</li>
                  <li><strong>Strategic Resource Drain:</strong> Each interaction is designed to be slow and demanding for the bot, consuming its CPU cycles, bandwidth, and time with an endless stream of unique pages and deep, recursive links.</li>
                  <li><strong>Proactive Data Devaluation:</strong> By feeding AI scrapers our LLM-generated noise, we aim to degrade the quality of their training data, making their efforts not only costly but counterproductive.</li>
                  <li><strong>SEO-Conscious Design:</strong> Implemented correctly (we&apos;ll show you how!), SpiteSpiral targets *only* misbehaving bots, leaving your standing with legitimate search engines like Google unharmed.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-primary/30 shadow-lg shadow-primary/10 bg-card/80 backdrop-blur-sm">
            <CardHeader className="p-6 flex items-center min-h-12">
              <CardTitle className="text-2xl text-accent glitch-text min-h-12 flex items-center">Why SpiteSpiral? Our Unique Approach</CardTitle>
            </CardHeader>
            <CardContent className="text-foreground/80 space-y-3">
              <p>Most bot solutions focus on *blocking*. SpiteSpiral focuses on **active engagement and consequence** for those that slip through or deliberately ignore your rules.</p>
              <ul className="list-disc pl-5 space-y-2 text-foreground/80">
                  <li><strong>Unique Trap-and-Drain Methodology:</strong> We turn your site into a sticky web for unwanted crawlers.</li>
                  <li><strong>Sophisticated LLM Content Generation:</strong> Makes our traps more believable and our data pollution more effective.</li>
                  <li><strong>Cost-Amplification for Scrapers:</strong> We make scraping your data an expensive mistake.</li>
                  <li><strong>Aimed at Rule-Breakers:</strong> Designed for the bots that other systems miss or can&apos;t effectively stop without impacting legitimate traffic.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-accent/30 shadow-lg shadow-accent/10 bg-card/80 backdrop-blur-sm">
            <CardHeader className="p-6 flex items-center min-h-12">
              <CardTitle className="text-2xl text-accent glitch-text min-h-12 flex items-center">Who Needs SpiteSpiral?</CardTitle>
            </CardHeader>
            <CardContent className="text-foreground/80 space-y-3">
              <p>SpiteSpiral is for anyone tired of their content being exploited by aggressive, unauthorized scrapers:</p>
              <ul className="list-disc pl-5 space-y-2 text-foreground/80">
                  <li><strong>Businesses:</strong> Protect proprietary data, pricing strategies, and unique content. Prevent competitors from easily training AI models on your information.</li>
                  <li><strong>Creators & Artists:</strong> Safeguard your intellectual property and make it costly for AI to train on your original work without permission.</li>
                  <li><strong>Developers & Site Owners:</strong> Add a potent layer of defense against resource-draining bots that ignore common courtesies.</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="mt-10 mb-20 w-full max-w-4xl px-4">
          <Card className="border-primary/30 shadow-lg shadow-primary/10 bg-card/80 backdrop-blur-sm">
            <CardHeader className="p-6 text-center">
              <CardTitle className="text-4xl text-primary glitch-text">Frequently Asked Questions</CardTitle>
              <CardDescription className="text-muted-foreground mt-2">The Honest Truth</CardDescription>
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

      {/* Demo Tracking Pixel */}
      <img src="https://api.spitespiral.com/trap/38e19a7e-1a3f-4bf0-b83f-edd7efe6fceb" width="1" height="1" alt="" style={{border:0, position:"absolute", left:"-9999px"}} aria-hidden="true" loading="eager" />

      <footer className="py-6 md:px-8 md:py-0 border-t border-primary/10 bg-card/50 mt-auto">
        <div className="container flex flex-col items-center justify-center gap-2 md:h-20 text-center">
          <NextLink href="/" className="flex items-center gap-2 group mb-2">
            <BrandLogoIcon className="h-8 w-8 text-primary" />
            <span className="text-sm font-semibold text-primary">SpiteSpiral</span>
          </NextLink>
          <NextLink href="/legal/licenses" className="text-xs text-muted-foreground/70 hover:text-accent animate-link-glow">
            Licenses & Acknowledgements
          </NextLink>
          <p className="text-xs text-muted-foreground/70">
            © {new Date().getFullYear()} SpiteSpiral. Trap with malice.
          </p>
        </div>
      </footer>
    </div>
  );
}
