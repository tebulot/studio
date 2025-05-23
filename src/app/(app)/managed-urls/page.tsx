import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AddUrlForm from "@/components/managed-urls/AddUrlForm";
import UrlList from "@/components/managed-urls/UrlList";
import { LinkIcon } from "lucide-react";

export default function ManagedUrlsPage() {
  return (
    <div className="space-y-8">
      <header className="mb-10">
        <div className="flex items-center gap-3">
          <LinkIcon className="h-10 w-10 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight text-primary glitch-text">Managed URLs</h1>
        </div>
        <p className="text-muted-foreground mt-2 text-lg">
          Configure and manage the URLs that trigger your SpiteSpiral tarpits.
        </p>
      </header>

      <section>
        <Card className="shadow-lg border-primary/20">
          <CardHeader>
            <CardTitle className="text-xl text-primary">Add New Managed URL</CardTitle>
            <CardDescription>
              Provide a URL path and an optional description for your new tarpit trigger.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AddUrlForm />
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="shadow-lg border-accent/20">
          <CardHeader>
            <CardTitle className="text-xl text-accent">Your Managed URLs</CardTitle>
            <CardDescription>
              A list of your currently active managed URLs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UrlList />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
