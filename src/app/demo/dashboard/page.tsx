
'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import TrappedCrawlersChart from "@/components/dashboard/TrappedCrawlersChart";
import { ShieldCheck, Users, DollarSign, Info, Eye, Fingerprint, Globe, ListFilter, BarChart3, Server, Activity } from "lucide-react"; // Removed FileText
import { db } from "@/lib/firebase/clientApp";
import { collection, query, where, onSnapshot, getDocs, type DocumentData, type QuerySnapshot, Timestamp, orderBy } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import NextLink from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { subDays, startOfDay, eachDayOfInterval, format, startOfHour, eachHourOfInterval, parseISO } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip } from "recharts";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

const DEMO_USER_ID = process.env.NEXT_PUBLIC_DEMO_USER_ID;
const DEMO_TARPIT_PATH_SEGMENT = process.env.NEXT_PUBLIC_DEMO_TARPIT_PATH_SEGMENT;
const DIRECT_TRAP_URL = "https://api.spitespiral.com/trap/b4b37b21-31b5-47f8-81a7-7a9f8a867911";

interface AnalyticsSummaryDocumentForDemo {
  id?: string;
  tarpitId: string;
  startTime: Timestamp;
  totalHits: number;
  uniqueIpCount: number;
  topCountries?: Array<{ item: string; hits: number }>;
  methodDistribution?: Record<string, number>;
  statusDistribution?: Record<string, number>;
  topPaths?: Array<{ item: string; hits: number }>; // Kept for data structure, but not displayed
  topIPs?: Array<{ item: string; hits: number }>;
  topUserAgents?: Array<{ item: string; hits: number }>;
}

interface AggregatedAnalyticsDataForDemo {
  totalHits: number;
  approxUniqueIpCount: number;
  topCountries: Array<{ country: string; hits: number }>;
  topIPs: Array<{ ip: string; hits: number }>;
  topUserAgents: Array<{ userAgent: string; hits: number }>;
  // topPaths: Array<{ path: string; hits: number }>; // Not needed in aggregated display
  methodDistribution: Record<string, number>;
  statusDistribution: Record<string, number>;
  summaryHitsOverTime?: Array<{ date: string; hits: number }>;
  activeInstances: number;
  illustrativeCost: string;
}

const HorizontalBarChartDemo = ({ data, nameKey, valueKey }: { data: any[], nameKey: string, valueKey: string }) => {
  if (!data || data.length === 0) return <p className="text-xs text-muted-foreground h-40 flex items-center justify-center">No data to display.</p>;
  const chartData = data.map(item => ({ name: item[nameKey], value: item[valueKey] })).slice(0, 5);
  return (
    <ResponsiveContainer width="100%" height={chartData.length * 35 + 40}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.3)" />
        <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10, width: 90, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} interval={0} stroke="hsl(var(--muted-foreground))" />
        <RechartsTooltip
          contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', fontSize: '12px' }}
          labelStyle={{ color: 'hsl(var(--popover-foreground))', fontWeight: 'bold' }}
          itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
          cursor={{ fill: 'hsl(var(--accent)/0.1)' }}
        />
        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
};


export default function DemoDashboardPage() {
  const { toast } = useToast();
  const [aggregatedDemoData, setAggregatedDemoData] = useState<AggregatedAnalyticsDataForDemo | null>(null);
  const [isLoadingDemoData, setIsLoadingDemoData] = useState(true);
  const [demoDataError, setDemoDataError] = useState<string | null>(null);
  const [isDemoConfigProperlySet, setIsDemoConfigProperlySet] = useState(false);

  useEffect(() => {
    const logPrefix = "DemoDashboardPage - Config Check:";
    // console.log(`${logPrefix} Using DEMO_USER_ID:`, DEMO_USER_ID);
    // console.log(`${logPrefix} Using DEMO_TARPIT_PATH_SEGMENT:`, DEMO_TARPIT_PATH_SEGMENT);

    if (DEMO_USER_ID && DEMO_USER_ID !== "public-demo-user-id-placeholder" &&
        DEMO_TARPIT_PATH_SEGMENT && DEMO_TARPIT_PATH_SEGMENT !== "your-demo-tarpit-path-segment-placeholder") {
      setIsDemoConfigProperlySet(true);
      // console.log(`${logPrefix} Demo User ID and Tarpit Path Segment are configured.`);
    } else {
      setIsDemoConfigProperlySet(false);
      setIsLoadingDemoData(false);
      let errorMsg = "";
      if (!DEMO_USER_ID || DEMO_USER_ID === "public-demo-user-id-placeholder") {
        errorMsg += "NEXT_PUBLIC_DEMO_USER_ID is not set or is placeholder. ";
        // console.error(`${logPrefix} NEXT_PUBLIC_DEMO_USER_ID missing or placeholder.`);
      }
      if (!DEMO_TARPIT_PATH_SEGMENT || DEMO_TARPIT_PATH_SEGMENT === "your-demo-tarpit-path-segment-placeholder") {
        errorMsg += "NEXT_PUBLIC_DEMO_TARPIT_PATH_SEGMENT is not set or is placeholder.";
        // console.error(`${logPrefix} NEXT_PUBLIC_DEMO_TARPIT_PATH_SEGMENT missing or placeholder.`);
      }
      setDemoDataError(errorMsg.trim());
    }
  }, []);

  useEffect(() => {
    if (!isDemoConfigProperlySet) return;

    const fetchAndAggregateDemoData = async () => {
      setIsLoadingDemoData(true);
      setDemoDataError(null);
      const logPrefix = `DemoDashboardPage (DEMO_TARPIT_PATH_SEGMENT: ${DEMO_TARPIT_PATH_SEGMENT ? DEMO_TARPIT_PATH_SEGMENT : 'N/A'}...) - Demo Data Fetch:`;

      // console.log(`${logPrefix} LocalStorage caching is TEMPORARILY DISABLED for debugging.`);

      try {
        let activeInstances = 0;
        if (DEMO_USER_ID) {
          try {
            // console.log(`${logPrefix} Fetching active instances for demo user ID: ${DEMO_USER_ID}`);
            const instancesQuery = query(collection(db, "tarpit_configs"), where("userId", "==", DEMO_USER_ID));
            const instancesSnapshot = await getDocs(instancesQuery);
            activeInstances = instancesSnapshot.size;
            // console.log(`${logPrefix} Fetched ${activeInstances} active instances for demo user.`);
          } catch (instanceError) {
              console.error(`${logPrefix} Error fetching demo active instances count:`, instanceError);
              toast({ title: "Error (Demo Instances)", description: `Could not fetch demo active tarpit instances. Error: ${instanceError instanceof Error ? instanceError.message : 'Unknown error'}`, variant: "destructive" });
          }
        } else {
          // console.warn(`${logPrefix} DEMO_USER_ID not set, cannot fetch active instances count.`);
        }

        const thirtyDaysAgoDate = startOfDay(subDays(new Date(), 29));
        // console.log(`${logPrefix} Fetching summaries with tarpitId: ${DEMO_TARPIT_PATH_SEGMENT} starting from ${thirtyDaysAgoDate.toISOString()}`);

        const summariesQuery = query(
          collection(db, "tarpit_analytics_summaries"),
          where("tarpitId", "==", DEMO_TARPIT_PATH_SEGMENT),
          where("startTime", ">=", Timestamp.fromDate(thirtyDaysAgoDate)),
          orderBy("startTime", "asc")
        );
        const querySnapshot = await getDocs(summariesQuery);
        // console.log(`${logPrefix} Firestore query for summaries returned ${querySnapshot.size} documents. Query details: tarpitId = ${DEMO_TARPIT_PATH_SEGMENT}, startTime >= ${thirtyDaysAgoDate.toISOString()}`);

        const allFetchedSummaries: AnalyticsSummaryDocumentForDemo[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // console.log(`${logPrefix} Summary doc ${doc.id} data:`, JSON.parse(JSON.stringify(data)));
          allFetchedSummaries.push({ id: doc.id, ...data } as AnalyticsSummaryDocumentForDemo);
        });

        if (allFetchedSummaries.length === 0) {
          // console.log(`${logPrefix} No summaries found for demo tarpit ID: ${DEMO_TARPIT_PATH_SEGMENT}.`);
          setAggregatedDemoData({
            totalHits: 0, approxUniqueIpCount: 0, topCountries: [], topIPs: [], topUserAgents: [],
            methodDistribution: {}, statusDistribution: {}, summaryHitsOverTime: [], activeInstances, illustrativeCost: "0.0000"
          });
          setIsLoadingDemoData(false);
          return;
        }

        const totalHits = allFetchedSummaries.reduce((sum, s) => sum + (s.totalHits || 0), 0);
        const approxUniqueIpCount = allFetchedSummaries.reduce((sum, s) => sum + (s.uniqueIpCount || 0), 0);

        const topCountries = aggregateTopList(allFetchedSummaries, "topCountries", "country");
        const topIPs = aggregateTopList(allFetchedSummaries, "topIPs", "ip");
        const topUserAgents = aggregateTopList(allFetchedSummaries, "topUserAgents", "userAgent", 10); // Fetch more for table
        // const topPaths = aggregateTopList(allFetchedSummaries, "topPaths", "path", 10); // Not displayed

        const methodDistribution = aggregateDistribution(allFetchedSummaries, "methodDistribution");
        const statusDistribution = aggregateDistribution(allFetchedSummaries, "statusDistribution");

        const hitsByInterval: { [key: string]: number } = {};
        const chartEndDate = new Date();
        const chartStartDate = subDays(chartEndDate, 29);
        const intervalPoints = eachDayOfInterval({ start: chartStartDate, end: chartEndDate });
        const aggregationFormat = 'yyyy-MM-dd';
        intervalPoints.forEach(point => { hitsByInterval[format(point, aggregationFormat)] = 0; });
        allFetchedSummaries.forEach(summary => {
            const summaryStartTime = summary.startTime.toDate();
            const intervalKey = format(startOfDay(summaryStartTime), aggregationFormat);
            if (hitsByInterval[intervalKey] !== undefined) { hitsByInterval[intervalKey] += summary.totalHits; }
        });
        const summaryHitsOverTimeData = intervalPoints.map(point => {
            const key = format(point, aggregationFormat);
            return { date: point.toISOString(), hits: hitsByInterval[key] || 0 };
        });

        const illustrativeCost = (totalHits * 0.0001).toFixed(4);

        const finalAggregatedData: AggregatedAnalyticsDataForDemo = {
            totalHits, approxUniqueIpCount, topCountries, topIPs, topUserAgents,
            methodDistribution, statusDistribution, summaryHitsOverTime: summaryHitsOverTimeData,
            activeInstances, illustrativeCost
        };

        setAggregatedDemoData(finalAggregatedData);
        // console.log(`${logPrefix} Processed fresh demo data. Not caching to localStorage during debug.`);

      } catch (error) {
        console.error(`${logPrefix} Error fetching or processing demo data:`, error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        setDemoDataError(errorMessage);
        toast({ title: "Error Fetching Demo Data", description: `Could not load demo analytics. ${errorMessage}`, variant: "destructive" });
      } finally {
        setIsLoadingDemoData(false);
      }
    };

    fetchAndAggregateDemoData();
  }, [isDemoConfigProperlySet, toast, DEMO_TARPIT_PATH_SEGMENT, DEMO_USER_ID]);


  if (!isDemoConfigProperlySet && !isLoadingDemoData) {
      return (
        <>
          <a href={DIRECT_TRAP_URL} rel="nofollow noopener noreferrer" aria-hidden="true" tabIndex={-1} style={{ opacity: 0.01, position: 'absolute', left: '-9999px', top: '-9999px', fontSize: '1px', color: 'transparent', width: '1px', height: '1px', overflow: 'hidden' }} title="SpiteSpiral Internal Data - Demo Dashboard Config Error">.</a>
          <div className="flex flex-col items-center justify-center text-center space-y-4 p-8 rounded-lg bg-card border border-destructive shadow-lg">
              <ShieldCheck className="h-16 w-16 text-destructive" />
              <h2 className="text-2xl font-semibold text-destructive">Demo Not Configured</h2>
              <p className="text-muted-foreground max-w-md">
                  The environment variables <code className="bg-muted px-1.5 py-0.5 rounded-sm font-semibold text-accent">NEXT_PUBLIC_DEMO_USER_ID</code> and/or <code className="bg-muted px-1.5 py-0.5 rounded-sm font-semibold text-accent">NEXT_PUBLIC_DEMO_TARPIT_PATH_SEGMENT</code> are not set or are still using placeholder values.
                  Please configure these in your <code className="bg-muted px-1.5 py-0.5 rounded-sm font-semibold text-accent">.env</code> file (e.g., <code className="bg-muted px-1 py-0.5 rounded text-xs">NEXT_PUBLIC_DEMO_TARPIT_PATH_SEGMENT="b4b37b21-31b5-47f8-81a7-7a9f8a867911"</code>) and ensure corresponding data and Firestore rules exist.
                  <br/><br/>Current error: {demoDataError || "Configuration variables missing."}
              </p>
               <Button asChild>
                  <NextLink href="/">Return to Homepage</NextLink>
              </Button>
          </div>
        </>
      );
  }

  if (isLoadingDemoData) {
     return (
        <>
            <a href={DIRECT_TRAP_URL} rel="nofollow noopener noreferrer" aria-hidden="true" tabIndex={-1} style={{ opacity: 0.01, position: 'absolute', left: '-9999px', top: '-9999px', fontSize: '1px', color: 'transparent', width: '1px', height: '1px', overflow: 'hidden' }} title="SpiteSpiral Internal Data - Demo Dashboard Loading">.</a>
            <div className="space-y-8">
                <header className="mb-10"><Skeleton className="h-10 w-3/4" /><Skeleton className="h-6 w-1/2 mt-2" /></header>
                <Alert className="border-primary/20 bg-card/50 mb-6 shadow-lg"><Skeleton className="h-24 w-full" /></Alert>
                <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
                    {[...Array(4)].map((_,i) => <Skeleton key={i} className="h-32 w-full" />)}
                </section>
                <Separator className="my-8 border-primary/20" />
                 <h2 className="text-2xl font-semibold text-primary mt-8 mb-4"><Skeleton className="h-8 w-1/2"/></h2>
                 <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                    {[...Array(4)].map((_,i) => <Skeleton key={i} className="h-48 w-full" />)}
                </section>
                <Separator className="my-8 border-primary/20" />
                <section><Skeleton className="h-80 w-full" /></section> {/* User Agent Table Skeleton */}
                <Separator className="my-8 border-primary/20" />
                <section><Skeleton className="h-96 w-full" /></section> {/* Hits Over Time Chart Skeleton */}
            </div>
        </>
     )
  }

  if (demoDataError && !aggregatedDemoData) {
      return (
           <>
            <a href={DIRECT_TRAP_URL} rel="nofollow noopener noreferrer" aria-hidden="true" tabIndex={-1} style={{ opacity: 0.01, position: 'absolute', left: '-9999px', top: '-9999px', fontSize: '1px', color: 'transparent', width: '1px', height: '1px', overflow: 'hidden' }} title="SpiteSpiral Internal Data - Demo Dashboard Error">.</a>
            <Alert variant="destructive">
                <ShieldCheck className="h-5 w-5" />
                <AlertTitle>Error Loading Demo Data</AlertTitle>
                <AlertDescription>{demoDataError}</AlertDescription>
            </Alert>
           </>
      );
  }


  return (
    <>
      <a href={DIRECT_TRAP_URL} rel="nofollow noopener noreferrer" aria-hidden="true" tabIndex={-1} style={{ opacity: 0.01, position: 'absolute', left: '-9999px', top: '-9999px', fontSize: '1px', color: 'transparent', width: '1px', height: '1px', overflow: 'hidden' }} title="SpiteSpiral Internal Data - Demo Dashboard">.</a>
      <div className="space-y-8">
        <header className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
              <h1 className="text-4xl font-bold tracking-tight text-primary glitch-text">Public Demo Dashboard</h1>
              <p className="text-muted-foreground mt-2 text-lg">
              Public demonstration of SpiteSpiral Tarpit activity (data from last 30 days).
              </p>
          </div>
        </header>

        <Alert variant="default" className="border-primary/20 bg-card/50 mb-6 shadow-lg">
          <Eye className="h-5 w-5 text-primary" />
          <AlertTitle className="text-primary">How This Demo Works</AlertTitle>
          <AlertDescription className="text-muted-foreground space-y-1">
           <p>
              The statistics on this page are sourced from a live SpiteSpiral Tarpit instance. This demo showcases data aggregated from activity summaries generated for this specific demo tarpit over the last 30 days. The 'Active Instances' count reflects configurations specific to the demo account.
            </p>
          </AlertDescription>
        </Alert>
        <Alert variant="default" className="border-accent/20 bg-card/50 mb-6">
          <Info className="h-5 w-5 text-accent" />
          <AlertTitle className="text-accent">Data Refresh Notice</AlertTitle>
          <AlertDescription className="text-muted-foreground">
            Aggregated statistics are based on summaries updated by the backend. This dashboard fetches these summarized stats. Caching is currently disabled for debugging.
          </AlertDescription>
        </Alert>

        <h2 className="text-2xl font-semibold text-primary mt-8 mb-4">Key Metrics (Last 30 Days Demo Summary)</h2>
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
            <Card className="border-primary/30 shadow-lg"><CardHeader className="pb-2"><div className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary" /><CardTitle className="text-md font-medium text-primary">Total Hits</CardTitle></div></CardHeader><CardContent><div className="text-3xl font-bold text-foreground">{aggregatedDemoData?.totalHits ?? 0}</div><p className="text-xs text-muted-foreground mt-1">Across demo tarpits.</p></CardContent></Card>
            <Card className="border-accent/30 shadow-lg"><CardHeader className="pb-2"><div className="flex items-center gap-2"><Users className="h-5 w-5 text-accent" /><CardTitle className="text-md font-medium text-accent">Approx. Unique IPs</CardTitle></div></CardHeader><CardContent><div className="text-3xl font-bold text-foreground">{aggregatedDemoData?.approxUniqueIpCount ?? 0}</div><p className="text-xs text-muted-foreground mt-1">Sum from summaries.</p></CardContent></Card>
            <Card className="border-primary/30 shadow-lg"><CardHeader className="pb-2"><div className="flex items-center gap-1.5"><CardTitle className="text-sm font-medium text-primary">Illustrative Compute Wasted</CardTitle><TooltipProvider><Tooltip delayDuration={100}><TooltipTrigger asChild><Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent><p className="text-xs">Each hit contributes $0.0001.</p></TooltipContent></Tooltip></TooltipProvider></div><DollarSign className="h-6 w-6 text-primary" /></CardHeader><CardContent><div className="text-3xl font-bold text-foreground">${aggregatedDemoData?.illustrativeCost ?? '0.0000'}</div><p className="text-xs text-muted-foreground mt-1">Based on total hits.</p></CardContent></Card>
            <Card className="border-accent/30 shadow-lg"><CardHeader className="pb-2"><div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /><CardTitle className="text-md font-medium text-accent">Active Demo Instances</CardTitle></div></CardHeader><CardContent><div className="text-3xl font-bold text-foreground">{aggregatedDemoData?.activeInstances ?? 0}</div><p className="text-xs text-muted-foreground mt-1">Configured for demo account.</p></CardContent></Card>
        </section>

        <Separator className="my-8 border-primary/20" />
        <h2 className="text-2xl font-semibold text-primary mt-8 mb-4">Aggregated Analytics (Last 30 Days Demo Summary)</h2>
        {aggregatedDemoData && aggregatedDemoData.totalHits > 0 ? (
          <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
              <Card className="border-accent/30 shadow-lg">
                  <CardHeader><div className="flex items-center gap-2"><Globe className="h-5 w-5 text-accent" /><CardTitle className="text-md font-medium text-accent">Activity by Country</CardTitle></div></CardHeader>
                  <CardContent className="min-h-[200px]">
                    {aggregatedDemoData?.topCountries && aggregatedDemoData.topCountries.length > 0 ? <HorizontalBarChartDemo data={aggregatedDemoData.topCountries} nameKey="country" valueKey="hits" /> : <p className="text-xs text-muted-foreground">No country data.</p>}
                  </CardContent>
              </Card>
              <Card className="border-primary/30 shadow-lg">
                  <CardHeader><div className="flex items-center gap-2"><Fingerprint className="h-5 w-5 text-primary" /><CardTitle className="text-md font-medium text-primary">IP Activity</CardTitle></div></CardHeader>
                  <CardContent className="min-h-[200px]">
                      {aggregatedDemoData?.topIPs && aggregatedDemoData.topIPs.length > 0 ? <HorizontalBarChartDemo data={aggregatedDemoData.topIPs} nameKey="ip" valueKey="hits" /> : <p className="text-xs text-muted-foreground">No IP data.</p>}
                  </CardContent>
              </Card>
              <Card className="border-accent/30 shadow-lg">
                  <CardHeader><div className="flex items-center gap-2"><Server className="h-5 w-5 text-accent" /><CardTitle className="text-md font-medium text-accent">HTTP Method Distribution</CardTitle></div></CardHeader>
                  <CardContent className="min-h-[150px]">
                    {aggregatedDemoData?.methodDistribution && Object.keys(aggregatedDemoData.methodDistribution).length > 0 ? (
                      <ul className="space-y-1 text-xs text-muted-foreground">{Object.entries(aggregatedDemoData.methodDistribution).sort(([,a],[,b])=>b-a).slice(0,5).map(([k,v],i) => <li key={i} className="flex justify-between"><span className="truncate max-w-[60%]">{k}</span> <span className="font-semibold">{v} hits</span></li>)}</ul>
                    ) : <p className="text-xs text-muted-foreground">No method data.</p>}
                  </CardContent>
              </Card>
              <Card className="border-primary/30 shadow-lg">
                  <CardHeader><div className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /><CardTitle className="text-md font-medium text-primary">HTTP Status Code Distribution</CardTitle></div></CardHeader>
                  <CardContent className="min-h-[150px]">
                      {aggregatedDemoData?.statusDistribution && Object.keys(aggregatedDemoData.statusDistribution).length > 0 ? (
                        <ul className="space-y-1 text-xs text-muted-foreground">{Object.entries(aggregatedDemoData.statusDistribution).sort(([,a],[,b])=>b-a).slice(0,5).map(([k,v],i) => <li key={i} className="flex justify-between"><span className="truncate max-w-[60%]">{k}</span> <span className="font-semibold">{v} hits</span></li>)}</ul>
                      ) : <p className="text-xs text-muted-foreground">No status data.</p>}
                  </CardContent>
              </Card>
          </section>
        ) : (
           <p className="text-muted-foreground text-center py-4">No demo summary data available to display, or no hits recorded.</p>
        )}

        <Separator className="my-8 border-primary/20" />
        <h2 className="text-2xl font-semibold text-primary mt-8 mb-4">Top User Agent Activity (Demo - Last 30 Days)</h2>
        <Card className="shadow-lg border-accent/20">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <ListFilter className="h-6 w-6 text-accent" />
                    <CardTitle className="text-xl text-accent">Top User Agent Activity</CardTitle>
                </div>
                <CardDescription>
                    User agents with the most hits to the demo tarpit in the last 30 days. (Illustrative demo data)
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoadingDemoData ? (
                     <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
                ) : demoDataError ? (
                    <p className="text-xs text-destructive text-center py-4">{demoDataError}</p>
                ) : !aggregatedDemoData?.topUserAgents || aggregatedDemoData.topUserAgents.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No User Agent data available for this period.</p>
                ) : (
                    <ScrollArea className="h-[300px] rounded-md border border-border">
                        <Table>
                            <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
                                <TableRow>
                                    <TableHead className="text-accent">User Agent String</TableHead>
                                    <TableHead className="text-accent text-right w-[100px]">Hits</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {aggregatedDemoData.topUserAgents.slice(0, 5).map((ua, index) => (
                                    <TableRow key={index} className="hover:bg-muted/30">
                                        <TableCell className="text-xs text-muted-foreground max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl truncate">
                                            <TooltipProvider delayDuration={150}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <span className="cursor-help">{ua.userAgent}</span>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="bg-popover text-popover-foreground border-primary/50 max-w-2xl p-3">
                                                        <p className="text-xs whitespace-pre-wrap break-all">{ua.userAgent}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </TableCell>
                                        <TableCell className="text-right font-semibold text-foreground/90">{ua.hits}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>

        <Separator className="my-8 border-primary/20" />
        <section>
          <Card className="shadow-lg border-primary/20">
            <CardHeader>
              <CardTitle className="text-xl text-primary">Total Hits Over Time (Demo - Last 30 Days)</CardTitle>
              <CardDescription>Total tarpit hits recorded daily from demo activity summaries.</CardDescription>
            </CardHeader>
            <CardContent>
              {isDemoConfigProperlySet &&
                <TrappedCrawlersChart
                    apiLogs={[]}
                    summaryHitsOverTime={aggregatedDemoData?.summaryHitsOverTime}
                    isLoading={isLoadingDemoData}
                    selectedRangeHours={30*24}
                    tier="window"
                />
              }
            </CardContent>
          </Card>
        </section>
        <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: '-9999px', opacity: 0, width: '1px', height: '1px', overflow: 'hidden' }}>
          <a href="/sneedsfeedandseed/" title="Internal Archive Redirect - Demo Dashboard" style={{ fontSize: '1px', color: 'transparent', display: 'inline-block' }}>.</a>
        </div>
      </div>
    </>
  );
}

function aggregateTopList(
  summaries: AnalyticsSummaryDocumentForDemo[],
  sourceArrayKey: "topCountries" | "topIPs" | "topUserAgents" | "topPaths",
  outputNameKey: string,
  limit: number = 5
): Array<{ [key: string]: string | number } & { hits: number }> {
  const counts: Record<string, number> = {};
  summaries.forEach(summary => {
    const list = summary[sourceArrayKey] as Array<{ item: string; hits: number }> | undefined;
    list?.forEach(subItem => {
      counts[subItem.item] = (counts[subItem.item] || 0) + subItem.hits;
    });
  });
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([val, hits]) => ({ [outputNameKey]: val, hits }));
}

function aggregateDistribution(
  summaries: AnalyticsSummaryDocumentForDemo[],
  keyField: "methodDistribution" | "statusDistribution"
): Record<string, number> {
  const totalDistribution: Record<string, number> = {};
  summaries.forEach(summary => {
    const dist = summary[keyField];
    if (dist) {
      for (const key in dist) {
        totalDistribution[key] = (totalDistribution[key] || 0) + dist[key];
      }
    }
  });
  return totalDistribution;
}

