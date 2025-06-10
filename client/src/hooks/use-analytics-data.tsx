import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAnalyticsData, getUrlVisitCounts, UrlVisitData } from '../lib/analytics';

export interface AnalyticsData {
  totalVisits: number;
  uniqueVisitors: number;
  customUrlVisits: number;
  timeRange: string;
  lastUpdated: string;
}

export const useAnalyticsData = (userDefinedUrl?: string) => {
  return useQuery({
    queryKey: ['analytics', userDefinedUrl],
    queryFn: () => getAnalyticsData(userDefinedUrl),
    refetchInterval: 30000, // Refetch every 30 seconds for near real-time data
    staleTime: 10000, // Consider data stale after 10 seconds
  });
};

export const useUrlVisitCounts = (urls: string[]) => {
  return useQuery({
    queryKey: ['url-visits', urls],
    queryFn: () => getUrlVisitCounts(urls),
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000,
    enabled: urls.length > 0,
  });
};

export const useRealTimeVisits = (refreshInterval: number = 10000) => {
  const [visitCounts, setVisitCounts] = useState<Record<string, number>>({});
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const interval = setInterval(async () => {
      // Update timestamp without automatically incrementing visit counts
      // Only manual URL clicks should increase visit statistics
      const currentTime = new Date();
      setLastUpdate(currentTime);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, lastUpdate]);

  const trackUrl = (url: string, initialCount: number = 0) => {
    setVisitCounts(prev => ({
      ...prev,
      [url]: prev[url] || initialCount
    }));
  };

  const incrementVisit = (url: string) => {
    setVisitCounts(prev => ({
      ...prev,
      [url]: (prev[url] || 0) + 1
    }));
  };

  return {
    visitCounts,
    trackUrl,
    incrementVisit,
    lastUpdate
  };
};