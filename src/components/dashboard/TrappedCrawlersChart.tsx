"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { ChartTooltipContent, ChartContainer, ChartConfig } from "@/components/ui/chart";

const chartData = [
  { date: "2024-06-01", crawlers: Math.floor(Math.random() * 100) + 50 },
  { date: "2024-06-02", crawlers: Math.floor(Math.random() * 100) + 50 },
  { date: "2024-06-03", crawlers: Math.floor(Math.random() * 100) + 50 },
  { date: "2024-06-04", crawlers: Math.floor(Math.random() * 100) + 50 },
  { date: "2024-06-05", crawlers: Math.floor(Math.random() * 100) + 50 },
  { date: "2024-06-06", crawlers: Math.floor(Math.random() * 100) + 50 },
  { date: "2024-06-07", crawlers: Math.floor(Math.random() * 100) + 50 },
];

const chartConfig = {
  crawlers: {
    label: "Crawlers",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;


export default function TrappedCrawlersChart() {
  return (
    <div className="h-[350px] w-full">
      <ChartContainer config={chartConfig} className="h-full w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.5)" />
            <XAxis 
              dataKey="date" 
              tickLine={false} 
              axisLine={false} 
              tickMargin={8} 
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis 
              tickLine={false} 
              axisLine={false} 
              tickMargin={8}
              stroke="hsl(var(--muted-foreground))"
            />
            <Tooltip
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
