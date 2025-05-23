
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Copy, Edit3, Code, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase/clientApp";
import { collection, query, where, onSnapshot, Timestamp, type DocumentData, type QueryDocumentSnapshot } from "firebase/firestore";

interface ManagedUrlFirestoreData {
  id: string; // Firestore document ID
  name: string;
  description?: string;
  fullUrl: string;
  pathSegment: string;
  createdAt: Timestamp; // Firestore Timestamp
  status: "active" | "inactive";
  userId: string;
}

export default function UrlList() {
  const [urls, setUrls] = useState<ManagedUrlFirestoreData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setUrls([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const q = query(collection(db, "tarpit_configs"), where("userId", "==", user.uid));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedUrls: ManagedUrlFirestoreData[] = [];
      querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        fetchedUrls.push({ id: doc.id, ...doc.data() } as ManagedUrlFirestoreData);
      });
      // Sort by creation date, newest first
      fetchedUrls.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
      setUrls(fetchedUrls);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching managed URLs:", error);
      toast({ title: "Error", description: "Could not fetch managed URLs.", variant: "destructive" });
      setIsLoading(false);
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, [user, toast]);

  const handleDelete = (id: string) => {
    // TODO: Implement delete functionality with a Server Action
    console.warn("Delete functionality not yet implemented for ID:", id);
    toast({ title: "Coming Soon", description: `Delete for URL ID ${id} is not yet implemented.`, variant: "default" });
  };

  const handleCopy = (textToCopy: string, type: string) => {
    navigator.clipboard.writeText(textToCopy);
    toast({ title: "Copied!", description: `${type} copied to clipboard.` });
  };

  const getEmbedCode = (url: string) => {
    if (url.endsWith('.js') || url.endsWith('.json')) {
      return `<script src="${url}" async defer></script>`;
    } else if (url.endsWith('.gif') || url.endsWith('.png') || url.endsWith('.jpg')) {
      return `<img src="${url}" alt="Tarpit Pixel" width="1" height="1" style="display:none;" />`;
    }
    return `<iframe src="${url}" width="0" height="0" style="display:none;" frameborder="0"></iframe>`;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading your URLs...</p>
      </div>
    );
  }

  if (!user) {
    return <p className="text-muted-foreground text-center py-4">Please log in to see your managed URLs.</p>;
  }

  if (urls.length === 0) {
    return <p className="text-muted-foreground text-center py-4">No managed URLs configured yet. Add one above!</p>;
  }

  return (
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
              <p className="text-sm text-foreground/90 break-all">
                <span className="font-semibold text-muted-foreground">Full URL: </span> {url.fullUrl}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Created: {url.createdAt ? new Date(url.createdAt.toDate()).toLocaleDateString() : 'N/A'}
              </p>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 border-t border-border pt-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" title="Get Embed Code" className="text-muted-foreground hover:text-primary">
                    <Code className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] bg-card border-primary/30">
                  <DialogHeader>
                    <DialogTitle className="text-primary">Embed Code</DialogTitle>
                    <DialogDescription>
                      Copy this code and paste it into your website&apos;s HTML where you want the tarpit to be active.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-1 items-center gap-4">
                      <Label htmlFor={`embed-code-${url.id}`} className="sr-only">
                        Embed Code
                      </Label>
                      <Textarea
                        id={`embed-code-${url.id}`}
                        value={getEmbedCode(url.fullUrl)}
                        readOnly
                        rows={4}
                        className="bg-input border-border focus:ring-primary text-foreground"
                      />
                    </div>
                    <Button onClick={() => handleCopy(getEmbedCode(url.fullUrl), "Embed code")} className="w-full bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground">
                      <Copy className="mr-2 h-4 w-4" /> Copy Code
                    </Button>
                  </div>
                   <DialogClose asChild>
                      <Button type="button" variant="secondary" className="mt-2">
                        Close
                      </Button>
                    </DialogClose>
                </DialogContent>
              </Dialog>

              <Button variant="ghost" size="icon" onClick={() => handleCopy(url.fullUrl, "URL")} title="Copy URL" className="text-muted-foreground hover:text-primary">
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" title="Edit URL (Not Implemented)" className="text-muted-foreground hover:text-accent disabled:opacity-50" disabled>
                <Edit3 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(url.id)} title="Delete URL (Not Implemented)" className="text-muted-foreground hover:text-destructive disabled:opacity-50" disabled>
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
