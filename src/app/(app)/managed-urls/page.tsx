
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
import { Link2 as LinkIcon, Copy, Settings, Code, CheckCircle, HelpCircle, Info, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

const entryStealthOptions = [ // For tooltip content
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

# Optional: Add more good bots here if you wish.
# User-agent: AhrefsBot
# Disallow: ${path}
# User-agent: SemrushBot
# Disallow: ${path}

User-agent: *
# Ensure this doesn't conflict with a broader "Disallow: /" for User-agent: *
# The primary goal is to disallow your specific trap path for all bots,
# especially those that might ignore the specific good bot directives.
Disallow: ${path}`;


export default function ManagedUrlsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [userTrapPath, setUserTrapPath] = useState('/secret-data-feed/');
  const [intensity, setIntensity] = useState('medium');
  const [theme, setTheme] = useState('generic');
  const [entryStealth, setEntryStealth] = useState('generic'); // 'generic' (off) or 'deep' (on)
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
      // Fallback URL for when user is not available (e.g., during initial load)
      setGeneratedUrl(`${TARPIT_BASE_URL}/trap?client_id=YOUR_USER_ID&intensity=medium&theme=generic&stealth=off&lure_speed=normal`);
    }
  }, [userTrapPath, intensity, theme, entryStealth, lureSpeed, user, TARPIT_BASE_URL]);

  // Snippet definitions
  const simpleHtmlLinkSnippet = (path: string) => `<a href="${path}" title="Archival Data Access" rel="nofollow">Internal Data Archives</a>`;
  const tinyHtmlLinkSnippet = (path: string) => `<a href="${path}" style="font-size:1px; color:transparent;" aria-hidden="true" tabindex="-1" rel="nofollow">.</a>`;
  const sitemapEntrySnippet = (path: string) => `<url>
  <loc>https://yourwebsite.com${path.startsWith('/') ? path : '/' + path}</loc>
  <lastmod>2024-01-01</lastmod>
  <priority>0.1</priority>
</url>`;

  const getCssHiddenLinkSnippet = (url: string) => `<a href="${url}" style="position:absolute; left:-9999px; top:-9999px;" rel="nofollow">Important Data Feed</a>`;
  const getCssClassLinkSnippet = (url: string) => `<a href="${url}" class="spite-link" rel="nofollow">Hidden Archive</a>`;
  const cssClassStyleSnippet = `.spite-link {\n  position: absolute;\n  left: -9999px;\n}`;
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

  return (
    <div className="space-y-8">
      <header className="mb-10">
        <div className="flex items-center gap-3">
          <LinkIcon className="h-10 w-10 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight text-primary glitch-text">Activate Your SpiteSpiral Trap</h1>
        </div>
        <p className="text-muted-foreground mt-2 text-lg">
          Ready to protect your site? Follow these steps to set up your SpiteSpiral link. We'll guide you to trap unwanted bots while keeping search engines like Google happy.
        </p>
      </header>

      {/* STEP 1: robots.txt */}
      <Card className="shadow-lg border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-accent" />
            <CardTitle className="text-2xl text-accent">Step 1: Safeguard Your SEO with robots.txt</CardTitle>
          </div>
          <CardDescription>
            This is crucial! To ensure search engines (like Google) can still crawl your site properly, you need to tell them to ignore the path leading to your SpiteSpiral trap. Malicious bots usually ignore these instructions, which is how we catch them.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="userTrapPath" className="text-foreground/80 font-semibold">Your Website's Trap Path</Label>
            <Input
              id="userTrapPath"
              value={userTrapPath}
              onChange={(e) => setUserTrapPath(e.target.value)}
              placeholder="e.g., /secret-data-feed/"
              className="mt-1 bg-input border-border focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">Enter a unique path for your SpiteSpiral link on your site. This path will be used in the robots.txt snippet below.</p>
          </div>
          <div>
            <Label className="text-foreground/80 font-semibold">Add to Your robots.txt</Label>
            <SnippetDisplay
              title=""
              snippet={robotsTxtSnippet}
              explanation={
                <Accordion type="single" collapsible className="w-full mt-2">
                  <AccordionItem value="robots-txt-details">
                    <AccordionTrigger className="text-xs text-accent hover:no-underline p-0 [&>svg]:h-3 [&>svg]:w-3">What is robots.txt and why is this important?</AccordionTrigger>
                    <AccordionContent className="text-xs pt-2 space-y-1">
                      <p><code className="text-xs bg-muted p-0.5 rounded">robots.txt</code> is a file at the root of your site (e.g., <code className="text-xs bg-muted p-0.5 rounded">yourwebsite.com/robots.txt</code>) that tells 'good' web crawlers (like Googlebot) which pages or sections they shouldn't crawl.</p>
                      <p>We want these good bots to crawl your real content for SEO, but *not* the path you dedicate for SpiteSpiral. Malicious bots often ignore `robots.txt`, which is how they find our trap.</p>
                      <p className="font-semibold text-destructive">CRITICAL: Be careful not to accidentally disallow your entire site (e.g., by writing <code className="text-xs">Disallow: /</code> under <code className="text-xs">User-agent: *</code> without other `Allow` rules). Always test your <code className="text-xs">robots.txt</code> changes, for example, using <a href="https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt#test-robots-txt" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">Google Search Console's robots.txt Tester</a>.</p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              }
              onCopy={handleCopy}
            />
          </div>
        </CardContent>
      </Card>

      {/* STEP 2: Configure Trap */}
      <Card className="shadow-lg border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-7 w-7 text-accent" />
            <CardTitle className="text-2xl text-accent">Step 2: Configure Your SpiteSpiral Trap Settings <span className="font-bold text-destructive text-sm">(Coming Soon)</span></CardTitle>
          </div>
          <CardDescription>
            Fine-tune your trap's behavior. Sensible defaults are selected. Your ready-to-use SpiteSpiral URL will generate below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <TooltipProvider>
            {/* Trap Intensity */}
            <div className="space-y-2">
              <div className="flex items-center">
                <Label className="text-foreground/80 font-semibold">Trap Intensity</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-5 w-5 ml-1 text-muted-foreground"><Info className="h-3.5 w-3.5" /></Button>
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
                    <RadioGroupItem value={option.value} id={`intensity-${option.value}`} disabled/>
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
                    <Button variant="ghost" size="icon" className="h-5 w-5 ml-1 text-muted-foreground"><Info className="h-3.5 w-3.5" /></Button>
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
                    <Button variant="ghost" size="icon" className="h-5 w-5 ml-1 text-muted-foreground"><Info className="h-3.5 w-3.5" /></Button>
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
                    <Button variant="ghost" size="icon" className="h-5 w-5 ml-1 text-muted-foreground"><Info className="h-3.5 w-3.5" /></Button>
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
                    <RadioGroupItem value={option.value} id={`lure-${option.value}`} disabled/>
                    <Label htmlFor={`lure-${option.value}`} className="text-sm font-normal">{option.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Generated URL */}
            <div>
              <Label htmlFor="generated-url" className="text-foreground/80 font-semibold">Generated SpiteSpiral URL</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="generated-url"
                  value={generatedUrl}
                  readOnly
                  className="flex-grow bg-input border-2 border-primary focus:ring-primary text-sm"
                />
                <Button onClick={() => handleCopy(generatedUrl, "SpiteSpiral URL")} variant="outline" className="text-accent border-accent hover:bg-accent/10">
                  <Copy className="mr-2 h-4 w-4" /> Copy URL
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">This is the direct SpiteSpiral URL. See Step 3 for how to link to it from your website using your Trap Path.</p>
            </div>
          </TooltipProvider>
        </CardContent>
      </Card>

      {/* STEP 3: Embedding Strategies */}
      <Card className="shadow-lg border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Code className="h-7 w-7 text-accent" />
            <CardTitle className="text-2xl text-accent">Step 3: Place the Trap Link on Your Site</CardTitle>
          </div>
          <CardDescription>
            Now, link your chosen "Trap Path" (from Step 1) to your SpiteSpiral URL (from Step 2). Here's how:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg text-primary mb-2">Recommended: Using a Redirect or Proxy (Easiest for Most)</h3>
            <p className="text-sm text-muted-foreground mb-3">
              The cleanest way is to make your website's "Trap Path" (e.g., <code className="text-xs bg-muted p-0.5 rounded">{userTrapPath}</code>) automatically redirect or proxy requests to your SpiteSpiral URL: <br />
              <code className="text-xs bg-muted p-0.5 rounded break-all block my-1">{generatedUrl}</code>
            </p>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="redirect-proxy-details">
                <AccordionTrigger className="text-sm text-accent hover:no-underline">How to set up redirects/proxies (General Advice)</AccordionTrigger>
                <AccordionContent className="text-xs pt-2 space-y-2">
                  <p><strong>Option A (If SpiteSpiral Offers Managed Proxy/CNAME):</strong> If you've configured <code className="text-xs bg-muted p-0.5 rounded">{userTrapPath}</code> or a subdomain like <code className="text-xs bg-muted p-0.5 rounded">trap.yourdomain.com</code> to be managed by SpiteSpiral (via CNAME or proxy settings we might provide in the future), simply create a link on your website directly to that path/subdomain. This is the simplest setup if available.</p>
                  <SnippetDisplay title="Example HTML (for Managed Proxy/CNAME)" snippet={`<a href="${userTrapPath}" title="Hidden Archive" rel="nofollow">Extra Resources</a>`} onCopy={handleCopy} />
                  <p><strong>Option B (User Manages Redirect):</strong> On your server, set up a 301 (permanent) or 302 (temporary) redirect from <code className="text-xs bg-muted p-0.5 rounded">{userTrapPath}</code> to your full SpiteSpiral URL shown above. How to do this depends on your server:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Apache:</strong> Use <code className="text-xs">.htaccess</code> with <code className="text-xs">Redirect</code> or <code className="text-xs">RewriteRule</code>.</li>
                    <li><strong>Nginx:</strong> Use a <code className="text-xs">location</code> block with a <code className="text-xs">return 301</code> or <code className="text-xs">rewrite</code>.</li>
                    <li><strong>CMS (WordPress, Shopify, etc.):</strong> Many CMSs have built-in redirect managers or plugins.</li>
                    <li><strong>Cloud Hosting (Netlify, Vercel, etc.):</strong> Often have configuration files for redirects (e.g., <code className="text-xs">_redirects</code>, <code className="text-xs">vercel.json</code>).</li>
                  </ul>
                  <p>Consult your hosting provider's documentation or your web developer if unsure.</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg text-primary mt-6 mb-2">More Ways to Add the Link</h3>
             <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="direct-html">
                    <AccordionTrigger>Direct HTML Link (Less Stealthy URL)</AccordionTrigger>
                    <AccordionContent className="space-y-2">
                        <p className="text-xs text-muted-foreground">If you cannot set up a redirect or proxy, you can link directly to the long SpiteSpiral URL. This is less ideal as the URL itself might look suspicious to some advanced bots if they analyze it, but it's functional.</p>
                        <SnippetDisplay title="Visible Direct Link" snippet={`<a href="${generatedUrl}" title="Archival Data Access" rel="nofollow">Internal Data Archives</a>`} onCopy={handleCopy} />
                        <SnippetDisplay title="Tiny, Invisible Direct Link" snippet={getCssHiddenLinkSnippet(generatedUrl).replace('Important Data Feed', '.')} onCopy={handleCopy} />
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="sitemap">
                    <AccordionTrigger>sitemap.xml Entry</AccordionTrigger>
                    <AccordionContent className="space-y-2">
                        <p className="text-xs text-muted-foreground">Directly tells crawlers (that read sitemaps) about your trap path. Ensure this path is disallowed for good bots in <code className="text-xs">robots.txt</code>.</p>
                        <SnippetDisplay title="sitemap.xml Entry Example" snippet={sitemapEntrySnippet(userTrapPath)} explanation="Replace 'https://example.com' with your actual domain and adjust lastmod." onCopy={handleCopy} />
                    </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="css-hidden">
                    <AccordionTrigger>CSS-Hidden Links</AccordionTrigger>
                    <AccordionContent className="space-y-2">
                        <p className="text-xs text-muted-foreground">Links present in HTML (so crawlers see them) but invisible or nearly invisible to users.</p>
                        <SnippetDisplay title="Off-Screen Link (Inline Style)" snippet={getCssHiddenLinkSnippet(generatedUrl)} onCopy={handleCopy} />
                        <SnippetDisplay title="Link with CSS Class" snippet={getCssClassLinkSnippet(generatedUrl)} onCopy={handleCopy} />
                        <SnippetDisplay title="Required CSS for .spite-link" snippet={cssClassStyleSnippet} onCopy={handleCopy} />
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="js-injection">
                    <AccordionTrigger>JavaScript Link Injection (Advanced)</AccordionTrigger>
                    <AccordionContent className="space-y-2">
                        <p className="text-xs text-muted-foreground">For dynamic control; may be missed by less sophisticated scrapers. Prefer HTML links for broad compatibility.</p>
                        <SnippetDisplay title="JS Link Injection Example" snippet={getJsInjectionSnippet(generatedUrl)} onCopy={handleCopy} />
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="server-side">
                    <AccordionTrigger>Server-Side Conditional Redirection (Most Complex)</AccordionTrigger>
                    <AccordionContent className="space-y-2">
                         <p className="text-xs text-muted-foreground">Identify suspicious bot behavior on your server and then redirect them to your SpiteSpiral URL. This is highly environment-specific (e.g., Nginx, Apache, application middleware). SpiteSpiral provides the destination trap.</p>
                    </AccordionContent>
                </AccordionItem>
             </Accordion>
          </div>
        </CardContent>
      </Card>

      {/* STEP 4: Final Checks */}
      <Card className="shadow-lg border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-7 w-7 text-accent" />
            <CardTitle className="text-2xl text-accent">Step 4: Final Review & Go Live!</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Before you're done, quickly verify:</p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-foreground/80">
            <li>Your <code className="text-xs bg-muted p-0.5 rounded">robots.txt</code> is updated correctly with the path <code className="text-xs bg-muted p-0.5 rounded">{userTrapPath}</code> (from Step 1) and allows good bots to your main site.</li>
            <li>A link to your site's 'Trap Path' (which leads to SpiteSpiral) is live on your website (Step 3).</li>
            <li>You've copied your <strong className="text-primary">Generated SpiteSpiral URL</strong> from Step 2 if needed for redirects.</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-3">You're all set! Unauthorized bots that ignore <code className="text-xs bg-muted p-0.5 rounded">robots.txt</code> and discover your link will now get caught in the SpiteSpiral. Our system will handle the rest.</p>
          <Accordion type="single" collapsible className="w-full mt-4">
              <AccordionItem value="best-practices">
                <AccordionTrigger className="text-sm text-accent hover:no-underline">View All Best Practices & Tips</AccordionTrigger>
                <AccordionContent className="text-xs pt-2 space-y-2">
                    <ul className="list-disc pl-4 space-y-1">
                        <li><strong>Double-Check <code className="text-xs">robots.txt</code>:</strong> Ensure it's correctly disallowing your SpiteSpiral path for good bots and allowing everything else they need. Test it!</li>
                        <li><strong>Use a Dedicated Path/Subdomain:</strong> This makes <code className="text-xs">robots.txt</code> management easier and clearer.</li>
                        <li><strong>Monitor (If Possible):</strong> If your server logs allow, you might see traffic hitting your chosen path. This can indicate the trap is being visited. (Your SpiteSpiral dashboard will also show activity on the SpiteSpiral URL itself).</li>
                        <li><strong>Subtlety is Key:</strong> Don't make your SpiteSpiral link obvious or alarming to human users. The goal is to trap bots.</li>
                        <li><strong>One Link is Often Enough:</strong> You don't need to scatter hundreds of these. A few well-placed, disavowed (for good bots) links are usually sufficient.</li>
                        <li><strong>SpiteSpiral Does the Heavy Lifting:</strong> Once a bot hits your configured SpiteSpiral URL (via your site's path/subdomain), our system takes over with the LLM babble, delays, and recursive linking.</li>
                    </ul>
                </AccordionContent>
              </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}

