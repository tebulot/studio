'use client';

import { useSpiteSpiralAnalytics, useSpiteSpiralHealth } from '@/hooks/useSpiteSpiralAnalytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, AlertCircle, Globe, Shield, Users, Zap, TrendingUp, BarChart3 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { GeographicThreatMap } from './GeographicThreatMap';
import type { AnalyticsResponse } from '@/lib/spitespiral-api';

interface AnalyticsDashboardProps {
  analyticsData?: AnalyticsResponse;
  isLoading?: boolean;
  error?: any;
  isDemo?: boolean;
}

export function AnalyticsDashboard({ analyticsData, isLoading, error, isDemo = false }: AnalyticsDashboardProps) {
  const { userProfile } = useAuth();
  const healthQuery = useSpiteSpiralHealth();
  const defaultAnalyticsQuery = useSpiteSpiralAnalytics();
  
  // Use provided props or fall back to hooks
  const analyticsQuery = {
    data: analyticsData || defaultAnalyticsQuery.data,
    isLoading: isLoading !== undefined ? isLoading : defaultAnalyticsQuery.isLoading,
    isError: error !== undefined ? !!error : defaultAnalyticsQuery.isError,
    error: error || defaultAnalyticsQuery.error,
    isSuccess: analyticsData ? true : defaultAnalyticsQuery.isSuccess
  };

  const tierBadgeVariant = (tier: string) => {
    switch (tier) {
      case 'enterprise':
        return 'default';
      case 'analytics':
        return 'secondary';
      case 'core':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const tierDisplayName = (tier: string) => {
    switch (tier) {
      case 'enterprise':
        return 'Enterprise';
      case 'analytics':
        return 'Analytics';
      case 'core':
        return 'Core';
      case 'window_shopping':
        return 'Free';
      case 'demo':
        return 'Demo';
      default:
        return tier;
    }
  };

  // Backend health status
  const backendStatus = healthQuery.isError ? 'error' : healthQuery.isLoading ? 'loading' : 'healthy';

  return (
    <div className="space-y-6">
      {/* Header with tier and backend status */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            {isDemo ? 'Sample analytics data from our tarpit network' : 'Real-time threat intelligence and behavioral analytics'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={isDemo ? 'secondary' : tierBadgeVariant(userProfile?.subscriptionTier || 'window_shopping')}>
            {isDemo ? 'Demo' : tierDisplayName(userProfile?.subscriptionTier || 'window_shopping')} Tier
          </Badge>
          <Badge variant={backendStatus === 'healthy' ? 'outline' : backendStatus === 'error' ? 'destructive' : 'secondary'}>
            Backend: {backendStatus === 'healthy' ? 'Connected' : backendStatus === 'error' ? 'Disconnected' : 'Connecting...'}
          </Badge>
        </div>
      </div>

      {/* Error states */}
      {analyticsQuery.isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Failed to load analytics</AlertTitle>
          <AlertDescription>
            {analyticsQuery.error instanceof Error ? analyticsQuery.error.message : 'An unexpected error occurred'}
          </AlertDescription>
        </Alert>
      )}

      {/* Payment required state */}
      {analyticsQuery.error && 'status' in analyticsQuery.error && analyticsQuery.error.status === 402 && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertTitle>Upgrade Required</AlertTitle>
          <AlertDescription>
            Analytics access requires a paid subscription. Upgrade to Core tier or higher to view detailed analytics.
          </AlertDescription>
        </Alert>
      )}

      {/* Loading state */}
      {analyticsQuery.isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-3 w-48 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Analytics data */}
      {analyticsQuery.isSuccess && analyticsQuery.data && (
        <>
          {/* Key metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsQuery.data.data.requests?.total || 
                   analyticsQuery.data.data.summary?.totalRequests || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Last 24 hours
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unique IPs</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsQuery.data.data.requests?.unique_ips || 
                   analyticsQuery.data.data.summary?.uniqueIPs || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Distinct visitors
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Tarpits</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsQuery.data.tarpitCount}</div>
                <p className="text-xs text-muted-foreground">
                  Currently deployed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Threat Level</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsQuery.data.data.summary?.threatLevel || 
                   (analyticsQuery.data.data.patterns?.high_confidence || 0) > 10 ? 'High' : 'Low'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Based on patterns detected
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Geographic threat map */}
          {analyticsQuery.data.data.geographic && analyticsQuery.data.data.geographic.length > 0 && (
            <GeographicThreatMap data={analyticsQuery.data.data.geographic} />
          )}

          {/* Time series chart for Analytics and Enterprise tiers */}
          {analyticsQuery.data.data.timeSeriesData && analyticsQuery.data.data.timeSeriesData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Request Volume Over Time</CardTitle>
                <CardDescription>
                  Hourly request distribution for the last 24 hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={analyticsQuery.data.data.timeSeriesData}>
                    <defs>
                      <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="time" 
                      tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    />
                    <YAxis />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                      formatter={(value: any) => [value, 'Requests']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="requests" 
                      stroke="#8884d8" 
                      fillOpacity={1} 
                      fill="url(#colorRequests)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Geographic distribution for Analytics and Enterprise tiers */}
          {analyticsQuery.data.data.geographic && analyticsQuery.data.data.geographic.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Geographic Distribution</CardTitle>
                <CardDescription>
                  Top countries by request volume
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={analyticsQuery.data.data.geographic.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="country" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="requests" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Behavioral patterns for Analytics and Enterprise tiers */}
          {analyticsQuery.data.data.behavioral && analyticsQuery.data.data.behavioral.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Detected Behavioral Patterns</CardTitle>
                <CardDescription>
                  Crawler and bot patterns identified by ML analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsQuery.data.data.behavioral.slice(0, 5).map((pattern, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{pattern.pattern}</p>
                          <p className="text-xs text-muted-foreground">
                            {pattern.occurrences} occurrences
                          </p>
                        </div>
                      </div>
                      <Badge variant={pattern.avg_confidence > 0.8 ? 'destructive' : 'secondary'}>
                        {(pattern.avg_confidence * 100).toFixed(0)}% confidence
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* STIX indicators for Enterprise tier */}
          {analyticsQuery.data.data.stixIndicators && analyticsQuery.data.data.stixIndicators.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>STIX Threat Intelligence</CardTitle>
                <CardDescription>
                  Network-wide threat indicators from the SpiteSpiral community
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsQuery.data.data.stixIndicators.slice(0, 5).map((indicator) => (
                    <div key={indicator.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{indicator.type}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {indicator.pattern.substring(0, 50)}...
                          </p>
                        </div>
                      </div>
                      <Badge variant="destructive">
                        {(indicator.confidence * 100).toFixed(0)}% threat
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}