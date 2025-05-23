
"use client";

import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "lucide-react"; // Added for Links Followed icon

interface Activity {
  ip: string;
  userAgent: string;
  timestamp: string; // ISO string
  status: string;
  linksFollowed: number; // New field
}

const generateRecentActivity = (): Activity[] => [
  { ip: "192.168.1.101", userAgent: "Googlebot/2.1", timestamp: new Date().toISOString(), status: "Trapped", linksFollowed: Math.floor(Math.random() * 50) + 5 },
  { ip: "10.0.0.5", userAgent: "AhrefsBot", timestamp: new Date(Date.now() - 3600000).toISOString(), status: "Slowed", linksFollowed: Math.floor(Math.random() * 30) + 2 },
  { ip: "172.16.0.23", userAgent: "SemrushBot", timestamp: new Date(Date.now() - 7200000).toISOString(), status: "Trapped", linksFollowed: Math.floor(Math.random() * 70) + 10 },
  { ip: "203.0.113.45", userAgent: "SuspiciousUA/1.0", timestamp: new Date(Date.now() - 10800000).toISOString(), status: "Blocked", linksFollowed: 0 }, // Blocked, so 0 links
  { ip: "198.51.100.12", userAgent: "Bingbot/2.0", timestamp: new Date(Date.now() - 14400000).toISOString(), status: "Trapped", linksFollowed: Math.floor(Math.random() * 60) + 8 },
  { ip: "192.0.2.88", userAgent: "Unknown Crawler", timestamp: new Date(Date.now() - 18000000).toISOString(), status: "Analyzed", linksFollowed: Math.floor(Math.random() * 20) + 1 },
];

export default function RecentActivityTable() {
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setRecentActivity(generateRecentActivity());
      setIsLoading(false);
    }, 700); // Simulate network delay
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <ScrollArea className="h-[400px] rounded-md border border-border">
        <Table>
          <TableHeader className="sticky top-0 bg-muted/50 backdrop-blur-sm">
            <TableRow>
              <TableHead className="text-accent">IP Address</TableHead>
              <TableHead className="text-accent">User Agent</TableHead>
              <TableHead className="text-accent">Timestamp</TableHead>
              <TableHead className="text-accent">Status</TableHead>
              <TableHead className="text-right text-accent">Links Followed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, index) => (
              <TableRow key={index}>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    );
  }

  return (
    <ScrollArea className="h-[400px] rounded-md border border-border">
      <Table>
        <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
          <TableRow>
            <TableHead className="text-accent">IP Address</TableHead>
            <TableHead className="text-accent">User Agent</TableHead>
            <TableHead className="text-accent">Timestamp</TableHead>
            <TableHead className="text-accent">Status</TableHead>
            <TableHead className="text-right text-accent">
              <div className="flex items-center justify-end">
                <Link className="h-4 w-4 mr-1" />
                Links Followed
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recentActivity.map((activity, index) => (
            <TableRow key={index} className="hover:bg-muted/30">
              <TableCell className="font-medium text-foreground/90">{activity.ip}</TableCell>
              <TableCell className="text-muted-foreground max-w-xs truncate">{activity.userAgent}</TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(activity.timestamp).toLocaleString()}
              </TableCell>
              <TableCell>
                <Badge
                  variant={activity.status === "Trapped" ? "default" : activity.status === "Blocked" ? "destructive" : "secondary"}
                  className={
                    activity.status === "Trapped" ? "bg-primary/80 text-primary-foreground" :
                    activity.status === "Blocked" ? "bg-destructive/80 text-destructive-foreground" :
                    activity.status === "Slowed" ? "bg-accent/80 text-accent-foreground" :
                    "bg-secondary text-secondary-foreground"
                  }
                >
                  {activity.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-medium text-primary">
                {activity.linksFollowed}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
