
"use client";

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Copy, Edit3, Code, Loader2, Save, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase/clientApp";
import { collection, query, where, onSnapshot, Timestamp, type DocumentData, type QueryDocumentSnapshot, doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { deprovisionTarpitInstance } from '@/lib/actions';

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
  
  const [isEmbedDialogOpen, setIsEmbedDialogOpen] = useState(false);
  const [currentUrlForEmbed, setCurrentUrlForEmbed] = useState<ManagedUrlFirestoreData | null>(null);


  const editForm = useForm<EditFormData>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (authLoading) {
      setIsLoading(true);
      return;
    }
    if (!user || !user.uid) {
      setUrls([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const currentUserId = user.uid;
    const q = query(collection(db, "tarpit_configs"), where("userId", "==", currentUserId), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const validUrls: ManagedUrlFirestoreData[] = [];
      querySnapshot.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
        const data = docSnap.data();
        if (data.name && data.fullUrl && data.pathSegment && data.userId && data.status &&
            data.createdAt && typeof data.createdAt.toMillis === 'function') {
          validUrls.push({
            id: docSnap.id,
            name: data.name as string,
            description: data.description as string | undefined,
            fullUrl: data.fullUrl as string,
            pathSegment: data.pathSegment as string,
            instanceId: data.instanceId as string | undefined,
            createdAt: data.createdAt as Timestamp,
            updatedAt: data.updatedAt as Timestamp | undefined,
            status: data.status as "active" | "inactive",
            userId: data.userId as string,
          });
        } else {
          // console.warn(`Document ${docSnap.id} is missing required fields or has invalid createdAt. Data:`, data);
        }
      });
      // Sorting is already handled by Firestore's orderBy, no need to sort client-side again
      setUrls(validUrls);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching managed URLs (Raw Firebase Error):", error);
      toast({
        title: "Error",
        description: "Could not fetch managed URLs. Please check the browser console for more details.",
        variant: "destructive"
      });
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

      toast({ title: "Success!", description: "Managed URL updated successfully!", variant: "default" });
      setIsEditDialogOpen(false);
      setCurrentUrlToEdit(null);
    } catch (error) {
      console.error("Error updating managed URL:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      toast({ title: "Error", description: `Failed to update URL: ${errorMessage}`, variant: "destructive" });
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
        toast({
          title: "De-provisioning Failed",
          description: deprovisionResult.message || "Could not de-provision the Docker instance. Firestore entry not deleted.",
          variant: "destructive",
          duration: 7000,
        });
        setIsDeleteLoading(false);
        return; 
      }

      toast({
        title: "Instance De-provisioning Started",
        description: deprovisionResult.message,
        variant: "default",
      });

      const docRef = doc(db, "tarpit_configs", currentUrlToDelete.id);
      await deleteDoc(docRef);

      toast({ title: "Success!", description: "Managed URL and associated instance (if applicable) successfully marked for deletion!", variant: "default" });
      setIsDeleteDialogOpen(false);
      setCurrentUrlToDelete(null);

    } catch (error) {
      console.error("Error during delete process:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred during deletion.";
      toast({ title: "Error", description: `Failed to complete delete operation: ${errorMessage}`, variant: "destructive" });
    } finally {
      setIsDeleteLoading(false);
    }
  };
  
  const handleEmbedOpen = (url: ManagedUrlFirestoreData) => {
    setCurrentUrlForEmbed(url);
    setIsEmbedDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading your URLs...</p>
      </div>
    );
  }

  if (!user && !authLoading) { 
    return <p className="text-muted-foreground text-center py-4">Please log in to see your managed URLs.</p>;
  }

  if (urls.length === 0 && !authLoading && user) {
    return <p className="text-muted-foreground text-center py-4">No managed URLs configured yet. Add one above!</p>;
  }

  const handleCopy = (text: string, type: string = "Text") => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: "Copied!", description: `${type} copied to clipboard.` });
    }).catch(err => {
      console.error(`Could not copy ${type}: `, err);
      toast({ title: "Error", description: `Could not copy ${type}.`, variant: "destructive" });
    });
  };
  
  const SnippetDisplay = ({ title, snippet, explanation }: { title: string, snippet: string, explanation: string }) => (
    <div className="space-y-2 mb-4">
      <h4 className="font-semibold text-sm text-primary">{title}</h4>
      <Textarea
        value={snippet}
        readOnly
        rows={snippet.split('\n').length > 1 ? snippet.split('\n').length +1 : 3}
        className="bg-input border-border focus:ring-primary text-foreground/90 font-mono text-xs"
      />
      <p className="text-xs text-muted-foreground">{explanation}</p>
      <Button onClick={() => handleCopy(snippet, `${title} Snippet`)} variant="outline" size="sm" className="text-accent border-accent hover:bg-accent/10">
        <Copy className="mr-2 h-3 w-3" /> Copy Snippet
      </Button>
    </div>
  );

  return (
    <>
      <ScrollArea className="h-[500px] -mx-6 px-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {urls.map((url) => (
            <Card key={url.id} className="flex flex-col justify-between border-border hover:border-primary/50 transition-colors duration-200">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg text-primary break-all">{url.name}</CardTitle>
                  <Badge variant={url.status === 'active' ? 'default' : 'secondary'} className={url.status === 'active' ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}>
                    {url.status}
                  </Badge>
                </div>
                <CardDescription className="text-muted-foreground/80 pt-1">
                  {url.description || "No description provided."}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                 <p className="text-xs text-muted-foreground">
                  Instance ID: {url.instanceId || "N/A"}
                </p>
                <p className="text-sm text-foreground/90 break-all mt-1">
                  <span className="font-semibold text-muted-foreground">Full URL: </span> 
                  <a href={url.fullUrl} target="_blank" rel="noopener noreferrer" className="hover:underline text-accent">{url.fullUrl}</a>
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Created: {url.createdAt ? new Date(url.createdAt.toDate()).toLocaleDateString() : 'N/A'}
                  {url.updatedAt && (
                    <span className="ml-2">| Updated: {new Date(url.updatedAt.toDate()).toLocaleDateString()}</span>
                  )}
                </p>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t border-border pt-4">
                <Button variant="ghost" size="icon" title="Get Embed Code & Instructions" onClick={() => handleEmbedOpen(url)} className="text-muted-foreground hover:text-primary">
                  <HelpCircle className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleCopy(url.fullUrl, "URL")} title="Copy URL" className="text-muted-foreground hover:text-primary">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" title="Edit URL" onClick={() => handleEditOpen(url)} className="text-muted-foreground hover:text-accent">
                  <Edit3 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" title="Delete URL" onClick={() => handleDeleteOpen(url)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {/* Embed Code Dialog */}
      <Dialog open={isEmbedDialogOpen} onOpenChange={setIsEmbedDialogOpen}>
        <DialogContent className="max-w-2xl bg-card border-primary/30">
          <DialogHeader>
            <DialogTitle className="text-primary flex items-center"><Code className="mr-2 h-5 w-5"/>Embed Instructions for: {currentUrlForEmbed?.name}</DialogTitle>
            <DialogDescription>
              Follow these instructions to effectively embed your SpiteSpiral Tarpit link and start trapping crawlers. These methods are designed to be SEO-neutral.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] p-1 pr-4">
            {currentUrlForEmbed && (
                <Accordion type="single" collapsible className="w-full space-y-3">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-accent hover:text-primary">Primary Recommended Snippets</AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    <SnippetDisplay
                      title="1x1 Invisible Pixel Image"
                      snippet={`<img src="${currentUrlForEmbed.fullUrl}" width="1" height="1" alt="" style="border:0; position:absolute; left:-9999px;" aria-hidden="true" loading="eager" />`}
                      explanation={`This creates a tiny, invisible image. Most web crawlers will try to fetch this image, leading them to your tarpit. The loading="eager" hint encourages it to load even if off-screen. It's designed to be completely invisible, not affect your page layout, and is semantically neutral for SEO.`}
                    />
                    <SnippetDisplay
                      title="Fake Stylesheet Link (for the <head>)"
                      snippet={`<link rel="stylesheet" href="${currentUrlForEmbed.fullUrl}" media="print" onload="this.media='all'; this.onload=null;" />`}
                      explanation={`This looks like a stylesheet to crawlers. We use media="print" and an onload trick to ensure it doesn't block your page rendering for actual visitors while still being discoverable by many bots. This method is generally not interpreted by search engines as a content link.`}
                    />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger className="text-accent hover:text-primary">Alternative Snippets</AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    <SnippetDisplay
                      title="Fake Script Tag"
                      snippet={`<script src="${currentUrlForEmbed.fullUrl}" async defer></script>`}
                      explanation={`This mimics a JavaScript file. 'async' and 'defer' help prevent it from blocking your page load for human visitors. Script tags are generally not followed for link equity by search engines.`}
                    />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger className="text-accent hover:text-primary">Step-by-Step Guidance</AccordionTrigger>
                  <AccordionContent className="text-sm text-foreground/80 space-y-1 pt-2">
                    <p>1. Choose one of the HTML snippets provided above.</p>
                    <p>2. Copy the entire snippet.</p>
                    <p>3. Open the HTML code for the website pages where you want to detect crawlers.</p>
                    <p>4. Paste the snippet into the recommended location within your HTML (see 'Where to Place it' below).</p>
                    <p>5. If you use a website template or a common include file (like a header or footer), placing it there will deploy it across many pages at once.</p>
                    <p>6. Save and publish your website changes.</p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger className="text-accent hover:text-primary">Where to Place It to Catch the Most Crawlers</AccordionTrigger>
                  <AccordionContent className="text-sm text-foreground/80 space-y-2 pt-2">
                    <p><strong className="text-primary">Goal:</strong> The Managed URL should be easily discoverable by automated crawlers but generally ignored by human visitors and have minimal SEO impact.</p>
                    <p className="font-semibold text-foreground/90">Key Locations on Their Website:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong className="text-primary/90">In the HTML &lt;head&gt;:</strong> Ideal for the &lt;link rel="stylesheet" ...&gt; method. Crawlers almost always parse the head for metadata and resource links.</li>
                      <li><strong className="text-primary/90">End of the &lt;body&gt; tag:</strong> A common place for tracking scripts and non-critical elements. Good for the &lt;img&gt; or &lt;script&gt; methods. This ensures it doesn't interfere with the rendering of the main content.</li>
                      <li><strong className="text-primary/90">Common Headers/Footers:</strong> If their website uses templates (e.g., WordPress, Shopify, or a custom CMS), tell them to place the snippet in their site-wide header or footer template file. This ensures the tarpit link is present on every page, maximizing coverage.</li>
                    </ul>
                    <p><strong className="text-primary">Throughout Multiple Pages:</strong> Emphasize that the more pages it's on, the higher the chance of catching various types of crawlers exploring different parts of their site.</p>
                    <p><strong className="text-primary">Subtlety is Key (for Humans):</strong> Our provided snippets are designed to be invisible or non-disruptive to your human visitors. The goal is for automated bots to follow these links, not your customers.</p>
                     <p className="font-semibold text-foreground/90 mt-2">What to (Generally) Avoid for this Specific Purpose:</p>
                     <ul className="list-disc pl-5 space-y-1">
                        <li>Placing it only in robots.txt.</li>
                        <li>Hiding it too well with JavaScript that some crawlers might not execute.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5">
                  <AccordionTrigger className="text-accent hover:text-primary">Do's and Don'ts (SEO & Best Practices)</AccordionTrigger>
                  <AccordionContent className="text-sm text-foreground/80 space-y-2 pt-2">
                    <p className="font-semibold text-foreground/90">Do:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Use the provided snippets as they are designed for low SEO impact.</li>
                      <li>Place it where it's likely to be parsed by automated tools.</li>
                      <li>Test your page after adding it to ensure it doesn't break your layout.</li>
                    </ul>
                    <p className="font-semibold text-foreground/90 mt-2">Don't:</p>
                     <ul className="list-disc pl-5 space-y-1">
                      <li>Make the Managed URL a standard, visible, crawlable link (`<a href='...'>`) for your human users unless you have a specific, advanced reason and understand the SEO implications.</li>
                      <li><strong className="text-destructive">If you absolutely must create an anchor tag (`<a>`) pointing to your Managed URL (not generally recommended for this purpose), ensure you add `rel="nofollow"` to it. This tells search engines not to follow the link or pass link equity.</strong></li>
                      <li>Modify the <code className="bg-muted px-1 py-0.5 rounded text-xs text-accent">{currentUrlForEmbed.fullUrl}</code> part of the snippet.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </ScrollArea>
          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card border-primary/30">
          <DialogHeader>
            <DialogTitle className="text-primary">Edit Managed URL</DialogTitle>
            <DialogDescription>
              Update the name and description for your managed URL. The URL path itself cannot be changed.
            </DialogDescription>
          </DialogHeader>
          {currentUrlToEdit && (
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 py-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/80">Tarpit Name</FormLabel>
                      <FormControl>
                        <Input {...field} className="bg-input border-border focus:ring-primary text-foreground"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/80">Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea {...field} className="bg-input border-border focus:ring-primary text-foreground"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <DialogFooter className="pt-4">
                    <DialogClose asChild>
                      <Button type="button" variant="outline" disabled={isEditLoading}>Cancel</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isEditLoading} className="bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground">
                      {isEditLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Save Changes
                    </Button>
                  </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Alert Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-destructive/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This action cannot be undone. This will attempt to de-provision the associated Docker instance and permanently delete the managed URL
              <span className="font-semibold text-foreground break-all"> {currentUrlToDelete?.name} </span>
              ({currentUrlToDelete?.fullUrl}).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleteLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              {isDeleteLoading ? "Deleting..." : "Yes, delete URL & Instance"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

