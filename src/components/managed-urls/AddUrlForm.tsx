
"use client";

import { useState, useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Loader2, ShieldAlert } from "lucide-react"; 
import { useAuth } from "@/contexts/AuthContext";
import { provisionAndGenerateManagedTarpitConfigDetails } from "@/lib/actions";
import { db } from "@/lib/firebase/clientApp"; 
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore"; 
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

const formSchema = z.object({
  name: z.string().min(1, "Tarpit Name is required."),
  description: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

// Effective limit for users who can create URLs (e.g., "Set & Forget" tier)
const MANAGED_URL_LIMIT = 1; 

export default function AddUrlForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingUrlCount, setIsCheckingUrlCount] = useState(true);
  const [currentUserUrlCount, setCurrentUserUrlCount] = useState(0);
  const [canAddMoreUrls, setCanAddMoreUrls] = useState(false);

  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const tarpitBaseUrl = process.env.NEXT_PUBLIC_TARPIT_BASE_URL;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (authLoading) {
      setIsCheckingUrlCount(true);
      return;
    }
    if (!user) {
      setCanAddMoreUrls(false); // Can't add if not logged in
      setIsCheckingUrlCount(false);
      return;
    }

    const fetchUrlCount = async () => {
      setIsCheckingUrlCount(true);
      try {
        const q = query(collection(db, "tarpit_configs"), where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const count = querySnapshot.size;
        setCurrentUserUrlCount(count);
        
        // If count is 0, it implies they might be on "Window Shopping" or new.
        // The AccountPage handles guiding them to upgrade.
        // If they have >= MANAGED_URL_LIMIT, they can't add more.
        setCanAddMoreUrls(count < MANAGED_URL_LIMIT); 

      } catch (error) {
        console.error("Error fetching user URL count:", error);
        toast({ title: "Error", description: "Could not verify your current URL count.", variant: "destructive" });
        setCanAddMoreUrls(false); 
      } finally {
        setIsCheckingUrlCount(false);
      }
    };

    fetchUrlCount();
  }, [user, authLoading, toast]);


  const onSubmit: SubmitHandler<FormData> = async (formData) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add a managed URL.",
        variant: "destructive",
      });
      return;
    }

    if (!canAddMoreUrls) {
         toast({
            title: "Limit Reached",
            description: `You have reached the Managed URL limit for your current plan (${MANAGED_URL_LIMIT}), or you need to select a plan to add URLs. Please check your Account page.`,
            variant: "default", 
            duration: 7000,
        });
        return;
    }

    // Removed Tarpit Base URL check alert, as it was previously requested to be removed.

    setIsLoading(true);
    try {
      const provisionResult = await provisionAndGenerateManagedTarpitConfigDetails({
        userId: user.uid,
        name: formData.name,
        description: formData.description,
      });

      if (!provisionResult.success || !provisionResult.configData || !provisionResult.fullUrl) {
        toast({
          title: "Provisioning Failed",
          description: provisionResult.message || "Failed to provision tarpit instance or generate URL configuration.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      const { instanceId, ...configDataForWrite } = provisionResult.configData;
      const documentToWrite: any = { 
        ...configDataForWrite,
        createdAt: serverTimestamp(), 
        status: "active", 
      };
      if (instanceId !== undefined) { 
        documentToWrite.instanceId = instanceId;
      }

      await addDoc(collection(db, "tarpit_configs"), documentToWrite);

      toast({
        title: "Success!",
        description: `Tarpit instance provisioned and managed URL added!\nNew URL: ${provisionResult.fullUrl}`,
        variant: "default",
        duration: 7000, 
      });
      form.reset();
      // Re-fetch URL count to update canAddMoreUrls state
        const q = query(collection(db, "tarpit_configs"), where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const count = querySnapshot.size;
        setCurrentUserUrlCount(count);
        setCanAddMoreUrls(count < MANAGED_URL_LIMIT);

    } catch (error) {
      console.error("Error in onSubmit AddUrlForm:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      toast({
        title: "Error",
        description: `Failed to add managed URL: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isCheckingUrlCount) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-1/4" />
        </div>
    );
  }

  return (
    <>
      {!canAddMoreUrls && !isCheckingUrlCount && user && (
        <Alert variant="default" className="mb-6 border-amber-500/50 text-amber-500 [&>svg]:text-amber-500 bg-amber-500/10">
          <ShieldAlert className="h-5 w-5" />
          <AlertTitle>URL Limit Reached or Plan Required</AlertTitle>
          <AlertDescription>
            You have reached the Managed URL limit ({MANAGED_URL_LIMIT}) for your current plan, or you may need to select a subscription plan on your Account page to add URLs.
          </AlertDescription>
        </Alert>
      )}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground/80">Tarpit Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., My Main Website Trap" {...field} className="bg-background border-border focus:ring-primary"/>
                </FormControl>
                <FormDescription>
                  A descriptive name for this specific tarpit instance.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground/80">Description (Optional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="e.g., Main page capture link, header capture link, etc" {...field} className="bg-background border-border focus:ring-primary"/>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button 
            type="submit" 
            disabled={isLoading || !user || !canAddMoreUrls || isCheckingUrlCount} 
            className="w-full md:w-auto bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> 
            ) : (
              <PlusCircle className="mr-2 h-5 w-5" />
            )}
            {isLoading ? "Provisioning & Adding..." : "Add Managed URL"}
          </Button>
        </form>
      </Form>
    </>
  );
}
