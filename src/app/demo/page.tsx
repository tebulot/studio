'use client';

import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { useSpiteSpiralDemoAnalytics } from '@/hooks/useSpiteSpiralAnalytics';

export default function DemoPage() {
  const { data: analyticsData, isLoading, error } = useSpiteSpiralDemoAnalytics();

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">SpiteSpiral Analytics Demo</h1>
        <p className="text-muted-foreground mt-2">
          Explore sample analytics data from our tarpit network
        </p>
      </div>
      <AnalyticsDashboard 
        analyticsData={analyticsData} 
        isLoading={isLoading} 
        error={error} 
        isDemo={true}
      />
    </div>
  );
}