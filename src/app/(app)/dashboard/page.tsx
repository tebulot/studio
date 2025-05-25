
'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import TrappedCrawlersChart from "@/components/dashboard/TrappedCrawlersChart";
import { ShieldCheck, Users, DollarSign, Info } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase/clientApp";
import { collection, query, where, getDocs, type DocumentData, type QuerySnapshot, onSnapshot } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [activeInstancesCount, setActiveInstancesCount] = useState<number | null>(null);
  const [isLoadingInstancesCount, setIsLoadingInstancesCount] = useState(true);

  const [uniqueCrawlersCount, setUniqueCrawlersCount] = useState<number | null>(null);
  const [isLoadingUniqueCrawlers, setIsLoadingUniqueCrawlers] = useState(true);

  const [wastedComputeCost, setWastedComputeCost] = useState<string | null>(null);
  const [isLoadingWastedCompute, setIsLoadingWastedCompute] = useState(true);

  // Listener for active instances count (remains onSnapshot for responsiveness)
  useEffect(() => {
    if (authLoading) {
      setIsLoadingInstancesCount(true);
      return;
    }
    if (user) {
      setIsLoadingInstancesCount(true);
      const instancesQuery = query(collection(db, "tarpit_configs"), where("userId", "==", user.uid));
      const unsubscribeInstances = onSnapshot(instancesQuery, (querySnapshot: QuerySnapshot<DocumentData>) => {
        setActiveInstancesCount(querySnapshot.size);
        setIsLoadingInstancesCount(false);
      }, (error) => {
        console.error("Error fetching active instances count:", error);
        toast({ title: "Error", description: "Could not fetch active tarpit instances.", variant: "destructive" });
        setActiveInstancesCount(0);
        setIsLoadingInstancesCount(false);
      });
      return () => unsubscribeInstances();
    } else {
      setActiveInstancesCount(0);
      setIsLoadingInstancesCount(false);
    }
  }, [user, authLoading, toast]);

  // Fetch for unique crawlers count & wasted compute cost with caching
  useEffect(() => {
    if (authLoading || !user) {
      setIsLoadingUniqueCrawlers(true);
      setIsLoadingWastedCompute(true);
      if (!user && !authLoading) {
        setUniqueCrawlersCount(0);
        setWastedComputeCost("0.0000");
      }
      return;
    }

    const fetchLogStats = async () => {
      setIsLoadingUniqueCrawlers(true);
      setIsLoadingWastedCompute(true);

      const cacheKeyBase = `spiteSpiral_logStats_${user.uid}`;
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
            setUniqueCrawlersCount(JSON.parse(cachedCrawlers));
            setWastedComputeCost(JSON.parse(cachedCost));
            setIsLoadingUniqueCrawlers(false);
            setIsLoadingWastedCompute(false);
            // console.log("Loaded log stats from cache for user:", user.uid);
            return;
          }
        }
        // console.log("Fetching fresh log stats for user:", user.uid);

        const logsQuery = query(collection(db, "tarpit_logs"), where("userId", "==", user.uid));
        const querySnapshot = await getDocs(logsQuery);

        const uniqueIps = new Set<string>();
        let totalCost = 0;

        querySnapshot.forEach((doc) => {
          const data = doc.data();
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

        setUniqueCrawlersCount(currentUniqueCrawlers);
        setWastedComputeCost(currentWastedCost);

        localStorage.setItem(cachedCrawlersKey, JSON.stringify(currentUniqueCrawlers));
        localStorage.setItem(cachedCostKey, JSON.stringify(currentWastedCost));
        localStorage.setItem(timestampKey, Date.now().toString());

      } catch (error) {
        console.error("Error fetching logs for dashboard stats:", error);
        toast({ title: "Error", description: "Could not fetch crawler statistics.", variant: "destructive" });
        setUniqueCrawlersCount(0);
        setWastedComputeCost("0.0000");
      } finally {
        setIsLoadingUniqueCrawlers(false);
        setIsLoadingWastedCompute(false);
      }
    };

    fetchLogStats();
  }, [user, authLoading, toast]);


  return (
    <div className="space-y-8">
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-primary glitch-text">Dashboard</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Overview of your SpiteSpiral Tarpit activity and performance.
        </p>
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
            <CardTitle className="text-sm font-medium text-primary">Total Unique Crawlers Trapped</CardTitle>
            <Users className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            {isLoadingUniqueCrawlers ? (
              <Skeleton className="h-8 w-1/2" />
            ) : (
              <div className="text-3xl font-bold text-foreground">{uniqueCrawlersCount ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Distinct IP addresses logged</p> 
          </CardContent>
        </Card>
        <Card className="border-accent/30 shadow-lg shadow-accent/10 hover:shadow-accent/20 transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-accent">Active Tarpit Instances</CardTitle>
            <ShieldCheck className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoadingInstancesCount ? (
              <Skeleton className="h-8 w-1/2" />
            ) : (
              <div className="text-3xl font-bold text-foreground">{activeInstancesCount ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Currently configured managed URLs</p>
          </CardContent>
        </Card>
        <Card className="border-primary/30 shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Crawler Compute Wasted</CardTitle>
            <DollarSign className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoadingWastedCompute ? (
              <Skeleton className="h-8 w-1/2" />
            ) : (
              <div className="text-3xl font-bold text-foreground">${wastedComputeCost ?? '0.0000'}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Illustrative cost of resources wasted by crawlers.</p>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="shadow-lg border-primary/20">
          <CardHeader>
            <CardTitle className="text-xl text-primary">Crawler Activity Over Time</CardTitle>
            <CardDescription>Unique crawlers trapped daily in the last 30 days.</CardDescription>
          </CardHeader>
          <CardContent>
            <TrappedCrawlersChart />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
