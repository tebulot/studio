
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
import { useAuth, type UserProfile } from "@/contexts/AuthContext"; // Added UserProfile type
import { provisionAndGenerateManagedTarpitConfigDetails } from "@/lib/actions";
import { db } from "@/lib/firebase/clientApp";
import { collection, addDoc, serverTimestamp, query, where, getDocs, onSnapshot, type QuerySnapshot, type DocumentData } from "firebase/firestore"; // Added onSnapshot, QuerySnapshot, DocumentData
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

const formSchema = z.object({
  name: z.string().min(1, "Tarpit Name is required."),
  description: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

// const ADMIN_TEST_MAX_URLS = 1; // User can create up to 1 URL for "Set & Forget"

export default function AddUrlForm() {
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [isCheckingUrlCount, setIsCheckingUrlCount] = useState(true);
  const [currentUserUrlCount, setCurrentUserUrlCount] = useState(0);
  const [canAddMoreUrls, setCanAddMoreUrls] = useState(false);

  const { toast } = useToast();
  const { user, userProfile, loading: authContextLoading } = useAuth();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (authContextLoading || !user || !userProfile) {
      setIsCheckingUrlCount(true);
      setCanAddMoreUrls(false); // Default to false if user/profile not loaded
      if (!authContextLoading && !user) { // If done loading and no user, stop checking
        setIsCheckingUrlCount(false);
      }
      return;
    }

    setIsCheckingUrlCount(true);
    const q = query(collection(db, "tarpit_configs"), where("userId", "==", user.uid));

    // Use onSnapshot for real-time updates to currentUserUrlCount
    const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      const count = snapshot.size;
      setCurrentUserUrlCount(count);
      const limit = userProfile.managedUrlLimit || 0;
      setCanAddMoreUrls(count < limit);
      setIsCheckingUrlCount(false);
    }, (error) => {
      console.error("Error fetching user URL count with onSnapshot:", error);
      toast({ title: "Error", description: "Could not verify your current URL count.", variant: "destructive" });
      setCanAddMoreUrls(false);
      setIsCheckingUrlCount(false);
    });

    return () => unsubscribe(); // Cleanup listener on component unmount or when dependencies change

  }, [user, userProfile, authContextLoading, toast]);


  const onSubmit: SubmitHandler<FormData> = async (formData) => {
    if (!user || !userProfile) {
      toast({
        title: "Error",
        description: "You must be logged in and have a profile to add a managed URL.",
        variant: "destructive",
      });
      return;
    }

    if (userProfile.subscriptionStatus !== "active" && userProfile.subscriptionStatus !== "trialing") {
        toast({
            title: "Subscription Required",
            description: `Your subscription status is '${userProfile.subscriptionStatus}'. Please activate your subscription to add Managed URLs.`,
            variant: "default",
            duration: 7000,
        });
        return;
    }
    
    if (!canAddMoreUrls) {
         toast({
            title: "Limit Reached",
            description: `You have reached the Managed URL limit of ${userProfile.managedUrlLimit} for your current plan. Please upgrade your plan or delete existing URLs.`,
            variant: "default",
            duration: 7000,
        });
        return;
    }

    setIsSubmittingForm(true);
    try {
      const provisionResult = await provisionAndGenerateManagedTarpitConfigDetails({
        userId: user.uid,
        name: formData.name,
        description: formData.description,
      });

      if (!provisionResult.success || !provisionResult.configData || !provisionResult.fullUrl) {
        let toastMessage = provisionResult.message || "Failed to provision tarpit instance or generate URL configuration.";
        if (provisionResult.message.includes("limit reached") || provisionResult.message.includes("subscription status")) {
            toastMessage = provisionResult.message;
        }
        toast({
          title: "Provisioning Failed",
          description: toastMessage,
          variant: "destructive",
        });
        setIsSubmittingForm(false);
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
      // No need to manually re-fetch count here as onSnapshot will handle it.

    } catch (error) {
      console.error("Error in onSubmit AddUrlForm:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      toast({
        title: "Error",
        description: `Failed to add managed URL: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmittingForm(false);
    }
  };

  if (authContextLoading || isCheckingUrlCount) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-1/4" />
        </div>
    );
  }
  
  const currentLimit = userProfile?.managedUrlLimit ?? 0;

  return (
    <>
      {user && userProfile && (!canAddMoreUrls || (userProfile.subscriptionStatus !== "active" && userProfile.subscriptionStatus !== "trialing")) && !isCheckingUrlCount && (
        <Alert variant="default" className="mb-6 border-amber-500/50 text-amber-500 [&>svg]:text-amber-500 bg-amber-500/10">
          <ShieldAlert className="h-5 w-5" />
          <AlertTitle>
            {userProfile.subscriptionStatus !== "active" && userProfile.subscriptionStatus !== "trialing"
              ? "Subscription Inactive"
              : `URL Limit Reached (${currentUserUrlCount}/${currentLimit})`}
          </AlertTitle>
          <AlertDescription>
            {userProfile.subscriptionStatus !== "active" && userProfile.subscriptionStatus !== "trialing"
              ? `Your subscription status is '${userProfile.subscriptionStatus}'. Please check your Account page to activate your subscription.`
              : `You have reached the Managed URL limit (${currentLimit}) for your current plan. Please upgrade your plan or delete existing URLs to add more.`}
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
            disabled={isSubmittingForm || !user || !userProfile || !canAddMoreUrls || isCheckingUrlCount || (userProfile.subscriptionStatus !== "active" && userProfile.subscriptionStatus !== "trialing")}
            className="w-full md:w-auto bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground"
          >
            {isSubmittingForm || isCheckingUrlCount ? ( // Show loader if checking count too
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <PlusCircle className="mr-2 h-5 w-5" />
            )}
            {isSubmittingForm ? "Provisioning & Adding..." : isCheckingUrlCount ? "Checking Limits..." : "Add Managed URL"}
          </Button>
           {!isCheckingUrlCount && userProfile && userProfile.subscriptionStatus === "active" && userProfile.managedUrlLimit > 0 && (
             <p className="text-xs text-muted-foreground">
                You have {currentUserUrlCount} out of {currentLimit} Managed URLs.
             </p>
           )}
        </form>
      </Form>
    </>
  );
}
