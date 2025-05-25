
"use client";

import { useState, useEffect } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip } from "recharts";
import { ChartTooltipContent, ChartContainer, ChartConfig } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase/clientApp";
import { collection, query, where, getDocs, orderBy, Timestamp, type DocumentData } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { format, subDays, startOfDay } from 'date-fns';

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

const chartConfig = {
  crawlers: {
    label: "Unique Crawlers",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

interface TrappedCrawlersChartProps {
  userIdOverride?: string;
}

interface ChartDataPoint {
  date: string; 
  crawlers: number;
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
      const cacheKey = `spiteSpiral_chartData_${currentUserId}`;
      const timestampKey = `spiteSpiral_chartData_timestamp_${currentUserId}`;

      try {
        const cachedTimestampStr = localStorage.getItem(timestampKey);
        const cachedTimestamp = cachedTimestampStr ? parseInt(cachedTimestampStr, 10) : 0;

        if (Date.now() - cachedTimestamp < CACHE_DURATION) {
          const cachedData = localStorage.getItem(cacheKey);
          if (cachedData) {
            setProcessedChartData(JSON.parse(cachedData));
            setIsLoading(false);
            // console.log("Loaded chart data from cache for:", currentUserId);
            return;
          }
        }
        // console.log("Fetching fresh chart data for:", currentUserId);

        const thirtyDaysAgoTimestamp = Timestamp.fromDate(startOfDay(subDays(new Date(), 30)));
        const q = query(
          collection(db, "tarpit_logs"),
          where("userId", "==", currentUserId),
          where("timestamp", ">=", thirtyDaysAgoTimestamp),
          orderBy("timestamp", "asc")
        );

        const querySnapshot = await getDocs(q);

        const dailyActivity: { [dateStr: string]: Set<string> } = {}; 

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.timestamp && data.trappedBotIp && data.timestamp instanceof Timestamp) {
            const logTimestamp = data.timestamp.toDate();
            // Ensure we only count logs from the last 30 days relative to today
            if (logTimestamp >= startOfDay(subDays(new Date(), 30))) { 
              const dateStr = format(logTimestamp, 'yyyy-MM-dd');
              if (!dailyActivity[dateStr]) {
                dailyActivity[dateStr] = new Set<string>();
              }
              dailyActivity[dateStr].add(data.trappedBotIp as string);
            }
          }
        });

        const finalChartData: ChartDataPoint[] = [];
        for (let i = 0; i < 30; i++) {
          const date = startOfDay(subDays(new Date(), 29 - i)); // Iterate from 29 days ago to today
          const dateStr = format(date, 'yyyy-MM-dd');
          
          finalChartData.push({
            date: dateStr, // Store as "YYYY-MM-DD"
            crawlers: dailyActivity[dateStr] ? dailyActivity[dateStr].size : 0,
          });
        }
        
        setProcessedChartData(finalChartData);
        localStorage.setItem(cacheKey, JSON.stringify(finalChartData));
        localStorage.setItem(timestampKey, Date.now().toString());

      } catch (error) {
        console.error("Error fetching chart data:", error);
        toast({
          title: "Error Fetching Chart Data",
          description: "Could not fetch crawler activity for the chart. Please try again later.",
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

  const noActivity = processedChartData.every(dataPoint => dataPoint.crawlers === 0);

  if (processedChartData.length === 0 || noActivity) {
    return (
      <div className="h-[350px] w-full flex items-center justify-center">
        <p className="text-muted-foreground">
          {userIdOverride 
            ? "No crawler activity recorded for the demo in the last 30 days." 
            : "No crawler activity recorded in the last 30 days."}
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
              tickFormatter={(value) => format(new Date(value + 'T00:00:00'), 'MMM dd')} // Ensure date is parsed correctly
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis 
              tickLine={false} 
              axisLine={false} 
              tickMargin={8}
              stroke="hsl(var(--muted-foreground))"
              allowDecimals={false}
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
            <Bar dataKey="crawlers" fill="var(--color-crawlers)" radius={4} />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
