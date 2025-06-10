import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp, Eye, ExternalLink, RefreshCw } from 'lucide-react';
import { useAnalyticsData } from '@/hooks/use-analytics-data';
import { trackCustomUrlVisit } from '@/lib/analytics';
import { useAuth } from '@/hooks/use-auth';

// Helper function to get visit data from localStorage
const getUrlVisitData = (url: string) => {
  try {
    const stored = localStorage.getItem('localhost_analytics_data');
    if (stored) {
      const analytics = JSON.parse(stored);
      const visits = analytics.visits[url] || 0;
      const sessions = analytics.sessions?.filter((s: any) => s.url === url) || [];
      const lastVisit = sessions.length > 0 ? sessions[sessions.length - 1].timestamp : null;
      
      return { visits, lastVisit };
    }
  } catch (error) {
    console.warn('Failed to get visit data:', error);
  }
  
  return { visits: 0, lastVisit: null };
};

interface VisitCountWidgetProps {
  compact?: boolean;
  showAddButton?: boolean;
  userDefinedUrl?: string;
  className?: string;
}

export default function VisitCountWidget({ compact = false, showAddButton = true, userDefinedUrl, className }: VisitCountWidgetProps) {
  const { user } = useAuth();
  const [trackedUrls] = useState([
    '/dashboard?utm_source=email',
    '/marketplace?category=deals',
    '/links?ref=social'
  ]);
  
  const { data: analyticsData, isLoading, refetch } = useAnalyticsData();
  
  const simulateVisit = (url: string) => {
    trackCustomUrlVisit(url, {}, user?.id.toString());
    refetch();
  };

  if (compact) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-accent" />
              <div>
                <p className="text-sm font-medium text-foreground">총 방문</p>
                <p className="text-lg font-bold text-foreground">
                  {isLoading ? '...' : analyticsData?.totalVisits.toLocaleString()}
                </p>
              </div>
            </div>
            <Button
              onClick={() => refetch()}
              size="sm"
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-card border-border ${className || ''}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-foreground flex items-center space-x-2">
          <Eye className="w-5 h-5" />
          <span>실시간 방문 추적</span>
        </CardTitle>
        <Button
          onClick={() => refetch()}
          size="sm"
          variant="ghost"
          className="text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">1</p>
            <p className="text-xs text-muted-foreground">오늘</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">0</p>
            <p className="text-xs text-muted-foreground">어제</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">0</p>
            <p className="text-xs text-muted-foreground">전체</p>
          </div>
        </div>

        {/* Real-time URL Tracking */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground">최근 추적 URL</h4>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>실시간</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-background rounded border">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-foreground">대시보드</span>
                  <span className="text-xs text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded">새 방문</span>
                </div>
                <p className="text-xs text-muted-foreground font-mono">/dashboard?user_id={user?.id}</p>
              </div>
              <Button
                onClick={() => simulateVisit(`/dashboard?user_id=${user?.id}`)}
                size="sm"
                variant="ghost"
                className="text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-2 bg-background rounded border">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-foreground">마켓플레이스</span>
                  <span className="text-xs text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">최근 방문</span>
                </div>
                <p className="text-xs text-muted-foreground font-mono">/marketplace?category=deals</p>
              </div>
              <Button
                onClick={() => simulateVisit('/marketplace?category=deals')}
                size="sm"
                variant="ghost"
                className="text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-2 bg-background rounded border">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-foreground">링크</span>
                  <span className="text-xs text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">활성 링크</span>
                </div>
                <p className="text-xs text-muted-foreground font-mono">/links?ref=social</p>
              </div>
              <Button
                onClick={() => simulateVisit('/links?ref=social')}
                size="sm"
                variant="ghost"
                className="text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={() => window.location.href = '/analytics'}
          >
            <TrendingUp className="w-3 h-3 mr-1" />
            전체 분석 보기
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}