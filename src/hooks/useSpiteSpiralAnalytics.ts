import { useQuery } from '@tanstack/react-query';
import { getSpiteSpiralAPI } from '@/lib/spitespiral-api';
import { useAuth } from '@/contexts/AuthContext';

export function useSpiteSpiralHealth() {
  const api = getSpiteSpiralAPI(async () => null); // Health check doesn't need auth

  return useQuery({
    queryKey: ['spitespiral', 'health'],
    queryFn: () => api.checkHealth(),
    refetchInterval: 30000, // Check every 30 seconds
    retry: false, // Don't retry health checks
  });
}

export function useSpiteSpiralAnalytics() {
  const { user } = useAuth();
  
  const api = getSpiteSpiralAPI(async () => {
    if (!user) return null;
    try {
      const token = await user.getIdToken();
      return token;
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
  });

  return useQuery({
    queryKey: ['spitespiral', 'analytics', user?.uid],
    queryFn: () => api.getAnalytics(),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    refetchInterval: 60 * 1000, // Refetch every minute
    retry: (failureCount, error: any) => {
      // Don't retry on 402 (payment required) or 404 (no tarpits)
      if (error?.status === 402 || error?.status === 404) {
        return false;
      }
      return failureCount < 3;
    },
  });
}