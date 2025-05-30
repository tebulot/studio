
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link as LinkIcon, Copy, Settings, Code, CheckCircle, HelpCircle, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label'; // Ensured Label is imported

// Placeholder constants for snippets (simplified)
const robotsTxtExample = `User-agent: Googlebot
Disallow: /your-chosen-spitespiral-path/

User-agent: bingbot
Disallow: /your-chosen-spitespiral-path/

User-agent: AhrefsBot
Disallow: /your-chosen-spitespiral-path/

User-agent: SemrushBot
Disallow: /your-chosen-spitespiral-path/

User-agent: *
Allow: /
Disallow: /your-chosen-spitespiral-path/`;

const simpleHtmlLinkSnippet = `<a href="/your-chosen-spitespiral-path/" title="Archival Data Access">Internal Data Archives</a>`;
const tinyHtmlLinkSnippet = `<a href="/your-chosen-spitespiral-path/" style="font-size:1px; color:transparent;" aria-hidden="true" tabindex="-1">.</a>`;
const sitemapEntrySnippet = `<url><loc>https://example.com/your-chosen-spitespiral-path/</loc></url>`;

// Functions to generate snippets dynamically (simplified)
const getCssHiddenLinkSnippet = (url: string) => `<a href="${url}" style="position:absolute; left:-9999px; top:-9999px;" rel="nofollow">Important Data Feed</a>`;
const getCssClassLinkSnippet = (url: string) => `<a href="${url}" class="spite-link" rel="nofollow">Hidden Archive</a>`;
const cssClassStyleSnippet = `.spite-link { position: absolute; left: -9999px; }`;
const getJsInjectionSnippet = (url: string) => `<div id="spite-container"></div><script>/* JS injection for ${url} */</script>`;


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

/*
// SnippetDisplay component (temporarily commented out to isolate parsing errors)
const SnippetDisplay = ({ title, snippet, explanation }: { title: string, snippet: string, explanation?: string }) => {
  const { toast: showToast } = useToast();
  const handleCopySnippetInternal = useCallback((textToCopy: string, type: string = "Text") => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          showToast({ title: "Copied!", description: `${type} copied to clipboard.` });
        })
        .catch(err => {
          console.error("Copy error:", err);
          showToast({ title: "Error", description: `Could not copy ${type}.`, variant: "destructive" });
        });
    } else {
       showToast({ title: "Error", description: "Clipboard API not available.", variant: "destructive" });
    }
  }, [showToast]);

  return (
    <div className="space-y-2 mb-4">
      <h4 className="font-semibold text-sm text-primary">{title}</h4>
      <Textarea
        value={snippet}
        readOnly
        rows={snippet.split('\n').length > 1 ? Math.min(snippet.split('\n').length + 1, 12) : 3}
        className="bg-input border-border focus:ring-primary text-foreground/90 font-mono text-xs"
      />
      {explanation && <p className="text-xs text-muted-foreground">{explanation}</p>}
      <Button onClick={() => handleCopySnippetInternal(snippet, `${title} Snippet`)} variant="outline" size="sm" className="text-accent border-accent hover:bg-accent/10">
        <Copy className="mr-2 h-3 w-3" /> Copy Snippet
      </Button>
    </div>
  );
};
*/


export default function ManagedUrlsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [intensity, setIntensity] = useState('medium');
  const [theme, setTheme] = useState('generic');
  const [entryStealthValue, setEntryStealthValue] = useState('generic'); // 'generic' or 'deep'
  const [lureSpeed, setLureSpeed] = useState('normal');
  const [generatedUrl, setGeneratedUrl] = useState('');

  const TARPIT_BASE_URL = process.env.NEXT_PUBLIC_TARPIT_BASE_URL || 'https://your-spitespiral-service.com';

  useEffect(() => {
    if (user?.uid) {
      const params = new URLSearchParams();
      params.append('client_id', user.uid);
      if (intensity !== 'medium') params.append('intensity', intensity);
      if (theme !== 'generic') params.append('theme', theme);
      if (entryStealthValue === 'deep') params.append('stealth', 'on');
      if (lureSpeed !== 'normal') params.append('lure_speed', lureSpeed);
      
      const queryString = params.toString();
      setGeneratedUrl(`${TARPIT_BASE_URL}/trap${queryString ? `?${queryString}` : ''}`);
    } else {
      setGeneratedUrl(`${TARPIT_BASE_URL}/trap?client_id=YOUR_USER_ID&intensity=medium&theme=generic&stealth=off&lure_speed=normal`);
    }
  }, [intensity, theme, entryStealthValue, lureSpeed, user, TARPIT_BASE_URL]);

  const handleCopyUrl = useCallback((textToCopy: string) => {
    if (!user) {
        toast({ title: "Login Required", description: "Please log in to copy your personalized URL.", variant: "destructive" });
        return;
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(textToCopy)
        .then(() => {
            toast({ title: "Copied!", description: `Generated URL copied to clipboard.` });
        })
        .catch(err => {
            console.error("Copy error:", err);
            toast({ title: "Error", description: `Could not copy URL.`, variant: "destructive" });
        });
    } else {
        toast({ title: "Error", description: "Clipboard API not available.", variant: "destructive" });
    }
  }, [user, toast]);

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
              <li><strong className="text-foreground/80">Define Your SpiteSpiral Path:</strong> Decide on a specific, unique path on your site that will host the SpiteSpiral link. This isn&apos;t the SpiteSpiral service URL itself, but a path on your domain where you&aposll place the redirection or the direct link to it. Example: Let&apos;s say you choose <code className="bg-muted px-1 py-0.5 rounded-sm text-xs text-accent">/do-not-enter-bots/</code> or <code className="bg-muted px-1 py-0.5 rounded-sm text-xs text-accent">/special-data-archive/</code>.</li>
              <li><strong className="text-foreground/80">Add Disallow Rules:</strong></li>
            </ul>
          </div>
          <Textarea
            value={robotsTxtExample}
            readOnly
            rows={10} 
            className="font-mono text-xs bg-input border-border focus:ring-primary"
          />
          <Button onClick={() => handleCopyUrl(robotsTxtExample)} variant="outline" size="sm" className="text-accent border-accent hover:bg-accent/10">
            <Copy className="mr-2 h-3 w-3" /> Copy Example
          </Button>
          <p className="text-sm text-foreground/80"><strong className="text-destructive">IMPORTANT:</strong> Replace <code className="bg-muted px-1 py-0.5 rounded-sm text-xs text-accent">/your-chosen-spitespiral-path/</code> with the actual path you decide on. Make sure it has leading and trailing slashes if it represents a directory.</p>
          <p className="text-sm text-muted-foreground"><strong className="text-destructive">Warning:</strong> Be very careful not to accidentally disallow your entire site (e.g., <code className="bg-muted px-1 py-0.5 rounded-sm text-xs text-accent">Disallow: /</code>). Test your robots.txt changes using <a href='https://support.google.com/webmasters/answer/6062598' target='_blank' rel='noopener noreferrer' className='text-accent hover:underline'>Google Search Console&apos;s robots.txt Tester</a> or similar tools.</p>
        </CardContent>
      </Card>

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
            <p className="text-xs text-muted-foreground">Controls the initial &apos;aggressiveness&apos; of the trap.</p>
          </div>

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
            <p className="text-xs text-muted-foreground">Influences the &apos;flavor&apos; of the LLM-generated text within the trap.</p>
          </div>
          
          <div className="space-y-2">
            <Label className="text-foreground/80">Entry Point Stealth</Label>
            <div className="flex items-center space-x-2">
                <Switch
                    id="stealth-toggle"
                    checked={entryStealthValue === 'deep'}
                    onCheckedChange={(checked) => setEntryStealthValue(checked ? 'deep' : 'generic')}
                />
                <Label htmlFor="stealth-toggle" className="font-normal text-sm">
                    {entryStealthOptions.find(o=>o.value === entryStealthValue)?.label}
                </Label>
            </div>
            <p className="text-xs text-muted-foreground">Determines if the trap simulates entry into a deep page.</p>
          </div>
          
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
            <p className="text-xs text-muted-foreground">Adjusts the loading speed of the very first page.</p>
          </div>
          
          <div className="space-y-2 pt-4 border-t border-border">
            <Label htmlFor="generated-url" className="text-foreground/80 font-semibold">Generated SpiteSpiral URL:</Label>
            <div className="flex items-center gap-2">
              <Input id="generated-url" value={generatedUrl} readOnly className="flex-grow bg-input border-2 border-primary focus:ring-primary text-sm" />
              <Button onClick={() => handleCopyUrl(generatedUrl)} variant="outline" size="icon" className="text-accent border-accent hover:bg-accent/10">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
             <p className="text-xs text-muted-foreground">
                Your User ID ({user?.uid ? <code className="bg-muted px-1 py-0.5 rounded-sm text-xs text-accent">{user.uid}</code> : 'N/A, please log in'}) is included.
             </p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Code className="h-6 w-6 text-accent" />
            <CardTitle className="text-xl text-primary">Step 3: Embedding Your SpiteSpiral Link</CardTitle>
          </div>
          <CardDescription>
            Choose a method below to embed the Generated SpiteSpiral URL (from Step 2) on your website. These methods use your direct SpiteSpiral URL. For simpler integration, consider pointing a path on your own domain (disallowed in robots.txt) to this URL via a redirect.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <h3 className="text-lg font-semibold text-primary mb-3">Easy Embedding Methods</h3>
            <Accordion type="single" collapsible className="w-full mb-6">
              <AccordionItem value="easy-embed-1">
                <AccordionTrigger className="text-accent hover:text-primary">Method: Simple HTML Link (Basic)</AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2 text-sm text-muted-foreground">
                  <p>Use Case: Easy to implement, good for footers, &quot;Terms of Service&quot; pages, or deep utility pages not often visited by humans.</p>
                  <p>How To: Place a standard HTML &lt;a&gt; tag linking to your chosen internal path on your website (e.g., /my-secret-bot-path/). This path must then be configured on your server to redirect to the SpiteSpiral URL generated in Step 2. Ensure /my-secret-bot-path/ is disallowed in your robots.txt for good bots. Consult your developer or hosting provider for setting up the redirect.</p>
                  {/* Placeholder for SnippetDisplay - Visible HTML Link Example */}
                  <p className="text-xs text-muted-foreground">Visible HTML Link Example (Placeholder): {simpleHtmlLinkSnippet}</p>
                  {/* Placeholder for SnippetDisplay - Less Visible HTML Link Example */}
                  <p className="text-xs text-muted-foreground">Less Visible HTML Link Example (Placeholder): {tinyHtmlLinkSnippet}</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="easy-embed-2">
                <AccordionTrigger className="text-accent hover:text-primary">Method: sitemap.xml Entry</AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2 text-sm text-muted-foreground">
                  <p>Placeholder for sitemap.xml instructions.</p>
                  {/* Placeholder for SnippetDisplay - Sitemap.xml Entry Example */}
                  <p className="text-xs text-muted-foreground">Sitemap.xml Entry Example (Placeholder): {sitemapEntrySnippet}</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <h3 className="text-lg font-semibold text-primary mb-3 mt-6">More Advanced Embedding Methods</h3>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="advanced-embed-1">
                <AccordionTrigger className="text-accent hover:text-primary">Method: CSS-Hidden Links (More Subtle)</AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2 text-sm text-muted-foreground">
                  <p>Placeholder for CSS-Hidden Links instructions.</p>
                  {/* Placeholder for SnippetDisplay - CSS Hidden Link (Style Attribute) */}
                  <p className="text-xs text-muted-foreground">CSS Hidden Link (Style Attribute) (Placeholder): {getCssHiddenLinkSnippet(generatedUrl || "YOUR_URL")}</p>
                  {/* Placeholder for SnippetDisplay - CSS Hidden Link (Dedicated Class) */}
                  <p className="text-xs text-muted-foreground">CSS Hidden Link (Dedicated Class) (Placeholder): {getCssClassLinkSnippet(generatedUrl || "YOUR_URL")}</p>
                  {/* Placeholder for SnippetDisplay - CSS Style for '.spite-link' class */}
                  <p className="text-xs text-muted-foreground">CSS Style for '.spite-link' class (Placeholder): {cssClassStyleSnippet}</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="advanced-embed-2">
                <AccordionTrigger className="text-accent hover:text-primary">Method: JavaScript Link Injection (Advanced)</AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2 text-sm text-muted-foreground">
                  <p>Placeholder for JavaScript Link Injection instructions.</p>
                  {/* Placeholder for SnippetDisplay - JavaScript Link Injection Example */}
                  <p className="text-xs text-muted-foreground">JavaScript Link Injection Example (Placeholder): {getJsInjectionSnippet(generatedUrl || "YOUR_URL")}</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="advanced-embed-3">
                <AccordionTrigger className="text-accent hover:text-primary">Method: Server-Side Conditional Redirection (Most Complex)</AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2 text-sm text-muted-foreground">
                  <p>Placeholder for Server-Side Redirection instructions.</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
        </CardContent>
      </Card>

      <Card className="shadow-lg border-accent/20">
        <CardHeader>
           <div className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-accent" />
            <CardTitle className="text-xl text-primary">Step 4: Final Checks &amp; Best Practices</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-foreground/80">Double-Check `robots.txt`</strong>: Ensure it&apos;s correctly disallowing your chosen SpiteSpiral path for good bots. Test it!</li>
            <li><strong className="text-foreground/80">Use a Dedicated Path/Subdomain (for Easy Methods)</strong>: If using the &quot;Simple HTML Link&quot; or &quot;Sitemap.xml Entry&quot; methods, a dedicated path on your site that redirects to the SpiteSpiral URL simplifies `robots.txt` management.</li>
            <li><strong className="text-foreground/80">Subtlety is Key</strong>: Don&apos;t make your SpiteSpiral link obvious or alarming to human users. The goal is to trap bots.</li>
            <li><strong className="text-foreground/80">One Link is Often Enough (when directly embedding SpiteSpiral URL)</strong>: For methods like CSS-hidden links or JS injection that use the direct SpiteSpiral URL, you often only need one well-placed instance per page or in a common template.</li>
            <li><strong className="text-foreground/80">`rel="nofollow"`</strong>: If creating standard HTML anchor (`<a>`) tags, always add `rel="nofollow"` to them to prevent passing link equity. (The provided snippets for CSS/JS injection that create `<a>` tags include this).</li>
            <li><strong className="text-foreground/80">SpiteSpiral Does the Heavy Lifting</strong>: Once a bot hits your configured SpiteSpiral URL, our system takes over with the LLM babble, delays, and recursive linking.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
