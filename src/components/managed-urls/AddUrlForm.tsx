
"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Loader2 } from "lucide-react"; 
import { useAuth } from "@/contexts/AuthContext";
import { provisionAndGenerateManagedTarpitConfigDetails } from "@/lib/actions"; // Updated import
import { db } from "@/lib/firebase/clientApp"; 
import { collection, addDoc, serverTimestamp } from "firebase/firestore"; 

const formSchema = z.object({
  name: z.string().min(1, "Tarpit Name is required."),
  description: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function AddUrlForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit: SubmitHandler<FormData> = async (formData) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add a managed URL.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Step 1: Call server action to provision Docker instance AND generate details (pathSegment, fullUrl)
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

      // Step 2: Write to Firestore on the client-side (after successful Docker provisioning)
      const documentToWrite = {
        ...provisionResult.configData, // This includes userId, name, description, pathSegment, fullUrl, instanceId (optional)
        createdAt: serverTimestamp(), 
        status: "active", // Ensure status is set, though configData should have it
      };

      await addDoc(collection(db, "tarpit_configs"), documentToWrite);

      toast({
        title: "Success!",
        description: `Tarpit instance provisioned and managed URL added!\nNew URL: ${provisionResult.fullUrl}`,
        variant: "default",
        duration: 7000, 
      });
      form.reset();

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

  return (
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
                <Textarea placeholder="e.g., Captures bots attempting to scrape product pages." {...field} className="bg-background border-border focus:ring-primary"/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading || !user} className="w-full md:w-auto bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground">
          {isLoading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> 
          ) : (
            <PlusCircle className="mr-2 h-5 w-5" />
          )}
          {isLoading ? "Provisioning & Adding..." : "Add Managed URL"}
        </Button>
      </form>
    </Form>
  );
}
