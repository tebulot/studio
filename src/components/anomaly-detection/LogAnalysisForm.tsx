"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { analyzeTarpitLogs, type AnalyzeTarpitLogsOutput } from "@/ai/flows/analyze-tarpit-logs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, AlertCircle } from "lucide-react";

const formSchema = z.object({
  logs: z.string().min(50, "Logs must be at least 50 characters long."),
});

type FormData = z.infer<typeof formSchema>;

export default function LogAnalysisForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeTarpitLogsOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      logs: "",
    },
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    setAnalysisResult(null);
    setError(null);
    try {
      const result = await analyzeTarpitLogs({ logs: data.logs });
      setAnalysisResult(result);
      toast({
        title: "Analysis Complete",
        description: "AI has finished analyzing the logs.",
      });
    } catch (err) {
      console.error("Analysis error:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during analysis.";
      setError(errorMessage);
      toast({
        title: "Analysis Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="logs"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground/80 text-lg">Paste Logs Here</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="e.g., [timestamp] IP: 1.2.3.4 User-Agent: BadBot/1.0 ..."
                    {...field}
                    rows={10}
                    className="bg-background border-border focus:ring-primary min-h-[200px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isLoading} className="w-full md:w-auto bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground">
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground mr-2"></div>
            ) : (
              <Sparkles className="mr-2 h-5 w-5" />
            )}
            {isLoading ? "Analyzing..." : "Analyze Logs with AI"}
          </Button>
        </form>
      </Form>

      {error && (
        <Alert variant="destructive" className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Analysis Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {analysisResult && (
        <Card className="mt-8 border-accent/30 shadow-lg shadow-accent/10">
          <CardHeader>
            <CardTitle className="text-xl text-accent flex items-center">
              <Sparkles className="mr-2 h-6 w-6" />
              AI Analysis Results
            </CardTitle>
            <CardDescription>Summary and detected anomalies from the provided logs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg text-foreground/90 mb-2">Summary:</h3>
              <p className="text-muted-foreground whitespace-pre-wrap bg-muted/30 p-4 rounded-md">{analysisResult.summary}</p>
            </div>
            {analysisResult.anomalies && analysisResult.anomalies.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg text-foreground/90 mb-2">Detected Anomalies:</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  {analysisResult.anomalies.map((anomaly, index) => (
                    <li key={index} className="p-2 bg-muted/30 rounded-md border border-dashed border-destructive/50 text-destructive">
                      {anomaly}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {analysisResult.anomalies && analysisResult.anomalies.length === 0 && (
                <p className="text-muted-foreground">No specific anomalies detected by the AI.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
