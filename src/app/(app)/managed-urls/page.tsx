
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LinkIcon, Copy, Settings, Code, CheckCircle, HelpCircle, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch'; // Added Switch import

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
      if (entryStealthValue === 'deep') params.append('stealth', 'on'); // 'on' if deep, implies 'off' otherwise
      if (lureSpeed !== 'normal') params.append('lure_speed', lureSpeed);

      const queryString = params.toString();
      setGeneratedUrl(`${TARPIT_BASE_URL}/trap${queryString ? `?${queryString}` : ''}`);
    } else {
      // Default URL for logged-out users or if UID is not available
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
<a href="/your-chosen-spitespiral-path/" title="Archival Data Access" rel="nofollow">Internal Data Archives</a>`;
  const tinyHtmlLinkSnippet = `<!-- A tiny, almost invisible link to your chosen path -->
<a href="/your-chosen-spitespiral-path/" style="font-size:1px; color:transparent;" aria-hidden="true" tabindex="-1" rel="nofollow">.</a>`;
  const sitemapEntrySnippet = `<url>
  <loc>https://data-archive.yourdomain.com/</loc> 
  <lastmod>2024-01-01</lastmod>
  <priority>0.1</priority>
</url>`;

  const getCssHiddenLinkSnippet = (url: string) => `<a href="${url}" style="position:absolute; left:-9999px; top:-9999px;" rel="nofollow">Important Data Feed</a>`;
  const getCssClassLinkSnippet = (url: string) => `<a href="${url}" class="spite-link" rel="nofollow">Hidden Archive</a>`;
  const cssClassStyleSnippet = `.spite-link {
  position: absolute;
  left: -9999px; /* Moves it off-screen */
  /* Or more subtly: opacity: 0.01; font-size: 1px; */
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
    document.getElementById('spite-container').appendChild(spiteLink);
  });
</script>`;

  const SnippetDisplay = ({ title, snippet, explanation }: { title: string, snippet: string, explanation?: string }) => (
    <div className="space-y-2 mb-4">
      <h4 className="font-semibold text-sm text-primary">{title}</h4>
      <Textarea
        value={snippet}
        readOnly
        rows={snippet.split('\n').length > 1 ? Math.min(snippet.split('\n').length + 1, 10) : 3}
        className="bg-input border-border focus:ring-primary text-foreground/90 font-mono text-xs"
      />
      {explanation && <p className="text-xs text-muted-foreground">{explanation}</p>}
      <Button onClick={() => handleCopy(snippet, `${title} Snippet`)} variant="outline" size="sm" className="text-accent border-accent hover:bg-accent/10">
        <Copy className="mr-2 h-3 w-3" /> Copy Snippet
      </Button>
    </div>
  );

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
              <li><strong className="text-foreground/80">Define Your SpiteSpiral Path:</strong> Decide on a specific, unique path on your site that will host the SpiteSpiral link (e.g., /secret-bot-area/). This is the path you will disallow. The link you place at this path will then lead to the SpiteSpiral URL generated in Step 2.</li>
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
            Use the options below to fine-tune the behavior of your SpiteSpiral trap. Your unique, ready-to-embed URL will be generated at the bottom. This URL is what you&apos;ll use in Step 3.
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
              Low: Slower introduction of delays, slightly less dense linking.<br />
              Medium (Recommended Default): Balanced approach.<br />
              High: Quicker introduction of significant delays, denser internal linking.<br />
              Extreme: Very aggressive delays and link density from the start.
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
            <p className="text-xs text-muted-foreground">Influences the &apos;flavor&apos; of the LLM-generated text within the trap.</p>
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
            <p className="text-xs text-muted-foreground">Determines if the trap starts from a &apos;root&apos; page or simulates entry into a deep page.<br/>
             Generic Entry / Stealth Off (Default): Standard SpiteSpiral URL structure.<br />
             Deep Page Simulation / Stealth On: URL appears like a deep internal page, potentially less obviously a generic trap.
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
            <p className="text-xs text-muted-foreground">Adjusts the loading speed of the very first page in the trap.<br/>
            Normal Delay (Default): Intensity dictates first page delay.<br />
            Slightly Faster Initial Page: Minimal delay on first page to &apos;hook&apos; bots quickly.
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
                Use this full URL in the embedding methods in Step 3 (or the path you chose in Step 1 that redirects to this URL).
             </p>
          </div>
        </CardContent>
      </Card>

      {/* Step 3: Embedding Strategies */}
      <Card className="shadow-lg border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Code className="h-6 w-6 text-accent" />
            <CardTitle className="text-xl text-primary">Step 3: Embedding Your SpiteSpiral Link</CardTitle>
          </div>
          <CardDescription>
            Use your Generated SpiteSpiral URL (from Step 2) with the methods below. For the &quot;Simple HTML Link&quot; and &quot;Sitemap.xml Entry&quot;, you will link to the path on your own site (e.g., /your-chosen-spitespiral-path/) which you have configured to redirect to your Generated SpiteSpiral URL. For other methods like CSS-hidden links or JS Injection, you can often use the Generated SpiteSpiral URL directly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <h3 className="text-lg font-semibold text-primary mb-3">Easy Embedding Methods</h3>
          <Accordion type="single" collapsible className="w-full mb-6">
            <AccordionItem value="easy-embed-1">
              <AccordionTrigger className="text-accent hover:text-primary">Method: Simple HTML Link (Basic)</AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2 text-sm text-muted-foreground">
                 <p><strong>Use Case:</strong> Easy to implement, good for footers, &quot;Terms of Service&quot; pages, or deep utility pages not often visited by humans.</p>
                 <p><strong>How To:</strong></p>
                 <ol className="list-decimal list-inside space-y-2 my-2">
                   <li>
                     <strong>Embed the Link:</strong> Copy one of the HTML snippets below and paste it into your website&apos;s code.
                     <ul className="list-disc list-inside pl-5 mt-1">
                       <li>Replace <code>&quot;/your-chosen-spitespiral-path/&quot;</code> in the snippet with the <strong>exact path you disallowed in your `robots.txt` (Step 1)</strong>.</li>
                     </ul>
                   </li>
                   <li>
                     <strong>Make Your Path Lead to SpiteSpiral:</strong> The path you chose (e.g., <code>/secret-bot-area/</code>) on your website now needs to send visitors (especially bots) to your <strong>&apos;Generated SpiteSpiral URL&apos;</strong> (from Step 2), typically via a server-side redirect. Consult your web developer or hosting provider if unsure how to set up a redirect.
                   </li>
                 </ol>
                 <p className="mt-3 font-semibold text-foreground/90">Link Snippets:</p>
                <SnippetDisplay
                  title="Visible Link Snippet"
                  snippet={simpleHtmlLinkSnippet}
                />
                <SnippetDisplay
                  title="Less Visible Link Snippet"
                  snippet={tinyHtmlLinkSnippet}
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="easy-embed-2">
              <AccordionTrigger className="text-accent hover:text-primary">Method: sitemap.xml Entry</AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2 text-sm text-muted-foreground">
                <p><strong>Use Case:</strong> Directly tells crawlers (that read sitemaps) about the existence of this &quot;section.&quot;</p>
                <p><strong>How To:</strong> Add an entry to your sitemap.xml file pointing to the path on your domain (e.g., <code className="bg-muted px-1 rounded-sm text-xs">https://yourdomain.com/your-chosen-spitespiral-path/</code>) that you&apos;ve disallowed for good bots and configured to lead to your SpiteSpiral URL.</p>
                 <SnippetDisplay
                    title="Sitemap.xml Snippet"
                    snippet={sitemapEntrySnippet}
                    explanation="Note: Set a low priority. Replace the example https://data-archive.yourdomain.com/ with your actual chosen path."
                  />
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <h3 className="text-lg font-semibold text-primary mb-3 mt-6">More Advanced Embedding Methods</h3>
          <Accordion type="single" collapsible className="w-full">
             <AccordionItem value="advanced-embed-1">
              <AccordionTrigger className="text-accent hover:text-primary">Method: CSS-Hidden Links (More Subtle)</AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2 text-sm text-muted-foreground">
                <p><strong>Use Case:</strong> Links that are part of the HTML (so crawlers see them) but are invisible or nearly invisible to human users. These can use your <code className="bg-muted px-1 rounded-sm text-xs text-accent">{generatedUrl}</code> directly.</p>
                <SnippetDisplay
                    title="CSS Hidden Link Snippet 1 (Inline Style)"
                    snippet={getCssHiddenLinkSnippet(generatedUrl)}
                  />
                <p className="mt-2">OR use a dedicated CSS class:</p>
                 <SnippetDisplay
                    title="CSS Hidden Link Snippet 2 (Using Class)"
                    snippet={getCssClassLinkSnippet(generatedUrl)}
                  />
                 <SnippetDisplay
                    title="Required CSS for Class Method"
                    snippet={cssClassStyleSnippet}
                  />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="advanced-embed-2">
              <AccordionTrigger className="text-accent hover:text-primary">Method: JavaScript Link Injection (Advanced)</AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2 text-sm text-muted-foreground">
                <p><strong>Use Case:</strong> For more dynamic control; can make the link appear only under certain conditions or after a delay. Can use your <code className="bg-muted px-1 rounded-sm text-xs text-accent">{generatedUrl}</code> directly.</p>
                <SnippetDisplay
                    title="JavaScript Injection Snippet"
                    snippet={getJsInjectionSnippet(generatedUrl)}
                    explanation="Caution: Over-reliance on JS for link generation might be missed by less sophisticated scrapers that don't execute JS well. Prefer HTML links when possible for broad compatibility."
                  />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="advanced-embed-3">
              <AccordionTrigger className="text-accent hover:text-primary">Method: Server-Side Conditional Redirection (Most Complex)</AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2 text-sm text-muted-foreground">
                <p><strong>Use Case:</strong> Identifying suspicious bot behavior at the server level and then serving a link to, or directly redirecting to, your SpiteSpiral path/subdomain (which in turn loads your Generated SpiteSpiral URL).</p>
                <p><strong>How To:</strong> This is highly environment-specific. Requires server-side coding or configuration (e.g., Nginx if statements with rate limiting, or application middleware). If a bot trips a &quot;bad behavior&quot; threshold, your server could redirect it: HTTP 302 Found to your disallowed path (e.g., `/your-chosen-spitespiral-path/`) or directly to your Generated SpiteSpiral URL.</p>
                <p className="mt-2 text-xs text-primary"><strong>SpiteSpiral Note:</strong> This is an advanced technique for clients to implement on their servers. SpiteSpiral provides the destination trap URL.</p>
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
            <li><strong className="text-foreground/80">Double-Check `robots.txt`:</strong> Ensure it correctly disallows your chosen SpiteSpiral path for good bots. Test it!</li>
            <li><strong className="text-foreground/80">Use a Dedicated Path/Subdomain on Your Site:</strong> This makes `robots.txt` management easier and clearer for the &quot;Simple HTML Link&quot; and &quot;Sitemap&quot; methods.</li>
            <li><strong className="text-foreground/80">Monitor (If Possible):</strong> If your server logs allow, you might see traffic hitting your chosen path. This can indicate the trap is being visited.</li>
            <li><strong className="text-foreground/80">Subtlety is Key:</strong> Don&apos;t make your SpiteSpiral link obvious or alarming to human users. The goal is to trap bots.</li>
            <li><strong className="text-foreground/80">`rel="nofollow"`:</strong> When using `<a>` tags for embedding (especially if visible), add `rel="nofollow"` to the link. This instructs search engines not to follow the link or pass ranking value, further protecting your SEO. Our snippets for `<a>` tags include this.</li>
            <li><strong className="text-foreground/80">SpiteSpiral Does the Heavy Lifting:</strong> Once a bot hits your configured SpiteSpiral URL (either directly or via your site&apos;s redirected path), our system takes over with the LLM babble, delays, and recursive linking.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
