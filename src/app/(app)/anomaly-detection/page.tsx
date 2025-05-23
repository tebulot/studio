
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import RequestLogTable from "@/components/request-logs/RequestLogTable"; // New component
import { FileText } from "lucide-react"; // Changed icon

export default function RequestLogsPage() { // Renamed function for clarity
  return (
    <div className="space-y-8">
      <header className="mb-10">
        <div className="flex items-center gap-3">
          <FileText className="h-10 w-10 text-primary" /> {/* Changed icon */}
          <h1 className="text-4xl font-bold tracking-tight text-primary glitch-text">Request Logs</h1> {/* Changed title */}
        </div>
        <p className="text-muted-foreground mt-2 text-lg">
          View raw GET and POST request logs from crawlers interacting with your tarpits. {/* Changed description */}
        </p>
      </header>

      <section>
        <Card className="shadow-lg border-primary/20">
          <CardHeader>
            <CardTitle className="text-xl text-primary">Crawler Request Logs</CardTitle> {/* Changed title */}
            <CardDescription>
              Detailed log of incoming requests identified or suspected as crawlers. {/* Changed description */}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RequestLogTable /> {/* Use new component */}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
