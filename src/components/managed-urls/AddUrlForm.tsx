
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
        // For now, we use a placeholder for actual tier limits.
        // If count is 0, they are "new" and can't add (simulating Window Shopping).
        // If we wanted to allow 1 URL for a basic tier, it would be:
        // setCanAddMoreUrls(count < ACTUAL_USER_TIER_LIMIT);
        setCanAddMoreUrls(count < MAX_ALLOWED_URLS_PLACEHOLDER + 1 && count === 0); // Allows 0 if count is 0. Adjust if actual plans allow 1 for first tier.
                                                                            // This effectively means if count is 0, canAddMoreUrls is false (0 < 1 && 0 === 0 is false)
                                                                            // If you want the first tier (Set & Forget) to add 1, this logic needs to be more sophisticated
                                                                            // by fetching user's actual tier.
                                                                            // For now, let's simplify: if count is 0, they can't add.
        if (count === 0) {
          setCanAddMoreUrls(false); // New users with 0 URLs are effectively on "Window Shopping"
        } else {
          // If they have >0 URLs, it means they are on a "paid" tier.
          // Here you would check against their *actual* tier's limit from Firestore.
          // For this example, let's assume if they have any, they can't add more via this simple form.
          // This logic needs to be replaced with real tier limit checks.
          // For now, let's assume a very basic limit of 1 for demonstration if they already have one.
          // This is a placeholder for a proper tier system.
          setCanAddMoreUrls(count < 1); // Placeholder: if they have 1, they can't add more.
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

    if (!canAddMoreUrls && currentUserUrlCount >= MAX_ALLOWED_URLS_PLACEHOLDER && currentUserUrlCount > 0) {
         toast({
            title: "Limit Reached",
            description: "You've reached the maximum number of Managed URLs for your current plan. Please upgrade to add more.",
            variant: "default",
            duration: 7000,
        });
        return;
    }
     if (currentUserUrlCount === 0 && !canAddMoreUrls) { // Explicitly for the "0 existing URLs" case
        toast({
            title: "Subscription Required",
            description: "Please select a subscription plan on the Account page to add Managed URLs.",
            variant: "default",
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
        // This simplified logic will need to be replaced by actual tier limit checks
        if (count === 0) {
            setCanAddMoreUrls(false);
        } else {
            setCanAddMoreUrls(count < 1); // Placeholder
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
      {!canAddMoreUrls && !isCheckingUrlCount && user && (
        <Alert variant="destructive" className="mb-6 border-amber-500/50 text-amber-500 [&>svg]:text-amber-500">
          <ShieldAlert className="h-5 w-5" />
          <AlertTitle>URL Limit Reached or Subscription Required</AlertTitle>
          <AlertDescription>
            {currentUserUrlCount === 0 
              ? "To add your first Managed URL, please select a subscription plan on your Account page."
              : "You have reached the maximum number of Managed URLs for your current plan. Please upgrade to add more."}
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
