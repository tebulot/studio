
'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import TrappedCrawlersChart from "@/components/dashboard/TrappedCrawlersChart";
import { ShieldCheck, Users, DollarSign, Info, Eye } from "lucide-react"; // Added Eye
import { db } from "@/lib/firebase/clientApp";
import { collection, query, where, onSnapshot, getDocs, type DocumentData, type QuerySnapshot, Timestamp, orderBy } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import NextLink from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { subDays, startOfDay } from "date-fns";

const DEMO_USER_ID = process.env.NEXT_PUBLIC_DEMO_USER_ID;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

interface ActivitySummaryDocForDemo {
  startTime: Timestamp;
  uniqueIpCount: number;
  totalHits: number;
  userId: string;
}

export default function DemoDashboardPage() {
  const { toast } = useToast();
  const [activeInstancesCount, setActiveInstancesCount] = useState<number | null>(null);
  const [isLoadingInstancesCount, setIsLoadingInstancesCount] = useState(true);
  
  const [demoUniqueCrawlersApproxCount, setDemoUniqueCrawlersApproxCount] = useState<number | null>(null);
  const [isLoadingDemoUniqueCrawlers, setIsLoadingDemoUniqueCrawlers] = useState(true);

  const [demoWastedComputeCost, setDemoWastedComputeCost] = useState<string | null>(null);
  const [isLoadingDemoWastedCompute, setIsLoadingDemoWastedCompute] = useState(true);

  const [isDemoIdProperlyConfigured, setIsDemoIdProperlyConfigured] = useState(false);

  useEffect(() => {
    console.log("DemoDashboardPage: Using DEMO_USER_ID:", DEMO_USER_ID);
    if (DEMO_USER_ID && DEMO_USER_ID !== "public-demo-user-id-placeholder") {
      setIsDemoIdProperlyConfigured(true);
    } else {
      setIsDemoIdProperlyConfigured(false);
      // Set loading states to false if not configured, to prevent infinite loaders
      setIsLoadingInstancesCount(false);
      setIsLoadingDemoUniqueCrawlers(false);
      setIsLoadingDemoWastedCompute(false);
      setActiveInstancesCount(0);
      setDemoUniqueCrawlersApproxCount(0);
      setDemoWastedComputeCost("0.0000");
    }
  }, []); // Run once on mount to check config


  // Listener for active demo instances count (reads from tarpit_configs)
  useEffect(() => {
    if (!isDemoIdProperlyConfigured) {
      return;
    }
    setIsLoadingInstancesCount(true);
    const instancesQuery = query(collection(db, "tarpit_configs"), where("userId", "==", DEMO_USER_ID));
    const unsubscribeInstances = onSnapshot(instancesQuery, (querySnapshot: QuerySnapshot<DocumentData>) => {
      setActiveInstancesCount(querySnapshot.size);
      setIsLoadingInstancesCount(false);
    }, (error) => {
      console.error("Error fetching demo active instances count:", error);
      toast({ 
        title: "Error Fetching Demo Instances", 
        description: `Could not fetch demo active tarpit instances. Ensure Firestore rules allow public read for data where userId is '${DEMO_USER_ID}' (this ID must be the literal string in your rules for demo access) and check DEMO_USER_ID configuration.`, 
        variant: "destructive", 
        duration: 10000 
      });
      setActiveInstancesCount(0);
      setIsLoadingInstancesCount(false);
    });
    return () => unsubscribeInstances();
  }, [isDemoIdProperlyConfigured, toast]);

  // Fetch for demo unique crawlers approx. count & wasted compute cost from activity summaries with caching
  useEffect(() => {
    if (!isDemoIdProperlyConfigured) {
      return;
    }
    
    const fetchDemoSummaryStats = async () => {
      setIsLoadingDemoUniqueCrawlers(true);
      setIsLoadingDemoWastedCompute(true);

      const cacheKeyBase = `spiteSpiral_summaryStats_${DEMO_USER_ID}`;
      const cachedCrawlersKey = `${cacheKeyBase}_uniqueCrawlersApprox`;
      const cachedCostKey = `${cacheKeyBase}_wastedComputeSummary`;
      const timestampKey = `${cacheKeyBase}_timestamp`;
      const logPrefix = `DemoDashboardPage (DEMO_USER_ID: ${DEMO_USER_ID ? DEMO_USER_ID.substring(0,5) : 'N/A'}...) - Demo Summary Stats:`;


      try {
        const cachedTimestampStr = localStorage.getItem(timestampKey);
        const cachedTimestamp = cachedTimestampStr ? parseInt(cachedTimestampStr, 10) : 0;
        const now = Date.now();
        const cacheAge = now - cachedTimestamp;
        
        console.log(`${logPrefix} Cache check. Now: ${new Date(now).toISOString()}, Cached At: ${new Date(cachedTimestamp).toISOString()}, Age: ${cacheAge/1000}s, Max Age: ${CACHE_DURATION/1000}s`);

        if (cacheAge < CACHE_DURATION) {
          const cachedCrawlers = localStorage.getItem(cachedCrawlersKey);
          const cachedCost = localStorage.getItem(cachedCostKey);
          if (cachedCrawlers !== null && cachedCost !== null) {
            console.log(`${logPrefix} Using cached data.`);
            setDemoUniqueCrawlersApproxCount(JSON.parse(cachedCrawlers));
            setDemoWastedComputeCost(JSON.parse(cachedCost));
            setIsLoadingDemoUniqueCrawlers(false);
            setIsLoadingDemoWastedCompute(false);
            return;
          } else {
             console.log(`${logPrefix} Cache valid by timestamp, but data missing. Fetching fresh.`);
          }
        } else {
            console.log(`${logPrefix} Cache stale or not found. Fetching fresh data.`);
        }


        const thirtyDaysAgoDate = startOfDay(subDays(new Date(), 29));
        const summariesQuery = query(
          collection(db, "tarpit_activity_summaries"), 
          where("userId", "==", DEMO_USER_ID),
          where("startTime", ">=", Timestamp.fromDate(thirtyDaysAgoDate)),
          orderBy("startTime", "asc")
        );
        const querySnapshot = await getDocs(summariesQuery);
        console.log(`${logPrefix} Fetched ${querySnapshot.size} summary documents from Firestore for demo user.`);

        let summedUniqueIpCount = 0;
        let totalHitsForCostCalc = 0;

        querySnapshot.forEach((doc) => {
          const data = doc.data() as ActivitySummaryDocForDemo;
          if (data.uniqueIpCount) {
            summedUniqueIpCount += data.uniqueIpCount;
          }
          if (data.totalHits) {
            totalHitsForCostCalc += data.totalHits;
          }
        });

        const currentWastedCost = (totalHitsForCostCalc * 0.0001).toFixed(4);
        console.log(`${logPrefix} Processed fresh data: UniqueIPsSum=${summedUniqueIpCount}, TotalHitsForCost=${totalHitsForCostCalc}, WastedCost=${currentWastedCost}`);

        setDemoUniqueCrawlersApproxCount(summedUniqueIpCount);
        setDemoWastedComputeCost(currentWastedCost);

        localStorage.setItem(cachedCrawlersKey, JSON.stringify(summedUniqueIpCount));
        localStorage.setItem(cachedCostKey, JSON.stringify(currentWastedCost));
        localStorage.setItem(timestampKey, now.toString());
        console.log(`${logPrefix} Updated cache with fresh data.`);

      } catch (error) {
        console.error(`${logPrefix} Error fetching activity summaries:`, error);
        toast({ 
            title: "Error Fetching Demo Stats", 
            description: `Could not fetch demo crawler statistics. Ensure Firestore rules allow public read for data where userId is '${DEMO_USER_ID}' (this ID must be the literal string in your rules for demo access) and check DEMO_USER_ID configuration. Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 
            variant: "destructive", 
            duration: 10000 
        });
        setDemoUniqueCrawlersApproxCount(0);
        setDemoWastedComputeCost("0.0000");
      } finally {
        setIsLoadingDemoUniqueCrawlers(false);
        setIsLoadingDemoWastedCompute(false);
      }
    };
    fetchDemoSummaryStats();
  }, [isDemoIdProperlyConfigured, toast]);


  if (!isDemoIdProperlyConfigured && (isLoadingInstancesCount || isLoadingDemoUniqueCrawlers || isLoadingDemoWastedCompute )) {
    // Still determining configuration or initial loading
    return (
        <div className="flex flex-col items-center justify-center text-center space-y-4 p-8 rounded-lg bg-card border border-border shadow-lg">
            <ShieldCheck className="h-16 w-16 text-primary animate-pulse" />
            <h2 className="text-2xl font-semibold text-primary">Loading Demo...</h2>
            <p className="text-muted-foreground max-w-md">
                Verifying demo configuration...
            </p>
        </div>
    );
  }
  
  if (!isDemoIdProperlyConfigured) {
      return (
          <div className="flex flex-col items-center justify-center text-center space-y-4 p-8 rounded-lg bg-card border border-destructive shadow-lg">
              <ShieldCheck className="h-16 w-16 text-destructive" />
              <h2 className="text-2xl font-semibold text-destructive">Demo Not Configured</h2>
              <p className="text-muted-foreground max-w-md">
                  The <code className="bg-muted px-1.5 py-0.5 rounded-sm font-semibold text-accent">NEXT_PUBLIC_DEMO_USER_ID</code> environment variable is not set or is still using the placeholder value.
                  Please configure this in your <code className="bg-muted px-1.5 py-0.5 rounded-sm font-semibold text-accent">.env</code> file (and ensure it's not the placeholder <code className="bg-muted px-1.5 py-0.5 rounded-sm text-destructive">public-demo-user-id-placeholder</code>) and ensure corresponding data and Firestore rules exist to view the demo.
              </p>
               <Button asChild>
                  <NextLink href="/">Return to Homepage</NextLink>
              </Button>
          </div>
      );
  }


  return (
    <div className="space-y-8">
      <header className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-4xl font-bold tracking-tight text-primary glitch-text">Public Demo Dashboard</h1>
            <p className="text-muted-foreground mt-2 text-lg">
            This is a public demonstration of SpiteSpiral Tarpit activity.
            </p>
        </div>
      </header>

      <Alert variant="default" className="border-primary/20 bg-card/50 mb-6 shadow-lg">
        <Eye className="h-5 w-5 text-primary" />
        <AlertTitle className="text-primary">How This Demo Works</AlertTitle>
        <AlertDescription className="text-muted-foreground space-y-1">
          <p>The statistics you see on this page are generated by a real, live SpiteSpiral Tarpit!</p>
          <p>
            An invisible tracking pixel (an embed link like those provided to our users) is placed on the SpiteSpiral homepage.
            This pixel is designed to be ignored by human visitors but is followed by many automated web crawlers and bots.
          </p>
          <p>
            When bots access this link, their activity is logged and sent to our dashboard, just like it would be for a subscriber.
            The data is aggregated (approximately every 30 minutes) to show trends and totals.
          </p>
          <p>
            Crucially, this demo tarpit instance runs on separate, dedicated infrastructure—the same powerful infrastructure our users get.
            This means the bot activity it handles doesn't impact the performance of the main SpiteSpiral website.
          </p>
          <p>
            You can get your own isolated Tarpit instance to protect your website for a low monthly cost!
          </p>
        </AlertDescription>
      </Alert>

       <Alert variant="default" className="border-accent/20 bg-card/50 mb-6">
        <Info className="h-5 w-5 text-accent" />
        <AlertTitle className="text-accent">Data Refresh Notice</AlertTitle>
        <AlertDescription className="text-muted-foreground">
          Aggregated statistics (Unique Crawlers, Compute Wasted, Activity Chart) are based on summaries updated approximately every 30 minutes (by the backend). Active Tarpit Instances update in real-time. The dashboard itself refreshes these summarized stats from its cache or fetches new data if the cache is older than 30 minutes.
        </AlertDescription>
      </Alert>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-primary/30 shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Total Unique Crawlers (30-day approx. Demo)</CardTitle>
            <Users className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            {isLoadingDemoUniqueCrawlers ? (
              <Skeleton className="h-8 w-1/2" />
            ) : (
              <div className="text-3xl font-bold text-foreground">{demoUniqueCrawlersApproxCount ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Sum of unique IPs from 30-day demo summaries.</p>
          </CardContent>
        </Card>
        <Card className="border-accent/30 shadow-lg shadow-accent/10 hover:shadow-accent/20 transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-accent">Active Demo Tarpit Instances</CardTitle>
            <ShieldCheck className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoadingInstancesCount ? (
              <Skeleton className="h-8 w-1/2" />
            ) : (
              <div className="text-3xl font-bold text-foreground">{activeInstancesCount ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Currently configured managed URLs for demo.</p>
          </CardContent>
        </Card>
        <Card className="border-primary/30 shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Crawler Compute Wasted (30-day Demo)</CardTitle>
            <DollarSign className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoadingDemoWastedCompute ? (
              <Skeleton className="h-8 w-1/2" />
            ) : (
              <div className="text-3xl font-bold text-foreground">${demoWastedComputeCost ?? '0.0000'}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Illustrative cost based on total hits from 30-day demo summaries.</p>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="shadow-lg border-primary/20">
          <CardHeader>
            <CardTitle className="text-xl text-primary">Total Hits Over Time (Demo)</CardTitle>
            <CardDescription>Total tarpit hits recorded daily in the last 30 days for demo from activity summaries.</CardDescription>
          </CardHeader>
          <CardContent>
            {isDemoIdProperlyConfigured && <TrappedCrawlersChart userIdOverride={DEMO_USER_ID} />}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
    
