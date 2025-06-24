
'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import TrappedCrawlersChart from "@/components/dashboard/TrappedCrawlersChart";
import { ShieldCheck, Users, DollarSign, Info, Eye, Fingerprint, Globe, ListFilter, BarChart3, Server, Activity, Network } from "lucide-react"; // Removed MapIcon
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
const DEMO_TARPIT_INSTANCE_ID = "a218a364-aec0-4e17-a218-321d59dd29d2";
const DIRECT_TRAP_URL = `https://api.spitespiral.com/trap/${DEMO_TARPIT_INSTANCE_ID}`;

interface AnalyticsSummaryDocumentForDemo {
  id?: string;
  tarpitId: string;
  userId?: string;
  startTime: Timestamp;
  totalHits: number;
  uniqueIpCount: number;
  topCountries?: Array<{ item: string; hits: number }>;
  methodDistribution?: Record<string, number>;
  statusDistribution?: Record<string, number>;
  topIPs?: Array<{ item: string; hits: number; asn?: string }>;
  topUserAgents?: Array<{ item: string; hits: number }>;
  topASNs?: Array<{ item: string; hits: number; name?: string; }>;
}

interface AggregatedAnalyticsDataForDemo {
  totalHits: number;
  approxUniqueIpCount: number;
  topCountries: Array<{ country: string; hits: number }>;
  topIPs: Array<{ ip: string; hits: number; asn?: string }>;
  topUserAgents: Array<{ userAgent: string; hits: number }>;
  methodDistribution: Record<string, number>;
  statusDistribution: Record<string, number>;
  topASNs: Array<{ asn: string; hits: number; name?: string; }>;
  summaryHitsOverTime?: Array<{ date: string; hits: number }>;
  activeInstances: number;
  illustrativeCost: string;
}

const HorizontalBarChartDemo = ({ data, nameKey, valueKey, detailKey }: { data: any[], nameKey: string, valueKey: string, detailKey?: string }) => {
  if (!data || data.length === 0) return <p className="text-xs text-muted-foreground h-40 flex items-center justify-center">No data to display.</p>;
  
  const chartData = data.map(item => ({
    name: item[nameKey] + (detailKey && item[detailKey] ? ` (${item[detailKey]})` : ''),
    value: item[valueKey]
  })).slice(0, 5);

  return (
    <ResponsiveContainer width="100%" height={chartData.length * 45 + 40}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 100, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.3)" />
        <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
        <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 10, width: 140, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} interval={0} stroke="hsl(var(--muted-foreground))" />
        <RechartsTooltip
          contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', fontSize: '12px' }}
          labelStyle={{ color: 'hsl(var(--popover-foreground))', fontWeight: 'bold' }}
          itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
          cursor={{ fill: 'hsl(var(--accent)/0.1)' }}
          formatter={(value, name, props) => {
            const originalName = props.payload.name;
            return [value, originalName];
          }}
        />
        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={25} />
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
    if (DEMO_USER_ID && DEMO_USER_ID !== "public-demo-user-id-placeholder" && DEMO_TARPIT_INSTANCE_ID) {
      console.log(`${logPrefix} NEXT_PUBLIC_DEMO_USER_ID (for demo account features like 'Active Instances') is set to: ${DEMO_USER_ID}`);
      console.log(`${logPrefix} DEMO_TARPIT_INSTANCE_ID (for analytics summaries) is set to: ${DEMO_TARPIT_INSTANCE_ID}`);
      setIsDemoConfigProperlySet(true);
    } else {
      setIsDemoConfigProperlySet(false);
      setIsLoadingDemoData(false);
      let errorMsg = "";
      if (!DEMO_USER_ID || DEMO_USER_ID === "public-demo-user-id-placeholder") {
        errorMsg += "NEXT_PUBLIC_DEMO_USER_ID is not set or is placeholder. ";
        console.error(`${logPrefix} Error: NEXT_PUBLIC_DEMO_USER_ID is not set or is placeholder.`);
      }
      if (!DEMO_TARPIT_INSTANCE_ID) {
         errorMsg += "DEMO_TARPIT_INSTANCE_ID is not set. This is hardcoded for the demo. ";
         console.error(`${logPrefix} Error: DEMO_TARPIT_INSTANCE_ID is not set.`);
      }
      setDemoDataError(errorMsg.trim() || "Demo configuration incomplete.");
    }
  }, []);

  useEffect(() => {
    if (!isDemoConfigProperlySet) return;

    const fetchAndAggregateDemoData = async () => {
      setIsLoadingDemoData(true);
      setDemoDataError(null);
      const logPrefix = `DemoDashboardPage (DEMO_USER_ID: ${DEMO_USER_ID}, Demo Tarpit ID for Analytics: ${DEMO_TARPIT_INSTANCE_ID}) - Demo Data Fetch:`;
      console.log(`${logPrefix} Starting fetch.`);

      try {
        let activeInstances = 0;
        if (DEMO_USER_ID) { 
          try {
            const instancesQuery = query(collection(db, "tarpit_configs"), where("userId", "==", DEMO_USER_ID));
            const instancesSnapshot = await getDocs(instancesQuery);
            activeInstances = instancesSnapshot.size;
            console.log(`${logPrefix} Fetched ${activeInstances} active demo instances for demo user ${DEMO_USER_ID}.`);
          } catch (instanceError) {
              console.error(`${logPrefix} Error fetching demo active instances count for user ${DEMO_USER_ID}:`, instanceError);
              toast({ title: "Error (Demo Instances)", description: `Could not fetch demo active tarpit instances. Error: ${instanceError instanceof Error ? instanceError.message : 'Unknown error'}`, variant: "destructive" });
          }
        }

        const thirtyDaysAgoDate = startOfDay(subDays(new Date(), 29));
        console.log(`${logPrefix} Querying summaries for tarpitId: "${DEMO_TARPIT_INSTANCE_ID}" and startTime >= ${thirtyDaysAgoDate.toISOString()}`);
        
        const summariesQuery = query(
          collection(db, "tarpit_analytics_summaries"),
          where("tarpitId", "==", DEMO_TARPIT_INSTANCE_ID),
          where("startTime", ">=", Timestamp.fromDate(thirtyDaysAgoDate)),
          orderBy("startTime", "asc")
        );
        const querySnapshot = await getDocs(summariesQuery);
        console.log(`${logPrefix} Fetched ${querySnapshot.size} summary documents for tarpitId "${DEMO_TARPIT_INSTANCE_ID}".`);

        const allFetchedSummaries: AnalyticsSummaryDocumentForDemo[] = [];
        querySnapshot.forEach((doc) => {
          allFetchedSummaries.push({ id: doc.id, ...doc.data() } as AnalyticsSummaryDocumentForDemo);
        });

        if (allFetchedSummaries.length === 0) {
          console.log(`${logPrefix} No summary documents found for the criteria.`);
          setAggregatedDemoData({
            totalHits: 0, approxUniqueIpCount: 0, topCountries: [], topIPs: [], topUserAgents: [],
            methodDistribution: {}, statusDistribution: {}, topASNs: [], 
            summaryHitsOverTime: [], activeInstances, illustrativeCost: "0.0000"
          });
          setIsLoadingDemoData(false);
          return;
        }

        const totalHits = allFetchedSummaries.reduce((sum, s) => sum + (s.totalHits || 0), 0);
        const approxUniqueIpCount = allFetchedSummaries.reduce((sum, s) => sum + (s.uniqueIpCount || 0), 0);

        const topCountries = aggregateTopListDemo(allFetchedSummaries, "topCountries", "country");
        const topIPs = aggregateTopListDemo(allFetchedSummaries, "topIPs", "ip");
        const topASNs = aggregateTopListDemo(allFetchedSummaries, "topASNs", "asn");
        const topUserAgents = aggregateTopListDemo(allFetchedSummaries, "topUserAgents", "userAgent", 10);

        const methodDistribution = aggregateDistributionDemo(allFetchedSummaries, "methodDistribution");
        const statusDistribution = aggregateDistributionDemo(allFetchedSummaries, "statusDistribution");

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
            totalHits, approxUniqueIpCount, topCountries, topIPs, topASNs, topUserAgents,
            methodDistribution, statusDistribution, summaryHitsOverTime: summaryHitsOverTimeData,
            activeInstances, illustrativeCost
        };

        setAggregatedDemoData(finalAggregatedData);
        console.log(`${logPrefix} Successfully processed and aggregated ${allFetchedSummaries.length} summaries. Final data:`, finalAggregatedData);

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
  }, [isDemoConfigProperlySet, toast]);


  if (!isDemoConfigProperlySet && !isLoadingDemoData) {
      return (
        <>
          <a href={DIRECT_TRAP_URL} rel="nofollow noopener noreferrer" aria-hidden="true" tabIndex={-1} style={{ opacity: 0.01, position: 'absolute', left: '-9999px', top: '-9999px', fontSize: '1px', color: 'transparent', width: '1px', height: '1px', overflow: 'hidden' }} title="SpiteSpiral Internal Data - Demo Dashboard Config Error">.</a>
          <div className="flex flex-col items-center justify-center text-center space-y-4 p-8 rounded-lg bg-card border border-destructive shadow-lg">
              <ShieldCheck className="h-16 w-16 text-destructive" />
              <h2 className="text-2xl font-semibold text-destructive">Demo Not Configured</h2>
              <p className="text-muted-foreground max-w-md">
                  One or more demo environment variables (like <code className="bg-muted px-1.5 py-0.5 rounded-sm font-semibold text-accent">NEXT_PUBLIC_DEMO_USER_ID</code>) are not set correctly.
                  Please configure these in your <code className="bg-muted px-1.5 py-0.5 rounded-sm font-semibold text-accent">.env</code> file.
                  The demo analytics are for tarpit instance <code className="bg-muted px-1.5 py-0.5 rounded-sm font-semibold text-accent">{DEMO_TARPIT_INSTANCE_ID}</code>.
                  <br/><br/>Current error: {demoDataError || "Configuration missing."}
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
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                </section>
                <Separator className="my-8 border-primary/20" />
                <section><Skeleton className="h-80 w-full" /></section>
                <Separator className="my-8 border-primary/20" />
                <section><Skeleton className="h-96 w-full" /></section>
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
              Public demonstration of SpiteSpiral Nightmare v2 Tarpit activity (data from last 30 days).
              </p>
          </div>
        </header>

        <Alert variant="default" className="border-primary/20 bg-card/50 mb-6 shadow-lg">
          <Eye className="h-5 w-5 text-primary" />
          <AlertTitle className="text-primary">How This Demo Works</AlertTitle>
          <AlertDescription className="text-muted-foreground space-y-1">
             <p>
              The statistics on this page showcase live data from a SpiteSpiral Nightmare v2 Tarpit.
              This demo reflects real activity aggregated from our public demonstration tarpit,
              which is actively embedded and collecting data. You can see how it captures and
              analyzes interactions, including IP intelligence with ASN (network provider) data
              for enhanced threat assessment. This provides a glimpse into the insights you&apos;d
              get for your own configured tarpits.
            </p>
          </AlertDescription>
        </Alert>
        <Alert variant="default" className="border-accent/20 bg-card/50 mb-6">
          <Info className="h-5 w-5 text-accent" />
          <AlertTitle className="text-accent">Data Refresh Notice</AlertTitle>
          <AlertDescription className="text-muted-foreground">
            Aggregated statistics are based on summaries updated by the backend. This dashboard fetches these summarized stats.
          </AlertDescription>
        </Alert>

        <Separator className="my-8 border-primary/20" />

        <h2 className="text-2xl font-semibold text-primary mt-8 mb-4">Key Metrics (Last 30 Days Demo Summary)</h2>
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
            <Card className="border-primary/30 shadow-lg"><CardHeader className="pb-2"><div className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary" /><CardTitle className="text-md font-medium text-primary">Total Hits</CardTitle></div></CardHeader><CardContent><div className="text-3xl font-bold text-foreground">{aggregatedDemoData?.totalHits ?? 0}</div><p className="text-xs text-muted-foreground mt-1">Across demo Nightmare v2 tarpits.</p></CardContent></Card>
            <Card className="border-accent/30 shadow-lg"><CardHeader className="pb-2"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><Users className="h-5 w-5 text-accent" /><CardTitle className="text-md font-medium text-accent">Approx. Unique IPs</CardTitle></div> <TooltipProvider><Tooltip delayDuration={100}><TooltipTrigger asChild><Info className="h-4 w-4 text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent className="bg-popover text-popover-foreground border-primary/50 max-w-xs"><p className="text-xs">Includes ASN (network provider) data.</p></TooltipContent></Tooltip></TooltipProvider> </div></CardHeader><CardContent><div className="text-3xl font-bold text-foreground">{aggregatedDemoData?.approxUniqueIpCount ?? 0}</div><p className="text-xs text-muted-foreground mt-1">Sum from summaries.</p></CardContent></Card>
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
                  <CardHeader><div className="flex items-center gap-2"><Fingerprint className="h-5 w-5 text-primary" /><CardTitle className="text-md font-medium text-primary">IP Activity (with ASN)</CardTitle></div></CardHeader>
                  <CardContent className="min-h-[200px]">
                      {aggregatedDemoData?.topIPs && aggregatedDemoData.topIPs.length > 0 ? <HorizontalBarChartDemo data={aggregatedDemoData.topIPs} nameKey="ip" valueKey="hits" detailKey="asn"/> : <p className="text-xs text-muted-foreground">No IP data.</p>}
                  </CardContent>
              </Card>
              <Card className="border-accent/30 shadow-lg">
                  <CardHeader><div className="flex items-center gap-2"><Network className="h-5 w-5 text-accent" /><CardTitle className="text-md font-medium text-accent">Top ASN Activity</CardTitle></div></CardHeader>
                  <CardContent className="min-h-[200px]">
                    {aggregatedDemoData?.topASNs && aggregatedDemoData.topASNs.length > 0 ? <HorizontalBarChartDemo data={aggregatedDemoData.topASNs} nameKey="asn" valueKey="hits" detailKey="name" /> : <p className="text-xs text-muted-foreground">No ASN data.</p>}
                  </CardContent>
              </Card>
              <Card className="border-primary/30 shadow-lg">
                  <CardHeader><div className="flex items-center gap-2"><Server className="h-5 w-5 text-primary" /><CardTitle className="text-md font-medium text-primary">HTTP Method Distribution</CardTitle></div></CardHeader>
                  <CardContent className="min-h-[150px]">
                    {aggregatedDemoData?.methodDistribution && Object.keys(aggregatedDemoData.methodDistribution).length > 0 ? (
                      <ul className="space-y-1 text-xs text-muted-foreground">{Object.entries(aggregatedDemoData.methodDistribution).sort(([,a],[,b])=>b-a).slice(0,5).map(([k,v],i) => <li key={i} className="flex justify-between"><span className="truncate max-w-[60%]">{k}</span> <span className="font-semibold">{v} hits</span></li>)}</ul>
                    ) : <p className="text-xs text-muted-foreground">No method data.</p>}
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
                    User agents with the most hits to the demo Nightmare v2 tarpit in the last 30 days. (Illustrative demo data)
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
                                {aggregatedDemoData.topUserAgents.slice(0, 10).map((ua, index) => (
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
              <CardDescription>Total Nightmare v2 tarpit hits recorded daily from demo activity summaries.</CardDescription>
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

// Helper function specific to demo page to avoid direct dependency if main dashboard's is complex
function aggregateTopListDemo(
  summaries: AnalyticsSummaryDocumentForDemo[],
  sourceArrayKey: "topCountries" | "topIPs" | "topUserAgents" | "topASNs", 
  outputNameKey: string,
  limit: number = 5
): Array<{ [key: string]: string | number } & { hits: number; asn?: string; name?: string; }> {
  const counts: Record<string, { hits: number; asn?: string; name?: string; }> = {};
  summaries.forEach(summary => {
    const list = summary[sourceArrayKey] as Array<{ item: string; hits: number; asn?: string; name?: string; }> | undefined;
    list?.forEach(subItem => {
      if (!counts[subItem.item]) {
        counts[subItem.item] = { hits: 0 };
      }
      counts[subItem.item].hits += subItem.hits;
      if (subItem.asn && !counts[subItem.item].asn) {
        counts[subItem.item].asn = subItem.asn;
      }
      if (subItem.name && !counts[subItem.item].name) {
        counts[subItem.item].name = subItem.name;
      }
    });
  });
  return Object.entries(counts)
    .sort(([, a], [, b]) => b.hits - a.hits)
    .slice(0, limit)
    .map(([val, data]) => ({ [outputNameKey]: val, hits: data.hits, asn: data.asn, name: data.name }));
}

function aggregateDistributionDemo(
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

    

    
