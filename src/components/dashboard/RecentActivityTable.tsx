"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const recentActivity = [
  { ip: "192.168.1.101", userAgent: "Googlebot/2.1", timestamp: new Date().toISOString(), status: "Trapped", severity: "Low" },
  { ip: "10.0.0.5", userAgent: "AhrefsBot", timestamp: new Date(Date.now() - 3600000).toISOString(), status: "Slowed", severity: "Medium" },
  { ip: "172.16.0.23", userAgent: "SemrushBot", timestamp: new Date(Date.now() - 7200000).toISOString(), status: "Trapped", severity: "Low" },
  { ip: "203.0.113.45", userAgent: "SuspiciousUA/1.0", timestamp: new Date(Date.now() - 10800000).toISOString(), status: "Blocked", severity: "High" },
  { ip: "198.51.100.12", userAgent: "Bingbot/2.0", timestamp: new Date(Date.now() - 14400000).toISOString(), status: "Trapped", severity: "Low" },
  { ip: "192.0.2.88", userAgent: "Unknown Crawler", timestamp: new Date(Date.now() - 18000000).toISOString(), status: "Analyzed", severity: "Medium" },
];

export default function RecentActivityTable() {
  return (
    <ScrollArea className="h-[400px] rounded-md border border-border">
      <Table>
        <TableHeader className="sticky top-0 bg-muted/50 backdrop-blur-sm">
          <TableRow>
            <TableHead className="text-accent">IP Address</TableHead>
            <TableHead className="text-accent">User Agent</TableHead>
            <TableHead className="text-accent">Timestamp</TableHead>
            <TableHead className="text-accent">Status</TableHead>
            <TableHead className="text-right text-accent">Severity</TableHead>
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
              <TableCell className="text-right">
                <Badge 
                  variant={activity.severity === "High" ? "destructive" : activity.severity === "Medium" ? "secondary" : "outline"}
                  className={
                    activity.severity === "High" ? "border-destructive text-destructive" :
                    activity.severity === "Medium" ? "border-accent text-accent" :
                    "border-primary text-primary"
                  }
                >
                  {activity.severity}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
