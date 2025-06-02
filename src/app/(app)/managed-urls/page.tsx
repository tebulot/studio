
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
import { Link2 as Link2Icon, Copy, Settings, Code, CheckCircle, HelpCircle, Info, ShieldCheck, Settings2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import AddUrlForm from '@/components/managed-urls/AddUrlForm';
import UrlList from '@/components/managed-urls/UrlList';

// SnippetDisplay component definition
const SnippetDisplay = ({ title, snippet, explanation, onCopy }: { title: string, snippet: string, explanation?: React.ReactNode, onCopy: (text: string, type: string) => void }) => {
  return (
    <div className="space-y-2 mb-4">
      <h4 className="font-semibold text-sm text-primary">{title}</h4>
      <Textarea
        value={snippet}
        readOnly
        rows={snippet.split('\n').length > 1 ? Math.min(snippet.split('\n').length + 1, 12) : 3}
        className="bg-input border-border focus:ring-primary text-foreground/90 font-mono text-xs"
      />
      {explanation && <div className="text-xs text-muted-foreground">{explanation}</div>}
      <Button onClick={() => onCopy(snippet, `${title} Snippet`)} variant="outline" size="sm" className="text-accent border-accent hover:bg-accent/10">
        <Copy className="mr-2 h-3 w-3" /> Copy Snippet
      </Button>
    </div>
  );
};

// Trap Configuration Options
const intensityOptions = [
  { value: 'low', label: 'Low', description: "Slower introduction of delays, slightly less dense linking. Good for very subtle, long-term engagement." },
  { value: 'medium', label: 'Medium (Recommended)', description: "Balanced approach. Moderate initial delays and link complexity." },
  { value: 'high', label: 'High', description: "Quicker introduction of significant delays, denser internal linking. Aims to bog down bots more rapidly." },
  { value: 'extreme', label: 'Extreme', description: "Very aggressive delays and link density from the start. Use if you want to make an immediate, strong impact on resource consumption." },
];

const themeOptions = [
  { value: 'generic', label: 'Generic (Default)', description: "A broad mix of plausible-sounding text." },
  { value: 'tech', label: 'Generic Tech', description: "Subtly mimic content from the tech industry." },
  { value: 'biz', label: 'Business/Finance Jargon', description: "Subtly mimic content from the business/finance industry." },
  { value: 'academic', label: 'Abstract Academia', description: "Subtly mimic content from academic fields." },
  { value: 'art', label: 'Creative/Artistic Musings', description: "Subtly mimic content from creative or artistic fields." },
  { value: 'legal', label: 'Pseudo-Legal Text', description: "Subtly mimic content resembling legal documents." },
];

const entryStealthOptions = [
  { value: 'generic', label: 'Generic Entry', description: "The trap starts with a more generic-looking base URL structure provided by SpiteSpiral." },
  { value: 'deep', label: 'Deep Page Simulation', description: "The generated URL will include more complex path segments (still leading to SpiteSpiral, but appearing like a deep internal page)." },
];

const lureSpeedOptions = [
  { value: 'normal', label: 'Normal Delay (Default)', description: "The trap's configured intensity dictates the first page's delay." },
  { value: 'fast_intro', label: 'Slightly Faster Initial Page', description: "The first page loads with a minimal delay to quickly 'hook' the bot, with subsequent pages reverting to the chosen intensity's delay strategy." },
];

const robotsTxtTemplate = (path: string) => `# Add this to your website's robots.txt file:

User-agent: Googlebot
Disallow: ${path}

User-agent: bingbot
Disallow: ${path}

# Optional: Add more good bots to list?
# User-agent: AhrefsBot
# Disallow: ${path}
# User-agent: SemrushBot
# Disallow: ${path}

User-agent: *
Disallow: /api/ # General Next.js good practice
Disallow: ${path}
# Ensure this doesn't block your whole site if you have a wider User-agent: * block.
# The primary goal is to disallow the path for specified good bots.
# Malicious bots that ignore these rules for good bots are our target.`;

const simpleHtmlLinkSnippet = (path: string) => `<a href="${path}" title="Archival Data Access">Internal Data Archives</a>`;
const tinyHtmlLinkSnippet = (path: string) => `<a href="${path}" style="font-size:1px; color:transparent;" aria-hidden="true" tabindex="-1">.</a>`;
const sitemapEntrySnippet = (path: string) => `<url>
  <loc>https://yourwebsite.com${path.startsWith('/') ? path : '/' + path}</loc>
  <lastmod>2024-01-01</lastmod>
  <priority>0.1</priority>
</url>`;

const getCssClassLinkSnippet = (url: string) => `<a href="${url}" class="spite-link" rel="nofollow">Hidden Archive</a>`;
const cssClassStyleSnippet = `.spite-link {
  position: absolute;
  left: -9999px;
}`;
const getJsInjectionSnippet = (url: string) => `<div id="spite-container"></div>
<script>
  document.addEventListener('DOMContentLoaded', function() {
    // Potentially add conditions here before injecting
    const spiteLink = document.createElement('a');
    spiteLink.href = "${url}";
    spiteLink.innerHTML = "Diagnostic Data";
    spiteLink.setAttribute('aria-hidden', 'true'); // If it's not for users
    spiteLink.setAttribute('rel', 'nofollow'); // Good practice
    spiteLink.style.opacity = '0.01'; // Make it unobtrusive
    if(document.getElementById('spite-container')) {
      document.getElementById('spite-container').appendChild(spiteLink);
    }
  });
</script>`;

const getExtremelyBasicLinkSnippet = (url: string) => `<a href="${url}" rel="nofollow noopener noreferrer" aria-hidden="true" tabindex="-1" style="opacity:0.01; position:absolute; left:-9999px; top:-9999px; font-size:1px; color:transparent;" title="Data Archive (Internal Use Only)">Internal Resources</a>`;

export default function ManagedUrlsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [userTrapPath, setUserTrapPath] = useState('/secret-data-feed/');
  const [intensity, setIntensity] = useState('medium');
  const [theme, setTheme] = useState('generic');
  const [entryStealth, setEntryStealth] = useState('generic');
  const [lureSpeed, setLureSpeed] = useState('normal');

  const [robotsTxtSnippet, setRobotsTxtSnippet] = useState('');
  const [generatedUrl, setGeneratedUrl] = useState('');
  
  const TARPIT_BASE_URL = process.env.NEXT_PUBLIC_TARPIT_BASE_URL || 'https://your-spitespiral-service.com';

  const handleCopy = useCallback((textToCopy: string, type: string = "Text") => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          toast({ title: "Copied!", description: `${type} copied to clipboard.` });
        })
        .catch(err => {
          console.error("Copy error:", err);
          toast({ title: "Error", description: `Could not copy ${type}.`, variant: "destructive" });
        });
    } else {
       toast({ title: "Error", description: "Clipboard API not available.", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => {
    const sanitizedUserPath = userTrapPath.startsWith('/') ? userTrapPath : `/${userTrapPath}`;
    setRobotsTxtSnippet(robotsTxtTemplate(sanitizedUserPath));

    if (user?.uid) {
      const params = new URLSearchParams();
      params.append('client_id', user.uid);
      if (intensity !== 'medium') params.append('intensity', intensity);
      if (theme !== 'generic') params.append('theme', theme);
      if (entryStealth === 'deep') params.append('stealth', 'on');
      if (lureSpeed !== 'normal') params.append('lure_speed', lureSpeed);
      
      const queryString = params.toString();
      setGeneratedUrl(`${TARPIT_BASE_URL}/trap${queryString ? `?${queryString}` : ''}`);
    } else {
      setGeneratedUrl(`${TARPIT_BASE_URL}/trap?client_id=YOUR_USER_ID&intensity=medium&theme=generic&stealth=off&lure_speed=normal`);
    }
  }, [userTrapPath, intensity, theme, entryStealth, lureSpeed, user, TARPIT_BASE_URL]);


  return (
    <div className="space-y-8">
      <header className="mb-10">
        <div className="flex items-center gap-3">
          <Link2Icon className="h-10 w-10 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight text-primary glitch-text">Activate Your SpiteSpiral Trap</h1>
        </div>
        <p className="text-muted-foreground mt-2 text-lg">
          Ready to protect your site? Follow these steps to set up your SpiteSpiral link. We'll guide you to trap unwanted bots while keeping search engines like Google happy.
        </p>
      </header>

      {/* Section 1: Create & Manage Your Tarpit Instances */}
      <Card className="shadow-lg border-accent/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-7 w-7 text-accent" />
            <CardTitle className="text-2xl text-accent">Create &amp; Manage Your Tarpit Instances</CardTitle>
          </div>
          <CardDescription>
            Create named tarpit instances here. Each instance will have a unique SpiteSpiral URL that you can embed. Use the guide below for setup and best practices.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AddUrlForm />
          <UrlList />
        </CardContent>
      </Card>

      {/* Section 2: Setup & Embedding Guide */}
      <Card className="shadow-lg border-primary/20">
        <CardHeader>
           <div className="flex items-center gap-2">
            <Info className="h-7 w-7 text-accent" />
            <CardTitle className="text-2xl text-accent">Setup &amp; Embedding Guide</CardTitle>
          </div>
          <CardDescription>
            Follow these steps to effectively integrate SpiteSpiral and protect your website.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {/* STEP 1: robots.txt */}
            <AccordionItem value="step-1-robots">
              <AccordionTrigger className="text-xl font-semibold text-primary hover:no-underline">Step 1: Safeguard Your SEO with `robots.txt`</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-3">
                <p className="text-muted-foreground">
                  This is crucial! To ensure search engines (like Google) can still crawl your site properly, you need to tell them to ignore the path leading to your SpiteSpiral trap. Malicious bots usually ignore these instructions, which is how we catch them.
                </p>
                <div>
                  <Label htmlFor="userTrapPath" className="text-foreground/80 font-semibold">Your Website's Trap Path</Label>
                  <Input
                    id="userTrapPath"
                    value={userTrapPath}
                    onChange={(e) => setUserTrapPath(e.target.value)}
                    placeholder="e.g., /secret-data-feed/ or /bot-honeypot/"
                    className="mt-1 bg-input border-border focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Enter a unique path for your SpiteSpiral link on your site. This path will be used in the `robots.txt` snippet below.</p>
                </div>
                <div>
                  <Label className="text-foreground/80 font-semibold">Add to Your `robots.txt`</Label>
                  <SnippetDisplay
                    title=""
                    snippet={robotsTxtSnippet}
                    explanation={
                      <Accordion type="single" collapsible className="w-full mt-2">
                        <AccordionItem value="robots-txt-details">
                           <AccordionTrigger className="font-semibold text-sm text-accent border border-accent/50 rounded-md px-3 py-2 hover:no-underline [&>svg]:h-4 [&>svg]:w-4">What is `robots.txt` and why is this important?</AccordionTrigger>
                          <AccordionContent className="text-xs pt-2 space-y-1 text-muted-foreground">
                            <p><code className="text-xs bg-muted p-0.5 rounded">robots.txt</code> is a file at the root of your site (e.g., <code className="text-xs bg-muted p-0.5 rounded">yourwebsite.com/robots.txt</code>) that tells 'good' web crawlers (like Googlebot) which pages or sections they shouldn't crawl.</p>
                            <p>We want these good bots to crawl your real content for SEO, but *not* the path you dedicate for SpiteSpiral. Malicious bots often ignore `robots.txt`, which is how they find our trap.</p>
                            <p className="font-semibold text-destructive">CRITICAL: Be careful not to accidentally disallow your entire site (e.g., by writing <code className="text-xs bg-muted p-0.5 rounded">Disallow: /</code> under <code className="text-xs bg-muted p-0.5 rounded">User-agent: *</code> without other `Allow` rules). Always test your `robots.txt` changes using <a href="https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt#test-robots-txt" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">Google Search Console's robots.txt Tester</a> or similar tools.</p>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    }
                    onCopy={handleCopy}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* STEP 2: Configure Trap */}
            <AccordionItem value="step-2-configure">
              <AccordionTrigger className="text-xl font-semibold text-primary hover:no-underline">
                Step 2: Configure Your SpiteSpiral Trap Settings (Advanced - Coming Soon)
                 <span className="block text-xs text-muted-foreground font-normal mt-1">Current tarpits are modified Nepenthes tarpits that, while functional, do not support these features yet.</span>
              </AccordionTrigger>
              <AccordionContent className="space-y-6 pt-3">
                <p className="text-muted-foreground">
                  The following options demonstrate future capabilities for fine-tuning trap behavior. Currently, Managed URLs created above use default SpiteSpiral (Nepenthes-based) settings. The URL generated below is an example of how parameters *could* be used for future, more advanced trap types.
                </p>
                 <TooltipProvider>
                    {/* Trap Intensity */}
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Label className="text-foreground/80 font-semibold">Trap Intensity</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-5 w-5 ml-1 text-muted-foreground"><HelpCircle className="h-3.5 w-3.5" /></Button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs bg-popover text-popover-foreground border-primary/50">
                            <p className="font-bold mb-1">Controls initial trap 'aggressiveness':</p>
                            <ul className="list-disc pl-4 text-xs space-y-1">
                              {intensityOptions.map(opt => <li key={opt.value}><strong>{opt.label.replace(' (Recommended)', '')}:</strong> {opt.description}</li>)}
                            </ul>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <RadioGroup value={intensity} onValueChange={setIntensity} className="flex flex-wrap gap-4" disabled>
                        {intensityOptions.map(option => (
                          <div key={option.value} className="flex items-center space-x-2">
                            <RadioGroupItem value={option.value} id={`intensity-${option.value}`} disabled />
                            <Label htmlFor={`intensity-${option.value}`} className="text-sm font-normal">{option.label}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    {/* Babble Theme */}
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Label htmlFor="babble-theme" className="text-foreground/80 font-semibold">Content "Babble" Theme</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-5 w-5 ml-1 text-muted-foreground"><HelpCircle className="h-3.5 w-3.5" /></Button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs bg-popover text-popover-foreground border-primary/50">
                            <p className="font-bold mb-1">Influences the 'flavor' of the LLM-generated fake content:</p>
                            <p className="text-xs">While always nonsensical, a theme can make the fake content appear more aligned with a specific domain, potentially making data pollution more effective if scrapers are targeting certain types of information.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Select value={theme} onValueChange={setTheme} disabled>
                        <SelectTrigger id="babble-theme" className="w-full md:w-[300px] bg-input border-border focus:ring-primary" disabled>
                          <SelectValue placeholder="Select theme" />
                        </SelectTrigger>
                        <SelectContent>
                          {themeOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Entry Point Stealth */}
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Label htmlFor="entry-stealth-toggle" className="text-foreground/80 font-semibold">Entry Point Stealth</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-5 w-5 ml-1 text-muted-foreground"><HelpCircle className="h-3.5 w-3.5" /></Button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs bg-popover text-popover-foreground border-primary/50">
                            <p className="font-bold mb-1">Makes the trap entry point look more like a deep internal page:</p>
                            <ul className="list-disc pl-4 text-xs space-y-1">
                              {entryStealthOptions.map(opt => <li key={opt.value}><strong>{opt.label}:</strong> {opt.description}</li>)}
                            </ul>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="flex items-center space-x-2 p-2 border border-dashed border-border rounded-md">
                        <Switch
                          id="entry-stealth-toggle"
                          checked={entryStealth === 'deep'}
                          onCheckedChange={(checked) => setEntryStealth(checked ? 'deep' : 'generic')}
                          disabled
                          className="data-[state=unchecked]:border-border"
                        />
                        <Label htmlFor="entry-stealth-toggle" className="text-sm font-medium">
                          {entryStealth === 'deep' ? "Deep Page Simulation (Stealth On)" : "Generic Entry (Stealth Off)"}
                        </Label>
                      </div>
                    </div>
                    
                    {/* Initial Lure Speed */}
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Label className="text-foreground/80 font-semibold">Initial Lure Speed</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-5 w-5 ml-1 text-muted-foreground"><HelpCircle className="h-3.5 w-3.5" /></Button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs bg-popover text-popover-foreground border-primary/50">
                            <p className="font-bold mb-1">Adjusts delay of the very first trap page to 'hook' bots faster:</p>
                            <ul className="list-disc pl-4 text-xs space-y-1">
                              {lureSpeedOptions.map(opt => <li key={opt.value}><strong>{opt.label.replace(' (Default)', '')}:</strong> {opt.description}</li>)}
                            </ul>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <RadioGroup value={lureSpeed} onValueChange={setLureSpeed} className="flex flex-wrap gap-4" disabled>
                        {lureSpeedOptions.map(option => (
                          <div key={option.value} className="flex items-center space-x-2">
                            <RadioGroupItem value={option.value} id={`lure-${option.value}`} disabled />
                            <Label htmlFor={`lure-${option.value}`} className="text-sm font-normal">{option.label}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                </TooltipProvider>
                {/* Generated URL */}
                <div>
                  <Label htmlFor="generated-url" className="text-foreground/80 font-semibold">Example Parameterized SpiteSpiral URL</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id="generated-url"
                      value={generatedUrl}
                      readOnly
                      className="flex-grow bg-input border-2 border-primary focus:ring-primary text-sm"
                    />
                    <Button onClick={() => handleCopy(generatedUrl, "Example SpiteSpiral URL")} variant="outline" className="text-accent border-accent hover:bg-accent/10">
                      <Copy className="mr-2 h-4 w-4" /> Copy Example URL
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">This URL demonstrates how parameters for future features would look. For actual deployment, use the URLs generated from the "Create New Managed URL" form above.</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* STEP 3: Embedding Strategies */}
            <AccordionItem value="step-3-embed">
              <AccordionTrigger className="text-xl font-semibold text-primary hover:no-underline">Step 3: Place the Trap Link on Your Site</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-3">
                <p className="text-muted-foreground">
                  Now, you need to link to your SpiteSpiral service. Choose one of the methods below.
                  You'll either link to your chosen "Trap Path" (from Step 1, e.g., <code className="bg-muted px-1 py-0.5 rounded text-xs">{userTrapPath}</code>) and then configure your server to redirect/proxy that path to your SpiteSpiral URL,
                  OR you'll link *directly* to a "SpiteSpiral URL" (obtained from your "Managed URLs" list, or the "Example Parameterized SpiteSpiral URL" from Step 2 for testing).
                </p>
                
                <h3 className="text-lg font-semibold text-accent mt-6 mb-2">Easy Embedding Methods</h3>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="embed-simplest-html-direct">
                    <AccordionTrigger>Simplest: Hidden HTML Link (Direct to SpiteSpiral)</AccordionTrigger>
                    <AccordionContent className="space-y-2 pt-2">
                       <p className="text-sm text-muted-foreground">
                        This is the easiest method. Paste this HTML snippet directly into your website (e.g., near the footer). It links *directly* to your <span className="font-semibold">Generated SpiteSpiral URL</span>.
                        The link is designed to be invisible to users and includes attributes to discourage good bots. The full SpiteSpiral URL will be visible in your site's source code.
                      </p>
                      <SnippetDisplay 
                        title="Simplest Hidden HTML Link (Direct to SpiteSpiral)" 
                        snippet={getExtremelyBasicLinkSnippet(generatedUrl)} 
                        explanation={<>Use a <span className="font-semibold">Generated SpiteSpiral URL</span> (from "Managed URLs" list or Step 2 for testing) in this snippet.</>}
                        onCopy={handleCopy}
                      />
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="embed-standard-html-redirect">
                    <AccordionTrigger>Standard: HTML Link on Your Site (Requires Redirect/Proxy)</AccordionTrigger>
                    <AccordionContent className="space-y-2 pt-2">
                       <p className="text-sm text-muted-foreground">
                        Place an HTML link on your website pointing to your chosen "Trap Path" (e.g., <code className="bg-muted px-1 py-0.5 rounded text-xs">{userTrapPath}</code>).
                        You then *must* configure your server to make this Trap Path redirect or proxy to your actual <span className="font-semibold">Generated SpiteSpiral URL</span>.
                        This method is preferred if you want to hide the SpiteSpiral URL from your site's source code.
                        If unsure about server redirects/proxies, use the "Simplest HTML Link (Direct to SpiteSpiral)" method above.
                      </p>
                      <SnippetDisplay title="Visible HTML Link (to your Trap Path)" snippet={simpleHtmlLinkSnippet(userTrapPath)} explanation={<>Links to your site's <code className="bg-muted px-1 py-0.5 rounded text-xs">{userTrapPath}</code>, which then redirects/proxies to a <span className="font-semibold">Generated SpiteSpiral URL</span>.</>} onCopy={handleCopy}/>
                      <SnippetDisplay title="Tiny, Invisible HTML Link (to your Trap Path)" snippet={tinyHtmlLinkSnippet(userTrapPath)} explanation={<>A less visible link to your site's <code className="bg-muted px-1 py-0.5 rounded text-xs">{userTrapPath}</code>, which redirects/proxies to a <span className="font-semibold">Generated SpiteSpiral URL</span>.</>} onCopy={handleCopy}/>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="embed-sitemap-redirect">
                    <AccordionTrigger>Standard: `sitemap.xml` Entry (Requires Redirect/Proxy)</AccordionTrigger>
                    <AccordionContent className="space-y-2 pt-2">
                      <p className="text-sm text-muted-foreground">Add an entry to your <code className="bg-muted px-1 py-0.5 rounded text-xs">sitemap.xml</code> file pointing to your chosen "Trap Path" (e.g., <code className="bg-muted px-1 py-0.5 rounded text-xs">{userTrapPath}</code>). Ensure this path is disallowed for good bots in `robots.txt` and that your server redirects/proxies it to a <span className="font-semibold">Generated SpiteSpiral URL</span>.</p>
                      <SnippetDisplay title="sitemap.xml Entry (for your Trap Path)" snippet={sitemapEntrySnippet(userTrapPath)} explanation={<>Points to your site's <code className="bg-muted px-1 py-0.5 rounded text-xs">{userTrapPath}</code>, which should then redirect/proxy to a <span className="font-semibold">Generated SpiteSpiral URL</span>.</>} onCopy={handleCopy}/>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <h3 className="text-lg font-semibold text-accent mt-6 mb-2">More Advanced Embedding Methods</h3>
                 <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="embed-css-hidden-direct">
                      <AccordionTrigger>CSS-Hidden Links (Direct to SpiteSpiral)</AccordionTrigger>
                      <AccordionContent className="space-y-2 pt-2">
                          <p className="text-sm text-muted-foreground">These links are present in HTML but made invisible to users using CSS. They link *directly* to your <span className="font-semibold">Generated SpiteSpiral URL</span>. This is an alternative to the "Simplest HTML Link" if you prefer using CSS classes for styling.</p>
                          <SnippetDisplay title="Link with CSS Class (Direct to SpiteSpiral)" snippet={getCssClassLinkSnippet(generatedUrl)} explanation={<>Uses a <span className="font-semibold">Generated SpiteSpiral URL</span>.</>} onCopy={handleCopy} />
                          <SnippetDisplay title="Required CSS for .spite-link class" snippet={cssClassStyleSnippet} explanation="Add this CSS to your site's stylesheet." onCopy={handleCopy} />
                      </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="embed-js-injection-direct">
                      <AccordionTrigger>JavaScript Link Injection (Direct to SpiteSpiral)</AccordionTrigger>
                      <AccordionContent className="space-y-2 pt-2">
                          <p className="text-sm text-muted-foreground">Dynamically inject the link using JavaScript. This may be missed by some less sophisticated scrapers. The link is created *directly* to your <span className="font-semibold">Generated SpiteSpiral URL</span>.</p>
                          <SnippetDisplay title="JS Link Injection Example (Direct to SpiteSpiral)" snippet={getJsInjectionSnippet(generatedUrl)} explanation={<>Uses a <span className="font-semibold">Generated SpiteSpiral URL</span>.</>} onCopy={handleCopy} />
                      </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="embed-server-side-direct">
                      <AccordionTrigger>Server-Side Conditional Redirection (Most Powerful, Direct to SpiteSpiral)</AccordionTrigger>
                      <AccordionContent className="space-y-2 pt-2">
                          <p className="text-sm text-muted-foreground">
                            This is the most flexible method. Identify suspicious bots on your server (e.g., based on behavior patterns, unusual user agents, request frequency from a single IP, or failed login attempts).
                            Once identified, your server issues an HTTP redirect (e.g., 302 Found or 307 Temporary Redirect) sending the bot *directly* to your <span className="font-semibold">Generated SpiteSpiral URL</span>.
                          </p>
                          <p className="text-sm text-muted-foreground mt-2">
                            <span className="font-semibold text-primary">Future Enhancement with API:</span> With the upcoming "API for Your Individual Tarpit Data," you could further enhance this. Before redirecting, your server could make an API call to SpiteSpiral to log the suspicious IP/User-Agent against your specific tarpit instance. This would provide more detailed tracking in your SpiteSpiral dashboard about *why* a bot was redirected, then you'd proceed with the redirect.
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            This method requires server-side configuration (e.g., Nginx, Apache, application middleware in Node.js/Python/PHP, or serverless functions). Example: If a bot trips a "bad behavior" threshold, your server redirects to: <code className="bg-muted px-1 py-0.5 rounded text-xs text-accent break-all">{generatedUrl}</code>.
                          </p>
                      </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </AccordionContent>
            </AccordionItem>

            {/* STEP 4: Final Checks */}
            <AccordionItem value="step-4-final">
              <AccordionTrigger className="text-xl font-semibold text-primary hover:no-underline">Step 4: Final Review &amp; Go Live!</AccordionTrigger>
              <AccordionContent className="space-y-3 pt-3">
                 <p className="text-sm text-muted-foreground">Before you're done, quickly verify:</p>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-foreground/80">
                    <li>Your <code className="text-xs bg-muted p-0.5 rounded">robots.txt</code> is updated correctly with the path <code className="text-xs bg-muted p-0.5 rounded">{userTrapPath}</code> (from Step 1) and allows good bots to your main site.</li>
                    <li>A link to your site's 'Trap Path' (which leads to a SpiteSpiral URL from your "Managed URLs" list above or the "Example Parameterized SpiteSpiral URL" from Step 2 if you're not using named instances) is live on your website (Step 3).</li>
                    <li>(Optional) Reviewed advanced configurations or embedding methods.</li>
                  </ul>
                  <p className="text-sm text-muted-foreground mt-3">You're all set! Unauthorized bots that ignore <code className="text-xs bg-muted p-0.5 rounded">robots.txt</code> and discover your link will now get caught in the SpiteSpiral. Our system will handle the rest.</p>
                  <Accordion type="single" collapsible className="w-full mt-4">
                      <AccordionItem value="best-practices">
                        <AccordionTrigger className="text-sm text-accent hover:no-underline">View All Best Practices &amp; Tips</AccordionTrigger>
                        <AccordionContent className="text-xs pt-2 space-y-2 text-muted-foreground">
                            <ul className="list-disc pl-4 space-y-1">
                                <li><strong>Double-Check <code className="text-xs">robots.txt</code>:</strong> Ensure it's correctly disallowing your SpiteSpiral path for good bots and allowing everything else they need. Test it!</li>
                                <li><strong>Use a Dedicated Path/Subdomain:</strong> This makes <code className="text-xs">robots.txt</code> management easier and clearer.</li>
                                <li><strong>Monitor (If Possible):</strong> If your server logs allow, you might see traffic hitting your chosen path. (Your SpiteSpiral dashboard will also show activity on the SpiteSpiral URL itself).</li>
                                <li><strong>Subtlety is Key:</strong> Don't make your SpiteSpiral link obvious or alarming to human users.</li>
                                <li><strong>One Link is Often Enough:</strong> A few well-placed, disavowed (for good bots) links are usually sufficient.</li>
                                <li><strong>SpiteSpiral Does the Heavy Lifting:</strong> Once a bot hits your configured SpiteSpiral URL (via your site's path/subdomain), our system takes over.</li>
                            </ul>
                        </AccordionContent>
                      </AccordionItem>
                  </Accordion>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}

