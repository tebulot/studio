
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
import { useAuth } from "@/contexts/AuthContext";
import { addManagedTarpitConfig } from "@/lib/actions"; // Import the server action

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

  const onSubmit: SubmitHandler<FormData> = async (data) => {
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
      const result = await addManagedTarpitConfig({
        userId: user.uid,
        name: data.name,
        description: data.description,
      });

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
        description: "An unexpected error occurred while calling the server action.",
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
