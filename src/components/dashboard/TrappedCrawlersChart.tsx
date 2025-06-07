
"use client";

import { useState, useEffect, useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip } from "recharts";
import { ChartTooltipContent, ChartContainer, ChartConfig } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { format, startOfHour, startOfDay, eachHourOfInterval, eachDayOfInterval, parseISO } from 'date-fns';
import { Info } from "lucide-react";

interface ApiLogEntry {
  timestamp: number; // Millisecond Unix timestamp
  // other fields from ApiLogEntry...
}

const chartConfig = {
  hits: { 
    label: "Total Hits",
    color: "hsl(var(--primary))", // Use primary color from theme
  },
} satisfies ChartConfig;

interface TrappedCrawlersChartProps {
  apiLogs: ApiLogEntry[];
  isLoading: boolean;
  selectedRangeHours: number;
}

interface ChartDataPoint {
  date: string; // Formatted date/time string for XAxis
  hits: number; 
}

export default function TrappedCrawlersChart({ apiLogs, isLoading, selectedRangeHours }: TrappedCrawlersChartProps) {

  const processedChartData = useMemo(() => {
    if (!apiLogs || apiLogs.length === 0) {
      return [];
    }

    const now = new Date();
    const endDate = now;
    const startDate = new Date(now.getTime() - selectedRangeHours * 60 * 60 * 1000);

    let intervalPoints: Date[];
    let tickFormatter: (dateStr: string) => string;
    let aggregationFormat: string; // For grouping logs

    if (selectedRangeHours <= 48) { // Up to 2 days, show hourly
      intervalPoints = eachHourOfInterval({ start: startDate, end: endDate });
      tickFormatter = (dateStr) => format(parseISO(dateStr), 'HH:00'); // HH:mm for X-axis
      aggregationFormat = 'yyyy-MM-dd HH'; // Group logs by hour
    } else if (selectedRangeHours <= 7 * 24) { // Up to 7 days, show daily
      intervalPoints = eachDayOfInterval({ start: startDate, end: endDate });
      tickFormatter = (dateStr) => format(parseISO(dateStr), 'MMM dd'); // "Jan 01" for X-axis
      aggregationFormat = 'yyyy-MM-dd'; // Group logs by day
    } else { // More than 7 days (e.g., 30 days), show daily
      intervalPoints = eachDayOfInterval({ start: startDate, end: endDate });
      tickFormatter = (dateStr) => format(parseISO(dateStr), 'MMM dd');
      aggregationFormat = 'yyyy-MM-dd';
    }
    
    const hitsByInterval: { [key: string]: number } = {};
    intervalPoints.forEach(point => {
      hitsByInterval[format(point, aggregationFormat)] = 0;
    });

    apiLogs.forEach(log => {
      const logDate = new Date(log.timestamp);
      let intervalKey: string;
      if (selectedRangeHours <= 48) {
        intervalKey = format(startOfHour(logDate), aggregationFormat);
      } else {
        intervalKey = format(startOfDay(logDate), aggregationFormat);
      }
      if (hitsByInterval[intervalKey] !== undefined) {
        hitsByInterval[intervalKey]++;
      }
    });

    return intervalPoints.map(point => {
      const key = format(point, aggregationFormat);
      return {
        date: point.toISOString(), // Store as ISO string, format for display in XAxis
        hits: hitsByInterval[key] || 0,
      };
    });

  }, [apiLogs, selectedRangeHours]);


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
      <div className="h-[350px] w-full flex flex-col items-center justify-center text-center p-4">
        <Info className="h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-lg font-semibold text-muted-foreground">No Activity Data for Chart</p>
        <p className="text-sm text-muted-foreground max-w-md">
          No tarpit activity recorded in the API logs for the selected time range, or data is still loading.
        </p>
      </div>
    );
  }
  
  // Determine tick formatter based on range for the XAxis display
  let xAxisTickFormatter: (value: string) => string;
  if (selectedRangeHours <= 24) { // 24 hours or less, show HH:00
    xAxisTickFormatter = (value) => format(parseISO(value), 'HH:00');
  } else if (selectedRangeHours <= 48) { // 25 to 48 hours, show Day HH:00
     xAxisTickFormatter = (value) => format(parseISO(value), 'MMM dd HH:00');
  } else { // More than 48 hours, show MMM dd
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
              // Interval logic for X-axis ticks might be needed for dense data
              // interval={selectedRangeHours > 7*24 ? Math.floor(processedChartData.length / 7) : 'preserveStartEnd'} // Example: show ~7 ticks for 30 days
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
                            if (payload && payload.length > 0) {
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
