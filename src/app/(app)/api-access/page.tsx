
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code2, DatabaseZap, Users, GlobeLock } from "lucide-react";

export default function ApiAccessPage() {
  return (
    <div className="space-y-8">
      <header className="mb-10">
        <div className="flex items-center gap-3">
          <Code2 className="h-10 w-10 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight text-primary glitch-text">API Access (Upcoming)</h1>
        </div>
        <p className="text-muted-foreground mt-2 text-lg">
          Explore upcoming API features designed to give you programmatic access to your tarpit data and broader threat intelligence.
        </p>
      </header>

      <section className="space-y-6">
        <Card className="shadow-lg border-accent/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <DatabaseZap className="h-7 w-7 text-accent" />
              <CardTitle className="text-2xl text-accent">Raw Log Access for Your Tarpits</CardTitle>
            </div>
            <CardDescription>
              Gain direct access to raw, non-aggregated logs from your tarpit instances for detailed analysis and custom integration.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-foreground/80">
            <p>While SpiteSpiral provides aggregated summaries, we are developing features to grant you access to the granular raw logs from your tarpit instances. This allows for deeper investigation and integration into your own security toolchains.</p>
            
            <h4 className="font-semibold text-primary pt-2">Key Features for Raw Log Access:</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Secure Raw Log Storage:</strong> SpiteSpiral will securely store your raw logs, making them readily accessible to you.</li>
              <li><strong>Scalable Log Management:</strong> We manage the complexities of potentially large log volumes, with appropriate retention policies.</li>
              <li><strong>Structured Log Data:</strong> Your raw logs will be provided in a standardized format (e.g., JSONL), ideal for easy parsing and integration with your existing analysis tools.</li>
              <li><strong>Reliable Log Collection:</strong> Our robust pipeline ensures raw logs from your tarpit instances are efficiently collected and made available.</li>
              <li><strong>Your Data, Secured:</strong> We ensure strict data isolation, keeping your raw logs private and secure.</li>
              <li><strong>Flexible Access:</strong> Retrieve your raw logs through the dashboard or programmatically via dedicated API endpoints.</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-7 w-7 text-primary" />
              <CardTitle className="text-2xl text-primary">API for Your Individual Tarpit Data</CardTitle>
            </div>
            <CardDescription>
              Programmatically access data from your own managed tarpits for custom integrations and security workflows.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-foreground/80">
            <p>This API will empower you to retrieve detailed information and statistics specific to your configured SpiteSpiral tarpit instances.</p>
            <h4 className="font-semibold text-accent pt-2">What This API Will Offer:</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Secure & Authenticated Access:</strong> Programmatic access will be protected with robust authentication, likely using API keys tied to your account.</li>
              <li><strong>Developer-Friendly API:</strong> Expect a well-designed RESTful API with clear endpoints for retrieving your tarpit data. Examples include:
                <ul className="list-circle pl-5 space-y-0.5 mt-1">
                  <li><code className="text-xs bg-muted p-0.5 rounded">GET /v1/client/tarpits/&#123;tarpitId&#125;/logs/raw</code> (with pagination, time filters)</li>
                  <li><code className="text-xs bg-muted p-0.5 rounded">GET /v1/client/tarpits/&#123;tarpitId&#125;/logs/summary</code></li>
                  <li><code className="text-xs bg-muted p-0.5 rounded">GET /v1/client/tarpits</code> (list your managed tarpits)</li>
                </ul>
              </li>
              <li><strong>Comprehensive Data Access:</strong> Retrieve raw log lines, aggregated statistics, and specific indicators like frequent IPs or User-Agents targeting your instances.</li>
              <li><strong>Reliable Performance:</strong> Sensible rate limits will be in place to ensure stable and fair usage for all clients.</li>
              <li><strong>Clear Documentation:</strong> We'll provide comprehensive API documentation to help you integrate smoothly.</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-accent/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <GlobeLock className="h-7 w-7 text-accent" />
              <CardTitle className="text-2xl text-accent">Global Threat Intelligence API (Platform-Wide)</CardTitle>
            </div>
            <CardDescription>
              Access anonymized and aggregated threat data from across the entire SpiteSpiral platform to proactively identify and block known bad actors.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-foreground/80">
            <p>This premium API will provide insights derived from activity across all SpiteSpiral tarpits, offering a broader view of threat landscapes and enabling proactive defense.</p>
            <h4 className="font-semibold text-primary pt-2">Leverage Platform-Wide Insights:</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Anonymized, Aggregated Intelligence:</strong> Benefit from insights derived from across the SpiteSpiral network. We'll aggregate indicators like malicious IPs and User-Agents, ensuring all data is anonymized to protect client privacy.</li>
              <li><strong>Actionable Threat Feeds:</strong> Data will be enriched with context, such as frequency and recency, to help you prioritize and act on threats more effectively.</li>
              <li><strong>Easy-to-Integrate Feeds:</strong> Access global threat data via dedicated API endpoints (e.g., for top malicious IPs) in standardized formats.</li>
              <li><strong>Premium & Secure Access:</strong> This API will be secured with robust authentication, ensuring data integrity and controlled access.</li>
              <li><strong>High-Quality Intelligence:</strong> We'll implement processes to maintain the quality of the threat feed and minimize false positives.</li>
              <li><strong>Responsible Data Handling:</strong> We are committed to adhering to data privacy regulations and ethical guidelines in providing this service.</li>
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

