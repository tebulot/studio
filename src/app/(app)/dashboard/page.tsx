
'use client'; // Convert to client component for hooks and data fetching

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import TrappedCrawlersChart from "@/components/dashboard/TrappedCrawlersChart";
import RecentActivityTable from "@/components/dashboard/RecentActivityTable";
import { ShieldCheck, Users, DollarSign, Cpu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase/clientApp";
import { collection, query, where, onSnapshot, type DocumentData } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [activeInstancesCount, setActiveInstancesCount] = useState<number | null>(null);
  const [isLoadingCount, setIsLoadingCount] = useState(true);

  useEffect(() => {
    if (authLoading) {
      setIsLoadingCount(true);
      return;
    }

    if (user) {
      setIsLoadingCount(true);
      const q = query(collection(db, "tarpit_configs"), where("userId", "==", user.uid));
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        setActiveInstancesCount(querySnapshot.size);
        setIsLoadingCount(false);
      }, (error) => {
        console.error("Error fetching active instances count:", error);
        setActiveInstancesCount(0); // Or some error state
        setIsLoadingCount(false);
      });

      return () => unsubscribe(); // Cleanup listener on component unmount
    } else {
      // No user, so no instances
      setActiveInstancesCount(0);
      setIsLoadingCount(false);
    }
  }, [user, authLoading]);

  return (
    <div className="space-y-8">
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-primary glitch-text">Dashboard</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Overview of your SpiteSpiral Tarpit activity and performance.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-primary/30 shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Total Crawlers Trapped</CardTitle>
            <Users className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">1,234</div> {/* Placeholder */}
            <p className="text-xs text-muted-foreground mt-1">+20.1% from last month</p> {/* Placeholder */}
          </CardContent>
        </Card>
        <Card className="border-accent/30 shadow-lg shadow-accent/10 hover:shadow-accent/20 transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-accent">Active Tarpit Instances</CardTitle>
            <ShieldCheck className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoadingCount ? (
              <Skeleton className="h-8 w-1/2" />
            ) : (
              <div className="text-3xl font-bold text-foreground">{activeInstancesCount ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Currently configured managed URLs</p>
          </CardContent>
        </Card>
        <Card className="border-primary/30 shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Crawler Compute Wasted</CardTitle>
            <DollarSign className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">$75.80</div> {/* Placeholder */}
            <p className="text-xs text-muted-foreground mt-1">Wasted by trapped crawlers this month</p> {/* Placeholder */}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="shadow-lg border-primary/20">
          <CardHeader>
            <CardTitle className="text-xl text-primary">Crawler Activity Over Time</CardTitle>
            <CardDescription>Visual representation of trapped crawlers in the last 30 days.</CardDescription>
          </CardHeader>
          <CardContent>
            <TrappedCrawlersChart />
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="shadow-lg border-accent/20">
          <CardHeader>
            <CardTitle className="text-xl text-accent">Recent Activity Logs</CardTitle>
            <CardDescription>Latest interactions with your tarpit instances.</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentActivityTable />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
