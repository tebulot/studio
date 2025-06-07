
'use client';

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import TrappedCrawlersChart from "@/components/dashboard/TrappedCrawlersChart";
import ApiLogTable from "@/components/dashboard/ApiLogTable";
import { ShieldCheck, Users, DollarSign, Info, Fingerprint, ListFilter, Activity, Globe, Server, FileText, BarChart3, AlertCircle } from "lucide-react"; // Added new icons
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase/clientApp";
import { collection, query, where, onSnapshot, type DocumentData, type QuerySnapshot, Timestamp, getDocs } from "firebase/firestore"; // Added getDocs, Timestamp
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface ApiLogEntry {
  timestamp: number; // Millisecond Unix timestamp
  level: string;
  message: string;
  source_ip: string;
  user_agent: string;
  method: string;
  path: string;
  status_code: number;
}

interface ApiResponse {
  success: boolean;
  data: ApiLogEntry[];
  message?: string;
}

// Interface for data from 'tarpit_analytics_summaries'
interface AnalyticsSummaryItem {
  count: number; // For distributions
  hits?: number; // For top lists
  country?: string;
  ip?: string;
  userAgent?: string;
  path?: string;
  method?: string;
  status?: string | number;
}

interface AnalyticsSummaryDocument {
  id?: string; // Firestore doc ID
  tarpitId: string;
  startTime: Timestamp;
  totalHits: number;
  uniqueIpCount: number; // Approximation if summed across many
  topCountries?: Array<{ country: string; hits: number }>;
  methodDistribution?: Record<string, number>; // e.g., { "GET": 100, "POST": 5 }
  statusDistribution?: Record<string, number>; // e.g., { "200": 90, "404": 10 }
  topPaths?: Array<{ path: string; hits: number }>;
  topIPs?: Array<{ ip: string; hits: number }>;
  topUserAgents?: Array<{ userAgent: string; hits: number }>;
}

interface AggregatedAnalyticsData {
  totalHits: number;
  approxUniqueIpCount: number;
  topCountries: Array<{ country: string; hits: number }>;
  topIPs: Array<{ ip: string; hits: number }>;
  topUserAgents: Array<{ userAgent: string; hits: number }>;
  topPaths: Array<{ path: string; hits: number }>;
  methodDistribution: Record<string, number>;
  statusDistribution: Record<string, number>;
}


const LOG_FETCH_LIMIT = 250;

// Helper function to aggregate "top X" style arrays
function aggregateTopList<T extends { hits: number }, K extends keyof T>(
  summaries: AnalyticsSummaryDocument[],
  keyField: K extends "country" ? "topCountries" : K extends "ip" ? "topIPs" : K extends "userAgent" ? "topUserAgents" : "topPaths",
  valueField: K, // 'country', 'ip', 'userAgent', 'path'
  limit: number = 5
): Array<{ [P in K]: T[K] } & { hits: number }> {
  const counts: Record<string, number> = {};
  summaries.forEach(summary => {
    const list = summary[keyField] as Array<{ [P in K]: T[K] } & { hits: number }> | undefined;
    list?.forEach(item => {
      const itemValue = item[valueField] as string;
      counts[itemValue] = (counts[itemValue] || 0) + item.hits;
    });
  });
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([val, hits]) => ({ [valueField]: val, hits } as any));
}

// Helper function to aggregate distribution objects
function aggregateDistribution(
  summaries: AnalyticsSummaryDocument[],
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


export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [activeInstancesCount, setActiveInstancesCount] = useState<number | null>(null);
  const [isLoadingInstancesCount, setIsLoadingInstancesCount] = useState(true);

  const [apiLogsData, setApiLogsData] = useState<ApiLogEntry[]>([]);
  const [apiLoading, setApiLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedRangeHours, setSelectedRangeHours] = useState<number>(24);

  // State for aggregated analytics from Firestore summaries
  const [aggregatedAnalytics, setAggregatedAnalytics] = useState<AggregatedAnalyticsData | null>(null);
  const [isAggregatedLoading, setIsAggregatedLoading] = useState(true);
  const [aggregatedError, setAggregatedError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) { setIsLoadingInstancesCount(true); return; }
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

  useEffect(() => {
    if (authLoading || !user) {
      setApiLoading(true);
      setApiLogsData([]);
      if (!user && !authLoading) { setApiLoading(false); }
      return;
    }
    const fetchApiLogs = async () => {
      setApiLoading(true); setApiError(null);
      try {
        const token = await user.getIdToken();
        const apiUrl = `https://api.spitespiral.com/v1/logs?range=${selectedRangeHours}&limit=${LOG_FETCH_LIMIT}&direction=backward`;
        const response = await fetch(apiUrl, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: `API request failed with status ${response.status}` }));
          throw new Error(errorData.message || `Failed to fetch logs. Status: ${response.status}`);
        }
        const result: ApiResponse = await response.json();
        if (result.success && result.data) { setApiLogsData(result.data); } 
        else { throw new Error(result.message || "API returned success=false or no data."); }
      } catch (err) {
        console.error("Full error object during fetchApiLogs:", err);
        let userFriendlyMessage = "An unknown error occurred while fetching logs.";
        if (err instanceof Error) {
          if (err.message.toLowerCase().includes("failed to fetch")) {
            userFriendlyMessage = "Could not connect to the log server. Please check your internet connection or try again later. The service might be temporarily unavailable.";
          } else { userFriendlyMessage = err.message; }
        }
        setApiError(userFriendlyMessage);
        toast({ title: "Log Fetch Error", description: userFriendlyMessage, variant: "destructive", duration: 7000 });
        setApiLogsData([]);
      } finally { setApiLoading(false); }
    };
    fetchApiLogs();
  }, [user, authLoading, toast, selectedRangeHours]);

  // Fetch and process aggregated analytics from Firestore
  useEffect(() => {
    if (authLoading || !user) {
      setIsAggregatedLoading(true);
      setAggregatedAnalytics(null);
      if(!user && !authLoading) setIsAggregatedLoading(false);
      return;
    }

    const fetchAggregatedAnalytics = async () => {
      setIsAggregatedLoading(true);
      setAggregatedError(null);
      setAggregatedAnalytics(null);

      try {
        // 1. Get user's tarpit IDs (pathSegment) from tarpit_configs
        const configsQuery = query(collection(db, "tarpit_configs"), where("userId", "==", user.uid));
        const configsSnapshot = await getDocs(configsQuery);
        const userTarpitIds = configsSnapshot.docs.map(doc => doc.data().pathSegment as string).filter(id => id);

        if (userTarpitIds.length === 0) {
          setAggregatedAnalytics({
            totalHits: 0, approxUniqueIpCount: 0, topCountries: [], topIPs: [],
            topUserAgents: [], topPaths: [], methodDistribution: {}, statusDistribution: {}
          });
          setIsAggregatedLoading(false);
          return;
        }
        
        // 2. Fetch summaries from tarpit_analytics_summaries
        const rangeInMilliseconds = selectedRangeHours * 60 * 60 * 1000;
        const startDate = new Date(Date.now() - rangeInMilliseconds);
        const startDateTimestamp = Timestamp.fromDate(startDate);

        // Firestore 'in' query limit is 30. Chunk if necessary, though unlikely for tarpitIds.
        const MAX_IN_CLAUSE_VALUES = 30;
        let allSummaries: AnalyticsSummaryDocument[] = [];

        for (let i = 0; i < userTarpitIds.length; i += MAX_IN_CLAUSE_VALUES) {
            const chunkOfTarpitIds = userTarpitIds.slice(i, i + MAX_IN_CLAUSE_VALUES);
            if (chunkOfTarpitIds.length > 0) {
                const summariesQuery = query(
                    collection(db, "tarpit_analytics_summaries"),
                    where("tarpitId", "in", chunkOfTarpitIds),
                    where("startTime", ">=", startDateTimestamp)
                );
                const summariesSnapshot = await getDocs(summariesQuery);
                summariesSnapshot.forEach(doc => {
                    allSummaries.push({ id: doc.id, ...doc.data() } as AnalyticsSummaryDocument);
                });
            }
        }
        
        // 3. Aggregate the summaries
        if (allSummaries.length === 0) {
           setAggregatedAnalytics({
            totalHits: 0, approxUniqueIpCount: 0, topCountries: [], topIPs: [],
            topUserAgents: [], topPaths: [], methodDistribution: {}, statusDistribution: {}
          });
          setIsAggregatedLoading(false);
          return;
        }

        const aggregatedData: AggregatedAnalyticsData = {
          totalHits: allSummaries.reduce((sum, s) => sum + (s.totalHits || 0), 0),
          approxUniqueIpCount: allSummaries.reduce((sum, s) => sum + (s.uniqueIpCount || 0), 0),
          topCountries: aggregateTopList(allSummaries, "topCountries", "country"),
          topIPs: aggregateTopList(allSummaries, "topIPs", "ip"),
          topUserAgents: aggregateTopList(allSummaries, "topUserAgents", "userAgent"),
          topPaths: aggregateTopList(allSummaries, "topPaths", "path"),
          methodDistribution: aggregateDistribution(allSummaries, "methodDistribution"),
          statusDistribution: aggregateDistribution(allSummaries, "statusDistribution"),
        };
        setAggregatedAnalytics(aggregatedData);

      } catch (err) {
        console.error("Error fetching/processing aggregated analytics:", err);
        setAggregatedError(err instanceof Error ? err.message : "An unknown error occurred.");
        toast({ title: "Summary Error", description: "Could not load aggregated analytics.", variant: "destructive" });
      } finally {
        setIsAggregatedLoading(false);
      }
    };

    fetchAggregatedAnalytics();
  }, [user, authLoading, selectedRangeHours, toast]);


  const apiKpiStats = useMemo(() => {
    if (!apiLogsData || apiLogsData.length === 0) {
      return { totalHitsInRange: 0, uniqueAttackerIpsInRange: 0, mostProbedPath: { path: "N/A", hits: 0 }, uniqueUserAgentsInRange: 0 };
    }
    const uniqueIps = new Set(apiLogsData.map(log => log.source_ip)).size;
    const uniqueUserAgents = new Set(apiLogsData.map(log => log.user_agent)).size;
    const pathCounts: Record<string, number> = {};
    apiLogsData.forEach(log => { pathCounts[log.path] = (pathCounts[log.path] || 0) + 1; });
    let mostProbedPath = "N/A"; let maxHits = 0;
    for (const path in pathCounts) { if (pathCounts[path] > maxHits) { mostProbedPath = path; maxHits = pathCounts[path]; } }
    return { totalHitsInRange: apiLogsData.length, uniqueAttackerIpsInRange: uniqueIps, mostProbedPath: { path: mostProbedPath, hits: maxHits }, uniqueUserAgentsInRange: uniqueUserAgents };
  }, [apiLogsData]);

  const illustrativeCost = (apiKpiStats.totalHitsInRange * 0.0001).toFixed(4);
  const handleRangeChange = (value: string) => { setSelectedRangeHours(Number(value)); };
  const isLoadingApiKpis = apiLoading;

  const renderDistributionCard = (title: string, data: Record<string, number> | undefined, icon: React.ElementType, isLoading: boolean, error: string | null) => {
    const IconComponent = icon;
    const sortedData = data ? Object.entries(data).sort(([,a],[,b]) => b-a).slice(0,5) : [];
    return (
      <Card className="border-primary/30 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <IconComponent className="h-5 w-5 text-primary" />
            <CardTitle className="text-md font-medium text-primary">{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-20 w-full" /> :
           error ? <p className="text-xs text-destructive">{error}</p> :
           !data || sortedData.length === 0 ? <p className="text-xs text-muted-foreground">No data available.</p> :
            <ul className="space-y-1 text-xs text-muted-foreground">
              {sortedData.map(([key, value]) => (
                <li key={key} className="flex justify-between">
                  <span className="truncate max-w-[70%]">{key}</span>
                  <span className="font-semibold text-foreground/90">{value} hits</span>
                </li>
              ))}
            </ul>
          }
        </CardContent>
      </Card>
    );
  };
  
  const renderTopListCard = (title: string, data: Array<{ [key: string]: string | number, hits: number }> | undefined, itemKey: string, icon: React.ElementType, isLoading: boolean, error: string | null) => {
    const IconComponent = icon;
    return (
      <Card className="border-accent/30 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <IconComponent className="h-5 w-5 text-accent" />
            <CardTitle className="text-md font-medium text-accent">{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-20 w-full" /> :
           error ? <p className="text-xs text-destructive">{error}</p> :
           !data || data.length === 0 ? <p className="text-xs text-muted-foreground">No data available.</p> :
            <ul className="space-y-1 text-xs text-muted-foreground">
              {data.map((item, index) => (
                <li key={index} className="flex justify-between">
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="truncate max-w-[70%] cursor-help">{item[itemKey] as string}</span>
                      </TooltipTrigger>
                      <TooltipContent className="bg-popover text-popover-foreground border-primary/50 max-w-xs">
                        <p>{item[itemKey] as string}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <span className="font-semibold text-foreground/90">{item.hits} hits</span>
                </li>
              ))}
            </ul>
          }
        </CardContent>
      </Card>
    );
  };


  return (
    <div className="space-y-8">
      <header className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-primary glitch-text">Dashboard</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Overview of your SpiteSpiral Tarpit activity and performance. Selected range: Last {selectedRangeHours} hours.
          </p>
        </div>
        <div className="flex items-center gap-2">
            <Label htmlFor="timeRange" className="text-sm text-muted-foreground whitespace-nowrap">Time Range:</Label>
            <Select value={String(selectedRangeHours)} onValueChange={handleRangeChange} disabled={apiLoading || isAggregatedLoading}>
                <SelectTrigger id="timeRange" className="w-[180px] bg-background border-primary/30 focus:ring-primary">
                    <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="24">Last 24 Hours</SelectItem>
                    <SelectItem value="168">Last 7 Days</SelectItem>
                    <SelectItem value="720">Last 30 Days</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </header>

      <Alert variant="default" className="border-accent/20 bg-card/50 mb-6">
        <Info className="h-5 w-5 text-accent" />
        <AlertTitle className="text-accent">Dashboard Data Sources</AlertTitle>
        <AlertDescription className="text-muted-foreground space-y-1">
          <p> • <strong>Recent Activity (Table & Chart below):</strong> Shows up to {LOG_FETCH_LIMIT} most recent raw log entries from the <code className="text-xs bg-muted p-0.5 rounded">/v1/logs</code> API for the selected time range. KPIs labeled "(in API range)" are derived from this specific slice of data.</p>
          <p> • <strong>Overall Summaries (Cards in 'Aggregated Analytics' section):</strong> Provides aggregated statistics (e.g., Top IPs, Top Countries) from processed <code className="text-xs bg-muted p-0.5 rounded">tarpit_analytics_summaries</code> in Firestore across all your active tarpits for the full selected time range.</p>
        </AlertDescription>
      </Alert>
      
      {apiError && (
         <Alert variant="destructive" className="mb-6">
          <Activity className="h-5 w-5" />
          <AlertTitle>API Error (Recent Logs)</AlertTitle>
          <AlertDescription>Could not load recent activity logs: {apiError}</AlertDescription>
        </Alert>
      )}
       {aggregatedError && (
         <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Error Loading Summarized Analytics</AlertTitle>
          <AlertDescription>Could not load aggregated summary data: {aggregatedError}</AlertDescription>
        </Alert>
      )}

      {/* KPIs from API Logs (Recent Slice) */}
      <h2 className="text-2xl font-semibold text-primary mt-8 mb-4">Recent Activity Insights (from latest {LOG_FETCH_LIMIT} API logs)</h2>
      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
        <Card className="border-primary/30 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Total Hits (in API range)</CardTitle>
            <Users className="h-6 w-6 text-accent" />
          </CardHeader>
          <CardContent>
            {isLoadingApiKpis ? <Skeleton className="h-8 w-1/2" /> : <div className="text-3xl font-bold text-foreground">{apiKpiStats.totalHitsInRange}</div>}
            <p className="text-xs text-muted-foreground mt-1">Hits from latest {LOG_FETCH_LIMIT} API logs for range.</p>
          </CardContent>
        </Card>
        <Card className="border-accent/30 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-accent">Unique IPs (in API range)</CardTitle>
            <Fingerprint className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoadingApiKpis ? <Skeleton className="h-8 w-1/2" /> : <div className="text-3xl font-bold text-foreground">{apiKpiStats.uniqueAttackerIpsInRange}</div>}
            <p className="text-xs text-muted-foreground mt-1">Unique source IPs from displayed API logs.</p>
          </CardContent>
        </Card>
        <Card className="border-primary/30 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-1.5">
              <CardTitle className="text-sm font-medium text-primary">Illustrative Compute Wasted</CardTitle>
              <TooltipProvider><Tooltip delayDuration={100}><TooltipTrigger asChild><Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent className="bg-popover text-popover-foreground border-primary/50 max-w-xs"><p className="text-xs">Each hit shown (from API logs) contributes $0.0001 to this illustrative total.</p></TooltipContent></Tooltip></TooltipProvider>
            </div>
            <DollarSign className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoadingApiKpis ? <Skeleton className="h-8 w-1/2" /> : <div className="text-3xl font-bold text-foreground">${illustrativeCost}</div>}
            <p className="text-xs text-muted-foreground mt-1">Based on hits in displayed API logs.</p>
          </CardContent>
        </Card>
        <Card className="border-accent/30 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-accent">Active Tarpit Instances</CardTitle>
            <ShieldCheck className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoadingInstancesCount ? <Skeleton className="h-8 w-1/2" /> : <div className="text-3xl font-bold text-foreground">{activeInstancesCount ?? 0}</div>}
            <p className="text-xs text-muted-foreground mt-1">Currently configured managed URLs.</p>
          </CardContent>
        </Card>
      </section>
      <section className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          <Card className="border-primary/30 shadow-lg">
              <CardHeader><CardTitle className="text-lg font-medium text-primary">Most Probed Path (in API range)</CardTitle></CardHeader>
              <CardContent>
                  {isLoadingApiKpis ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold text-foreground truncate" title={apiKpiStats.mostProbedPath.path}>{apiKpiStats.mostProbedPath.path}</div>}
                  {isLoadingApiKpis ? <Skeleton className="h-4 w-1/2 mt-1" /> : <p className="text-xs text-muted-foreground mt-1">{`${apiKpiStats.mostProbedPath.hits} hits to this path in displayed API logs.`}</p>}
              </CardContent>
          </Card>
          <Card className="border-accent/30 shadow-lg">
              <CardHeader><CardTitle className="text-lg font-medium text-accent">Unique User Agents (in API range)</CardTitle></CardHeader>
              <CardContent>
                  {isLoadingApiKpis ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold text-foreground">{apiKpiStats.uniqueUserAgentsInRange}</div>}
                  <p className="text-xs text-muted-foreground mt-1">Unique User-Agent strings from displayed API logs.</p>
              </CardContent>
          </Card>
      </section>

      {/* Aggregated Analytics from Firestore Summaries */}
      <Separator className="my-8 border-primary/20" />
      <h2 className="text-2xl font-semibold text-primary mt-8 mb-4">Overall Aggregated Analytics (Summarized for Selected Range)</h2>
      {isAggregatedLoading && (
          <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
          </section>
      )}
      {!isAggregatedLoading && aggregatedAnalytics && (
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          <Card className="border-primary/30 shadow-lg">
            <CardHeader className="pb-2"><div className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary" /><CardTitle className="text-md font-medium text-primary">Total Hits (Summarized)</CardTitle></div></CardHeader>
            <CardContent><div className="text-3xl font-bold text-foreground">{aggregatedAnalytics.totalHits}</div><p className="text-xs text-muted-foreground mt-1">Across all your tarpits for the range.</p></CardContent>
          </Card>
          <Card className="border-accent/30 shadow-lg">
            <CardHeader className="pb-2"><div className="flex items-center gap-2"><Users className="h-5 w-5 text-accent" /><CardTitle className="text-md font-medium text-accent">Approx. Unique IPs (Summarized)</CardTitle></div></CardHeader>
            <CardContent><div className="text-3xl font-bold text-foreground">{aggregatedAnalytics.approxUniqueIpCount}</div><p className="text-xs text-muted-foreground mt-1">Sum of unique IP counts from summaries.</p></CardContent>
          </Card>
           {renderTopListCard("Top Attacking Countries", aggregatedAnalytics.topCountries, "country", Globe, isAggregatedLoading, aggregatedError)}
           {renderTopListCard("Top Attacker IPs", aggregatedAnalytics.topIPs, "ip", Fingerprint, isAggregatedLoading, aggregatedError)}
           {renderTopListCard("Top User Agents", aggregatedAnalytics.topUserAgents, "userAgent", ListFilter, isAggregatedLoading, aggregatedError)}
           {renderTopListCard("Top Paths Hit", aggregatedAnalytics.topPaths, "path", FileText, isAggregatedLoading, aggregatedError)}
           {renderDistributionCard("HTTP Method Distribution", aggregatedAnalytics.methodDistribution, Server, isAggregatedLoading, aggregatedError)}
           {renderDistributionCard("HTTP Status Code Distribution", aggregatedAnalytics.statusDistribution, BarChart3, isAggregatedLoading, aggregatedError)}
        </section>
      )}
       {!isAggregatedLoading && !aggregatedAnalytics && !aggregatedError && (
        <p className="text-muted-foreground text-center py-4">No aggregated summary data found for the selected range.</p>
      )}

      <Separator className="my-8 border-primary/20" />
      <h2 className="text-2xl font-semibold text-primary mt-8 mb-4">Recent Activity Details (from latest {LOG_FETCH_LIMIT} API logs)</h2>
      <section>
        <Card className="shadow-lg border-primary/20">
          <CardHeader>
            <CardTitle className="text-xl text-primary">Total Hits Over Time (in API range)</CardTitle>
            <CardDescription>Total tarpit hits from API logs for the selected range.</CardDescription>
          </CardHeader>
          <CardContent>
            <TrappedCrawlersChart apiLogs={apiLogsData} isLoading={apiLoading} selectedRangeHours={selectedRangeHours} />
          </CardContent>
        </Card>
      </section>
      <section>
        <Card className="shadow-lg border-accent/20">
          <CardHeader>
             <div className="flex items-center gap-2"> <ListFilter className="h-6 w-6 text-accent" /> <CardTitle className="text-xl text-accent">Detailed Activity Logs (Last {LOG_FETCH_LIMIT} for range)</CardTitle> </div>
            <CardDescription>Raw log entries from your tarpit instances for the selected range (via API).</CardDescription>
          </CardHeader>
          <CardContent>
            <ApiLogTable logs={apiLogsData} isLoading={apiLoading} error={apiError} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
