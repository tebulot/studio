
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Copy, Edit3, Loader2, Save, Settings2, HelpCircle, ShieldCheck, Code as CodeIcon } from "lucide-react"; // Added Settings2, HelpCircle, CodeIcon
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase/clientApp";
import { collection, query, where, onSnapshot, Timestamp, type DocumentData, type QueryDocumentSnapshot, doc, updateDoc, deleteDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { deprovisionTarpitInstance } from '@/lib/actions';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ManagedUrlFirestoreData {
  id: string;
  name: string;
  description?: string;
  fullUrl: string;
  pathSegment: string;
  instanceId?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  status: "active" | "inactive";
  userId: string;
}

const editFormSchema = z.object({
  name: z.string().min(1, "Tarpit Name is required."),
  description: z.string().optional(),
});

type EditFormData = z.infer<typeof editFormSchema>;


// SnippetDisplay component definition (moved from managed-urls/page.tsx)
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

// Trap Configuration Options (moved from managed-urls/page.tsx)
const intensityOptions = [
  { value: 'low', label: 'Low', description: "Slower introduction of delays, slightly less dense linking." },
  { value: 'medium', label: 'Medium (Recommended)', description: "Balanced approach." },
  { value: 'high', label: 'High', description: "Quicker introduction of significant delays, denser internal linking." },
  { value: 'extreme', label: 'Extreme', description: "Very aggressive delays and link density." },
];

const themeOptions = [
  { value: 'generic', label: 'Generic (Default)', description: "A broad mix of plausible-sounding text." },
  { value: 'tech', label: 'Generic Tech', description: "Content mimicking the tech industry." },
  // Add other themes as needed
];

const entryStealthOptions = [
  { value: 'generic', label: 'Generic Entry', description: "Standard base URL structure." },
  { value: 'deep', label: 'Deep Page Simulation', description: "URL appears like a deep internal page." },
];

const lureSpeedOptions = [
  { value: 'normal', label: 'Normal Delay (Default)', description: "Standard delay for the first page." },
  { value: 'fast_intro', label: 'Slightly Faster Initial Page', description: "Minimal delay on the first page to 'hook' bots." },
];

// Snippet generating functions (moved and adapted from managed-urls/page.tsx)
const robotsTxtTemplate = (yourSiteTrapPath: string) => `# Add this to your website's robots.txt file:
# Replace '${yourSiteTrapPath}' with the actual path you configure on your site
# that will redirect/proxy to the SpiteSpiral URL.

User-agent: Googlebot
Disallow: ${yourSiteTrapPath}

User-agent: bingbot
Disallow: ${yourSiteTrapPath}

User-agent: *
Disallow: /api/ # General Next.js good practice
Disallow: ${yourSiteTrapPath}
# Ensure this doesn't block your whole site if you have a wider User-agent: * block.
# Malicious bots that ignore these rules are our target.`;

const simpleHtmlLinkSnippet = (yourSiteTrapPath: string) => `<a href="${yourSiteTrapPath}" title="Archival Data Access">Internal Data Archives</a>`;
const tinyHtmlLinkSnippet = (yourSiteTrapPath: string) => `<a href="${yourSiteTrapPath}" style="font-size:1px; color:transparent;" aria-hidden="true" tabindex="-1">.</a>`;
const sitemapEntrySnippet = (yourSiteTrapPath: string) => `<url>
  <loc>https://yourwebsite.com${yourSiteTrapPath.startsWith('/') ? yourSiteTrapPath : '/' + yourSiteTrapPath}</loc>
  <lastmod>${new Date().toISOString().split('T')[0]}</lastmod> 
  <priority>0.1</priority>
</url>`;

const getCssClassLinkSnippet = (spiteSpiralUrl: string) => `<a href="${spiteSpiralUrl}" class="spite-link" rel="nofollow">Hidden Archive</a>`;
const cssClassStyleSnippet = `.spite-link {
  position: absolute;
  left: -9999px;
}`;
const getJsInjectionSnippet = (spiteSpiralUrl: string) => `<div id="spite-container"></div>
<script>
  document.addEventListener('DOMContentLoaded', function() {
    const spiteLink = document.createElement('a');
    spiteLink.href = "${spiteSpiralUrl}";
    spiteLink.innerHTML = "Diagnostic Data";
    spiteLink.setAttribute('aria-hidden', 'true');
    spiteLink.setAttribute('rel', 'nofollow');
    spiteLink.style.opacity = '0.01';
    if(document.getElementById('spite-container')) {
      document.getElementById('spite-container').appendChild(spiteLink);
    }
  });
</script>`;

const getExtremelyBasicLinkSnippet = (spiteSpiralUrl: string) => `<a href="${spiteSpiralUrl}" rel="nofollow noopener noreferrer" aria-hidden="true" tabindex="-1" style="opacity:0.01; position:absolute; left:-9999px; top:-9999px; font-size:1px; color:transparent;" title="Data Archive (Internal Use Only)">Internal Resources</a>`;


export default function UrlList() {
  const { user, loading: authLoading } = useAuth();
  const [urls, setUrls] = useState<ManagedUrlFirestoreData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentUrlToEdit, setCurrentUrlToEdit] = useState<ManagedUrlFirestoreData | null>(null);
  const [isEditLoading, setIsEditLoading] = useState(false);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentUrlToDelete, setCurrentUrlToDelete] = useState<ManagedUrlFirestoreData | null>(null);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  // For the new setup guide dialog
  const [isSetupGuideOpen, setIsSetupGuideOpen] = useState(false);
  const [currentUrlForSetupGuide, setCurrentUrlForSetupGuide] = useState<ManagedUrlFirestoreData | null>(null);
  
  // State for the (disabled) advanced config example within the setup guide dialog
  const [exampleIntensity, setExampleIntensity] = useState('medium');
  const [exampleTheme, setExampleTheme] = useState('generic');
  const [exampleEntryStealth, setExampleEntryStealth] = useState('generic');
  const [exampleLureSpeed, setExampleLureSpeed] = useState('normal');


  const editForm = useForm<EditFormData>({
    resolver: zodResolver(editFormSchema),
    defaultValues: { name: "", description: "" },
  });

  useEffect(() => {
    if (authLoading) { setIsLoading(true); return; }
    if (!user || !user.uid) { setUrls([]); setIsLoading(false); return; }
    
    setIsLoading(true);
    const currentUserId = user.uid;
    const q = query(collection(db, "tarpit_configs"), where("userId", "==", currentUserId), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const validUrls: ManagedUrlFirestoreData[] = [];
      querySnapshot.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
        const data = docSnap.data();
        if (data.name && data.fullUrl && data.pathSegment && data.userId && data.status && data.createdAt?.toMillis) {
          validUrls.push({ id: docSnap.id, ...data } as ManagedUrlFirestoreData);
        } else {
          console.warn(`Document ${docSnap.id} is missing required fields. Data:`, data);
        }
      });
      setUrls(validUrls);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching managed URLs:", error);
      toast({ title: "Error", description: "Could not fetch managed URLs.", variant: "destructive" });
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user, authLoading, toast]);

  const handleEditOpen = (url: ManagedUrlFirestoreData) => {
    setCurrentUrlToEdit(url);
    editForm.reset({ name: url.name, description: url.description || "" });
    setIsEditDialogOpen(true);
  };

  const onEditSubmit: SubmitHandler<EditFormData> = async (formData) => {
    if (!currentUrlToEdit || !user) return;
    setIsEditLoading(true);
    try {
      const docRef = doc(db, "tarpit_configs", currentUrlToEdit.id);
      await updateDoc(docRef, {
        name: formData.name,
        description: formData.description || "",
        updatedAt: serverTimestamp(),
      });
      toast({ title: "Success!", description: "Managed URL updated.", variant: "default" });
      setIsEditDialogOpen(false);
      setCurrentUrlToEdit(null);
    } catch (error) {
      console.error("Error updating URL:", error);
      toast({ title: "Error", description: `Failed to update URL: ${error instanceof Error ? error.message : "Unknown error"}`, variant: "destructive" });
    } finally {
      setIsEditLoading(false);
    }
  };

  const handleDeleteOpen = (url: ManagedUrlFirestoreData) => {
    setCurrentUrlToDelete(url);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!currentUrlToDelete || !user) return;
    setIsDeleteLoading(true);
    try {
      const deprovisionResult = await deprovisionTarpitInstance({
        instanceId: currentUrlToDelete.instanceId,
        pathSegment: currentUrlToDelete.pathSegment,
        userId: user.uid,
      });
      if (!deprovisionResult.success) {
        toast({ title: "De-provisioning Failed", description: deprovisionResult.message, variant: "destructive", duration: 7000 });
        setIsDeleteLoading(false);
        return;
      }
      await deleteDoc(doc(db, "tarpit_configs", currentUrlToDelete.id));
      toast({ title: "Success!", description: "Managed URL & instance deleted.", variant: "default" });
      setIsDeleteDialogOpen(false);
      setCurrentUrlToDelete(null);
    } catch (error) {
      console.error("Error deleting URL:", error);
      toast({ title: "Error", description: `Deletion failed: ${error instanceof Error ? error.message : "Unknown error"}`, variant: "destructive" });
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const handleCopy = useCallback((textToCopy: string, type: string = "Text") => {
    navigator.clipboard.writeText(textToCopy)
      .then(() => toast({ title: "Copied!", description: `${type} copied.` }))
      .catch(err => toast({ title: "Error", description: `Could not copy ${type}.`, variant: "destructive" }));
  }, [toast]);

  const handleSetupGuideOpen = (url: ManagedUrlFirestoreData) => {
    setCurrentUrlForSetupGuide(url);
    // Reset example config state for the dialog
    setExampleIntensity('medium');
    setExampleTheme('generic');
    setExampleEntryStealth('generic');
    setExampleLureSpeed('normal');
    setIsSetupGuideOpen(true);
  };
  
  const generatedExampleAdvancedUrl = currentUrlForSetupGuide ? (() => {
    const base = currentUrlForSetupGuide.fullUrl;
    const params = new URLSearchParams();
    // Only add params if they differ from default, to keep URL clean
    if (exampleIntensity !== 'medium') params.append('intensity', exampleIntensity);
    if (exampleTheme !== 'generic') params.append('theme', exampleTheme);
    if (exampleEntryStealth === 'deep') params.append('stealth', 'on'); // 'on' if deep, not present if generic
    if (exampleLureSpeed !== 'normal') params.append('lure_speed', exampleLureSpeed);
    
    const queryString = params.toString();
    return queryString ? `${base}${base.includes('?') ? '&' : '?'}${queryString}` : base;
  })() : "";


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading URLs...</p>
      </div>
    );
  }

  if (!user && !authLoading) {
    return <p className="text-muted-foreground text-center py-4">Please log in.</p>;
  }
  if (urls.length === 0 && !authLoading && user) {
    return <p className="text-muted-foreground text-center py-4">No URLs configured. Add one!</p>;
  }

  const USER_TRAP_PATH_PLACEHOLDER = "/your-chosen-path-for-this-trap/";

  return (
    <>
      <ScrollArea className="h-[250px] -mx-6 px-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {urls.map((url) => (
            <Card key={url.id} className="flex flex-col justify-between border-border hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg text-primary break-all">{url.name}</CardTitle>
                  <Badge variant={url.status === 'active' ? 'default' : 'secondary'} className={url.status === 'active' ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}>
                    {url.status}
                  </Badge>
                </div>
                <CardDescription className="text-muted-foreground/80 pt-1">
                  {url.description || "No description."}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-xs text-muted-foreground">Instance ID: {url.instanceId || "N/A"}</p>
                <p className="text-sm text-foreground/90 break-all mt-1">
                  <span className="font-semibold text-muted-foreground">Full URL: </span>
                  <a href={url.fullUrl} target="_blank" rel="noopener noreferrer" className="hover:underline text-accent">{url.fullUrl}</a>
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Created: {url.createdAt ? new Date(url.createdAt.toDate()).toLocaleDateString() : 'N/A'}
                  {url.updatedAt && (<span className="ml-2">| Updated: {new Date(url.updatedAt.toDate()).toLocaleDateString()}</span>)}
                </p>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t border-border pt-4">
                <Button variant="outline" size="sm" title="Setup & Embedding Guide" onClick={() => handleSetupGuideOpen(url)} className="text-primary border-primary hover:bg-primary/10 hover:text-primary-foreground">
                  <Settings2 className="mr-2 h-4 w-4" /> Setup Guide
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleCopy(url.fullUrl, "URL")} title="Copy URL" className="text-muted-foreground hover:text-primary"><Copy className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" title="Edit URL" onClick={() => handleEditOpen(url)} className="text-muted-foreground hover:text-accent"><Edit3 className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" title="Delete URL" onClick={() => handleDeleteOpen(url)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {/* Setup Guide Dialog */}
      <Dialog open={isSetupGuideOpen} onOpenChange={setIsSetupGuideOpen}>
        <DialogContent className="max-w-3xl w-full bg-card border-primary/30 p-0">
          <DialogHeader className="p-6 pb-4 border-b border-border">
            <DialogTitle className="text-primary text-2xl flex items-center">
              <Settings2 className="mr-3 h-6 w-6"/>Setup &amp; Embedding Guide for: <span className="text-accent ml-2 truncate max-w-xs">{currentUrlForSetupGuide?.name}</span>
            </DialogTitle>
            <DialogDescription className="pt-1">
              Follow these steps to integrate this specific SpiteSpiral trap (<code className="text-xs bg-muted p-0.5 rounded text-accent break-all">{currentUrlForSetupGuide?.fullUrl}</code>) and protect your website.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="p-6">
            <Accordion type="single" collapsible className="w-full">
              {/* STEP 1: robots.txt */}
              <AccordionItem value="step-1-robots">
                <AccordionTrigger className="text-xl font-semibold text-primary hover:no-underline">Step 1: Safeguard Your SEO with `robots.txt`</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-3">
                  <p className="text-muted-foreground">
                    Crucial! To ensure search engines (like Google) crawl your site properly, tell them to ignore the path you'll use for this SpiteSpiral trap. Malicious bots usually ignore these instructions.
                  </p>
                  <div>
                    <Label className="text-foreground/80 font-semibold">Your Website's Trap Path (Placeholder)</Label>
                    <Input
                      id="userTrapPathPlaceholder"
                      value={USER_TRAP_PATH_PLACEHOLDER}
                      readOnly
                      className="mt-1 bg-input border-border focus:ring-primary cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground mt-1">This is a <span className="font-semibold">placeholder</span>. On your website, you will choose a unique path (e.g., <code className="text-xs">/internal-data-archive/</code>) and configure your server to redirect or proxy requests from this path to your SpiteSpiral URL: <code className="text-xs bg-muted p-0.5 rounded text-accent break-all">{currentUrlForSetupGuide?.fullUrl}</code>. Then, use your chosen path in the `robots.txt` snippet below.</p>
                  </div>
                  <div>
                    <Label className="text-foreground/80 font-semibold">Add to Your `robots.txt`</Label>
                    <SnippetDisplay
                      title=""
                      snippet={robotsTxtTemplate(USER_TRAP_PATH_PLACEHOLDER)}
                      explanation={
                        <Accordion type="single" collapsible className="w-full mt-2">
                          <AccordionItem value="robots-txt-details">
                            <AccordionTrigger className="font-semibold text-sm text-accent border border-accent/50 rounded-md px-3 py-2 hover:no-underline [&>svg]:h-4 [&>svg]:w-4">What is `robots.txt` and why is this important?</AccordionTrigger>
                            <AccordionContent className="text-xs pt-2 space-y-1 text-muted-foreground">
                              <p><code className="text-xs bg-muted p-0.5 rounded">robots.txt</code> (at <code className="text-xs bg-muted p-0.5 rounded">yourwebsite.com/robots.txt</code>) tells 'good' crawlers which pages they shouldn't crawl.</p>
                              <p>We want good bots to crawl your real content, but *not* the path you dedicate for this SpiteSpiral trap. Malicious bots often ignore `robots.txt`.</p>
                              <p className="font-semibold text-destructive">CRITICAL: Be careful! Always test `robots.txt` changes.</p>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      }
                      onCopy={handleCopy}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* STEP 2: Configure Trap (Advanced) */}
              <AccordionItem value="step-2-configure">
                <AccordionTrigger className="text-xl font-semibold text-primary hover:no-underline">Step 2: Advanced Trap Settings (Informational)</AccordionTrigger>
                <AccordionContent className="space-y-6 pt-3">
                   <p className="text-sm text-muted-foreground font-normal mb-4 block">
                    The current Managed URL (<code className="text-xs bg-muted p-0.5 rounded text-accent break-all">{currentUrlForSetupGuide?.fullUrl}</code>) is a SpiteSpiral (Nepenthes-based) tarpit instance. These use optimized default settings and do not currently support the advanced parameters below.
                  </p>
                  <p className="text-muted-foreground">
                    The following options demonstrate future capabilities for fine-tuning newer types of traps. The URL generated below is an *example* of how parameters *could* be appended to your current URL for such future trap types.
                  </p>
                  <TooltipProvider>
                      <div className="space-y-2">
                        <Label className="text-foreground/80 font-semibold">Trap Intensity (Example)</Label>
                        <RadioGroup value={exampleIntensity} onValueChange={setExampleIntensity} className="flex flex-wrap gap-4" disabled>
                          {intensityOptions.map(option => (<div key={option.value} className="flex items-center space-x-2"><RadioGroupItem value={option.value} id={`ex-intensity-${option.value}`} disabled /><Label htmlFor={`ex-intensity-${option.value}`} className="text-sm font-normal">{option.label}</Label></div>))}
                        </RadioGroup>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ex-babble-theme" className="text-foreground/80 font-semibold">Content "Babble" Theme (Example)</Label>
                        <Select value={exampleTheme} onValueChange={setExampleTheme} disabled>
                          <SelectTrigger id="ex-babble-theme" className="w-full md:w-[300px] bg-input border-border focus:ring-primary" disabled><SelectValue placeholder="Select theme" /></SelectTrigger>
                          <SelectContent>{themeOptions.map(option => (<SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>))}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ex-entry-stealth-toggle" className="text-foreground/80 font-semibold">Entry Point Stealth (Example)</Label>
                        <div className="flex items-center space-x-2 p-2 border border-dashed border-border rounded-md">
                          <Switch id="ex-entry-stealth-toggle" checked={exampleEntryStealth === 'deep'} onCheckedChange={(checked) => setExampleEntryStealth(checked ? 'deep' : 'generic')} disabled className="data-[state=unchecked]:border-border" />
                          <Label htmlFor="ex-entry-stealth-toggle" className="text-sm font-medium">{exampleEntryStealth === 'deep' ? "Deep Page Simulation (Stealth On)" : "Generic Entry (Stealth Off)"}</Label>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground/80 font-semibold">Initial Lure Speed (Example)</Label>
                        <RadioGroup value={exampleLureSpeed} onValueChange={setExampleLureSpeed} className="flex flex-wrap gap-4" disabled>
                          {lureSpeedOptions.map(option => (<div key={option.value} className="flex items-center space-x-2"><RadioGroupItem value={option.value} id={`ex-lure-${option.value}`} disabled /><Label htmlFor={`ex-lure-${option.value}`} className="text-sm font-normal">{option.label}</Label></div>))}
                        </RadioGroup>
                      </div>
                  </TooltipProvider>
                  <div>
                    <Label htmlFor="generated-example-url" className="text-foreground/80 font-semibold">Example Parameterized SpiteSpiral URL (Illustrative)</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input id="generated-example-url" value={generatedExampleAdvancedUrl} readOnly className="flex-grow bg-input border-2 border-primary focus:ring-primary text-sm" />
                      <Button onClick={() => handleCopy(generatedExampleAdvancedUrl, "Example SpiteSpiral URL")} variant="outline" className="text-accent border-accent hover:bg-accent/10"><Copy className="mr-2 h-4 w-4" /> Copy Example</Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">This demonstrates how parameters for future features *could* look. For actual deployment of *this* tarpit, use its direct Full URL: <code className="text-xs bg-muted p-0.5 rounded text-accent break-all">{currentUrlForSetupGuide?.fullUrl}</code>.</p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* STEP 3: Embedding Strategies */}
              <AccordionItem value="step-3-embed">
                <AccordionTrigger className="text-xl font-semibold text-primary hover:no-underline">Step 3: Place the Trap Link on Your Site</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-3">
                  <p className="text-muted-foreground">
                    Link to your SpiteSpiral service. You'll either link *directly* to this SpiteSpiral URL (<code className="text-xs bg-muted p-0.5 rounded text-accent break-all">{currentUrlForSetupGuide?.fullUrl}</code>) OR link to your chosen "Trap Path" (e.g., <code className="bg-muted px-1 py-0.5 rounded text-xs">{USER_TRAP_PATH_PLACEHOLDER}</code> from Step 1) and then configure your server to redirect/proxy that path to this SpiteSpiral URL.
                  </p>
                  
                  <h3 className="text-lg font-semibold text-accent mt-6 mb-2">Easy Embedding Methods</h3>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="embed-simplest-html-direct">
                      <AccordionTrigger>Simplest: Hidden HTML Link (Direct to SpiteSpiral)</AccordionTrigger>
                      <AccordionContent className="space-y-2 pt-2">
                        <p className="text-sm text-muted-foreground">Easiest method. Paste this HTML snippet into your website (e.g., footer). Links *directly* to <span className="font-semibold text-accent">this SpiteSpiral URL</span>. Invisible to users.</p>
                        <SnippetDisplay title="Simplest Hidden HTML Link (Direct to SpiteSpiral)" snippet={getExtremelyBasicLinkSnippet(currentUrlForSetupGuide?.fullUrl || '')} explanation={<>Uses <strong className="text-accent">this specific SpiteSpiral URL</strong>.</>} onCopy={handleCopy} />
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="embed-standard-html-redirect">
                      <AccordionTrigger>Standard: HTML Link on Your Site (Requires Redirect/Proxy)</AccordionTrigger>
                      <AccordionContent className="space-y-2 pt-2">
                        <p className="text-sm text-muted-foreground">Place an HTML link on your site pointing to your chosen "Trap Path" (e.g., <code className="bg-muted px-1 py-0.5 rounded text-xs">{USER_TRAP_PATH_PLACEHOLDER}</code>). Your server *must* then redirect/proxy this path to <span className="font-semibold text-accent">this SpiteSpiral URL</span>. Hides the SpiteSpiral URL from source.</p>
                        <SnippetDisplay title="Visible HTML Link (to your Trap Path)" snippet={simpleHtmlLinkSnippet(USER_TRAP_PATH_PLACEHOLDER)} explanation={<>Links to your site's <code className="bg-muted px-1 py-0.5 rounded text-xs">{USER_TRAP_PATH_PLACEHOLDER}</code>, which redirects/proxies to <strong className="text-accent">this SpiteSpiral URL</strong>.</>} onCopy={handleCopy}/>
                        <SnippetDisplay title="Tiny, Invisible HTML Link (to your Trap Path)" snippet={tinyHtmlLinkSnippet(USER_TRAP_PATH_PLACEHOLDER)} explanation={<>A less visible link to your site's <code className="bg-muted px-1 py-0.5 rounded text-xs">{USER_TRAP_PATH_PLACEHOLDER}</code>, redirecting/proxying to <strong className="text-accent">this SpiteSpiral URL</strong>.</>} onCopy={handleCopy}/>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="embed-sitemap-redirect">
                      <AccordionTrigger>Standard: `sitemap.xml` Entry (Requires Redirect/Proxy)</AccordionTrigger>
                      <AccordionContent className="space-y-2 pt-2">
                        <p className="text-sm text-muted-foreground">Add to <code className="bg-muted px-1 py-0.5 rounded text-xs">sitemap.xml</code>, pointing to your "Trap Path" (e.g., <code className="bg-muted px-1 py-0.5 rounded text-xs">{USER_TRAP_PATH_PLACEHOLDER}</code>). Ensure this path is disallowed in `robots.txt` and redirects/proxies to <span className="font-semibold text-accent">this SpiteSpiral URL</span>.</p>
                        <SnippetDisplay title="sitemap.xml Entry (for your Trap Path)" snippet={sitemapEntrySnippet(USER_TRAP_PATH_PLACEHOLDER)} explanation={<>Points to your site's <code className="bg-muted px-1 py-0.5 rounded text-xs">{USER_TRAP_PATH_PLACEHOLDER}</code>, which redirects/proxies to <strong className="text-accent">this SpiteSpiral URL</strong>.</>} onCopy={handleCopy}/>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  <h3 className="text-lg font-semibold text-accent mt-6 mb-2">More Advanced Embedding Methods</h3>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="embed-css-hidden-direct">
                        <AccordionTrigger>CSS-Hidden Links (Alternative, Direct to SpiteSpiral)</AccordionTrigger>
                        <AccordionContent className="space-y-2 pt-2">
                            <p className="text-sm text-muted-foreground">Present in HTML but CSS-hidden. Links *directly* to <span className="font-semibold text-accent">this SpiteSpiral URL</span>.</p>
                            <SnippetDisplay title="Link with CSS Class (Direct to SpiteSpiral)" snippet={getCssClassLinkSnippet(currentUrlForSetupGuide?.fullUrl || '')} explanation={<>Uses <strong className="text-accent">this SpiteSpiral URL</strong>.</>} onCopy={handleCopy} />
                            <SnippetDisplay title="Required CSS for .spite-link class" snippet={cssClassStyleSnippet} explanation="Add this CSS to your site's stylesheet." onCopy={handleCopy} />
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="embed-js-injection-direct">
                        <AccordionTrigger>JavaScript Link Injection (Direct to SpiteSpiral)</AccordionTrigger>
                        <AccordionContent className="space-y-2 pt-2">
                            <p className="text-sm text-muted-foreground">Dynamically inject the link. May be missed by some scrapers. Links *directly* to <span className="font-semibold text-accent">this SpiteSpiral URL</span>.</p>
                            <SnippetDisplay title="JS Link Injection Example (Direct to SpiteSpiral)" snippet={getJsInjectionSnippet(currentUrlForSetupGuide?.fullUrl || '')} explanation={<>Uses <strong className="text-accent">this SpiteSpiral URL</strong>.</>} onCopy={handleCopy} />
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="embed-server-side-direct">
                        <AccordionTrigger>Server-Side Conditional Redirection (Most Powerful)</AccordionTrigger>
                        <AccordionContent className="space-y-2 pt-2">
                            <p className="text-sm text-muted-foreground">Identify suspicious bots on your server. Once identified, your server issues an HTTP redirect, sending the bot *directly* to <span className="font-semibold text-accent">this SpiteSpiral URL</span> (<code className="text-xs bg-muted p-0.5 rounded text-accent break-all">{currentUrlForSetupGuide?.fullUrl}</code>).</p>
                            <p className="text-sm text-muted-foreground mt-2"><span className="font-semibold text-primary">Future Enhancement with API:</span> The upcoming "API for Your Individual Tarpit Data" could allow your server to log suspicious IPs/User-Agents against this specific tarpit instance *before* redirecting, providing richer data in your SpiteSpiral dashboard.</p>
                        </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </AccordionContent>
              </AccordionItem>

              {/* STEP 4: Final Checks */}
              <AccordionItem value="step-4-final">
                <AccordionTrigger className="text-xl font-semibold text-primary hover:no-underline">Step 4: Final Review &amp; Go Live!</AccordionTrigger>
                <AccordionContent className="space-y-3 pt-3">
                  <p className="text-sm text-muted-foreground">Quickly verify:</p>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-foreground/80">
                    <li>Your `robots.txt` is updated (Step 1), disallowing your chosen path (e.g., <code className="text-xs bg-muted p-0.5 rounded">{USER_TRAP_PATH_PLACEHOLDER}</code>) for good bots.</li>
                    <li>A link to <span className="font-semibold text-accent">this SpiteSpiral URL</span> (directly or via your site's path) is live on your website (Step 3).</li>
                  </ul>
                  <p className="text-sm text-muted-foreground mt-3">You're all set! Unauthorized bots finding this trap will get caught. Check your SpiteSpiral Dashboard for activity.</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            </div>
          </ScrollArea>
          <DialogFooter className="p-6 pt-4 border-t border-border">
            <DialogClose asChild>
              <Button type="button" variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Edit Dialog (remains mostly unchanged) */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card border-primary/30">
          <DialogHeader>
            <DialogTitle className="text-primary">Edit Managed URL</DialogTitle>
            <DialogDescription>Update name and description. URL path cannot be changed.</DialogDescription>
          </DialogHeader>
          {currentUrlToEdit && (
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 py-4">
                <FormField control={editForm.control} name="name" render={({ field }) => (<FormItem><FormLabel className="text-foreground/80">Tarpit Name</FormLabel><FormControl><Input {...field} className="bg-input border-border focus:ring-primary text-foreground"/></FormControl><FormMessage /></FormItem>)} />
                <FormField control={editForm.control} name="description" render={({ field }) => (<FormItem><FormLabel className="text-foreground/80">Description (Optional)</FormLabel><FormControl><Textarea {...field} className="bg-input border-border focus:ring-primary text-foreground"/></FormControl><FormMessage /></FormItem>)} />
                <DialogFooter className="pt-4">
                  <DialogClose asChild><Button type="button" variant="outline" disabled={isEditLoading}>Cancel</Button></DialogClose>
                  <Button type="submit" disabled={isEditLoading} className="bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground">
                    {isEditLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Alert Dialog (remains unchanged) */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-destructive/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will de-provision the instance and delete: <span className="font-semibold text-foreground break-all">{currentUrlToDelete?.name}</span> ({currentUrlToDelete?.fullUrl}). This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={isDeleteLoading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleteLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />} {isDeleteLoading ? "Deleting..." : "Yes, delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
