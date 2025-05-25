
"use client";

import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase/clientApp";
import { collection, query, where, onSnapshot, orderBy, Timestamp, type DocumentData, type QueryDocumentSnapshot } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

interface TarpitLogEntry {
  id: string; // Firestore document ID
  timestamp: Timestamp;
  trappedBotIp: string;
  userAgent: string;
  managedUrlId: string;
  managedUrlPath: string;
  userId: string;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "OTHER" | string;
  status?: number;
  responseType?: "Trapped" | "Slowed" | "Blocked" | "Served" | string;
  requestBodySnippet?: string;
}

interface RequestLogTableProps {
  userIdOverride?: string;
}

export default function RequestLogTable({ userIdOverride }: RequestLogTableProps) {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [logs, setLogs] = useState<TarpitLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const currentUserId = userIdOverride || user?.uid;

    if (!userIdOverride && authLoading) {
      setIsLoading(true);
      return;
    }
    
    if (!currentUserId) {
      setLogs([]);
      setIsLoading(false);
      if (!userIdOverride) { 
        // console.log("No user ID available for RequestLogTable.");
      }
      return;
    }

    setIsLoading(true);
    const q = query(
      collection(db, "tarpit_logs"),
      where("userId", "==", currentUserId),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedLogs: TarpitLogEntry[] = [];
      querySnapshot.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
        const data = docSnap.data();
        if (data.timestamp && data.trappedBotIp && data.userAgent && data.managedUrlPath) {
          fetchedLogs.push({
            id: docSnap.id,
            timestamp: data.timestamp as Timestamp,
            trappedBotIp: data.trappedBotIp as string,
            userAgent: data.userAgent as string,
            managedUrlId: data.managedUrlId as string,
            managedUrlPath: data.managedUrlPath as string,
            userId: data.userId as string,
            method: data.method as string | undefined,
            status: data.status as number | undefined,
            responseType: data.responseType as string | undefined,
            requestBodySnippet: data.requestBodySnippet as string | undefined,
          });
        }
      });
      setLogs(fetchedLogs);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching request logs:", error);
      toast({
        title: "Error Fetching Logs",
        description: "Could not fetch request logs. Check console for details.",
        variant: "destructive",
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userIdOverride, user, authLoading, toast]);

  const getBadgeVariant = (responseType?: string) => {
    switch (responseType) {
      case "Trapped": return "default";
      case "Blocked": return "destructive";
      case "Slowed": return "secondary";
      default: return "outline";
    }
  };

  const getBadgeClass = (responseType?: string) => {
    switch (responseType) {
      case "Trapped": return "bg-primary/80 text-primary-foreground";
      case "Blocked": return "bg-destructive/80 text-destructive-foreground";
      case "Slowed": return "bg-accent/80 text-accent-foreground";
      default: return "border-border";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(7)].map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return <p className="text-muted-foreground text-center py-4">
      {userIdOverride ? "No demo logs found for this configuration." : "No request logs available yet. Once your tarpits are active and interacting with crawlers, logs will appear here."}
    </p>;
  }

  return (
    <TooltipProvider>
      <ScrollArea className="h-[600px] rounded-md border border-border">
        <Table>
          <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
            <TableRow>
              <TableHead className="text-accent w-[180px]">Timestamp</TableHead>
              <TableHead className="text-accent w-[80px]">Method</TableHead>
              <TableHead className="text-accent">Path Hit</TableHead>
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
                  {log.timestamp ? new Date(log.timestamp.toDate()).toLocaleString() : 'N/A'}
                </TableCell>
                <TableCell>
                  <Badge variant={log.method === "POST" || log.method === "PUT" ? "secondary" : "outline"}
                         className={log.method === "POST" || log.method === "PUT" ? "bg-accent/70 text-accent-foreground" : ""}>
                    {log.method || 'N/A'}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium text-foreground/90 text-sm break-all">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="truncate block max-w-[200px] hover:underline cursor-help">{log.managedUrlPath}</span>
                    </TooltipTrigger>
                    <TooltipContent className="bg-popover text-popover-foreground border-primary/50 max-w-md">
                      <p>{log.managedUrlPath}</p>
                      {log.requestBodySnippet && (
                        <div className="mt-2 pt-2 border-t border-border">
                          <p className="text-xs font-semibold">Request Body Snippet:</p>
                          <pre className="text-xs bg-muted/50 p-2 rounded-sm whitespace-pre-wrap break-all">{log.requestBodySnippet}</pre>
                        </div>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{log.trappedBotIp}</TableCell>
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
                  {log.status !== undefined && (
                    <Badge variant={log.status >= 400 ? "destructive" : log.status >= 300 ? "secondary" : "outline"}>
                      {log.status}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {log.responseType && (
                    <Badge variant={getBadgeVariant(log.responseType)} className={getBadgeClass(log.responseType)}>
                      {log.responseType}
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </TooltipProvider>
  );
}
