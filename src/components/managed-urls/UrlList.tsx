
"use client";

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Copy, Edit3, Code, Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase/clientApp";
import { collection, query, where, onSnapshot, Timestamp, type DocumentData, type QueryDocumentSnapshot } from "firebase/firestore";
import { updateManagedTarpitConfig, deleteManagedTarpitConfig } from "@/lib/actions";

interface ManagedUrlFirestoreData {
  id: string; // Firestore document ID
  name: string;
  description?: string;
  fullUrl: string;
  pathSegment: string;
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
    const q = query(collection(db, "tarpit_configs"), where("userId", "==", currentUserId));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const validUrls: ManagedUrlFirestoreData[] = [];
      querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        if (data.name && data.fullUrl && data.pathSegment && data.userId && data.status &&
            data.createdAt && typeof data.createdAt.toMillis === 'function') {
          validUrls.push({
            id: doc.id,
            name: data.name as string,
            description: data.description as string | undefined,
            fullUrl: data.fullUrl as string,
            pathSegment: data.pathSegment as string,
            createdAt: data.createdAt as Timestamp,
            updatedAt: data.updatedAt as Timestamp | undefined,
            status: data.status as "active" | "inactive",
            userId: data.userId as string,
          });
        } else {
          // console.warn(`Document ${doc.id} is missing required fields or has invalid createdAt. Data:`, data);
        }
      });
      validUrls.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
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
      const result = await updateManagedTarpitConfig({
        docId: currentUrlToEdit.id,
        name: formData.name,
        description: formData.description,
        userId: user.uid, // Pass for server-side validation, though rules are primary
      });

      if (result.success) {
        toast({ title: "Success!", description: result.message, variant: "default" });
        setIsEditDialogOpen(false);
        setCurrentUrlToEdit(null);
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    } catch (error) {
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
      const result = await deleteManagedTarpitConfig({
        docId: currentUrlToDelete.id,
        userId: user.uid, // Pass for server-side validation
      });

      if (result.success) {
        toast({ title: "Success!", description: result.message, variant: "default" });
        setIsDeleteDialogOpen(false);
        setCurrentUrlToDelete(null);
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      toast({ title: "Error", description: `Failed to delete URL: ${errorMessage}`, variant: "destructive" });
    } finally {
      setIsDeleteLoading(false);
    }
  };

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

  const handleCopy = (text: string, type: string = "Text") => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: "Copied!", description: `${type} copied to clipboard.` });
    }).catch(err => {
      console.error(`Could not copy ${type}: `, err);
      toast({ title: "Error", description: `Could not copy ${type}.`, variant: "destructive" });
    });
  };
  
  const getEmbedCode = (url: string): string => {
    if (!url) return "";
    if (url.endsWith('.js') || url.endsWith('.json')) {
      return `<script src="${url}" async defer></script>`;
    } else if (/\.(gif|png|jpg|jpeg|svg|webp)$/i.test(url)) {
      return `<img src="${url}" alt="Tarpit Pixel" width="1" height="1" style="display:none;" />`;
    }
    return `<iframe src="${url}" width="0" height="0" style="display:none;" frameborder="0" title="SpiteSpiral Tarpit"></iframe>`;
  };

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
                <p className="text-sm text-foreground/90 break-all">
                  <span className="font-semibold text-muted-foreground">Full URL: </span> {url.fullUrl}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Created: {url.createdAt ? new Date(url.createdAt.toDate()).toLocaleDateString() : 'N/A'}
                  {url.updatedAt && (
                    <span className="ml-2">| Updated: {new Date(url.updatedAt.toDate()).toLocaleDateString()}</span>
                  )}
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
                      <DialogTitle className="text-primary">Embed Code for {url.name}</DialogTitle>
                      <DialogDescription>
                        Copy this code and paste it into your website&apos;s HTML.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <Textarea
                        id={`embed-code-${url.id}`}
                        value={getEmbedCode(url.fullUrl)}
                        readOnly
                        rows={4}
                        className="bg-input border-border focus:ring-primary text-foreground"
                      />
                      <Button onClick={() => handleCopy(getEmbedCode(url.fullUrl), "Embed code")} className="w-full bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground">
                        <Copy className="mr-2 h-4 w-4" /> Copy Code
                      </Button>
                    </div>
                     <DialogClose asChild>
                        <Button type="button" variant="secondary" className="mt-2">Close</Button>
                      </DialogClose>
                  </DialogContent>
                </Dialog>

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
              This action cannot be undone. This will permanently delete the managed URL
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
              Yes, delete URL
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
