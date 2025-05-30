
'use client';

import { useState, useEffect, type ChangeEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LinkIcon, Copy, Info, ShieldCheck, Settings, Code, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Trap Configuration Options
const intensityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium (Recommended)' },
  { value: 'high', label: 'High' },
  { value: 'extreme', label: 'Extreme' },
];

const themeOptions = [
  { value: 'generic', label: 'Generic (Default)' },
  { value: 'tech', label: 'Generic Tech' },
  { value: 'biz', label: 'Business/Finance Jargon' },
  { value: 'academic', label: 'Abstract Academia' },
  { value: 'art', label: 'Creative/Artistic Musings' },
  { value: 'legal', label: 'Pseudo-Legal Text' },
];

const entryStealthOptions = [
  { value: 'generic', label: 'Generic Entry / Stealth Off (Default)' },
  { value: 'deep', label: 'Deep Page Simulation / Stealth On' },
];

const lureSpeedOptions = [
  { value: 'normal', label: 'Normal Delay (Default)' },
  { value: 'fast_intro', label: 'Slightly Faster Initial Page' },
];

export default function ManagedUrlsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [intensity, setIntensity] = useState('medium');
  const [theme, setTheme] = useState('generic');
  const [entryStealthValue, setEntryStealthValue] = useState('generic');
  const [lureSpeed, setLureSpeed] = useState('normal');
  const [generatedUrl, setGeneratedUrl] = useState('');

  const TARPIT_BASE_URL = process.env.NEXT_PUBLIC_TARPIT_BASE_URL || 'https://your-spitespiral-service.com'; // Fallback

  useEffect(() => {
    if (user?.uid) {
      const params = new URLSearchParams();
      params.append('client_id', user.uid); // Always include client_id
      if (intensity !== 'medium') params.append('intensity', intensity);
      if (theme !== 'generic') params.append('theme', theme);
      if (entryStealthValue !== 'generic') params.append('stealth', entryStealthValue === 'deep' ? 'on' : 'off');
      if (lureSpeed !== 'normal') params.append('lure_speed', lureSpeed);

      const queryString = params.toString();
      setGeneratedUrl(`${TARPIT_BASE_URL}/trap${queryString ? `?${queryString}` : ''}`);
    } else {
      // Example URL for logged-out users or if user ID is not available
      setGeneratedUrl(`${TARPIT_BASE_URL}/trap?client_id=YOUR_USER_ID_WHEN_LOGGED_IN&intensity=medium&theme=generic&stealth=off&lure_speed=normal`);
    }
  }, [intensity, theme, entryStealthValue, lureSpeed, user, TARPIT_BASE_URL]);

  const handleCopy = (textToCopy: string, type: string = "Text") => {
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        toast({ title: "Copied!", description: `${type} copied to clipboard.` });
      })
      .catch(err => {
        toast({ title: "Error", description: `Could not copy ${type}.`, variant: "destructive" });
      });
  };
  
  const robotsTxtExample = `User-agent: Googlebot
Disallow: /your-chosen-spitespiral-path/

User-agent: bingbot
Disallow: /your-chosen-spitespiral-path/

User-agent: AhrefsBot
Disallow: /your-chosen-spitespiral-path/

User-agent: SemrushBot
Disallow: /your-chosen-spitespiral-path/

User-agent: *
Allow: / # This ensures general bots can access everything by default...
Disallow: /your-chosen-spitespiral-path/ # ...EXCEPT your SpiteSpiral path
`;

  const simpleHtmlLinkSnippet = `<!-- Example: Link to your chosen path on your site -->
<a href="/your-chosen-spitespiral-path/" title="Archival Data Access">Internal Data Archives</a>`;
  const tinyHtmlLinkSnippet = `<!-- A tiny, almost invisible link to your chosen path -->
<a href="/your-chosen-spitespiral-path/" style="font-size:1px; color:transparent;" aria-hidden="true" tabindex="-1">.</a>`;

  const sitemapEntrySnippet = `<url>
  <loc>https://data-archive.yourdomain.com/</loc>
  <lastmod>2024-01-01</lastmod>
  <priority>0.1</priority>
</url>`;
  const cssHiddenLinkSnippet = `<a href="https://data-archive.yourdomain.com/" style="position:absolute; left:-9999px; top:-9999px;">Important Data Feed</a>`;
  const cssClassLinkSnippet = `<a href="https://data-archive.yourdomain.com/" class="spite-link">Hidden Archive</a>`;
  const cssClassStyleSnippet = `.spite-link {
  position: absolute;
  left: -9999px; /* Moves it off-screen */
  /* Or more subtly: opacity: 0.01; font-size: 1px; */
}`;
  const jsInjectionSnippet = `<div id="spite-container"></div>
<script>
  document.addEventListener('DOMContentLoaded', function() {
    // Potentially add conditions here before injecting
    const spiteLink = document.createElement('a');
    spiteLink.href = "https://data-archive.yourdomain.com/"; // Replace with user's path or subdomain
    spiteLink.innerHTML = "Diagnostic Data";
    spiteLink.setAttribute('aria-hidden', 'true'); // If it's not for users
    spiteLink.style.opacity = '0.01'; // Make it unobtrusive
    document.getElementById('spite-container').appendChild(spiteLink);
  });
</script>`;


  return (
    <div className="space-y-8">
      <header className="mb-10">
        <div className="flex items-center gap-3">
          <LinkIcon className="h-10 w-10 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight text-primary glitch-text">Configure &amp; Integrate Your SpiteSpiral Trap</h1>
        </div>
        <p className="text-muted-foreground mt-2 text-lg">
          Welcome to your SpiteSpiral link configuration! Below, you can customize how your unique SpiteSpiral trap behaves and then grab the URL to embed on your site.
          Remember: The primary goal is to ensnare misbehaving bots while remaining invisible to legitimate search engines. Follow these instructions carefully to protect your SEO.
        </p>
      </header>

      {/* Step 1: robots.txt */}
      <Card className="shadow-lg border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-accent" />
            <CardTitle className="text-xl text-primary">Step 1: Crucial robots.txt Setup (Protect Your SEO!)</CardTitle>
          </div>
          <CardDescription>
            Before embedding any SpiteSpiral link, you must configure your website&apos;s robots.txt file. This file tells legitimate search engine crawlers (like Googlebot and Bingbot) which parts of your site they should and shouldn&apos;t visit. We want them to crawl your real content, but explicitly disallow them from your SpiteSpiral link path. Most malicious scrapers and aggressive AI crawlers will ignore robots.txt, which is exactly what we want – they&apos;ll walk right into the trap.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-foreground/90 mb-1">Instructions for robots.txt:</h4>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground text-sm">
              <li><strong className="text-foreground/80">Locate or Create robots.txt:</strong> This file should be in the root directory of your website (e.g., www.yourwebsite.com/robots.txt).</li>
              <li><strong className="text-foreground/80">Define Your SpiteSpiral Path:</strong> Decide on a specific, unique path on your site that will host the SpiteSpiral link. This isn&apos;t the SpiteSpiral service URL itself, but a path on your domain where you&apos;ll place the redirection or the direct link to it. Example: Let&apos;s say you choose <code>/do-not-enter-bots/</code> or <code>/special-data-archive/</code>.</li>
              <li><strong className="text-foreground/80">Add Disallow Rules:</strong></li>
            </ul>
          </div>
          <Textarea
            value={robotsTxtExample}
            readOnly
            rows={15}
            className="font-mono text-xs bg-input border-border focus:ring-primary"
          />
          <Button onClick={() => handleCopy(robotsTxtExample, "robots.txt Example")} variant="outline" size="sm" className="text-accent border-accent hover:bg-accent/10">
            <Copy className="mr-2 h-3 w-3" /> Copy Example
          </Button>
          <p className="text-sm text-foreground/80"><strong className="text-destructive">IMPORTANT:</strong> Replace <code className="bg-muted px-1 py-0.5 rounded-sm text-xs text-accent">/your-chosen-spitespiral-path/</code> with the actual path you decide on. Make sure it has leading and trailing slashes if it represents a directory.</p>
          <p className="text-sm text-muted-foreground"><strong className="text-destructive">Warning:</strong> Be very careful not to accidentally disallow your entire site (e.g., <code className="bg-muted px-1 py-0.5 rounded-sm text-xs text-accent">Disallow: /</code>). Test your robots.txt changes using <a href='https://support.google.com/webmasters/answer/6062598' target='_blank' rel='noopener noreferrer' className='text-accent hover:underline'>Google Search Console&apos;s robots.txt Tester</a> or similar tools.</p>
        </CardContent>
      </Card>

      {/* Step 2: Customize Trap */}
      <Card className="shadow-lg border-accent/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-6 w-6 text-accent" />
            <CardTitle className="text-xl text-primary">Step 2: Customize Your SpiteSpiral Trap</CardTitle>
          </div>
          <CardDescription>
            Use the options below to fine-tune the behavior of your SpiteSpiral trap. Your unique, ready-to-embed URL will be generated at the bottom.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Intensity */}
          <div className="space-y-2">
            <Label htmlFor="intensity-select" className="text-foreground/80">Trap Intensity</Label>
            <RadioGroup value={intensity} onValueChange={setIntensity} className="flex flex-col space-y-1">
              {intensityOptions.map(opt => (
                <div key={opt.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={opt.value} id={`intensity-${opt.value}`} />
                  <Label htmlFor={`intensity-${opt.value}`} className="font-normal text-sm">{opt.label}</Label>
                </div>
              ))}
            </RadioGroup>
            <p className="text-xs text-muted-foreground">Controls the initial &apos;aggressiveness&apos; of the trap. <br />
              Low: Slower introduction of delays, slightly less dense linking. Good for very subtle, long-term engagement.<br />
              Medium (Recommended Default): Balanced approach. Moderate initial delays and link complexity.<br />
              High: Quicker introduction of significant delays, denser internal linking. Aims to bog down bots more rapidly.<br />
              Extreme: Very aggressive delays and link density from the start. Use if you want to make an immediate, strong impact on resource consumption.
            </p>
          </div>

          {/* Theme */}
          <div className="space-y-2">
            <Label htmlFor="theme-select" className="text-foreground/80">Content &quot;Babble&quot; Theme</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger id="theme-select" className="w-full md:w-[300px] bg-background border-border focus:ring-primary">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                {themeOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Influences the &apos;flavor&apos; of the LLM-generated text within the trap. While always nonsensical, a theme can make the fake content appear more aligned with a specific domain, potentially making data pollution more effective if scrapers are targeting certain types of information.<br />
            Generic (Default): A broad mix of plausible-sounding text.
            </p>
          </div>

          {/* Entry Point Stealth */}
           <div className="space-y-2">
            <Label className="text-foreground/80">Entry Point Stealth</Label>
            <RadioGroup value={entryStealthValue} onValueChange={setEntryStealthValue} className="flex flex-col space-y-1">
              {entryStealthOptions.map(opt => (
                <div key={opt.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={opt.value} id={`stealth-${opt.value}`} />
                  <Label htmlFor={`stealth-${opt.value}`} className="font-normal text-sm">{opt.label}</Label>
                </div>
              ))}
            </RadioGroup>
            <p className="text-xs text-muted-foreground">Determines if the trap always starts from a &apos;root&apos; page or simulates entry into a deep, specific-looking page.<br/>
             Generic Entry / Stealth Off (Default): The trap starts with a more generic-looking base URL structure provided by SpiteSpiral.<br />
             Deep Page Simulation / Stealth On: The generated URL will include more complex path segments (still leading to SpiteSpiral, but appearing like a deep internal page). This can make the initial entry point less obviously a generic trap.
            </p>
          </div>

          {/* Lure Speed */}
          <div className="space-y-2">
            <Label className="text-foreground/80">Initial Lure Speed</Label>
             <RadioGroup value={lureSpeed} onValueChange={setLureSpeed} className="flex flex-col space-y-1">
              {lureSpeedOptions.map(opt => (
                <div key={opt.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={opt.value} id={`lure-${opt.value}`} />
                  <Label htmlFor={`lure-${opt.value}`} className="font-normal text-sm">{opt.label}</Label>
                </div>
              ))}
            </RadioGroup>
            <p className="text-xs text-muted-foreground">Adjusts the loading speed and delay of the very first page encountered in the trap.<br/>
            Normal Delay (Default): The trap&apos;s configured intensity dictates the first page&apos;s delay.<br />
            Slightly Faster Initial Page: The first page loads with a minimal delay to quickly &apos;hook&apos; the bot, with subsequent pages reverting to the chosen intensity&apos;s delay strategy. Can sometimes encourage deeper initial crawling before the trap fully slows them.
            </p>
          </div>
          
          <div className="space-y-2 pt-4 border-t border-border">
            <Label htmlFor="generated-url" className="text-foreground/80 font-semibold">Generated SpiteSpiral URL:</Label>
            <div className="flex items-center gap-2">
              <Input id="generated-url" value={generatedUrl} readOnly className="flex-grow bg-input border-border focus:ring-primary text-sm" />
              <Button onClick={() => handleCopy(generatedUrl, "Generated URL")} variant="outline" size="icon" className="text-accent border-accent hover:bg-accent/10">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
             <p className="text-xs text-muted-foreground">
                Your User ID (<code className="bg-muted px-1 py-0.5 rounded-sm text-xs text-accent">{user?.uid || 'N/A'}</code>) is included as <code className="bg-muted px-1 py-0.5 rounded-sm text-xs text-accent">client_id</code>.
                The base URL is <code className="bg-muted px-1 py-0.5 rounded-sm text-xs text-accent">{TARPIT_BASE_URL}/trap</code>.
             </p>
          </div>
        </CardContent>
      </Card>

      {/* Step 3: Embedding Strategies */}
      <Card className="shadow-lg border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Code className="h-6 w-6 text-accent" />
            <CardTitle className="text-xl text-primary">Step 3: Embedding Your SpiteSpiral Link on Your Website</CardTitle>
          </div>
          <CardDescription>
            Now that you&apos;ve configured your robots.txt and generated your SpiteSpiral URL, here are several ways to add the link to your site.
            Remember, the link should point to the path you disallowed in robots.txt (e.g., /your-chosen-spitespiral-path/), and that path on your site should then contain or redirect to your SpiteSpiral URL.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="embed-1">
              <AccordionTrigger className="text-accent hover:text-primary">Method: Simple HTML Link (Basic)</AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2 text-sm text-muted-foreground">
                <p><strong>Use Case:</strong> Easy to implement, good for footers, &quot;Terms of Service&quot; pages, or deep utility pages not often visited by humans.</p>
                <p><strong>How To:</strong></p>
                <ol className="list-decimal list-inside space-y-2 my-2">
                  <li>
                    <strong>Embed the Link:</strong> Copy one of the HTML snippets below and paste it into your website&apos;s code. Good places are your site footer, &apos;Terms of Service&apos; page, or other less prominent pages.
                    <ul className="list-disc list-inside pl-5 mt-1">
                      <li>Replace <code>&quot;/your-chosen-spitespiral-path/&quot;</code> in the snippet with the <strong>exact path you disallowed in your `robots.txt` (Step 1)</strong>. For example, if you disallowed <code>/secret-bot-area/</code>, your link should be <code>href=&quot;/secret-bot-area/&quot;</code>.</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Make Your Path Lead to SpiteSpiral:</strong> The path you chose (e.g., <code>/secret-bot-area/</code>) on your website now needs to send visitors (especially bots) to your <strong>&apos;Generated SpiteSpiral URL&apos;</strong> (from Step 2).
                    <ul className="list-disc list-inside pl-5 mt-1">
                      <li>The most common way to do this is with a <strong>server-side redirect</strong>. The specifics depend on your website platform (e.g., settings in your hosting panel, WordPress redirect plugin, <code>.htaccess</code> file for Apache servers, or other server configurations).</li>
                      <li>If you&apos;re unsure how to set up a redirect, please consult your web developer or hosting provider&apos;s support documentation.</li>
                    </ul>
                  </li>
                </ol>
                <p className="mt-3 font-semibold text-foreground/90">Link Snippets:</p>
                <Textarea value={simpleHtmlLinkSnippet} readOnly rows={3} className="font-mono text-xs bg-input border-border focus:ring-primary"/>
                <Button onClick={() => handleCopy(simpleHtmlLinkSnippet, "Simple Link Snippet")} variant="outline" size="sm" className="text-accent border-accent hover:bg-accent/10 mt-1">
                  <Copy className="mr-2 h-3 w-3" /> Copy Visible Link Snippet
                </Button>
                <Textarea value={tinyHtmlLinkSnippet} readOnly rows={3} className="font-mono text-xs bg-input border-border focus:ring-primary mt-3"/>
                <Button onClick={() => handleCopy(tinyHtmlLinkSnippet, "Tiny Link Snippet")} variant="outline" size="sm" className="text-accent border-accent hover:bg-accent/10 mt-1">
                  <Copy className="mr-2 h-3 w-3" /> Copy Less Visible Link Snippet
                </Button>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="embed-2">
              <AccordionTrigger className="text-accent hover:text-primary">Method: sitemap.xml Entry</AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2 text-sm text-muted-foreground">
                <p><strong>Use Case:</strong> Directly tells crawlers (that read sitemaps) about the existence of this &quot;section.&quot;</p>
                <p><strong>How To:</strong> Add an entry to your sitemap.xml file pointing to the chosen path/subdomain (that is disallowed for good bots).</p>
                <Textarea value={sitemapEntrySnippet} readOnly rows={6} className="font-mono text-xs bg-input border-border focus:ring-primary"/>
                 <Button onClick={() => handleCopy(sitemapEntrySnippet, "Sitemap Snippet")} variant="outline" size="sm" className="text-accent border-accent hover:bg-accent/10 mt-1">
                  <Copy className="mr-2 h-3 w-3" /> Copy Snippet
                </Button>
                <p className="mt-2">Note: Set a low priority.</p>
              </AccordionContent>
            </AccordionItem>

             <AccordionItem value="embed-3">
              <AccordionTrigger className="text-accent hover:text-primary">Method: CSS-Hidden Links (More Subtle)</AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2 text-sm text-muted-foreground">
                <p><strong>Use Case:</strong> Links that are part of the HTML (so crawlers see them) but are invisible or nearly invisible to human users.</p>
                <Textarea value={cssHiddenLinkSnippet} readOnly rows={2} className="font-mono text-xs bg-input border-border focus:ring-primary"/>
                <Button onClick={() => handleCopy(cssHiddenLinkSnippet, "CSS Hidden Link Snippet")} variant="outline" size="sm" className="text-accent border-accent hover:bg-accent/10 mt-1">
                  <Copy className="mr-2 h-3 w-3" /> Copy Snippet 1
                </Button>
                <p className="mt-2">OR use a dedicated CSS class:</p>
                <Textarea value={cssClassLinkSnippet} readOnly rows={2} className="font-mono text-xs bg-input border-border focus:ring-primary"/>
                 <Button onClick={() => handleCopy(cssClassLinkSnippet, "CSS Class Link Snippet")} variant="outline" size="sm" className="text-accent border-accent hover:bg-accent/10 mt-1">
                  <Copy className="mr-2 h-3 w-3" /> Copy Snippet 2
                </Button>
                <Textarea value={cssClassStyleSnippet} readOnly rows={5} className="font-mono text-xs bg-input border-border focus:ring-primary mt-2"/>
                 <Button onClick={() => handleCopy(cssClassStyleSnippet, "CSS Style Snippet")} variant="outline" size="sm" className="text-accent border-accent hover:bg-accent/10 mt-1">
                  <Copy className="mr-2 h-3 w-3" /> Copy CSS
                </Button>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="embed-4">
              <AccordionTrigger className="text-accent hover:text-primary">Method: JavaScript Link Injection (Advanced)</AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2 text-sm text-muted-foreground">
                <p><strong>Use Case:</strong> For more dynamic control; can make the link appear only under certain conditions or after a delay.</p>
                <Textarea value={jsInjectionSnippet} readOnly rows={12} className="font-mono text-xs bg-input border-border focus:ring-primary"/>
                <Button onClick={() => handleCopy(jsInjectionSnippet, "JS Injection Snippet")} variant="outline" size="sm" className="text-accent border-accent hover:bg-accent/10 mt-1">
                  <Copy className="mr-2 h-3 w-3" /> Copy Snippet
                </Button>
                <p className="mt-2 text-xs text-destructive"><strong>Caution:</strong> Over-reliance on JS for link generation might be missed by less sophisticated scrapers that don&apos;t execute JS well. Prefer HTML links when possible for broad compatibility.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="embed-5">
              <AccordionTrigger className="text-accent hover:text-primary">Method: Server-Side Conditional Redirection (Most Complex)</AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2 text-sm text-muted-foreground">
                <p><strong>Use Case:</strong> Identifying suspicious bot behavior at the server level and then serving a link to, or directly redirecting to, the SpiteSpiral path/subdomain.</p>
                <p><strong>How To:</strong> This is highly environment-specific. Requires server-side coding or configuration (e.g., Nginx if statements with rate limiting, or application middleware). If a bot trips a &quot;bad behavior&quot; threshold, your server could redirect it: HTTP 302 Found to your SpiteSpiral path/subdomain.</p>
                <p className="mt-2 text-xs text-primary"><strong>SpiteSpiral Note:</strong> This is an advanced technique for clients to implement on their servers. SpiteSpiral provides the destination trap.</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Step 4: Best Practices */}
      <Card className="shadow-lg border-accent/20">
        <CardHeader>
           <div className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-accent" />
            <CardTitle className="text-xl text-primary">Step 4: Final Checks &amp; Best Practices</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-foreground/80">Double-Check robots.txt:</strong> Ensure it&apos;s correctly disallowing your SpiteSpiral path for good bots and allowing everything else they need. Test it!</li>
            <li><strong className="text-foreground/80">Use a Dedicated Path/Subdomain:</strong> This makes robots.txt management easier.</li>
            <li><strong className="text-foreground/80">Monitor (If Possible):</strong> If your server logs allow, you might see traffic hitting your chosen path. This can indicate the trap is being visited.</li>
            <li><strong className="text-foreground/80">Subtlety is Key:</strong> Don&apos;t make your SpiteSpiral link obvious or alarming to human users. The goal is to trap bots.</li>
            <li><strong className="text-foreground/80">One Link is Often Enough:</strong> You don&apos;t need to scatter hundreds of these. A few well-placed, disavowed (for good bots) links are usually sufficient.</li>
            <li><strong className="text-foreground/80">SpiteSpiral Does the Heavy Lifting:</strong> Once a bot hits your configured SpiteSpiral URL (via your site&apos;s path/subdomain), our system takes over with the LLM babble, delays, and recursive linking.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
    

    