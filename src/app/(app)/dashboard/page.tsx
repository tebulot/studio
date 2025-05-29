
'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import TrappedCrawlersChart from "@/components/dashboard/TrappedCrawlersChart";
import { ShieldCheck, Users, DollarSign, Info, Fingerprint } from "lucide-react"; // Added Fingerprint
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase/clientApp";
import { collection, query, where, getDocs, type DocumentData, type QuerySnapshot, onSnapshot, Timestamp, orderBy } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { subDays, startOfDay } from "date-fns";

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

interface ActivitySummaryDocForDashboard {
  startTime: Timestamp;
  uniqueIpCount: number;
  totalHits: number;
  userId: string;
  uniqueUserAgentCount?: number;
  topUserAgents?: Array<{ userAgent: string; hits: number }>;
  topPathsHit?: Array<{ path: string; hits: number }>;
  topIPs?: Array<{ ip: string; hits: number }>;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [activeInstancesCount, setActiveInstancesCount] = useState<number | null>(null);
  const [isLoadingInstancesCount, setIsLoadingInstancesCount] = useState(true);

  const [uniqueCrawlersApproxCount, setUniqueCrawlersApproxCount] = useState<number | null>(null);
  const [isLoadingUniqueCrawlers, setIsLoadingUniqueCrawlers] = useState(true);

  const [wastedComputeCost, setWastedComputeCost] = useState<string | null>(null);
  const [isLoadingWastedCompute, setIsLoadingWastedCompute] = useState(true);

  const [summedUniqueUserAgentCount, setSummedUniqueUserAgentCount] = useState<number | null>(null);
  const [latestTopUserAgents, setLatestTopUserAgents] = useState<Array<{ userAgent: string; hits: number }> | null>(null);
  const [isLoadingUserAgentStats, setIsLoadingUserAgentStats] = useState(true);


  // Listener for active instances count (reads from tarpit_configs)
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

  // Fetch for unique crawlers approx. count, wasted compute cost & user agent stats from activity summaries with caching
  useEffect(() => {
    if (authLoading || !user) {
      setIsLoadingUniqueCrawlers(true);
      setIsLoadingWastedCompute(true);
      setIsLoadingUserAgentStats(true);
      if (!user && !authLoading) {
        setUniqueCrawlersApproxCount(0);
        setWastedComputeCost("0.0000");
        setSummedUniqueUserAgentCount(0);
        setLatestTopUserAgents([]);
      }
      return;
    }

    const fetchSummaryStats = async () => {
      setIsLoadingUniqueCrawlers(true);
      setIsLoadingWastedCompute(true);
      setIsLoadingUserAgentStats(true);

      const cacheKeyBase = `spiteSpiral_summaryStats_${user.uid}`;
      const cachedCrawlersKey = `${cacheKeyBase}_uniqueCrawlersApprox`;
      const cachedCostKey = `${cacheKeyBase}_wastedComputeSummary`;
      const cachedUACountKey = `${cacheKeyBase}_summedUACount`;
      const cachedTopUAKey = `${cacheKeyBase}_latestTopUA`;
      const timestampKey = `${cacheKeyBase}_timestamp`;
      const logPrefix = `DashboardPage (User: ${user.uid.substring(0,5)}...) - Summary Stats:`;

      try {
        const cachedTimestampStr = localStorage.getItem(timestampKey);
        const cachedTimestamp = cachedTimestampStr ? parseInt(cachedTimestampStr, 10) : 0;
        const now = Date.now();
        const cacheAge = now - cachedTimestamp;

        console.log(`${logPrefix} Cache check. Now: ${new Date(now).toISOString()}, Cached At: ${new Date(cachedTimestamp).toISOString()}, Age: ${cacheAge/1000}s, Max Age: ${CACHE_DURATION/1000}s`);

        if (cacheAge < CACHE_DURATION) {
          const cachedCrawlers = localStorage.getItem(cachedCrawlersKey);
          const cachedCost = localStorage.getItem(cachedCostKey);
          const cachedUACount = localStorage.getItem(cachedUACountKey);
          const cachedTopUA = localStorage.getItem(cachedTopUAKey);

          if (cachedCrawlers !== null && cachedCost !== null && cachedUACount !== null && cachedTopUA !== null) {
            console.log(`${logPrefix} Using cached data for all summary stats.`);
            setUniqueCrawlersApproxCount(JSON.parse(cachedCrawlers));
            setWastedComputeCost(JSON.parse(cachedCost));
            setSummedUniqueUserAgentCount(JSON.parse(cachedUACount));
            setLatestTopUserAgents(JSON.parse(cachedTopUA));
            setIsLoadingUniqueCrawlers(false);
            setIsLoadingWastedCompute(false);
            setIsLoadingUserAgentStats(false);
            return;
          } else {
            console.log(`${logPrefix} Cache valid by timestamp, but some data missing. Fetching fresh.`);
          }
        } else {
          console.log(`${logPrefix} Cache stale or not found. Fetching fresh data.`);
        }

        const thirtyDaysAgoDate = startOfDay(subDays(new Date(), 29));
        const summariesQuery = query(
          collection(db, "tarpit_activity_summaries"),
          where("userId", "==", user.uid),
          where("startTime", ">=", Timestamp.fromDate(thirtyDaysAgoDate)),
          orderBy("startTime", "asc")
        );
        const querySnapshot = await getDocs(summariesQuery);
        console.log(`${logPrefix} Fetched ${querySnapshot.size} summary documents from Firestore.`);

        let summedUniqueIpCount = 0;
        let totalHitsForCostCalc = 0;
        let currentSummedUACount = 0;
        let mostRecentSummaryTime = new Timestamp(0,0);
        let tempLatestTopUserAgents: Array<{ userAgent: string; hits: number }> | null = null;

        querySnapshot.forEach((doc) => {
          const data = doc.data() as ActivitySummaryDocForDashboard;
          if (data.uniqueIpCount) {
            summedUniqueIpCount += data.uniqueIpCount;
          }
          if (data.totalHits) {
            totalHitsForCostCalc += data.totalHits;
          }
          if (data.uniqueUserAgentCount) {
            currentSummedUACount += data.uniqueUserAgentCount;
          }
          if (data.startTime && data.startTime.toMillis() > mostRecentSummaryTime.toMillis()) {
            mostRecentSummaryTime = data.startTime;
            tempLatestTopUserAgents = data.topUserAgents || [];
          }
        });

        const currentWastedCost = (totalHitsForCostCalc * 0.0001).toFixed(4);

        console.log(`${logPrefix} Processed fresh data: UniqueIPsSum=${summedUniqueIpCount}, TotalHitsForCost=${totalHitsForCostCalc}, WastedCost=${currentWastedCost}, SummedUACount=${currentSummedUACount}`);
        setUniqueCrawlersApproxCount(summedUniqueIpCount);
        setWastedComputeCost(currentWastedCost);
        setSummedUniqueUserAgentCount(currentSummedUACount);
        setLatestTopUserAgents(tempLatestTopUserAgents || []);


        localStorage.setItem(cachedCrawlersKey, JSON.stringify(summedUniqueIpCount));
        localStorage.setItem(cachedCostKey, JSON.stringify(currentWastedCost));
        localStorage.setItem(cachedUACountKey, JSON.stringify(currentSummedUACount));
        localStorage.setItem(cachedTopUAKey, JSON.stringify(tempLatestTopUserAgents || []));
        localStorage.setItem(timestampKey, now.toString());
        console.log(`${logPrefix} Updated cache with fresh data.`);

      } catch (error) {
        console.error(`${logPrefix} Error fetching activity summaries:`, error);
        toast({ title: "Error", description: "Could not fetch crawler statistics from summaries.", variant: "destructive" });
        setUniqueCrawlersApproxCount(0);
        setWastedComputeCost("0.0000");
        setSummedUniqueUserAgentCount(0);
        setLatestTopUserAgents([]);
      } finally {
        setIsLoadingUniqueCrawlers(false);
        setIsLoadingWastedCompute(false);
        setIsLoadingUserAgentStats(false);
      }
    };

    fetchSummaryStats();
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
          Aggregated statistics (Unique Crawlers, Compute Wasted, Activity Chart, User Agents) are based on summaries updated approximately every 30 minutes (by the backend). The dashboard itself refreshes these summarized stats from its cache or fetches new data if the cache is older than 30 minutes.
        </AlertDescription>
      </Alert>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
        <Card className="border-primary/30 shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Total Unique Crawlers (30-day approx.)</CardTitle>
            <Users className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            {isLoadingUniqueCrawlers ? (
              <Skeleton className="h-8 w-1/2" />
            ) : (
              <div className="text-3xl font-bold text-foreground">{uniqueCrawlersApproxCount ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Sum of unique IPs from 30-day summaries.</p>
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
            <CardTitle className="text-sm font-medium text-primary">Crawler Compute Wasted (30-day)</CardTitle>
            <DollarSign className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoadingWastedCompute ? (
              <Skeleton className="h-8 w-1/2" />
            ) : (
              <div className="text-3xl font-bold text-foreground">${wastedComputeCost ?? '0.0000'}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Illustrative cost based on total hits from 30-day summaries.</p>
          </CardContent>
        </Card>
        <Card className="border-accent/30 shadow-lg shadow-accent/10 hover:shadow-accent/20 transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-accent">User Agent Activity (30-day)</CardTitle>
            <Fingerprint className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoadingUserAgentStats ? (
              <>
                <Skeleton className="h-6 w-3/4 mb-1" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6 mt-1" />
              </>
            ) : (
              <>
                <div className="text-md font-semibold text-foreground">
                  Approx. Unique Agents: {summedUniqueUserAgentCount ?? 0}
                </div>
                {latestTopUserAgents && latestTopUserAgents.length > 0 ? (
                  <>
                    <p className="text-xs text-muted-foreground mt-1 mb-0.5">Top Agents (from latest summary):</p>
                    <ul className="text-xs text-muted-foreground space-y-0.5 max-h-20 overflow-y-auto">
                      {latestTopUserAgents.slice(0, 3).map((ua, index) => ( // Show top 3 for brevity
                        <li key={index} className="truncate">
                          <span title={ua.userAgent}>{ua.userAgent}</span> ({ua.hits} hits)
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">No user agent data available in latest summary.</p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="shadow-lg border-primary/20">
          <CardHeader>
            <CardTitle className="text-xl text-primary">Total Hits Over Time</CardTitle>
            <CardDescription>Total tarpit hits recorded daily in the last 30 days from activity summaries.</CardDescription>
          </CardHeader>
          <CardContent>
            <TrappedCrawlersChart />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
