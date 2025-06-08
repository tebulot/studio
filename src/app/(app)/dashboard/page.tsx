
'use client';

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import TrappedCrawlersChart from "@/components/dashboard/TrappedCrawlersChart";
import ApiLogTable from "@/components/dashboard/ApiLogTable";
import { ShieldCheck, Users, DollarSign, Info, Fingerprint, ListFilter, Activity, Globe, Server, FileText, BarChart3, AlertCircle, Eye, Lock } from "lucide-react";
import { useAuth, type UserProfile } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase/clientApp";
import { collection, query, where, onSnapshot, type DocumentData, type QuerySnapshot, Timestamp, getDocs, orderBy } from "firebase/firestore"; // Added orderBy
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip } from "recharts";
import { eachDayOfInterval, eachHourOfInterval, format, startOfDay, startOfHour, parseISO } from 'date-fns';

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

interface AnalyticsSummaryDocument {
  id?: string;
  tarpitId: string; // Still needed for context if a user has multiple tarpits
  userId?: string; // Expected to be added by the backend
  startTime: Timestamp;
  totalHits: number;
  uniqueIpCount: number;
  topCountries?: Array<{ item: string; hits: number }>;
  methodDistribution?: Record<string, number>;
  statusDistribution?: Record<string, number>;
  topPaths?: Array<{ item: string; hits: number }>;
  topIPs?: Array<{ item: string; hits: number }>;
  topUserAgents?: Array<{ item: string; hits: number }>;
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
  summaryHitsOverTime?: Array<{ date: string; hits: number }>;
}

const LOG_FETCH_LIMIT = 250;
const WINDOW_SHOPPING_PLACEHOLDER_COUNT_PRIMARY = 1234;
const WINDOW_SHOPPING_PLACEHOLDER_COUNT_SECONDARY = 789;
const WINDOW_SHOPPING_PLACEHOLDER_COST = "0.1234";
const WINDOW_SHOPPING_PLACEHOLDER_AGG_HITS = 10567;
const WINDOW_SHOPPING_PLACEHOLDER_AGG_IPS = 876;

const PLACEHOLDER_TOP_COUNTRIES_DEMO = [
  { country: "Atlantis (Demo)", hits: 300 }, { country: "El Dorado (Demo)", hits: 250 }, { country: "Shangri-La (Demo)", hits: 200 },
  { country: "Avalon (Demo)", hits: 150 }, { country: "Lyonesse (Demo)", hits: 100 },
];
const PLACEHOLDER_TOP_IPS_DEMO = [
  { ip: "10.0.0.1 (Demo)", hits: 150 }, { ip: "10.0.0.2 (Demo)", hits: 120 }, { ip: "10.0.0.3 (Demo)", hits: 90 },
  { ip: "10.0.0.4 (Demo)", hits: 70 }, { ip: "10.0.0.5 (Demo)", hits: 50 },
];
const PLACEHOLDER_TOP_UAS_DEMO = [
  { userAgent: "DemoBot/1.0 (Demo)", hits: 200 }, { userAgent: "SampleScraper/2.x (Demo)", hits: 180 }, { userAgent: "TestCrawler/0.1 (Demo)", hits: 150 },
  { userAgent: "PlaceholderUA (Demo)", hits: 100 }, { userAgent: "Botzilla-Demo (Demo)", hits: 80 },
];
const PLACEHOLDER_TOP_PATHS_DEMO = [
  { path: "/demo-login.php (Demo)", hits: 220 }, { path: "/sample-admin/ (Demo)", hits: 190 }, { path: "/test-api/data (Demo)", hits: 160 },
  { path: "/placeholder/path (Demo)", hits: 110 }, { path: "/example-route (Demo)", hits: 70 },
];
const PLACEHOLDER_METHOD_DIST_DEMO = { "GET (Demo)": 600, "POST (Demo)": 300, "PUT (Demo)": 50, "DELETE (Demo)": 20, "OPTIONS (Demo)": 30 };
const PLACEHOLDER_STATUS_DIST_DEMO = { "200 (Demo)": 700, "404 (Demo)": 150, "403 (Demo)": 100, "500 (Demo)": 30, "301 (Demo)": 20 };
const PLACEHOLDER_SUMMARY_HITS_OVER_TIME_DEMO = (rangeHours: number): Array<{date: string, hits: number}> => {
    const now = new Date();
    const endDate = now;
    const startDate = new Date(now.getTime() - rangeHours * 60 * 60 * 1000);
    let intervalPoints: Date[];
     if (rangeHours <= 48) { intervalPoints = eachHourOfInterval({ start: startDate, end: endDate });}
     else { intervalPoints = eachDayOfInterval({ start: startDate, end: endDate }); }
    return intervalPoints.map(point => ({
        date: point.toISOString(),
        hits: Math.floor(Math.random() * (rangeHours <=48 ? 20 : 200) + 5)
    }));
};

function aggregateTopList(
  summaries: AnalyticsSummaryDocument[],
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

const HorizontalBarChart = ({ data, nameKey, valueKey, layout = 'vertical' }: { data: any[], nameKey: string, valueKey: string, layout?: 'horizontal' | 'vertical' }) => {
  if (!data || data.length === 0) return <p className="text-xs text-muted-foreground h-40 flex items-center justify-center">No data to display.</p>;
  const chartData = data.map(item => ({ name: item[nameKey], value: item[valueKey] })).slice(0, 5);
  const containerHeight = layout === 'vertical' ? (chartData.length * 35 + 40) : 200;

  return (
    <ResponsiveContainer width="100%" height={containerHeight}>
      <BarChart data={chartData} layout={layout} margin={{ top: 5, right: 20, left: layout === 'vertical' ? 60 : 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.3)" />
        {layout === 'horizontal' ? (
          <XAxis dataKey="name" type="category" scale="band" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" interval={0} />
        ) : (
          <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
        )}
        {layout === 'horizontal' ? (
          <YAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false}/>
        ) : (
          <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10, width: 90, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} interval={0} stroke="hsl(var(--muted-foreground))" />
        )}
        <RechartsTooltip
          contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', fontSize: '12px' }}
          labelStyle={{ color: 'hsl(var(--popover-foreground))', fontWeight: 'bold' }}
          itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
          cursor={{ fill: 'hsl(var(--accent)/0.1)' }}
        />
        <Bar dataKey="value" fill="hsl(var(--primary))" radius={layout === 'vertical' ? [0, 4, 4, 0] : [4, 4, 0, 0]} barSize={layout === 'vertical' ? 20 : undefined} />
      </BarChart>
    </ResponsiveContainer>
  );
};


export default function DashboardPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [activeInstancesCount, setActiveInstancesCount] = useState<number | null>(null);
  const [isLoadingInstancesCount, setIsLoadingInstancesCount] = useState(true);

  const [apiLogsData, setApiLogsData] = useState<ApiLogEntry[]>([]);
  const [apiLoading, setApiLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedRangeHours, setSelectedRangeHours] = useState<number>(24);

  const [aggregatedAnalytics, setAggregatedAnalytics] = useState<AggregatedAnalyticsData | null>(null);
  const [isAggregatedLoading, setIsAggregatedLoading] = useState(true);
  const [aggregatedError, setAggregatedError] = useState<string | null>(null);

  const isEffectivelySubscribedForFeatures = useMemo(() => {
    if (!userProfile) return false;
    return ['active', 'trialing', 'active_until_period_end', 'pending_downgrade'].includes(userProfile.subscriptionStatus || '');
  }, [userProfile]);

  const isWindowShoppingTier = useMemo(() => {
    if (!userProfile) return true; 
    if (userProfile.activeTierId === 'window_shopping') return true;
    return !isEffectivelySubscribedForFeatures; 
  }, [userProfile, isEffectivelySubscribedForFeatures]);

  const isSetAndForgetTier = useMemo(() => {
    if (!userProfile || !isEffectivelySubscribedForFeatures || isWindowShoppingTier) return false;
    return (userProfile.activeTierId === 'set_and_forget' || userProfile.activeTierId === 'price_1RTilPKPVCKvfVVwBUqudAnp');
  }, [userProfile, isEffectivelySubscribedForFeatures, isWindowShoppingTier]);

  const isAnalyticsTier = useMemo(() => {
    if (!userProfile || !isEffectivelySubscribedForFeatures || isWindowShoppingTier) return false;
    return (userProfile.activeTierId === 'analytics' || userProfile.activeTierId === 'price_1RTim1KPVCKvfVVwDkc5G0at');
  }, [userProfile, isEffectivelySubscribedForFeatures, isWindowShoppingTier]);


  useEffect(() => {
    if (authLoading) { setIsLoadingInstancesCount(true); return; }
    if (user) {
      setIsLoadingInstancesCount(true);
      const logPrefix = `DashboardPage (User: ${user.uid.substring(0,5)}...) - Tarpit Configs:`;
      console.log(`${logPrefix} Subscribing to tarpit_configs for user ID: ${user.uid}`);
      const instancesQuery = query(collection(db, "tarpit_configs"), where("userId", "==", user.uid));
      const unsubscribeInstances = onSnapshot(instancesQuery, (querySnapshot: QuerySnapshot<DocumentData>) => {
        setActiveInstancesCount(querySnapshot.size);
        setIsLoadingInstancesCount(false);
        console.log(`${logPrefix} Fetched ${querySnapshot.size} active instances.`);
      }, (error) => {
        console.error(`${logPrefix} Error fetching active instances count:`, error);
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
    if (authLoading || !user || !isAnalyticsTier) { 
      setApiLoading(true);
      setApiLogsData([]);
      if (!user && !authLoading) { setApiLoading(false); }
      if(!isAnalyticsTier && user && !authLoading) {setApiLoading(false); }
      return;
    }
    const fetchApiLogs = async () => {
      setApiLoading(true); setApiError(null);
      const logPrefix = `DashboardPage (User: ${user.uid.substring(0,5)}...) - API Logs:`;
      console.log(`${logPrefix} Fetching API logs. Range: ${selectedRangeHours}h, Limit: ${LOG_FETCH_LIMIT}`);
      try {
        const token = await user.getIdToken();
        const apiUrl = `https://api.spitespiral.com/v1/logs?range=${selectedRangeHours}&limit=${LOG_FETCH_LIMIT}&direction=backward`;
        
        const response = await fetch(apiUrl, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: `API request failed with status ${response.status}` }));
          throw new Error(errorData.message || `Failed to fetch logs. Status: ${response.status}`);
        }
        const result: ApiResponse = await response.json();
        if (result.success && result.data) { 
            setApiLogsData(result.data); 
            console.log(`${logPrefix} Successfully fetched ${result.data.length} API log entries.`);
        } 
        else { throw new Error(result.message || "API returned success=false or no data."); }
      } catch (err) {
        console.error(`${logPrefix} Full error object during fetchApiLogs:`, err);
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
  }, [user, authLoading, toast, selectedRangeHours, isAnalyticsTier]);

  useEffect(() => {
    if (authLoading || !user || isWindowShoppingTier) {
      setIsAggregatedLoading(true);
      setAggregatedAnalytics(null);
      if(!user && !authLoading) setIsAggregatedLoading(false);
      if(isWindowShoppingTier && user && !authLoading) { setIsAggregatedLoading(false); }
      return;
    }

    const fetchAggregatedAnalytics = async () => {
      setIsAggregatedLoading(true);
      setAggregatedError(null);
      setAggregatedAnalytics(null);
      const logPrefix = `DashboardPage (User: ${user.uid.substring(0,5)}...) - Aggregated Analytics:`;
      console.log(`${logPrefix} Starting fetch for aggregated analytics. Range: ${selectedRangeHours}h. Querying by userId: ${user.uid}`);

      try {
        const rangeInMilliseconds = selectedRangeHours * 60 * 60 * 1000;
        const startDate = new Date(Date.now() - rangeInMilliseconds);
        const startDateTimestamp = Timestamp.fromDate(startDate);
        console.log(`${logPrefix} Calculated start date for summaries: ${startDate.toISOString()}`);
        
        // New query: Directly query tarpit_analytics_summaries by userId
        const summariesQuery = query(
            collection(db, "tarpit_analytics_summaries"),
            where("userId", "==", user.uid), // Assumes userId field will be added to summaries
            where("startTime", ">=", startDateTimestamp),
            orderBy("startTime", "asc") // Keep consistent ordering
        );
        console.log(`${logPrefix} Executing Firestore query for summaries with userId: ${user.uid} and startTime >= ${startDate.toISOString()}`);

        const summariesSnapshot = await getDocs(summariesQuery);
        const allSummaries: AnalyticsSummaryDocument[] = [];
        summariesSnapshot.forEach(doc => {
            const data = doc.data();
            console.log(`${logPrefix} Summary doc ${doc.id} (tarpitId: ${data.tarpitId || 'N/A'}) data:`, JSON.parse(JSON.stringify(data)));
            allSummaries.push({ id: doc.id, ...data } as AnalyticsSummaryDocument);
        });
        console.log(`${logPrefix} Fetched ${allSummaries.length} summaries for user ${user.uid}.`);
        
        if (allSummaries.length === 0) {
           setAggregatedAnalytics({
            totalHits: 0, approxUniqueIpCount: 0, topCountries: [], topIPs: [],
            topUserAgents: [], topPaths: [], methodDistribution: {}, statusDistribution: {},
            summaryHitsOverTime: [],
          });
          setIsAggregatedLoading(false);
          console.log(`${logPrefix} No summaries found for user ${user.uid} and time range.`);
          toast({ title: "No Summary Data", description: "No aggregated analytics data found for your tarpits in the selected range. This might also occur if the backend hasn't started adding 'userId' to summary documents yet.", variant: "default", duration: 8000});
          return;
        }

        const hitsByInterval: { [key: string]: number } = {};
        const now = new Date();
        const chartEndDate = now;
        const chartStartDate = new Date(now.getTime() - selectedRangeHours * 60 * 60 * 1000);
        let intervalPoints: Date[];
        let aggregationFormat: string;
        if (selectedRangeHours <= 48) { 
          intervalPoints = eachHourOfInterval({ start: chartStartDate, end: chartEndDate });
          aggregationFormat = 'yyyy-MM-dd HH'; 
        } else {
          intervalPoints = eachDayOfInterval({ start: chartStartDate, end: chartEndDate });
          aggregationFormat = 'yyyy-MM-dd';
        }
        intervalPoints.forEach(point => { hitsByInterval[format(point, aggregationFormat)] = 0; });
        allSummaries.forEach(summary => {
            const summaryStartTime = summary.startTime.toDate();
            let intervalKey: string;
            if (selectedRangeHours <= 48) { intervalKey = format(startOfHour(summaryStartTime), aggregationFormat); } 
            else { intervalKey = format(startOfDay(summaryStartTime), aggregationFormat); }
            if (hitsByInterval[intervalKey] !== undefined) { hitsByInterval[intervalKey] += summary.totalHits; }
        });
        const summaryHitsOverTimeData = intervalPoints.map(point => {
            const key = format(point, aggregationFormat);
            return { date: point.toISOString(), hits: hitsByInterval[key] || 0 };
        });

        const aggregatedData: AggregatedAnalyticsData = {
          totalHits: allSummaries.reduce((sum, s) => sum + (s.totalHits || 0), 0),
          approxUniqueIpCount: allSummaries.reduce((sum, s) => sum + (s.uniqueIpCount || 0), 0),
          topCountries: aggregateTopList(allSummaries, "topCountries", "country"),
          topIPs: aggregateTopList(allSummaries, "topIPs", "ip"),
          topUserAgents: aggregateTopList(allSummaries, "topUserAgents", "userAgent"),
          topPaths: aggregateTopList(allSummaries, "topPaths", "path", 10),
          methodDistribution: aggregateDistribution(allSummaries, "methodDistribution"),
          statusDistribution: aggregateDistribution(allSummaries, "statusDistribution"),
          summaryHitsOverTime: summaryHitsOverTimeData,
        };
        setAggregatedAnalytics(aggregatedData);
        console.log(`${logPrefix} Successfully processed and aggregated ${allSummaries.length} summaries.`);

      } catch (err) {
        console.error(`${logPrefix} Error fetching/processing aggregated analytics:`, err);
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
        setAggregatedError(errorMessage);
        toast({ title: "Summary Error", description: `Could not load aggregated analytics. ${errorMessage}`, variant: "destructive" });
      } finally {
        setIsAggregatedLoading(false);
      }
    };

    if (isSetAndForgetTier || isAnalyticsTier) {
        fetchAggregatedAnalytics();
    }
  }, [user, authLoading, selectedRangeHours, toast, isWindowShoppingTier, isSetAndForgetTier, isAnalyticsTier]);

  const apiKpiStats = useMemo(() => {
    if (isWindowShoppingTier) {
        return { totalHitsInRange: WINDOW_SHOPPING_PLACEHOLDER_COUNT_PRIMARY, uniqueAttackerIpsInRange: WINDOW_SHOPPING_PLACEHOLDER_COUNT_SECONDARY, mostProbedPath: { path: "/wp-login.php (Demo)", hits: WINDOW_SHOPPING_PLACEHOLDER_COUNT_PRIMARY / 2 }, uniqueUserAgentsInRange: WINDOW_SHOPPING_PLACEHOLDER_COUNT_SECONDARY / 2 };
    }
    if (!isAnalyticsTier || !apiLogsData || apiLogsData.length === 0) { 
      return { totalHitsInRange: 0, uniqueAttackerIpsInRange: 0, mostProbedPath: { path: "N/A", hits: 0 }, uniqueUserAgentsInRange: 0 };
    }
    const uniqueIps = new Set(apiLogsData.map(log => log.source_ip)).size;
    const uniqueUserAgents = new Set(apiLogsData.map(log => log.user_agent)).size;
    const pathCounts: Record<string, number> = {};
    apiLogsData.forEach(log => { pathCounts[log.path] = (pathCounts[log.path] || 0) + 1; });
    let mostProbedPath = "N/A"; let maxHits = 0;
    for (const path in pathCounts) { if (pathCounts[path] > maxHits) { mostProbedPath = path; maxHits = pathCounts[path]; } }
    return { totalHitsInRange: apiLogsData.length, uniqueAttackerIpsInRange: uniqueIps, mostProbedPath: { path: mostProbedPath, hits: maxHits }, uniqueUserAgentsInRange: uniqueUserAgents };
  }, [apiLogsData, isAnalyticsTier, isWindowShoppingTier]);

  const illustrativeCost = isWindowShoppingTier ? WINDOW_SHOPPING_PLACEHOLDER_COST : (apiKpiStats.totalHitsInRange * 0.0001).toFixed(4);
  const handleRangeChange = (value: string) => { setSelectedRangeHours(Number(value)); };
  
  const isLoadingKpis = apiLoading && isAnalyticsTier; 

  const currentTierName = useMemo(() => {
    if (isAnalyticsTier) return "Analytics";
    if (isSetAndForgetTier) return "Set & Forget";
    return "Window Shopping";
  }, [isAnalyticsTier, isSetAndForgetTier]);


  const renderDistributionCard = (title: string, data: Record<string, number> | undefined, icon: React.ElementType, isLoading: boolean, error: string | null, showPercentages: boolean, tier: 'window' | 'setforget' | 'analytics') => {
    const IconComponent = icon;
    let displayData = data;
    let cardIsLoading = isLoading;
    let cardError = error;

    if (tier === 'window') {
        cardIsLoading = false; cardError = null;
        displayData = title.toLowerCase().includes("method") ? PLACEHOLDER_METHOD_DIST_DEMO : PLACEHOLDER_STATUS_DIST_DEMO;
    }

    const sortedData = displayData ? Object.entries(displayData).sort(([,a],[,b]) => b-a).slice(0,5) : [];
    const totalHits = showPercentages ? sortedData.reduce((sum, [, value]) => sum + value, 0) : 0;
    
    return (
      <Card className="border-primary/30 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconComponent className="h-5 w-5 text-primary" />
              <CardTitle className="text-md font-medium text-primary">{title}</CardTitle>
            </div>
            {tier === 'setforget' && !showPercentages && (
                 <TooltipProvider><Tooltip delayDuration={100}>
                    <TooltipTrigger asChild><Info className="h-4 w-4 text-muted-foreground cursor-help" /></TooltipTrigger>
                    <TooltipContent className="bg-popover text-popover-foreground border-primary/50 max-w-xs"><p className="text-xs">Percentage breakdown available in Analytics Tier.</p></TooltipContent>
                </Tooltip></TooltipProvider>
            )}
          </div>
        </CardHeader>
        <CardContent className="min-h-[150px]">
          {cardIsLoading ? <Skeleton className="h-20 w-full" /> :
           cardError ? <p className="text-xs text-destructive">{cardError}</p> :
           !displayData || sortedData.length === 0 ? <p className="text-xs text-muted-foreground">No data available.</p> :
            <ul className="space-y-1 text-xs text-muted-foreground">
              {sortedData.map(([key, value]) => {
                const percentage = totalHits > 0 ? ((value / totalHits) * 100).toFixed(1) : "0.0";
                return (
                  <li key={key} className="flex justify-between">
                    <span className="truncate max-w-[60%]">{key}</span>
                    <span className="font-semibold text-foreground/90 text-right">
                      {value} hits {showPercentages && totalHits > 0 ? `(${percentage}%)` : ''}
                    </span>
                  </li>
                );
              })}
            </ul>
          }
        </CardContent>
      </Card>
    );
  };
  
  const renderTopListCard = (title: string, data: Array<{ [key: string]: string | number, hits: number }> | undefined, itemKey: string, icon: React.ElementType, isLoading: boolean, error: string | null, tier: 'window' | 'setforget' | 'analytics') => {
    const IconComponent = icon;
    let displayData = data;
    let cardIsLoading = isLoading;
    let cardError = error;

    if (tier === 'window') {
        cardIsLoading = false; cardError = null;
        if (title.toLowerCase().includes("countries")) displayData = PLACEHOLDER_TOP_COUNTRIES_DEMO;
        else if (title.toLowerCase().includes("ips")) displayData = PLACEHOLDER_TOP_IPS_DEMO;
        else if (title.toLowerCase().includes("user agents")) displayData = PLACEHOLDER_TOP_UAS_DEMO;
        else if (title.toLowerCase().includes("paths")) displayData = PLACEHOLDER_TOP_PATHS_DEMO;
    }
    
    return (
      <Card className="border-accent/30 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconComponent className="h-5 w-5 text-accent" />
              <CardTitle className="text-md font-medium text-accent">{title}</CardTitle>
            </div>
            {tier === 'setforget' && (title.includes("Countries") || title.includes("IPs") || title.includes("User Agents")) &&
                <TooltipProvider><Tooltip delayDuration={100}><TooltipTrigger asChild><Info className="h-4 w-4 text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent className="bg-popover text-popover-foreground border-primary/50 max-w-xs"><p className="text-xs">Full list and visual breakdown available in Analytics Tier.</p></TooltipContent></Tooltip></TooltipProvider>
            }
            {tier === 'window' && <TooltipProvider><Tooltip delayDuration={100}><TooltipTrigger asChild><Info className="h-4 w-4 text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent className="bg-popover text-popover-foreground border-primary/50 max-w-xs"><p className="text-xs">Live data and full lists available in paid tiers.</p></TooltipContent></Tooltip></TooltipProvider>}
          </div>
        </CardHeader>
        <CardContent className="min-h-[150px]">
          {cardIsLoading ? <Skeleton className="h-20 w-full" /> :
           cardError ? <p className="text-xs text-destructive">{cardError}</p> :
           !displayData || displayData.length === 0 ? <p className="text-xs text-muted-foreground">No data available.</p> :
            <ul className="space-y-1 text-xs text-muted-foreground">
              {displayData.slice(0, tier === 'setforget' ? 2 : 5).map((item, index) => (
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

  const currentDashboardTier: 'window' | 'setforget' | 'analytics' = 
    isAnalyticsTier ? 'analytics' : 
    isSetAndForgetTier ? 'setforget' : 
    'window';

  return (
    <div className="space-y-8">
      <header className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-primary glitch-text">Dashboard</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Overview of your SpiteSpiral Tarpit activity. Selected range: Last {selectedRangeHours} hours.
            Current Tier: <span className="font-semibold text-accent">{currentTierName}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
            <Label htmlFor="timeRange" className="text-sm text-muted-foreground whitespace-nowrap">Time Range:</Label>
            <Select value={String(selectedRangeHours)} onValueChange={handleRangeChange} disabled={apiLoading || isAggregatedLoading || isWindowShoppingTier}>
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
        <AlertTitle className="text-accent">Dashboard Data Sources & Tier Features</AlertTitle>
        <AlertDescription className="text-muted-foreground space-y-1">
          <p> • <strong className="text-primary">Window Shopping Tier:</strong> Displays static, illustrative demo data. Upgrade for live analytics!</p>
          <p> • <strong className="text-primary">Set & Forget Tier:</strong> Shows aggregated statistics from your tarpits (updated periodically from Firestore summaries). Limited visual details. Upgrade to Analytics for real-time logs and full visualizations.</p>
          <p> • <strong className="text-primary">Analytics Tier:</strong> Full access to near real-time detailed logs (up to {LOG_FETCH_LIMIT} via API), aggregated summaries, and all advanced visualizations.</p>
        </AlertDescription>
      </Alert>
      
      {apiError && isAnalyticsTier && (
         <Alert variant="destructive" className="mb-6">
          <Activity className="h-5 w-5" />
          <AlertTitle>API Error (Recent Logs - Analytics Tier)</AlertTitle>
          <AlertDescription>Could not load recent activity logs: {apiError}</AlertDescription>
        </Alert>
      )}
       {aggregatedError && (isSetAndForgetTier || isAnalyticsTier) && (
         <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Error Loading Summarized Analytics</AlertTitle>
          <AlertDescription>Could not load aggregated summary data: {aggregatedError}</AlertDescription>
        </Alert>
      )}

      {isAnalyticsTier && (
        <>
            <h2 className="text-2xl font-semibold text-primary mt-8 mb-4">Recent Activity Insights (from latest {LOG_FETCH_LIMIT} API logs - Analytics Tier)</h2>
            <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
                <Card className="border-primary/30 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-primary">Total Hits (in API range)</CardTitle>
                    <Users className="h-6 w-6 text-accent" />
                </CardHeader>
                <CardContent>
                    {isLoadingKpis ? <Skeleton className="h-8 w-1/2" /> : <div className="text-3xl font-bold text-foreground">{apiKpiStats.totalHitsInRange}</div>}
                    <p className="text-xs text-muted-foreground mt-1">Hits from latest {LOG_FETCH_LIMIT} API logs.</p>
                </CardContent>
                </Card>
                <Card className="border-accent/30 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-accent">Unique IPs (in API range)</CardTitle>
                    <Fingerprint className="h-6 w-6 text-primary" />
                </CardHeader>
                <CardContent>
                    {isLoadingKpis ? <Skeleton className="h-8 w-1/2" /> : <div className="text-3xl font-bold text-foreground">{apiKpiStats.uniqueAttackerIpsInRange}</div>}
                    <p className="text-xs text-muted-foreground mt-1">Unique source IPs from API logs.</p>
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
                    {isLoadingKpis ? <Skeleton className="h-8 w-1/2" /> : <div className="text-3xl font-bold text-foreground">${illustrativeCost}</div>}
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
             <section className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 mt-6">
                <Card className="border-primary/30 shadow-lg">
                    <CardHeader><CardTitle className="text-lg font-medium text-primary">Most Probed Path (in API range)</CardTitle></CardHeader>
                    <CardContent>
                        {isLoadingKpis ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold text-foreground truncate" title={apiKpiStats.mostProbedPath.path}>{apiKpiStats.mostProbedPath.path}</div>}
                        {isLoadingKpis ? <Skeleton className="h-4 w-1/2 mt-1" /> : <p className="text-xs text-muted-foreground mt-1">{`${apiKpiStats.mostProbedPath.hits} hits to this path in API logs.`}</p>}
                    </CardContent>
                </Card>
                <Card className="border-accent/30 shadow-lg">
                    <CardHeader><CardTitle className="text-lg font-medium text-accent">Unique User Agents (in API range)</CardTitle></CardHeader>
                    <CardContent>
                        {isLoadingKpis ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold text-foreground">{apiKpiStats.uniqueUserAgentsInRange}</div>}
                        <p className="text-xs text-muted-foreground mt-1">Unique User-Agent strings from API logs.</p>
                    </CardContent>
                </Card>
            </section>
        </>
      )}
      {isSetAndForgetTier && (
        <Alert variant="default" className="border-primary/20 bg-card/50 my-6">
            <Lock className="h-5 w-5 text-primary" />
            <AlertTitle className="text-primary">Analytics Tier Features</AlertTitle>
            <AlertDescription className="text-muted-foreground">
                Recent Activity Insights (from real-time API logs), detailed log table, and advanced chart visualizations are available in the <strong className="text-accent">Analytics Tier</strong>.
            </AlertDescription>
        </Alert>
      )}
       {isWindowShoppingTier && (
        <>
            <h2 className="text-2xl font-semibold text-primary mt-8 mb-4">Recent Activity Insights (Demo Data)</h2>
             <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
                 <Card className="border-primary/30 shadow-lg"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-primary">Total Hits (Demo)</CardTitle><Users className="h-6 w-6 text-accent" /></CardHeader><CardContent><div className="text-3xl font-bold text-foreground">{WINDOW_SHOPPING_PLACEHOLDER_COUNT_PRIMARY}</div><p className="text-xs text-muted-foreground mt-1">Illustrative demo data.</p></CardContent></Card>
                 <Card className="border-accent/30 shadow-lg"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-accent">Unique IPs (Demo)</CardTitle><Fingerprint className="h-6 w-6 text-primary" /></CardHeader><CardContent><div className="text-3xl font-bold text-foreground">{WINDOW_SHOPPING_PLACEHOLDER_COUNT_SECONDARY}</div><p className="text-xs text-muted-foreground mt-1">Illustrative demo data.</p></CardContent></Card>
                 <Card className="border-primary/30 shadow-lg"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><div className="flex items-center gap-1.5"><CardTitle className="text-sm font-medium text-primary">Compute Wasted (Demo)</CardTitle></div><DollarSign className="h-6 w-6 text-primary" /></CardHeader><CardContent><div className="text-3xl font-bold text-foreground">${WINDOW_SHOPPING_PLACEHOLDER_COST}</div><p className="text-xs text-muted-foreground mt-1">Illustrative demo data.</p></CardContent></Card>
                 <Card className="border-accent/30 shadow-lg"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-accent">Active Tarpit Instances</CardTitle><ShieldCheck className="h-6 w-6 text-primary" /></CardHeader><CardContent>{isLoadingInstancesCount ? <Skeleton className="h-8 w-1/2" /> : <div className="text-3xl font-bold text-foreground">{activeInstancesCount ?? 0}</div>}<p className="text-xs text-muted-foreground mt-1">Your configured URLs.</p></CardContent></Card>
            </section>
        </>
      )}


      <Separator className="my-8 border-primary/20" />
      <h2 className="text-2xl font-semibold text-primary mt-8 mb-4">Overall Aggregated Analytics (Summarized for Selected Range)</h2>
      {(!isAggregatedLoading || isWindowShoppingTier) && (aggregatedAnalytics || isWindowShoppingTier) ? (
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          <Card className="border-primary/30 shadow-lg">
            <CardHeader className="pb-2"><div className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary" /><CardTitle className="text-md font-medium text-primary">Total Hits (Summarized)</CardTitle></div></CardHeader>
            <CardContent><div className="text-3xl font-bold text-foreground">{isWindowShoppingTier ? WINDOW_SHOPPING_PLACEHOLDER_AGG_HITS : aggregatedAnalytics?.totalHits ?? 0}</div><p className="text-xs text-muted-foreground mt-1">Across your tarpits for the range.</p></CardContent>
          </Card>
          <Card className="border-accent/30 shadow-lg">
            <CardHeader className="pb-2"><div className="flex items-center gap-2"><Users className="h-5 w-5 text-accent" /><CardTitle className="text-md font-medium text-accent">Approx. Unique IPs (Summarized)</CardTitle></div></CardHeader>
            <CardContent><div className="text-3xl font-bold text-foreground">{isWindowShoppingTier ? WINDOW_SHOPPING_PLACEHOLDER_AGG_IPS : aggregatedAnalytics?.approxUniqueIpCount ?? 0}</div><p className="text-xs text-muted-foreground mt-1">Sum of unique IP counts from summaries.</p></CardContent>
          </Card>
          
          {isAnalyticsTier ? (
            <Card className="border-accent/30 shadow-lg">
              <CardHeader><div className="flex items-center gap-2"><Globe className="h-5 w-5 text-accent" /><CardTitle className="text-md font-medium text-accent">Top Attacking Countries</CardTitle></div></CardHeader>
              <CardContent className="min-h-[150px]">
                {isAggregatedLoading && !isWindowShoppingTier ? <Skeleton className="h-40 w-full" /> : aggregatedError ? <p className="text-xs text-destructive">{aggregatedError}</p> :
                 !aggregatedAnalytics?.topCountries || aggregatedAnalytics.topCountries.length === 0 ? <p className="text-xs text-muted-foreground">No data available.</p> :
                 <HorizontalBarChart data={aggregatedAnalytics.topCountries} nameKey="country" valueKey="hits" />}
              </CardContent>
            </Card>
          ) : ( 
            renderTopListCard("Top Attacking Countries", aggregatedAnalytics?.topCountries, "country", Globe, isAggregatedLoading && !isWindowShoppingTier, aggregatedError, currentDashboardTier)
          )}

          {isAnalyticsTier ? (
            <Card className="border-primary/30 shadow-lg">
              <CardHeader><div className="flex items-center gap-2"><Fingerprint className="h-5 w-5 text-primary" /><CardTitle className="text-md font-medium text-primary">Top Attacker IPs</CardTitle></div></CardHeader>
              <CardContent className="min-h-[150px]">
                {isAggregatedLoading && !isWindowShoppingTier ? <Skeleton className="h-40 w-full" /> : aggregatedError ? <p className="text-xs text-destructive">{aggregatedError}</p> :
                 !aggregatedAnalytics?.topIPs || aggregatedAnalytics.topIPs.length === 0 ? <p className="text-xs text-muted-foreground">No data available.</p> :
                 <HorizontalBarChart data={aggregatedAnalytics.topIPs} nameKey="ip" valueKey="hits" />}
              </CardContent>
            </Card>
          ) : ( 
             renderTopListCard("Top Attacker IPs", aggregatedAnalytics?.topIPs, "ip", Fingerprint, isAggregatedLoading && !isWindowShoppingTier, aggregatedError, currentDashboardTier)
          )}

          {isAnalyticsTier ? (
            <Card className="border-accent/30 shadow-lg">
              <CardHeader><div className="flex items-center gap-2"><ListFilter className="h-5 w-5 text-accent" /><CardTitle className="text-md font-medium text-accent">Top User Agents</CardTitle></div></CardHeader>
              <CardContent className="min-h-[150px]">
                {isAggregatedLoading && !isWindowShoppingTier ? <Skeleton className="h-40 w-full" /> : aggregatedError ? <p className="text-xs text-destructive">{aggregatedError}</p> :
                 !aggregatedAnalytics?.topUserAgents || aggregatedAnalytics.topUserAgents.length === 0 ? <p className="text-xs text-muted-foreground">No data available.</p> :
                 <HorizontalBarChart data={aggregatedAnalytics.topUserAgents} nameKey="userAgent" valueKey="hits" />}
              </CardContent>
            </Card>
          ) : ( 
            renderTopListCard("Top User Agents", aggregatedAnalytics?.topUserAgents, "userAgent", ListFilter, isAggregatedLoading && !isWindowShoppingTier, aggregatedError, currentDashboardTier)
          )}
          
           {renderTopListCard("Top Paths Hit", aggregatedAnalytics?.topPaths, "path", FileText, isAggregatedLoading && !isWindowShoppingTier, aggregatedError, currentDashboardTier)}
           {renderDistributionCard("HTTP Method Distribution", aggregatedAnalytics?.methodDistribution, Server, isAggregatedLoading && !isWindowShoppingTier, aggregatedError, isAnalyticsTier, currentDashboardTier)}
           {renderDistributionCard("HTTP Status Code Distribution", aggregatedAnalytics?.statusDistribution, BarChart3, isAggregatedLoading && !isWindowShoppingTier, aggregatedError, isAnalyticsTier, currentDashboardTier)}
        </section>
      ) : (isAggregatedLoading && !isWindowShoppingTier) ? (
           <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
              {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
          </section>
      ) : (
        <p className="text-muted-foreground text-center py-4">No aggregated summary data found for the selected range, or data is still loading.</p>
      )}
      

      <Separator className="my-8 border-primary/20" />
      <h2 className="text-2xl font-semibold text-primary mt-8 mb-4">
        {isWindowShoppingTier ? "Activity Details (Demo Data)" : 
         isSetAndForgetTier ? "Activity Hits Over Time (Summarized)" : 
         "Recent Activity Details (from latest " + LOG_FETCH_LIMIT + " API logs - Analytics Tier)"}
      </h2>
      <section>
        <Card className="shadow-lg border-primary/20">
          <CardHeader>
            <CardTitle className="text-xl text-primary">Total Hits Over Time
                {isWindowShoppingTier ? " (Demo)" : isSetAndForgetTier ? " (Summarized)" : " (API Range)"}
            </CardTitle>
            <CardDescription>
                {isWindowShoppingTier ? "Illustrative demo of tarpit hits." :
                 isSetAndForgetTier ? "Total tarpit hits from aggregated summaries for the selected range." :
                 `Total tarpit hits from API logs for the selected range (Analytics Tier).`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TrappedCrawlersChart 
                apiLogs={isAnalyticsTier ? apiLogsData : []} 
                summaryHitsOverTime={isWindowShoppingTier ? PLACEHOLDER_SUMMARY_HITS_OVER_TIME_DEMO(selectedRangeHours) : (isSetAndForgetTier || isAnalyticsTier ) ? aggregatedAnalytics?.summaryHitsOverTime : []}
                isLoading={isAnalyticsTier ? apiLoading : (isSetAndForgetTier ? isAggregatedLoading : false)} 
                selectedRangeHours={selectedRangeHours}
                tier={currentDashboardTier}
            />
          </CardContent>
        </Card>
      </section>
      
      {isAnalyticsTier && (
        <section className="mt-8">
            <Card className="shadow-lg border-accent/20">
            <CardHeader>
                <div className="flex items-center gap-2"> <ListFilter className="h-6 w-6 text-accent" /> <CardTitle className="text-xl text-accent">Detailed Activity Logs (Last {LOG_FETCH_LIMIT} for range)</CardTitle> </div>
                <CardDescription>Raw log entries from your tarpit instances for the selected range (via API - Analytics Tier).</CardDescription>
            </CardHeader>
            <CardContent>
                <ApiLogTable logs={apiLogsData} isLoading={apiLoading} error={apiError} />
            </CardContent>
            </Card>
        </section>
      )}
      {(isSetAndForgetTier || isWindowShoppingTier) && (
          <Alert variant="default" className="border-primary/20 bg-card/50 my-8">
            <Lock className="h-5 w-5 text-primary" />
            <AlertTitle className="text-primary">Detailed Logs - Analytics Tier Feature</AlertTitle>
            <AlertDescription className="text-muted-foreground">
                Access to the detailed raw activity log table is available in the <strong className="text-accent">Analytics Tier</strong>.
                {isWindowShoppingTier && " Upgrade to a paid plan to unlock live data and detailed logs!"}
            </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
    

    

    