
"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip } from "recharts";
import { ChartTooltipContent, ChartContainer, ChartConfig } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO, eachHourOfInterval, eachDayOfInterval, startOfHour, startOfDay } from 'date-fns'; // Ensure this line is uncommented
import { Info } from "lucide-react";

interface ApiLogEntry {
  timestamp: number; // Millisecond Unix timestamp
}

interface SummaryDataPoint {
    date: string; // ISO string
    hits: number;
}

const chartConfig = {
  hits: { 
    label: "Total Hits",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

interface TrappedCrawlersChartProps {
  apiLogs: ApiLogEntry[];
  summaryHitsOverTime?: SummaryDataPoint[];
  isLoading: boolean;
  selectedRangeHours: number;
  tier: 'window' | 'setforget' | 'analytics';
}

export default function TrappedCrawlersChart({ apiLogs, summaryHitsOverTime, isLoading, selectedRangeHours, tier }: TrappedCrawlersChartProps) {

  const processedChartData = useMemo(() => {
    let dataToProcess: Array<{ date: string; hits: number }> = [];

    if (tier === 'analytics' && apiLogs && apiLogs.length > 0) {
        // Process apiLogs for Analytics tier
        const now = new Date();
        const endDate = now;
        const startDate = new Date(now.getTime() - selectedRangeHours * 60 * 60 * 1000);
        let intervalPoints: Date[];
        let aggregationFormat: string;

        if (selectedRangeHours <= 48) {
            intervalPoints = eachHourOfInterval({ start: startDate, end: endDate });
            aggregationFormat = 'yyyy-MM-dd HH';
        } else {
            intervalPoints = eachDayOfInterval({ start: startDate, end: endDate });
            aggregationFormat = 'yyyy-MM-dd';
        }
        
        const hitsByInterval: { [key: string]: number } = {};
        intervalPoints.forEach(point => { hitsByInterval[format(point, aggregationFormat)] = 0; });

        apiLogs.forEach(log => {
            const logDate = new Date(log.timestamp);
            let intervalKey: string;
            if (selectedRangeHours <= 48) { intervalKey = format(startOfHour(logDate), aggregationFormat); } 
            else { intervalKey = format(startOfDay(logDate), aggregationFormat); }
            if (hitsByInterval[intervalKey] !== undefined) { hitsByInterval[intervalKey]++; }
        });
        dataToProcess = intervalPoints.map(point => ({ date: point.toISOString(), hits: hitsByInterval[format(point, aggregationFormat)] || 0 }));

    } else if ((tier === 'setforget' || tier === 'window') && summaryHitsOverTime && summaryHitsOverTime.length > 0) {
        // Use pre-aggregated summaryHitsOverTime for Set & Forget or Window Shopping
        dataToProcess = summaryHitsOverTime;
    } else {
        // For Window Shopping, if summaryHitsOverTime is specifically for demo and might be empty, 
        // or for other tiers if data isn't ready yet.
        return [];
    }
    return dataToProcess;

  }, [apiLogs, summaryHitsOverTime, selectedRangeHours, tier]);


  if (isLoading && tier !== 'window') { // Window shopping uses static data, no loading skeleton needed for chart if data is present
    return (
      <div className="h-[350px] w-full flex items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }
  
  const noActivity = processedChartData.every(dataPoint => dataPoint.hits === 0);

  if (processedChartData.length === 0 || noActivity) {
    return (
      <div className="h-[350px] w-full flex flex-col items-center justify-center text-center p-4">
        <Info className="h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-lg font-semibold text-muted-foreground">No Activity Data for Chart</p>
        <p className="text-sm text-muted-foreground max-w-md">
          No tarpit activity recorded for the selected time range, or data is still loading.
          {tier === 'window' && " (This is demo data)"}
        </p>
      </div>
    );
  }
  
  let xAxisTickFormatter: (value: string) => string;
  if (selectedRangeHours <= 24) { 
    xAxisTickFormatter = (value) => format(parseISO(value), 'HH:00');
  } else if (selectedRangeHours <= 48) {
     xAxisTickFormatter = (value) => format(parseISO(value), 'MMM dd HH:00');
  } else { 
    xAxisTickFormatter = (value) => format(parseISO(value), 'MMM dd');
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
              tickFormatter={xAxisTickFormatter}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis 
              tickLine={false} 
              axisLine={false} 
              tickMargin={8}
              stroke="hsl(var(--muted-foreground))"
              allowDecimals={false}
              label={{ value: 'Total Hits', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))', fontSize: 12, offset:10 }}
            />
            <RechartsTooltip
              cursor={false}
              content={<ChartTooltipContent 
                          indicator="dot" 
                          labelFormatter={(label, payload) => {
                            if (payload && payload.length > 0 && payload[0].payload.date) {
                                return format(parseISO(payload[0].payload.date), 'PPP p');
                            }
                            return label;
                          }}
                       />}
              wrapperStyle={{ outline: "none" }}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--popover))', 
                borderColor: 'hsl(var(--border))',
                borderRadius: 'var(--radius)',
                color: 'hsl(var(--popover-foreground))'
              }}
            />
            <Bar dataKey="hits" fill="var(--color-hits)" radius={selectedRangeHours <= 48 ? 2 : 4} />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}

    
