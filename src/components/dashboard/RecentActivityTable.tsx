
"use client";

import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase/clientApp";
import { collection, query, where, onSnapshot, orderBy, Timestamp, type DocumentData, type QueryDocumentSnapshot, limit } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";


interface ActivityLogEntry {
  id: string; // Firestore document ID
  timestamp: Timestamp;
  trappedBotIp: string;
  userAgent: string;
  managedUrlPath: string; // The path that was hit
  userId: string;
}

interface RecentActivityTableProps {
  userIdOverride?: string;
}

export default function RecentActivityTable({ userIdOverride }: RecentActivityTableProps) {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const currentUserId = userIdOverride || user?.uid;

    if (!userIdOverride && authLoading) {
      setIsLoading(true);
      return;
    }

    if (!currentUserId) {
      setActivityLogs([]);
      setIsLoading(false);
      if (!userIdOverride) { // Only show toast if not in override mode (i.e. expecting a logged-in user)
        // console.log("No user ID available for RecentActivityTable.");
      }
      return;
    }

    setIsLoading(true);
    const q = query(
      collection(db, "tarpit_logs"),
      where("userId", "==", currentUserId),
      orderBy("timestamp", "desc"),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedLogs: ActivityLogEntry[] = [];
      querySnapshot.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
        const data = docSnap.data();
        if (data.timestamp && data.trappedBotIp && data.userAgent && data.managedUrlPath && data.userId) {
          fetchedLogs.push({
            id: docSnap.id,
            timestamp: data.timestamp as Timestamp,
            trappedBotIp: data.trappedBotIp as string,
            userAgent: data.userAgent as string,
            managedUrlPath: data.managedUrlPath as string,
            userId: data.userId as string,
          });
        }
      });
      setActivityLogs(fetchedLogs);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching recent activity logs:", error);
      toast({
        title: "Error Fetching Activity",
        description: "Could not fetch recent activity. Check console for details.",
        variant: "destructive",
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userIdOverride, user, authLoading, toast]);

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
                  {log.timestamp ? new Date(log.timestamp.toDate()).toLocaleString() : 'N/A'}
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
                      <span className="truncate block max-w-[250px] hover:underline cursor-pointer">
                        {log.managedUrlPath}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="bg-popover text-popover-foreground border-primary/50 max-w-lg">
                      <p>{log.managedUrlPath}</p>
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
