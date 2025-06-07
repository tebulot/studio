
'use client';

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import TrappedCrawlersChart from "@/components/dashboard/TrappedCrawlersChart"; // Will be updated
import ApiLogTable from "@/components/dashboard/ApiLogTable"; // New component
import { ShieldCheck, Users, DollarSign, Info, Fingerprint, ListFilter, Activity } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase/clientApp";
import { collection, query, where, onSnapshot, type DocumentData, type QuerySnapshot } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label"; // Added import
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

const LOG_FETCH_LIMIT = 250; // Default limit for fetching logs

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  // State for "Active Tarpit Instances" - remains from Firestore
  const [activeInstancesCount, setActiveInstancesCount] = useState<number | null>(null);
  const [isLoadingInstancesCount, setIsLoadingInstancesCount] = useState(true);

  // New state for API-driven logs
  const [apiLogsData, setApiLogsData] = useState<ApiLogEntry[]>([]);
  const [apiLoading, setApiLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedRangeHours, setSelectedRangeHours] = useState<number>(24); // Default to 24 hours

  // Listener for active instances count (reads from tarpit_configs) - Unchanged
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

  // Fetch logs from the new /v1/logs API
  useEffect(() => {
    if (authLoading || !user) {
      setApiLoading(true);
      setApiLogsData([]);
      if (!user && !authLoading) {
        setApiLoading(false);
      }
      return;
    }

    const fetchApiLogs = async () => {
      setApiLoading(true);
      setApiError(null);
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
        } else {
          throw new Error(result.message || "API returned success=false or no data.");
        }
      } catch (err) {
        console.error("Error fetching API logs:", err);
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
        setApiError(errorMessage);
        toast({ title: "Log Fetch Error", description: errorMessage, variant: "destructive" });
        setApiLogsData([]);
      } finally {
        setApiLoading(false);
      }
    };

    fetchApiLogs();
  }, [user, authLoading, toast, selectedRangeHours]);

  // Memoized calculations for KPIs from API data
  const kpiStats = useMemo(() => {
    if (!apiLogsData || apiLogsData.length === 0) {
      return {
        totalHitsInRange: 0,
        uniqueAttackerIpsInRange: 0,
        mostProbedPath: { path: "N/A", hits: 0 },
        uniqueUserAgentsInRange: 0,
      };
    }

    const uniqueIps = new Set(apiLogsData.map(log => log.source_ip)).size;
    const uniqueUserAgents = new Set(apiLogsData.map(log => log.user_agent)).size;

    const pathCounts: Record<string, number> = {};
    apiLogsData.forEach(log => {
      pathCounts[log.path] = (pathCounts[log.path] || 0) + 1;
    });
    let mostProbedPath = "N/A";
    let maxHits = 0;
    for (const path in pathCounts) {
      if (pathCounts[path] > maxHits) {
        mostProbedPath = path;
        maxHits = pathCounts[path];
      }
    }
    
    return {
      totalHitsInRange: apiLogsData.length,
      uniqueAttackerIpsInRange: uniqueIps,
      mostProbedPath: { path: mostProbedPath, hits: maxHits },
      uniqueUserAgentsInRange: uniqueUserAgents,
    };
  }, [apiLogsData]);

  const illustrativeCost = (kpiStats.totalHitsInRange * 0.0001).toFixed(4);

  const handleRangeChange = (value: string) => {
    setSelectedRangeHours(Number(value));
  };
  
  const isLoadingKpis = apiLoading; // KPIs depend on API logs

  return (
    <div className="space-y-8">
      <header className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-primary glitch-text">Dashboard</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Overview of your SpiteSpiral Tarpit activity and performance.
          </p>
        </div>
        <div className="flex items-center gap-2">
            <Label htmlFor="timeRange" className="text-sm text-muted-foreground whitespace-nowrap">Time Range:</Label>
            <Select value={String(selectedRangeHours)} onValueChange={handleRangeChange} disabled={apiLoading}>
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
        <AlertTitle className="text-accent">Data Source Notice</AlertTitle>
        <AlertDescription className="text-muted-foreground">
          Dashboard statistics are now powered by a near real-time API, providing up-to-date insights into crawler activity. The table below shows up to {LOG_FETCH_LIMIT} most recent log entries for the selected range.
        </AlertDescription>
      </Alert>
      
      {apiError && (
         <Alert variant="destructive" className="mb-6">
          <Activity className="h-5 w-5" />
          <AlertTitle>API Error</AlertTitle>
          <AlertDescription>
            Could not load activity logs: {apiError}
          </AlertDescription>
        </Alert>
      )}

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
        <Card className="border-primary/30 shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Total Hits (in range)</CardTitle>
            <Users className="h-6 w-6 text-accent" />
          </CardHeader>
          <CardContent>
            {isLoadingKpis ? (
              <Skeleton className="h-8 w-1/2" />
            ) : (
              <div className="text-3xl font-bold text-foreground">{kpiStats.totalHitsInRange}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Hits recorded for the selected time range (up to {LOG_FETCH_LIMIT} logs shown).</p>
          </CardContent>
        </Card>

        <Card className="border-accent/30 shadow-lg shadow-accent/10 hover:shadow-accent/20 transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-accent">Unique Attacker IPs (in range)</CardTitle>
            <Fingerprint className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoadingKpis ? (
              <Skeleton className="h-8 w-1/2" />
            ) : (
              <div className="text-3xl font-bold text-foreground">{kpiStats.uniqueAttackerIpsInRange}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Unique source IPs from displayed logs.</p>
          </CardContent>
        </Card>
        
        <Card className="border-primary/30 shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-1.5">
              <CardTitle className="text-sm font-medium text-primary">Illustrative Compute Wasted</CardTitle>
              <TooltipProvider>
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-popover text-popover-foreground border-primary/50 max-w-xs">
                    <p className="text-xs">
                      Each hit shown contributes $0.0001 to this illustrative total.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <DollarSign className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoadingKpis ? (
              <Skeleton className="h-8 w-1/2" />
            ) : (
              <div className="text-3xl font-bold text-foreground">${illustrativeCost}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Based on displayed hits in the current range.</p>
          </CardContent>
        </Card>

        <Card className="border-accent/30 shadow-lg shadow-accent/10 hover:shadow-accent/20 transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-accent">Active Tarpit Instances</CardTitle>
            <ShieldCheck className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoadingInstancesCount ? (
              <Skeleton className="h-8 w-1/2" />
            ) : (
              <div className="text-3xl font-bold text-foreground">{activeInstancesCount ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Currently configured managed URLs.</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          <Card className="border-primary/30 shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-shadow duration-300">
              <CardHeader>
                  <CardTitle className="text-lg font-medium text-primary">Most Probed Path (in range)</CardTitle>
              </CardHeader>
              <CardContent>
                  {isLoadingKpis ? (
                      <Skeleton className="h-8 w-3/4" />
                  ) : (
                      <div className="text-2xl font-bold text-foreground truncate" title={kpiStats.mostProbedPath.path}>
                          {kpiStats.mostProbedPath.path}
                      </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                      {isLoadingKpis ? <Skeleton className="h-4 w-1/2" /> : `${kpiStats.mostProbedPath.hits} hits to this path in displayed logs.`}
                  </p>
              </CardContent>
          </Card>
          <Card className="border-accent/30 shadow-lg shadow-accent/10 hover:shadow-accent/20 transition-shadow duration-300">
              <CardHeader>
                  <CardTitle className="text-lg font-medium text-accent">Unique User Agents (in range)</CardTitle>
              </CardHeader>
              <CardContent>
                  {isLoadingKpis ? (
                      <Skeleton className="h-8 w-1/2" />
                  ) : (
                      <div className="text-2xl font-bold text-foreground">{kpiStats.uniqueUserAgentsInRange}</div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">Unique User-Agent strings from displayed logs.</p>
              </CardContent>
          </Card>
      </section>

      <section>
        <Card className="shadow-lg border-primary/20">
          <CardHeader>
            <CardTitle className="text-xl text-primary">Total Hits Over Time (in range)</CardTitle>
            <CardDescription>Total tarpit hits from API logs for the selected range.</CardDescription>
          </CardHeader>
          <CardContent>
            <TrappedCrawlersChart 
              apiLogs={apiLogsData} 
              isLoading={apiLoading} 
              selectedRangeHours={selectedRangeHours} 
            />
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="shadow-lg border-accent/20">
          <CardHeader>
             <div className="flex items-center gap-2">
                <ListFilter className="h-6 w-6 text-accent" />
                <CardTitle className="text-xl text-accent">Detailed Activity Logs (Last {LOG_FETCH_LIMIT} for range)</CardTitle>
            </div>
            <CardDescription>Raw log entries from your tarpit instances for the selected range.</CardDescription>
          </CardHeader>
          <CardContent>
            <ApiLogTable logs={apiLogsData} isLoading={apiLoading} error={apiError} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
