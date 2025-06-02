
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
              Gain access to raw, non-aggregated logs from your tarpit instances for detailed analysis and integration.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-foreground/80">
            <p>Currently, SpiteSpiral provides aggregated log summaries. We are working on providing direct access to raw logs, which can be voluminous but offer granular detail.</p>
            
            <h4 className="font-semibold text-primary pt-2">Storage & Access Options Under Consideration:</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Client-Side Download:</strong> Mechanisms to download raw logs to your own systems, shifting the storage burden to you but offering full control.</li>
              <li><strong>Dedicated Raw Log Storage:</strong> Storing raw logs on our infrastructure, segregated and accessible to you, potentially via cloud storage solutions (e.g., GCS buckets).</li>
            </ul>

            <h4 className="font-semibold text-primary pt-2">Technical Implications & Features:</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Log Volume & Storage:</strong> Scalable solutions for potentially large log volumes, with considerations for log rotation and retention policies.</li>
              <li><strong>Log Format:</strong> Standardized structured format (e.g., JSONL) for easy parsing.</li>
              <li><strong>Ingestion Pipeline:</strong> Robust pipeline to collect raw logs from tarpit instances and forward them to the storage solution.</li>
              <li><strong>Security & Segregation:</strong> Strict data isolation if logs are stored on our infrastructure.</li>
              <li><strong>Access Mechanism:</strong> Downloads via the dashboard and/or dedicated API endpoints.</li>
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
            <p>This API will allow you to retrieve data specific to your configured tarpit instances.</p>
            <h4 className="font-semibold text-accent pt-2">Technical Implications & Features:</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Authentication & Authorization:</strong> Robust security, likely extending Firebase Auth, with potential for API keys.</li>
              <li><strong>RESTful API Design:</strong> Clear endpoints, for example:
                <ul className="list-circle pl-5 space-y-0.5 mt-1">
                  <li><code className="text-xs bg-muted p-0.5 rounded">GET /v1/client/tarpits/&#123;tarpitId&#125;/logs/raw</code> (with pagination, time filters)</li>
                  <li><code className="text-xs bg-muted p-0.5 rounded">GET /v1/client/tarpits/&#123;tarpitId&#125;/logs/summary</code></li>
                  <li><code className="text-xs bg-muted p-0.5 rounded">GET /v1/client/tarpits</code> (list your managed tarpits)</li>
                </ul>
              </li>
              <li><strong>Data Points:</strong> Exposure of raw log lines, aggregated statistics, and specific indicators (e.g., frequent IPs/User-Agents).</li>
              <li><strong>Rate Limiting:</strong> To ensure fair usage and protect backend resources.</li>
              <li><strong>Documentation:</strong> Comprehensive API documentation.</li>
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
            <p>This premium API would provide insights derived from activity across all SpiteSpiral tarpits, offering a broader view of threat landscapes.</p>
            <h4 className="font-semibold text-primary pt-2">Technical Implications & Features:</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Data Aggregation & Anonymization:</strong> Collection of indicators (IPs, User-Agents, paths probed) from all instances, with strict anonymization to protect individual client privacy.</li>
              <li><strong>Threat Scoring/Ranking:</strong> Contextual information such as frequency, recency, and potential confidence scores for identified threats.</li>
              <li><strong>Dedicated Storage:</strong> Optimized storage for aggregated threat intelligence data.</li>
              <li><strong>API Design:</strong> Endpoints like <code className="text-xs bg-muted p-0.5 rounded">GET /v1/global/threats/ips</code> with filtering capabilities. Standardized output formats (e.g., JSON, potentially STIX/TAXII in the future).</li>
              <li><strong>Security & Access Control:</strong> Premium API requiring robust authentication.</li>
              <li><strong>Data Quality:</strong> Processes to manage data quality and address potential false positives.</li>
              <li><strong>Legal & Ethical Considerations:</strong> Careful review of data privacy regulations and clear terms of service.</li>
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
