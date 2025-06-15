
'use client';

import { Link2 as Link2Icon, Settings } from 'lucide-react';
import AddUrlForm from '@/components/managed-urls/AddUrlForm';
import UrlList from '@/components/managed-urls/UrlList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ManagedUrlsPage() {
  return (
    <div className="space-y-8">
      <header className="mb-10">
        <div className="flex items-center gap-3">
          <Link2Icon className="h-10 w-10 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight text-primary glitch-text">Activate Your SpiteSpiral Trap</h1>
        </div>
        <p className="text-muted-foreground mt-2 text-lg">
          Ready to protect your site? Create and manage your SpiteSpiral links below. Each link, powered by our Nightmare v2 engine, has its own setup guide to help you trap unwanted bots (using Procedural Content Generation and N-gram text) while keeping search engines happy.
        </p>
      </header>

      <Card className="shadow-lg border-accent/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-7 w-7 text-accent" />
            <CardTitle className="text-2xl text-accent">Create &amp; Manage Your Tarpit Instances</CardTitle>
          </div>
          <CardDescription>
            Create named Nightmare v2 tarpit instances here. Each instance will have a unique SpiteSpiral URL. Click the "Setup Guide" button on any existing URL for embedding instructions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AddUrlForm />
          <UrlList />
        </CardContent>
      </Card>
    </div>
  );
}
