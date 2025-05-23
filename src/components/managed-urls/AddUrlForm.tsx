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
import { PlusCircle } from "lucide-react";

const formSchema = z.object({
  urlPath: z.string().min(1, "URL Path is required").startsWith("/", "Path must start with /"),
  description: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

// Dummy function to simulate adding a URL
async function addManagedUrlApi(data: FormData): Promise<{ success: boolean; message: string, url?: string }> {
  return new Promise(resolve => {
    setTimeout(() => {
      console.log("Adding URL:", data);
      // Simulate success
      resolve({ success: true, message: "Managed URL added successfully!", url: `https://tarpit.spitespiral.com${data.urlPath}` });
      // Simulate failure
      // resolve({ success: false, message: "Failed to add URL. Please try again." });
    }, 1000);
  });
}


export default function AddUrlForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      urlPath: "",
      description: "",
    },
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    try {
      const result = await addManagedUrlApi(data); // Replace with actual API call
      if (result.success) {
        toast({
          title: "Success!",
          description: result.message + (result.url ? `\nNew URL: ${result.url}` : ""),
          variant: "default",
        });
        form.reset();
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
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
          name="urlPath"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground/80">URL Path</FormLabel>
              <FormControl>
                <Input placeholder="/my-trap.js" {...field} className="bg-background border-border focus:ring-primary"/>
              </FormControl>
              <FormDescription>
                The path that will trigger the tarpit (e.g., /pixel.gif, /config.json). Must start with /.
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
                <Textarea placeholder="e.g., Tarpit for blocking bad bots on main site" {...field} className="bg-background border-border focus:ring-primary"/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading} className="w-full md:w-auto bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground">
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground mr-2"></div>
          ) : (
            <PlusCircle className="mr-2 h-5 w-5" />
          )}
          {isLoading ? "Adding..." : "Add Managed URL"}
        </Button>
      </form>
    </Form>
  );
}
