
"use client";

import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface LogEntry {
  id: string;
  timestamp: string; // ISO string
  method: "GET" | "POST" | "PUT" | "DELETE" | "OTHER";
  path: string;
  ip: string;
  userAgent: string;
  status: number; // HTTP status code
  responseType: "Trapped" | "Slowed" | "Blocked" | "Served";
  requestBodySnippet?: string; // Optional, for POST/PUT
}

const generateMockLogs = (): LogEntry[] => {
  const now = Date.now();
  return [
    { id: "1", timestamp: new Date(now - Math.random() * 100000).toISOString(), method: "GET", path: "/trap.js", ip: "123.45.67.89", userAgent: "BadBot/1.0 (compatible; EvilScraper/2.2)", status: 200, responseType: "Trapped" },
    { id: "2", timestamp: new Date(now - Math.random() * 200000).toISOString(), method: "POST", path: "/api/submit", ip: "98.76.54.32", userAgent: "DataMiner/3.0", status: 403, responseType: "Blocked", requestBodySnippet: "{'data': 'sensitive'}" },
    { id: "3", timestamp: new Date(now - Math.random() * 300000).toISOString(), method: "GET", path: "/pixel.gif", ip: "11.22.33.44", userAgent: "Googlebot/2.1 (+http://www.google.com/bot.html)", status: 200, responseType: "Slowed" },
    { id: "4", timestamp: new Date(now - Math.random() * 400000).toISOString(), method: "GET", path: "/config.xml", ip: "55.66.77.88", userAgent: "AhrefsBot", status: 200, responseType: "Trapped" },
    { id: "5", timestamp: new Date(now - Math.random() * 500000).toISOString(), method: "POST", path: "/old/login", ip: "88.77.66.55", userAgent: "Scrapy/1.8.0 (+https://scrapy.org)", status: 200, responseType: "Trapped", requestBodySnippet: "user=admin&pass=password" },
    { id: "6", timestamp: new Date(now - Math.random() * 600000).toISOString(), method: "GET", path: "/assets/main.css", ip: "44.33.22.11", userAgent: "SemrushBot", status: 200, responseType: "Slowed" },
    { id: "7", timestamp: new Date(now - Math.random() * 700000).toISOString(), method: "GET", path: "/wp-login.php", ip: "203.0.113.45", userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36", status: 403, responseType: "Blocked" },
  ];
};

export default function RequestLogTable() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setLogs(generateMockLogs());
      setIsLoading(false);
    }, 1000);
  }, []);

  const getBadgeVariant = (responseType: LogEntry["responseType"]) => {
    switch (responseType) {
      case "Trapped": return "default"; // Primary
      case "Blocked": return "destructive";
      case "Slowed": return "secondary"; // Accent or similar
      case "Served": return "outline";
      default: return "outline";
    }
  };
   const getBadgeClass = (responseType: LogEntry["responseType"]) => {
    switch (responseType) {
      case "Trapped": return "bg-primary/80 text-primary-foreground";
      case "Blocked": return "bg-destructive/80 text-destructive-foreground";
      case "Slowed": return "bg-accent/80 text-accent-foreground"; // Using accent for "Slowed"
      default: return "border-border";
    }
  };


  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    );
  }
  
  if (logs.length === 0) {
    return <p className="text-muted-foreground text-center py-4">No request logs available yet.</p>;
  }

  return (
    <TooltipProvider>
      <ScrollArea className="h-[600px] rounded-md border border-border">
        <Table>
          <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
            <TableRow>
              <TableHead className="text-accent w-[180px]">Timestamp</TableHead>
              <TableHead className="text-accent w-[80px]">Method</TableHead>
              <TableHead className="text-accent">Path</TableHead>
              <TableHead className="text-accent w-[130px]">IP Address</TableHead>
              <TableHead className="text-accent">User Agent</TableHead>
              <TableHead className="text-accent w-[80px] text-center">Status</TableHead>
              <TableHead className="text-accent w-[100px] text-center">Response</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id} className="hover:bg-muted/30">
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(log.timestamp).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge variant={log.method === "POST" || log.method === "PUT" ? "secondary" : "outline"} 
                         className={log.method === "POST" || log.method === "PUT" ? "bg-accent/70 text-accent-foreground" : ""}>
                    {log.method}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium text-foreground/90 text-sm break-all">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="truncate block max-w-[200px] hover:underline cursor-help">{log.path}</span>
                    </TooltipTrigger>
                    <TooltipContent className="bg-popover text-popover-foreground border-primary/50 max-w-md">
                      <p>{log.path}</p>
                      {log.requestBodySnippet && (
                        <div className="mt-2 pt-2 border-t border-border">
                          <p className="text-xs font-semibold">Request Body Snippet:</p>
                          <pre className="text-xs bg-muted/50 p-2 rounded-sm whitespace-pre-wrap break-all">{log.requestBodySnippet}</pre>
                        </div>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{log.ip}</TableCell>
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
                <TableCell className="text-center text-sm">
                  <Badge variant={log.status >= 400 ? "destructive" : log.status >= 300 ? "secondary" : "outline"}>
                    {log.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={getBadgeVariant(log.responseType)} className={getBadgeClass(log.responseType)}>
                    {log.responseType}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </TooltipProvider>
  );
}
