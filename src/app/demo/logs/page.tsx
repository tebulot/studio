
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import RequestLogTable from "@/components/request-logs/RequestLogTable";
import { FileText, ShieldCheck, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import NextLink from "next/link";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const DEMO_USER_ID = process.env.NEXT_PUBLIC_DEMO_USER_ID;
const DIRECT_TRAP_URL = "https://api.spitespiral.com/trap/17bff108-d97e-42d7-b151-7a2378c56d12";

export default function DemoRequestLogsPage() {
  const [isDemoIdConfigured, setIsDemoIdConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // For initial check
  const [isMountedTrap, setIsMountedTrap] = useState(false);


  useEffect(() => {
    if (DEMO_USER_ID && DEMO_USER_ID !== "public-demo-user-id-placeholder") {
      setIsDemoIdConfigured(true);
    }
    setIsLoading(false);
    setIsMountedTrap(true); // For JS-injected link
  }, []);

  // For JS-injected footer link
  useEffect(() => {
    if (isMountedTrap) {
      const container = document.getElementById('spite-footer-container-demo-logs');
      if (container && !container.querySelector('a')) {
        const link = document.createElement('a');
        link.href = "/sneedsfeedandseed/";
        link.title = "Internal Archive JS Redirect - Demo Logs";
        link.setAttribute('aria-hidden', 'true');
        link.setAttribute('tabindex', '-1');
        link.style.cssText = "font-size:1px; color:transparent; opacity:0.01;";
        link.innerHTML = ".";
        container.appendChild(link);
      }
    }
  }, [isMountedTrap]);

  if (isLoading) {
      return (
        <>
        {/* Invisible direct tarpit link for header area */}
        <a
            href={DIRECT_TRAP_URL}
            rel="nofollow noopener noreferrer"
            aria-hidden="true"
            tabIndex={-1}
            style={{
            opacity: 0.01,
            position: 'absolute',
            left: '-9999px',
            top: '-9999px',
            fontSize: '1px',
            color: 'transparent',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
            }}
            title="SpiteSpiral Internal Data - Demo Logs Loading"
        >
            .
        </a>
        <div className="flex flex-col items-center justify-center text-center space-y-4 p-8">
            <FileText className="h-16 w-16 text-primary animate-pulse" />
            <p className="text-muted-foreground">Loading Demo Logs...</p>
        </div>
        </>
      )
  }

  if (!isDemoIdConfigured) {
    return (
        <>
        {/* Invisible direct tarpit link for header area */}
        <a
            href={DIRECT_TRAP_URL}
            rel="nofollow noopener noreferrer"
            aria-hidden="true"
            tabIndex={-1}
            style={{
            opacity: 0.01,
            position: 'absolute',
            left: '-9999px',
            top: '-9999px',
            fontSize: '1px',
            color: 'transparent',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
            }}
            title="SpiteSpiral Internal Data - Demo Logs Config Error"
        >
            .
        </a>
        <div className="flex flex-col items-center justify-center text-center space-y-4 p-8 rounded-lg bg-card border border-destructive shadow-lg">
            <ShieldCheck className="h-16 w-16 text-destructive" />
            <h2 className="text-2xl font-semibold text-destructive">Demo Not Configured</h2>
            <p className="text-muted-foreground max-w-md">
                The <code className="bg-muted px-1.5 py-0.5 rounded-sm font-semibold text-accent">NEXT_PUBLIC_DEMO_USER_ID</code> environment variable is not set or is still using the placeholder value.
                Please configure this in your <code className="bg-muted px-1.5 py-0.5 rounded-sm font-semibold text-accent">.env</code> file and ensure the corresponding user and data exist in Firestore to view the demo logs.
            </p>
            <Button asChild>
                <NextLink href="/">Return to Homepage</NextLink>
            </Button>
        </div>
        </>
    );
  }

  return (
    <>
    {/* Invisible direct tarpit link for header area */}
    <a
        href={DIRECT_TRAP_URL}
        rel="nofollow noopener noreferrer"
        aria-hidden="true"
        tabIndex={-1}
        style={{
        opacity: 0.01,
        position: 'absolute',
        left: '-9999px',
        top: '-9999px',
        fontSize: '1px',
        color: 'transparent',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
        }}
        title="SpiteSpiral Internal Data - Demo Logs"
    >
        .
    </a>
    <div className="space-y-8">
      <header className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <div className="flex items-center gap-3">
            <FileText className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight text-primary glitch-text">Demo Request Logs</h1>
            </div>
            <p className="text-muted-foreground mt-2 text-lg">
            View raw GET and POST request logs from crawlers interacting with the demo tarpits.
            </p>
        </div>
         <Button asChild variant="outline" className="border-accent text-accent hover:bg-accent/10 hover:text-accent-foreground">
            <NextLink href="/demo/dashboard">
                <ShieldCheck className="mr-2 h-4 w-4" /> View Demo Dashboard
            </NextLink>
        </Button>
      </header>

      <Alert variant="default" className="border-accent/20 bg-card/50 mb-6">
        <Info className="h-5 w-5 text-accent" />
        <AlertTitle className="text-accent">Raw Log Data Notice</AlertTitle>
        <AlertDescription className="text-muted-foreground">
          Due to our new log aggregation system for performance and cost, the detailed raw logs displayed here for the demo may be limited, not up-to-date, or may no longer be populated if the raw log collection (tarpit_logs) is deprecated for the demo user. The Demo Dashboard shows activity based on aggregated summaries.
        </AlertDescription>
      </Alert>

      <section>
        <Card className="shadow-lg border-primary/20">
          <CardHeader>
            <CardTitle className="text-xl text-primary">Demo Crawler Request Logs</CardTitle>
            <CardDescription>
              Detailed log of incoming requests to demo tarpits (may be limited or based on historical data).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RequestLogTable userIdOverride={DEMO_USER_ID} />
          </CardContent>
        </Card>
      </section>
      {/* Invisible JS-injected redirect tarpit link for footer area */}
      {isMountedTrap && (
        <div id="spite-footer-container-demo-logs" aria-hidden="true" style={{ position: 'absolute', left: '-9999px', bottom: '0px', opacity: 0, width: '1px', height: '1px', overflow: 'hidden' }}>
          {/* JS will inject here */}
        </div>
      )}
    </div>
    </>
  );
}

