
"use client";

import { useState, useEffect } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip } from "recharts";
import { ChartTooltipContent, ChartContainer, ChartConfig } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase/clientApp";
import { collection, query, where, getDocs, orderBy, Timestamp, type DocumentData } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns';

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

const chartConfig = {
  hits: { // Changed from crawlers to hits
    label: "Total Hits",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

interface TrappedCrawlersChartProps {
  userIdOverride?: string;
}

interface ChartDataPoint {
  date: string; 
  hits: number; // Changed from crawlers to hits
}

interface ActivitySummaryDoc {
  // Assuming these fields exist in your tarpit_activity_summaries documents
  startTime: Timestamp;
  endTime: Timestamp;
  totalHits: number;
  userId: string;
  // other fields like uniqueIpCount, etc., are not directly used by this chart version
}

export default function TrappedCrawlersChart({ userIdOverride }: TrappedCrawlersChartProps) {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [processedChartData, setProcessedChartData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const currentUserId = userIdOverride || user?.uid;

    if (!userIdOverride && authLoading) {
      setIsLoading(true);
      return;
    }

    if (!currentUserId) {
      setProcessedChartData([]);
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      const cacheKey = `spiteSpiral_summaryChartData_${currentUserId}`;
      const timestampKey = `spiteSpiral_summaryChartData_timestamp_${currentUserId}`;

      try {
        const cachedTimestampStr = localStorage.getItem(timestampKey);
        const cachedTimestamp = cachedTimestampStr ? parseInt(cachedTimestampStr, 10) : 0;

        if (Date.now() - cachedTimestamp < CACHE_DURATION) {
          const cachedData = localStorage.getItem(cacheKey);
          if (cachedData) {
            setProcessedChartData(JSON.parse(cachedData));
            setIsLoading(false);
            // console.log("Loaded summary chart data from cache for:", currentUserId);
            return;
          }
        }
        // console.log("Fetching fresh summary chart data for:", currentUserId);

        const thirtyDaysAgoDate = startOfDay(subDays(new Date(), 29)); // Ensure we include today
        const todayDate = endOfDay(new Date());

        const q = query(
          collection(db, "tarpit_activity_summaries"), // Query the new summaries collection
          where("userId", "==", currentUserId),
          where("startTime", ">=", Timestamp.fromDate(thirtyDaysAgoDate)), // Filter by summaries starting in the last 30 days
          orderBy("startTime", "asc") 
        );

        const querySnapshot = await getDocs(q);
        
        const dailyHits: { [dateStr: string]: number } = {};
        const daysInPeriod = eachDayOfInterval({ start: thirtyDaysAgoDate, end: todayDate });

        daysInPeriod.forEach(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          dailyHits[dateStr] = 0; // Initialize all days in the period with 0 hits
        });

        querySnapshot.forEach((doc) => {
          const data = doc.data() as ActivitySummaryDoc;
          if (data.startTime && data.totalHits && data.startTime instanceof Timestamp) {
            const summaryStartDate = data.startTime.toDate();
            // Check if the summary window (even partially) falls within the last 30 days until today
            if (summaryStartDate <= todayDate && summaryStartDate >= thirtyDaysAgoDate) {
                const dateStr = format(summaryStartDate, 'yyyy-MM-dd');
                if (dailyHits[dateStr] !== undefined) { // Check if the date exists (it should due to initialization)
                    dailyHits[dateStr] += data.totalHits;
                }
            }
          }
        });
        
        const finalChartData: ChartDataPoint[] = daysInPeriod.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            return {
                date: dateStr,
                hits: dailyHits[dateStr] || 0,
            };
        });
        
        setProcessedChartData(finalChartData);
        localStorage.setItem(cacheKey, JSON.stringify(finalChartData));
        localStorage.setItem(timestampKey, Date.now().toString());

      } catch (error) {
        console.error("Error fetching summary chart data:", error);
        toast({
          title: "Error Fetching Chart Data",
          description: "Could not fetch activity summary for the chart. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userIdOverride, user, authLoading, toast]);


  if (isLoading) {
    return (
      <div className="h-[350px] w-full flex items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  const noActivity = processedChartData.every(dataPoint => dataPoint.hits === 0);

  if (processedChartData.length === 0 || noActivity) {
    return (
      <div className="h-[350px] w-full flex items-center justify-center">
        <p className="text-muted-foreground">
          {userIdOverride 
            ? "No crawler activity summaries recorded for the demo in the last 30 days." 
            : "No crawler activity summaries recorded in the last 30 days."}
        </p>
      </div>
    );
  }

  return (
    <div className="h-[350px] w-full">
      <ChartContainer config={chartConfig} className="h-full w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={processedChartData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.5)" />
            <XAxis 
              dataKey="date" 
              tickLine={false} 
              axisLine={false} 
              tickMargin={8} 
              tickFormatter={(value) => format(new Date(value + 'T00:00:00'), 'MMM dd')}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis 
              tickLine={false} 
              axisLine={false} 
              tickMargin={8}
              stroke="hsl(var(--muted-foreground))"
              allowDecimals={false}
              label={{ value: 'Total Hits', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))', fontSize: 12, offset: 10 }}
            />
            <RechartsTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
              wrapperStyle={{ outline: "none" }}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--popover))', 
                borderColor: 'hsl(var(--border))',
                borderRadius: 'var(--radius)',
                color: 'hsl(var(--popover-foreground))'
              }}
            />
            <Bar dataKey="hits" fill="var(--color-hits)" radius={4} />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}

    