import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LogAnalysisForm from "@/components/anomaly-detection/LogAnalysisForm";
import { Bot } from "lucide-react"; // Using Bot icon as a stand-in for AI/ShieldAlert

export default function AnomalyDetectionPage() {
  return (
    <div className="space-y-8">
      <header className="mb-10">
        <div className="flex items-center gap-3">
          <Bot className="h-10 w-10 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight text-primary glitch-text">AI Anomaly Detection</h1>
        </div>
        <p className="text-muted-foreground mt-2 text-lg">
          Leverage AI to analyze tarpit logs for suspicious patterns and enhance threat intelligence.
        </p>
      </header>

      <section>
        <Card className="shadow-lg border-primary/20">
          <CardHeader>
            <CardTitle className="text-xl text-primary">Analyze Tarpit Logs</CardTitle>
            <CardDescription>
              Paste your tarpit logs below. Our AI will analyze them for unusual or suspicious activity.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LogAnalysisForm />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
