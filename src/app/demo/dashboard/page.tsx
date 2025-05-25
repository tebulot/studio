
'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import TrappedCrawlersChart from "@/components/dashboard/TrappedCrawlersChart";
import { ShieldCheck, Users, DollarSign, Info } from "lucide-react";
import { db } from "@/lib/firebase/clientApp";
import { collection, query, where, onSnapshot, getDocs, type DocumentData, type QuerySnapshot, type Timestamp } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import NextLink from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const DEMO_USER_ID = process.env.NEXT_PUBLIC_DEMO_USER_ID;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

interface TarpitLogForDemo {
  trappedBotIp: string;
  recursionDepth?: number;
  method?: string;
  timestamp: Timestamp; 
}

export default function DemoDashboardPage() {
  const { toast } = useToast();
  const [activeInstancesCount, setActiveInstancesCount] = useState<number | null>(null);
  const [isLoadingInstancesCount, setIsLoadingInstancesCount] = useState(true);
  
  const [demoUniqueCrawlersCount, setDemoUniqueCrawlersCount] = useState<number | null>(null);
  const [isLoadingDemoUniqueCrawlers, setIsLoadingDemoUniqueCrawlers] = useState(true);

  const [demoWastedComputeCost, setDemoWastedComputeCost] = useState<string | null>(null);
  const [isLoadingDemoWastedCompute, setIsLoadingDemoWastedCompute] = useState(true);

  const [isDemoIdConfigured, setIsDemoIdConfigured] = useState(false);

  // Listener for active demo instances count (remains onSnapshot)
  useEffect(() => {
    if (DEMO_USER_ID && DEMO_USER_ID !== "public-demo-user-id-placeholder") {
      setIsDemoIdConfigured(true);
      setIsLoadingInstancesCount(true);
      const instancesQuery = query(collection(db, "tarpit_configs"), where("userId", "==", DEMO_USER_ID));
      const unsubscribeInstances = onSnapshot(instancesQuery, (querySnapshot: QuerySnapshot<DocumentData>) => {
        setActiveInstancesCount(querySnapshot.size);
        setIsLoadingInstancesCount(false);
      }, (error) => {
        console.error("Error fetching demo active instances count:", error);
        toast({ title: "Error", description: "Could not fetch demo active tarpit instances.", variant: "destructive" });
        setActiveInstancesCount(0);
        setIsLoadingInstancesCount(false);
      });
      return () => unsubscribeInstances();
    } else {
      setActiveInstancesCount(0);
      setIsLoadingInstancesCount(false);
      setIsDemoIdConfigured(false);
    }
  }, [toast]);

  // One-time fetch for demo unique crawlers & wasted compute cost with caching
  useEffect(() => {
    if (DEMO_USER_ID && DEMO_USER_ID !== "public-demo-user-id-placeholder") {
      setIsDemoIdConfigured(true);
      
      const fetchDemoLogStats = async () => {
        setIsLoadingDemoUniqueCrawlers(true);
        setIsLoadingDemoWastedCompute(true);

        const cacheKeyBase = `spiteSpiral_logStats_${DEMO_USER_ID}`;
        const cachedCrawlersKey = `${cacheKeyBase}_uniqueCrawlers`;
        const cachedCostKey = `${cacheKeyBase}_wastedCompute`;
        const timestampKey = `${cacheKeyBase}_timestamp`;

        try {
          const cachedTimestampStr = localStorage.getItem(timestampKey);
          const cachedTimestamp = cachedTimestampStr ? parseInt(cachedTimestampStr, 10) : 0;

          if (Date.now() - cachedTimestamp < CACHE_DURATION) {
            const cachedCrawlers = localStorage.getItem(cachedCrawlersKey);
            const cachedCost = localStorage.getItem(cachedCostKey);
            if (cachedCrawlers !== null && cachedCost !== null) {
              setDemoUniqueCrawlersCount(JSON.parse(cachedCrawlers));
              setDemoWastedComputeCost(JSON.parse(cachedCost));
              setIsLoadingDemoUniqueCrawlers(false);
              setIsLoadingDemoWastedCompute(false);
              // console.log("Loaded demo log stats from cache for:", DEMO_USER_ID);
              return;
            }
          }
          // console.log("Fetching fresh demo log stats for:", DEMO_USER_ID);

          const logsQuery = query(collection(db, "tarpit_logs"), where("userId", "==", DEMO_USER_ID));
          const querySnapshot = await getDocs(logsQuery);

          const uniqueIps = new Set<string>();
          let totalCost = 0;

          querySnapshot.forEach((doc) => {
            const data = doc.data() as TarpitLogForDemo;
            if (data.trappedBotIp) {
              uniqueIps.add(data.trappedBotIp);
            }
            
            let entryCost = 0.0001;
            if (data.recursionDepth && typeof data.recursionDepth === 'number' && data.recursionDepth > 5) {
              entryCost += 0.0005;
            }
            if (data.method && typeof data.method === 'string' && data.method.toUpperCase() === 'POST') {
              entryCost += 0.00005;
            }
            totalCost += entryCost;
          });

          const currentUniqueCrawlers = uniqueIps.size;
          const currentWastedCost = totalCost.toFixed(4);

          setDemoUniqueCrawlersCount(currentUniqueCrawlers);
          setDemoWastedComputeCost(currentWastedCost);

          localStorage.setItem(cachedCrawlersKey, JSON.stringify(currentUniqueCrawlers));
          localStorage.setItem(cachedCostKey, JSON.stringify(currentWastedCost));
          localStorage.setItem(timestampKey, Date.now().toString());

        } catch (error) {
          console.error("Error fetching logs for demo dashboard stats:", error);
          toast({ title: "Error", description: "Could not fetch demo crawler statistics.", variant: "destructive" });
          setDemoUniqueCrawlersCount(0);
          setDemoWastedComputeCost("0.0000");
        } finally {
          setIsLoadingDemoUniqueCrawlers(false);
          setIsLoadingDemoWastedCompute(false);
        }
      };
      fetchDemoLogStats();
    } else {
      setDemoUniqueCrawlersCount(0);
      setDemoWastedComputeCost("0.0000");
      setIsLoadingDemoUniqueCrawlers(false);
      setIsLoadingDemoWastedCompute(false);
      setIsDemoIdConfigured(false);
    }
  }, [toast]);


  if (!DEMO_USER_ID || DEMO_USER_ID === "public-demo-user-id-placeholder") {
      if (!isLoadingInstancesCount && !isLoadingDemoUniqueCrawlers && !isLoadingDemoWastedCompute && !isDemoIdConfigured) {
        return (
            <div className="flex flex-col items-center justify-center text-center space-y-4 p-8 rounded-lg bg-card border border-destructive shadow-lg">
                <ShieldCheck className="h-16 w-16 text-destructive" />
                <h2 className="text-2xl font-semibold text-destructive">Demo Not Configured</h2>
                <p className="text-muted-foreground max-w-md">
                    The <code className="bg-muted px-1.5 py-0.5 rounded-sm font-semibold text-accent">NEXT_PUBLIC_DEMO_USER_ID</code> environment variable is not set or is still using the placeholder value.
                    Please configure this in your <code className="bg-muted px-1.5 py-0.5 rounded-sm font-semibold text-accent">.env</code> file and ensure the corresponding user and data exist in Firestore to view the demo.
                </p>
                 <Button asChild>
                    <NextLink href="/">Return to Homepage</NextLink>
                </Button>
            </div>
        );
      }
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

       <Alert variant="default" className="border-accent/20 bg-card/50 mb-6">
        <Info className="h-5 w-5 text-accent" />
        <AlertTitle className="text-accent">Data Refresh Notice</AlertTitle>
        <AlertDescription className="text-muted-foreground">
          Log-based statistics (Unique Crawlers, Compute Wasted, Activity Chart) refresh approximately every 30 minutes. Active Tarpit Instances update in real-time.
        </AlertDescription>
      </Alert>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-primary/30 shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Total Unique Crawlers Trapped (Demo)</CardTitle>
            <Users className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            {isLoadingDemoUniqueCrawlers ? (
              <Skeleton className="h-8 w-1/2" />
            ) : (
              <div className="text-3xl font-bold text-foreground">{demoUniqueCrawlersCount ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Distinct IP addresses logged for demo.</p>
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
            <CardTitle className="text-sm font-medium text-primary">Crawler Compute Wasted (Demo)</CardTitle>
            <DollarSign className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoadingDemoWastedCompute ? (
              <Skeleton className="h-8 w-1/2" />
            ) : (
              <div className="text-3xl font-bold text-foreground">${demoWastedComputeCost ?? '0.0000'}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Illustrative cost of resources wasted by crawlers on demo.</p>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="shadow-lg border-primary/20">
          <CardHeader>
            <CardTitle className="text-xl text-primary">Crawler Activity Over Time (Demo)</CardTitle>
            <CardDescription>Unique crawlers trapped daily in the last 30 days for demo.</CardDescription>
          </CardHeader>
          <CardContent>
            {DEMO_USER_ID && isDemoIdConfigured && <TrappedCrawlersChart userIdOverride={DEMO_USER_ID} />}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
