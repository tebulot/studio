
"use client";

import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; // Keep for potentially long UAs or URLs

interface ActivityLogEntry {
  id: string; // Added for unique key
  timestamp: string; // ISO string
  trappedBotIp: string;
  userAgent: string;
  managedUrlHit: string;
}

const generateMockActivityLogs = (): ActivityLogEntry[] => {
  const now = Date.now();
  const baseTarpitUrl = process.env.NEXT_PUBLIC_TARPIT_BASE_URL || "https://tarpit.example.com";
  return [
    { id: "log1", timestamp: new Date(now - Math.random() * 100000).toISOString(), trappedBotIp: "192.168.1.101", userAgent: "Googlebot/2.1 (+http://www.google.com/bot.html)", managedUrlHit: `${baseTarpitUrl}/trap/abc-123-def` },
    { id: "log2", timestamp: new Date(now - Math.random() * 200000).toISOString(), trappedBotIp: "10.0.0.5", userAgent: "AhrefsBot (https://ahrefs.com/robot/)", managedUrlHit: `${baseTarpitUrl}/trap/xyz-789-uvw` },
    { id: "log3", timestamp: new Date(now - Math.random() * 300000).toISOString(), trappedBotIp: "172.16.0.23", userAgent: "SemrushBot/7~bl", managedUrlHit: `${baseTarpitUrl}/trap/main-site-trap` },
    { id: "log4", timestamp: new Date(now - Math.random() * 400000).toISOString(), trappedBotIp: "203.0.113.45", userAgent: "MaliciousUA/1.0 (compatible; EvilScraper/2.2)", managedUrlHit: `${baseTarpitUrl}/trap/blog-post-lure` },
    { id: "log5", timestamp: new Date(now - Math.random() * 500000).toISOString(), trappedBotIp: "198.51.100.12", userAgent: "Bingbot/2.0 (+http://www.bing.com/bingbot.htm)", managedUrlHit: `${baseTarpitUrl}/trap/product-page-snare` },
    { id: "log6", timestamp: new Date(now - Math.random() * 600000).toISOString(), trappedBotIp: "192.0.2.88", userAgent: "Unknown Crawler Gecko/20100101 Firefox/90.0", managedUrlHit: `${baseTarpitUrl}/trap/legacy-path-hook` },
  ];
};

export default function RecentActivityTable() {
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setActivityLogs(generateMockActivityLogs());
      setIsLoading(false);
    }, 700); // Simulate network delay
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <ScrollArea className="h-[400px] rounded-md border border-border">
        <Table>
          <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
            <TableRow>
              <TableHead className="text-accent w-[180px]">Timestamp</TableHead>
              <TableHead className="text-accent w-[130px]">Trapped Bot IP</TableHead>
              <TableHead className="text-accent">User Agent</TableHead>
              <TableHead className="text-accent">Managed URL Hit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, index) => (
              <TableRow key={index}>
                <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                <TableCell><Skeleton className="h-5 w-40" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    );
  }
  
  if (activityLogs.length === 0) {
    return <p className="text-muted-foreground text-center py-4">No recent activity logged yet.</p>;
  }

  return (
    <TooltipProvider>
      <ScrollArea className="h-[400px] rounded-md border border-border">
        <Table>
          <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
            <TableRow>
              <TableHead className="text-accent w-[180px]">Timestamp</TableHead>
              <TableHead className="text-accent w-[130px]">Trapped Bot IP</TableHead>
              <TableHead className="text-accent">User Agent</TableHead>
              <TableHead className="text-accent">Managed URL Hit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activityLogs.map((log) => (
              <TableRow key={log.id} className="hover:bg-muted/30">
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(log.timestamp).toLocaleString()}
                </TableCell>
                <TableCell className="font-medium text-foreground/90">{log.trappedBotIp}</TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="truncate block max-w-[250px] cursor-help">{log.userAgent}</span>
                    </TooltipTrigger>
                    <TooltipContent className="bg-popover text-popover-foreground border-primary/50 max-w-lg">
                      <p>{log.userAgent}</p>
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell className="text-sm text-primary/90 break-all">
                   <Tooltip>
                    <TooltipTrigger asChild>
                      <a href={log.managedUrlHit} target="_blank" rel="noopener noreferrer" className="truncate block max-w-[250px] hover:underline cursor-pointer">
                        {log.managedUrlHit}
                      </a>
                    </TooltipTrigger>
                    <TooltipContent className="bg-popover text-popover-foreground border-primary/50 max-w-lg">
                      <p>{log.managedUrlHit}</p>
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </TooltipProvider>
  );
}
