
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
import { PlusCircle, Loader2, Info, ShieldAlert } from "lucide-react"; 
import { useAuth } from "@/contexts/AuthContext";
import { provisionAndGenerateManagedTarpitConfigDetails } from "@/lib/actions";
import { db } from "@/lib/firebase/clientApp"; 
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore"; 
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton"; // Added this import

const formSchema = z.object({
  name: z.string().min(1, "Tarpit Name is required."),
  description: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

// Define a placeholder for max allowed URLs, this would ideally come from user's subscription data
const MAX_ALLOWED_URLS_PLACEHOLDER = 0; // New users (Window Shopping proxy) can add 0

export default function AddUrlForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingUrlCount, setIsCheckingUrlCount] = useState(true);
  const [currentUserUrlCount, setCurrentUserUrlCount] = useState(0);
  const [canAddMoreUrls, setCanAddMoreUrls] = useState(false);

  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth(); // Get authLoading state
  const tarpitBaseUrl = process.env.NEXT_PUBLIC_TARPIT_BASE_URL;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (authLoading) { // Wait for authentication to resolve
      setIsCheckingUrlCount(true);
      return;
    }
    if (!user) {
      setCanAddMoreUrls(false);
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
        
        if (count === 0) {
          setCanAddMoreUrls(false); // New users with 0 URLs are effectively on "Window Shopping"
        } else {
          // This logic needs to be replaced with real tier limit checks from user's actual tier.
          // For now, this placeholder allows up to 1 URL if they already have at least one.
          // This means if they are on "Set & Forget" (1 URL limit) and have 1, they can't add.
          // If they are on "Analytics" (3 URL limit) and have 1, they could add 2 more.
          // A more robust check would fetch user's tier and its specific maxUrl.
          // For simplicity in this step, let's assume a basic check against a small number if they have > 0.
          // For a user who has > 0 URLs (meaning they are not "new"/Window Shopping):
          // const userTierMaxUrls = 1; // Replace with actual fetched tier maxUrls (e.g. 1 for Set & Forget, 3 for Analytics)
          // setCanAddMoreUrls(count < userTierMaxUrls); 
          // As per current logic, it seems "Set & Forget allows 1, Analytics allows 3"
          // For demo, we allow users who have existing URLs to add up to a hypothetical limit
          // This is a placeholder for real tier enforcement.
          // A more practical approach for a real app would be to fetch the user's current tier
          // from Firestore, then get the maxUrls for that tier.
          // const currentTier = await fetchUserTier(user.uid); // hypothetical function
          // if (currentTier.id === 'set_and_forget') setCanAddMoreUrls(count < 1);
          // else if (currentTier.id === 'analytics') setCanAddMoreUrls(count < 3);
          // else setCanAddMoreUrls(false);

          // Simplified placeholder logic:
          // If they have > 0 URLs, they are not on "Window Shopping".
          // Let's assume "Set & Forget" has 1 URL, "Analytics" has 3.
          // If they have any URL, we can't know their tier from just URL count here.
          // For now, if they have > 0, let's allow them to add up to a limit like 1, to simulate
          // a basic tier. This needs to be replaced.
          // The Account page simulates their tier; this form doesn't know it.
          // The previous placeholder `setCanAddMoreUrls(count < 1)` for users with > 0 URLs was too restrictive.
          // A more general placeholder if they have > 0 URLs:
          const placeholderMaxForExistingUsers = 3; // Allows up to 3 URLs if they already have some
          setCanAddMoreUrls(count < placeholderMaxForExistingUsers);
        }


      } catch (error) {
        console.error("Error fetching user URL count:", error);
        toast({ title: "Error", description: "Could not verify your current URL count.", variant: "destructive" });
        setCanAddMoreUrls(false); // Default to not allowing if there's an error
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

    if (!canAddMoreUrls && currentUserUrlCount === 0) { 
        toast({
            title: "Subscription Required",
            description: "To add your first Managed URL, please select a subscription plan on your Account page.",
            variant: "default", // Changed from destructive to default
            duration: 7000,
        });
        return;
    }

     if (!canAddMoreUrls && currentUserUrlCount > 0) {
         toast({
            title: "Limit Reached",
            description: "You've reached the maximum number of Managed URLs for your current plan. Please upgrade to add more.",
            variant: "default", // Changed from destructive to default
            duration: 7000,
        });
        return;
    }


    if (!tarpitBaseUrl || tarpitBaseUrl === "http://localhost:3001") {
        toast({
            title: "Configuration Notice",
            description: `The Tarpit Base URL is currently set to "${tarpitBaseUrl}". Please update NEXT_PUBLIC_TARPIT_BASE_URL in your .env file to your public tarpit service domain for live functionality.`,
            variant: "default",
            duration: 10000,
        });
        // Not returning here, allow local testing if user proceeds
    }

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

      const documentToWrite = {
        ...provisionResult.configData,
        createdAt: serverTimestamp(), 
        status: "active", 
      };

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
        
        if (count === 0) {
            setCanAddMoreUrls(false);
        } else {
          // Placeholder: replace with actual tier limit check
          const placeholderMaxForExistingUsers = 3; 
          setCanAddMoreUrls(count < placeholderMaxForExistingUsers); 
        }

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
      {!canAddMoreUrls && !isCheckingUrlCount && user && currentUserUrlCount === 0 && ( // Specific message for 0 URLs
        <Alert variant="default" className="mb-6 border-amber-500/50 text-amber-500 [&>svg]:text-amber-500 bg-amber-500/10">
          <ShieldAlert className="h-5 w-5" />
          <AlertTitle>Subscription Required</AlertTitle>
          <AlertDescription>
            To add your first Managed URL, please select a subscription plan on your Account page.
          </AlertDescription>
        </Alert>
      )}
      {!canAddMoreUrls && !isCheckingUrlCount && user && currentUserUrlCount > 0 && ( // Specific message for >0 URLs but limit reached
        <Alert variant="default" className="mb-6 border-amber-500/50 text-amber-500 [&>svg]:text-amber-500 bg-amber-500/10">
          <ShieldAlert className="h-5 w-5" />
          <AlertTitle>URL Limit Reached</AlertTitle>
          <AlertDescription>
            You have reached the maximum number of Managed URLs for your current plan. Please upgrade to add more.
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
