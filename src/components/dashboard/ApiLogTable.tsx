
"use client";

import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertTriangle, Info, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

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

interface ApiLogTableProps {
  logs: ApiLogEntry[];
  isLoading: boolean;
  error: string | null;
}

export default function ApiLogTable({ logs, isLoading, error }: ApiLogTableProps) {
  const [filterTerm, setFilterTerm] = useState("");

  const filteredLogs = useMemo(() => {
    if (!filterTerm) {
      return logs;
    }
    const lowerCaseFilterTerm = filterTerm.toLowerCase();
    return logs.filter(log =>
      log.source_ip.toLowerCase().includes(lowerCaseFilterTerm) ||
      log.user_agent.toLowerCase().includes(lowerCaseFilterTerm) ||
      log.path.toLowerCase().includes(lowerCaseFilterTerm) ||
      log.message.toLowerCase().includes(lowerCaseFilterTerm) ||
      String(log.status_code).includes(lowerCaseFilterTerm) ||
      log.method.toLowerCase().includes(lowerCaseFilterTerm)
    );
  }, [logs, filterTerm]);

  const getHttpStatusBadgeVariant = (statusCode: number) => {
    if (statusCode >= 500) return "destructive";
    if (statusCode >= 400) return "destructive";
    if (statusCode >= 300) return "secondary";
    if (statusCode >= 200) return "default";
    return "outline";
  };

   const getHttpStatusBadgeClass = (statusCode: number) => {
    if (statusCode >= 500) return "bg-destructive text-destructive-foreground";
    if (statusCode >= 400) return "bg-amber-500 text-white";
    if (statusCode >= 300) return "bg-yellow-500 text-black";
    if (statusCode >= 200) return "bg-green-600 text-white";
    return "border-border";
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-1/3 mb-4" /> {/* Skeleton for filter input */}
        {[...Array(7)].map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-10 px-4 bg-destructive/10 border border-destructive rounded-md">
        <AlertTriangle className="h-12 w-12 text-destructive mb-3" />
        <p className="text-lg font-semibold text-destructive">Error Loading Logs</p>
        <p className="text-sm text-destructive/80 max-w-md">{error}</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Filter logs (e.g., IP, path, user agent...)"
            value={filterTerm}
            onChange={(e) => setFilterTerm(e.target.value)}
            className="pl-10 bg-background border-border focus:ring-primary"
          />
        </div>
      </div>

      {logs.length === 0 && !filterTerm && (
         <div className="flex flex-col items-center justify-center text-center py-10 px-4 bg-card border border-border rounded-md h-[550px]">
          <Info className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-lg font-semibold text-muted-foreground">No Logs Found</p>
          <p className="text-sm text-muted-foreground max-w-md">
              No activity logs found for the selected time range or your tarpits haven't recorded any activity yet.
          </p>
        </div>
      )}

      {filteredLogs.length === 0 && filterTerm && (
         <div className="flex flex-col items-center justify-center text-center py-10 px-4 bg-card border border-border rounded-md h-[550px]">
          <Search className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-lg font-semibold text-muted-foreground">No Logs Match Your Filter</p>
          <p className="text-sm text-muted-foreground max-w-md">
              Try a different search term.
          </p>
        </div>
      )}

      {(logs.length > 0 || filterTerm) && filteredLogs.length > 0 && (
        <ScrollArea className="h-[550px] rounded-md border border-border">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
              <TableRow>
                <TableHead className="text-accent w-[180px]">Timestamp</TableHead>
                <TableHead className="text-accent w-[80px]">Method</TableHead>
                <TableHead className="text-accent w-[100px] text-center">Status</TableHead>
                <TableHead className="text-accent">Path</TableHead>
                <TableHead className="text-accent w-[130px]">Source IP</TableHead>
                <TableHead className="text-accent">User Agent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log, index) => (
                <TableRow key={`${log.timestamp}-${log.source_ip}-${index}`} className="hover:bg-muted/30">
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(log.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={log.method === "POST" || log.method === "PUT" ? "secondary" : "outline"}
                      className={log.method === "POST" || log.method === "PUT" ? "bg-accent/70 text-accent-foreground" : ""}
                    >
                      {log.method || 'N/A'}
                    </Badge>
                  </TableCell>
                   <TableCell className="text-center">
                      <Badge
                          variant={getHttpStatusBadgeVariant(log.status_code)}
                          className={getHttpStatusBadgeClass(log.status_code)}
                      >
                          {log.status_code}
                      </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-foreground/90 break-all">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="truncate block max-w-[200px] hover:underline cursor-pointer">{log.path || '/'}</span>
                      </TooltipTrigger>
                      <TooltipContent className="bg-popover text-popover-foreground border-primary/50 max-w-md">
                        <p>Full Path: {log.path || '/'}</p>
                        <p className="text-xs text-muted-foreground mt-1">Message: {log.message}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{log.source_ip}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                     <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="truncate block max-w-[200px] cursor-help">{log.user_agent}</span>
                      </TooltipTrigger>
                      <TooltipContent className="bg-popover text-popover-foreground border-primary/50 max-w-lg">
                        <p>{log.user_agent}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      )}
    </TooltipProvider>
  );
}

    