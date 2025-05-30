
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
import { Link as LinkIcon, Copy, Settings, Code, CheckCircle, HelpCircle, Info, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// SnippetDisplay component definition
const SnippetDisplay = ({ title, snippet, explanation, onCopy }: { title: string, snippet: string, explanation?: string, onCopy: (text: string, type: string) => void }) => {
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

# Optional: Add more good bots here if you wish.
# User-agent: AhrefsBot
# Disallow: ${path}
# User-agent: SemrushBot
# Disallow: ${path}

User-agent: *
# Ensure this doesn't conflict with a broader "Disallow: /" for User-agent: *
# The goal is to disallow your specific trap path for all bots,
# especially those that might ignore the specific good bot directives.
Disallow: ${path}`;


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

  const simpleHtmlLinkSnippet = (path: string) => `<a href="${path}" title="Archival Data Access">Internal Data Archives</a>`;
  const tinyHtmlLinkSnippet = (path: string) => `<a href="${path}" style="font-size:1px; color:transparent;" aria-hidden="true" tabindex="-1">.</a>`;
  const sitemapEntrySnippet = (path: string) => `<url><loc>https://example.com${path}</loc></url>`;
  
  const getCssHiddenLinkSnippet = (url: string) => `<a href="${url}" style="position:absolute; left:-9999px; top:-9999px;" rel="nofollow">Important Data Feed</a>`;
  const getCssClassLinkSnippet = (url: string) => `<a href="${url}" class="spite-link" rel="nofollow">Hidden Archive</a>`;
  const cssClassStyleSnippet = \`.spite-link {
  position: absolute;
  left: -9999px;
}\`;
  const getJsInjectionSnippet = (url: string) => \`<div id="spite-container"></div>
<script>
  document.addEventListener('DOMContentLoaded', function() {
    const spiteLink = document.createElement('a');
    spiteLink.href = "\${url}";
    spiteLink.innerHTML = "Diagnostic Data";
    spiteLink.setAttribute('aria-hidden', 'true');
    spiteLink.setAttribute('rel', 'nofollow');
    spiteLink.style.opacity = '0.01';
    if(document.getElementById('spite-container')) {
      document.getElementById('spite-container').appendChild(spiteLink);
    }
  });
</script>\`;

  return (
    <div className="space-y-8">
      <header className="mb-10">
        <div className="flex items-center gap-3">
          <LinkIcon className="h-10 w-10 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight text-primary glitch-text">Activate Your SpiteSpiral Trap</h1>
        </div>
        <p className="text-muted-foreground mt-2 text-lg">
          Ready to protect your site? Follow these steps to set up your SpiteSpiral link. We&apos;ll guide you to trap unwanted bots while keeping search engines like Google happy.
        </p>
      </header>

      {/* STEP 1: robots.txt */}
      <Card className="shadow-lg border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-accent" />
            <CardTitle className="text-xl text-primary">Step 1: Safeguard Your SEO with robots.txt</CardTitle>
          </div>
          <CardDescription>
            This is crucial! To ensure search engines (like Google) can still crawl your site properly, you need to tell them to ignore the path leading to your SpiteSpiral trap. Malicious bots usually ignore these instructions, which is how we catch them.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="userTrapPath" className="text-foreground/80 font-semibold">Your Website&apos;s Trap Path</Label>
            <Input 
              id="userTrapPath"
              value={userTrapPath} 
              onChange={(e) => setUserTrapPath(e.target.value)} 
              placeholder="/your-chosen-spitespiral-path/"
              className="mt-1 bg-input border-border focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">Enter a unique path for your SpiteSpiral link on your site (e.g., /secret-data-feed/). This path will be used in the robots.txt snippet below.</p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground/90 mb-1 mt-3">Add to Your robots.txt</h4>
            <SnippetDisplay 
              title="robots.txt Snippet"
              snippet={robotsTxtSnippet}
              explanation="This tells good bots like Googlebot to ignore your trap path, helping protect your SEO. Most malicious bots will ignore this and proceed into the trap."
              onCopy={handleCopy}
            />
          </div>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="robots-txt-details">
              <AccordionTrigger className="text-sm text-accent hover:text-primary">What is `robots.txt` and why is this important?</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-2 pt-2">
                <p><code className="bg-muted px-1 py-0.5 rounded-sm text-xs">robots.txt</code> is a file at the root of your website (e.g., www.yourwebsite.com/robots.txt) that tells web crawlers which pages or files the crawler can or can&apos;t request from your site.</p>
                <p><strong className="text-destructive">Critical Warning:</strong> Be very careful not to accidentally disallow your entire site (e.g., by adding <code className="bg-muted px-1 py-0.5 rounded-sm text-xs">User-agent: *</code> followed by <code className="bg-muted px-1 py-0.5 rounded-sm text-xs">Disallow: /</code> without other specific allow rules). This would tell search engines to ignore all your content!</p>
                <p>Always test your <code className="bg-muted px-1 py-0.5 rounded-sm text-xs">robots.txt</code> changes using <a href='https://support.google.com/webmasters/answer/6062598' target='_blank' rel='noopener noreferrer' className='text-accent hover:underline'>Google Search Console&apos;s robots.txt Tester</a> or similar tools.</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* STEP 2: Configure Trap URL */}
      <Card className="shadow-lg border-accent/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-6 w-6 text-accent" />
            <CardTitle className="text-xl text-primary">Step 2: Configure Your SpiteSpiral Trap Settings</CardTitle>
          </div>
          <CardDescription>
            Fine-tune your trap&apos;s behavior. Sensible defaults are selected. Your ready-to-use SpiteSpiral URL will generate below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <TooltipProvider>
            {/* Intensity */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label className="text-foreground/80">Trap Intensity</Label>
                <Tooltip>
                  <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-accent"><Info className="h-3.5 w-3.5" /></Button></TooltipTrigger>
                  <TooltipContent className="bg-popover text-popover-foreground border-primary/50 max-w-xs">
                    <p className="text-xs font-semibold">Controls initial trap &apos;aggressiveness&apos;.</p>
                    <ul className="list-disc pl-4 text-xs mt-1 space-y-1">
                      {intensityOptions.map(opt => <li key={opt.value}><strong>{opt.label}:</strong> {opt.description}</li>)}
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </div>
              <RadioGroup value={intensity} onValueChange={setIntensity} className="flex flex-col space-y-1">
                {intensityOptions.map(opt => (
                  <div key={opt.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={opt.value} id={`intensity-${opt.value}`} />
                    <Label htmlFor={`intensity-${opt.value}`} className="font-normal text-sm">{opt.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Theme */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="theme-select" className="text-foreground/80">Content &quot;Babble&quot; Theme</Label>
                 <Tooltip>
                  <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-accent"><Info className="h-3.5 w-3.5" /></Button></TooltipTrigger>
                  <TooltipContent className="bg-popover text-popover-foreground border-primary/50 max-w-xs">
                    <p className="text-xs font-semibold">Influences the &apos;flavor&apos; of the LLM-generated fake content.</p>
                     <ul className="list-disc pl-4 text-xs mt-1 space-y-1">
                        {themeOptions.map(opt => <li key={opt.value}><strong>{opt.label}:</strong> {opt.description}</li>)}
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </div>
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
            </div>
            
            {/* Entry Point Stealth */}
            <div className="space-y-2">
               <div className="flex items-center gap-1.5">
                <Label className="text-foreground/80">Entry Point Stealth</Label>
                 <Tooltip>
                  <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-accent"><Info className="h-3.5 w-3.5" /></Button></TooltipTrigger>
                  <TooltipContent className="bg-popover text-popover-foreground border-primary/50 max-w-xs">
                    <p className="text-xs font-semibold">Makes the trap entry point look more like a deep internal page.</p>
                     <ul className="list-disc pl-4 text-xs mt-1 space-y-1">
                        {entryStealthOptions.map(opt => <li key={opt.value}><strong>{opt.label}:</strong> {opt.description}</li>)}
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-center space-x-2">
                  <Switch
                      id="stealth-toggle"
                      checked={entryStealth === 'deep'}
                      onCheckedChange={(checked) => setEntryStealth(checked ? 'deep' : 'generic')}
                  />
                  <Label htmlFor="stealth-toggle" className="font-normal text-sm">
                      {entryStealthOptions.find(o=>o.value === entryStealth)?.label}
                  </Label>
              </div>
            </div>
            
            {/* Initial Lure Speed */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label className="text-foreground/80">Initial Lure Speed</Label>
                 <Tooltip>
                  <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-accent"><Info className="h-3.5 w-3.5" /></Button></TooltipTrigger>
                  <TooltipContent className="bg-popover text-popover-foreground border-primary/50 max-w-xs">
                     <p className="text-xs font-semibold">Adjusts delay of the very first trap page to &apos;hook&apos; bots faster.</p>
                     <ul className="list-disc pl-4 text-xs mt-1 space-y-1">
                        {lureSpeedOptions.map(opt => <li key={opt.value}><strong>{opt.label}:</strong> {opt.description}</li>)}
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </div>
              <RadioGroup value={lureSpeed} onValueChange={setLureSpeed} className="flex flex-col space-y-1">
                {lureSpeedOptions.map(opt => (
                  <div key={opt.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={opt.value} id={`lure-${opt.value}`} />
                    <Label htmlFor={`lure-${opt.value}`} className="font-normal text-sm">{opt.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </TooltipProvider>
          
          <div className="space-y-2 pt-4 border-t border-border">
            <Label htmlFor="generated-url" className="text-foreground/80 font-semibold">Generated SpiteSpiral URL:</Label>
            <div className="flex items-center gap-2">
              <Input id="generated-url" value={generatedUrl} readOnly className="flex-grow bg-input border-2 border-primary focus:ring-primary text-sm" />
              <Button onClick={() => handleCopy(generatedUrl, "SpiteSpiral URL")} variant="outline" size="icon" className="text-accent border-accent hover:bg-accent/10">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
             <p className="text-xs text-muted-foreground">
                This is the direct SpiteSpiral URL. See Step 3 for how to link to it from your website using your Trap Path. <br />
                Your User ID ({user?.uid ? <code className="bg-muted px-1 py-0.5 rounded-sm text-xs text-accent">{user.uid}</code> : 'N/A, please log in'}) is included for tracking.
             </p>
          </div>
        </CardContent>
      </Card>

      {/* STEP 3: Embedding Strategies */}
      <Card className="shadow-lg border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Code className="h-6 w-6 text-accent" />
            <CardTitle className="text-xl text-primary">Step 3: Place the Trap Link on Your Site</CardTitle>
          </div>
          <CardDescription>
            Now, link your chosen &apos;Trap Path&apos; (from Step 1) to your SpiteSpiral URL (from Step 2). Here&apos;s how:
          </CardDescription>
        </CardHeader>
        <CardContent>
            <h3 className="text-lg font-semibold text-primary mb-3">Easy Embedding Methods</h3>
            <Accordion type="single" collapsible className="w-full space-y-1">
              <AccordionItem value="easy-embed-1">
                <AccordionTrigger className="text-accent hover:text-primary text-sm">Simple HTML Link (Basic)</AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2 text-sm text-muted-foreground">
                    <p>Place a link on your website that points to the &apos;Trap Path&apos; you defined in Step 1 (e.g., <code className="bg-muted px-1 text-xs text-accent">{userTrapPath}</code>). Then, ensure your server redirects requests from this path to your full SpiteSpiral URL: <code className="bg-muted px-1 text-xs text-accent break-all">{generatedUrl}</code>. Consult your web developer or hosting provider for setting up redirects (e.g., via .htaccess, Nginx config, or CMS settings).</p>
                    <SnippetDisplay
                      title="Example Visible HTML Link (to your path)"
                      snippet={simpleHtmlLinkSnippet(userTrapPath)}
                      explanation={`Place this link on your site. Users click this, and your server should redirect them from "${userTrapPath}" to the SpiteSpiral URL.`}
                      onCopy={handleCopy}
                    />
                    <SnippetDisplay
                      title="Example Tiny Invisible Link (to your path)"
                      snippet={tinyHtmlLinkSnippet(userTrapPath)}
                      explanation={`A less human-visible link to "${userTrapPath}". This path must redirect to SpiteSpiral.`}
                      onCopy={handleCopy}
                    />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="easy-embed-2">
                <AccordionTrigger className="text-accent hover:text-primary text-sm">Sitemap.xml Entry</AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2 text-sm text-muted-foreground">
                   <p>Directly tell crawlers (that read sitemaps) about your chosen website path. This path should redirect/proxy to SpiteSpiral and be disallowed for good bots in robots.txt.</p>
                   <SnippetDisplay 
                    title="Sitemap.xml Entry Example"
                    snippet={sitemapEntrySnippet(userTrapPath)}
                    explanation="Add this to your sitemap.xml. Replace 'https://example.com' with your domain. Use a low priority."
                    onCopy={handleCopy}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <h3 className="text-lg font-semibold text-primary mb-3 mt-6">More Advanced Embedding Methods</h3>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="advanced-embed-1">
                  <AccordionTrigger className="text-accent hover:text-primary text-sm">CSS-Hidden Links (Direct to SpiteSpiral)</AccordionTrigger>
                  <AccordionContent className="space-y-3 pt-2 text-sm text-muted-foreground">
                    <p>Links that are part of the HTML (so crawlers see them) but are invisible or nearly invisible to human users. These would link directly to your generated SpiteSpiral URL (<code className="bg-muted px-1 text-xs text-accent break-all">{generatedUrl}</code>). Remember to add `rel="nofollow"` to these direct links.</p>
                    <SnippetDisplay 
                      title="CSS Hidden Link (Inline Style)"
                      snippet={getCssHiddenLinkSnippet(generatedUrl)}
                      explanation="Uses inline style to hide the link off-screen."
                      onCopy={handleCopy}
                    />
                    <SnippetDisplay 
                      title="CSS Hidden Link (Dedicated Class)"
                      snippet={getCssClassLinkSnippet(generatedUrl)}
                      explanation="Uses a CSS class. Add the corresponding style to your CSS file."
                      onCopy={handleCopy}
                    />
                    <SnippetDisplay 
                      title="CSS Style for '.spite-link' class"
                      snippet={cssClassStyleSnippet}
                      explanation="Add this to your website's CSS stylesheet."
                      onCopy={handleCopy}
                    />
                  </AccordionContent>
              </AccordionItem>
              <AccordionItem value="advanced-embed-2">
                <AccordionTrigger className="text-accent hover:text-primary text-sm">JavaScript Link Injection (Direct to SpiteSpiral)</AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2 text-sm text-muted-foreground">
                  <p>For more dynamic control. Caution: Over-reliance on JS might be missed by less sophisticated scrapers. This injects a link directly to your generated SpiteSpiral URL (<code className="bg-muted px-1 text-xs text-accent break-all">{generatedUrl}</code>).</p>
                  <SnippetDisplay 
                    title="JavaScript Link Injection Example"
                    snippet={getJsInjectionSnippet(generatedUrl)}
                    explanation="Injects a hidden link into a div with id 'spite-container'."
                    onCopy={handleCopy}
                  />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="advanced-embed-3">
                <AccordionTrigger className="text-accent hover:text-primary text-sm">Server-Side Conditional Redirection</AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2 text-sm text-muted-foreground">
                  <p>Most complex & powerful. Identify suspicious bot behavior on your server and then redirect them to your <code className="bg-muted px-1 text-xs text-accent">{userTrapPath}</code> (which then leads to SpiteSpiral). Requires server-side coding (Nginx, Apache, application middleware).</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
        </CardContent>
      </Card>

      {/* STEP 4: Final Checks */}
      <Card className="shadow-lg border-accent/20">
        <CardHeader>
           <div className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-accent" />
            <CardTitle className="text-xl text-primary">Step 4: Final Review & Go Live!</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <ul className="list-disc pl-5 space-y-1">
            <li><code className="bg-muted px-1 text-xs text-accent">robots.txt</code> is updated correctly with your chosen path (<code className="bg-muted px-1 text-xs text-accent">{userTrapPath}</code>) and allows good bots to your main site.</li>
            <li>A link to your site&apos;s &apos;Trap Path&apos; (which leads to SpiteSpiral) is live on your website.</li>
            <li>(Optional) Reviewed advanced configurations or embedding methods.</li>
          </ul>
          <p className="mt-3">You&apos;re all set! Unauthorized bots that ignore <code className="bg-muted px-1 text-xs text-accent">robots.txt</code> and discover your link will now get caught in the SpiteSpiral. Our system will handle the rest.</p>
          <Accordion type="single" collapsible className="w-full mt-3">
            <AccordionItem value="best-practices-details">
              <AccordionTrigger className="text-sm text-accent hover:text-primary">View All Best Practices & Tips</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-2 pt-2">
                <ul className="list-disc pl-5 space-y-1">
                    <li><strong className="text-foreground/80">Double-Check `robots.txt`</strong>: Ensure it&apos;s correctly disallowing your chosen SpiteSpiral path for good bots. Test it!</li>
                    <li><strong className="text-foreground/80">Use a Dedicated Path/Subdomain</strong>: If using redirect/proxy methods, a dedicated path on your site (like <code className="bg-muted px-1 text-xs text-accent">{userTrapPath}</code>) simplifies `robots.txt` management.</li>
                    <li><strong className="text-foreground/80">Subtlety is Key</strong>: Don&apos;t make your SpiteSpiral link obvious or alarming to human users. The goal is to trap bots.</li>
                    <li><strong className="text-foreground/80">One Link is Often Enough</strong>: You often only need one well-placed instance (e.g., in a common footer or header) that leads to your trap path.</li>
                    <li><strong className="text-foreground/80">`rel="nofollow"`</strong>: If creating standard HTML anchor (`<a>`) tags that directly link to the SpiteSpiral service URL (not your own trap path), always add `rel="nofollow"` to them.</li>
                    <li><strong className="text-foreground/80">SpiteSpiral Does the Heavy Lifting</strong>: Once a bot hits your configured SpiteSpiral URL, our system takes over.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}

    