"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Copy, Edit3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from '@/components/ui/scroll-area';

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

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: "Copied!", description: "URL copied to clipboard." });
  };

  if (urls.length === 0) {
    return <p className="text-muted-foreground">No managed URLs configured yet. Add one above!</p>;
  }

  return (
    <ScrollArea className="h-[500px] -mx-6 px-6"> {/* Negative margin to allow shadow from Card to be visible if ScrollArea is directly in CardContent */}
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
              <Button variant="ghost" size="icon" onClick={() => handleCopy(url.fullUrl)} title="Copy URL" className="text-muted-foreground hover:text-primary">
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
