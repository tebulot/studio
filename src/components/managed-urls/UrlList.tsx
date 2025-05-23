
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Copy, Edit3, Code } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ManagedUrl {
  id: string;
  fullUrl: string;
  path: string;
  description: string;
  createdAt: string; // ISO string
  status: "active" | "inactive";
}

const initialUrls: ManagedUrl[] = [
  { id: "1", fullUrl: "https://tarpit.spitespiral.com/trap.js", path: "/trap.js", description: "Main JS trap for general bots", createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), status: "active" },
  { id: "2", fullUrl: "https://tarpit.spitespiral.com/pixel.gif", path: "/pixel.gif", description: "Tracking pixel to identify scrapers", createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), status: "active" },
  { id: "3", fullUrl: "https://tarpit.spitespiral.com/old/config.xml", path: "/old/config.xml", description: "Decoy config for specific vulnerability scan", createdAt: new Date(Date.now() - 86400000 * 10).toISOString(), status: "inactive" },
];

export default function UrlList() {
  const [urls, setUrls] = useState<ManagedUrl[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Simulate fetching data
    setUrls(initialUrls);
  }, []);

  const handleDelete = (id: string) => {
    // Simulate API call
    setUrls(prevUrls => prevUrls.filter(url => url.id !== id));
    toast({ title: "URL Deleted", description: `Successfully removed the managed URL.` });
  };

  const handleCopy = (textToCopy: string, type: string) => {
    navigator.clipboard.writeText(textToCopy);
    toast({ title: "Copied!", description: `${type} copied to clipboard.` });
  };

  const getEmbedCode = (url: string) => {
    // Basic embed code, could be an iframe or img tag depending on the tarpit type
    if (url.endsWith('.js') || url.endsWith('.json')) {
      return `<script src="${url}" async defer></script>`;
    } else if (url.endsWith('.gif') || url.endsWith('.png') || url.endsWith('.jpg')) {
      return `<img src="${url}" alt="Tarpit Pixel" width="1" height="1" style="display:none;" />`;
    }
    return `<iframe src="${url}" width="0" height="0" style="display:none;" frameborder="0"></iframe>`;
  }

  if (urls.length === 0) {
    return <p className="text-muted-foreground">No managed URLs configured yet. Add one above!</p>;
  }

  return (
    <ScrollArea className="h-[500px] -mx-6 px-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {urls.map((url) => (
          <Card key={url.id} className="flex flex-col justify-between border-border hover:border-primary/50 transition-colors duration-200">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg text-primary break-all">{url.path}</CardTitle>
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
                Created: {new Date(url.createdAt).toLocaleDateString()}
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
              <Button variant="ghost" size="icon" title="Edit URL (Not Implemented)" className="text-muted-foreground hover:text-accent">
                <Edit3 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(url.id)} title="Delete URL" className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
