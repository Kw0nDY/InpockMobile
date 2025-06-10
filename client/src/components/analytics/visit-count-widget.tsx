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
}

export default function VisitCountWidget({ compact = false, showAddButton = true }: VisitCountWidgetProps) {
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
    <Card className="bg-card border-border">
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
            <p className="text-2xl font-bold text-foreground">
              {isLoading ? '...' : analyticsData?.totalVisits.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">총 방문</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">
              {isLoading ? '...' : analyticsData?.uniqueVisitors.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">순 방문자</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">
              {isLoading ? '...' : analyticsData?.customUrlVisits.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">커스텀 URL</p>
          </div>
        </div>

        {/* Quick Access URLs */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground mb-2">빠른 추적 URL</h4>
          {trackedUrls.map((url, index) => {
            const visitData = getUrlVisitData(url);
            const label = url.includes('dashboard') ? '대시보드' : 
                         url.includes('marketplace') ? '마켓플레이스' : '링크';
            
            return (
              <div 
                key={index}
                className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-foreground">{label}</span>
                    <Badge variant="secondary" className="bg-accent/20 text-accent text-xs">
                      {visitData.visits}회 방문
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono mt-1">{url}</p>
                  {visitData.lastVisit && (
                    <p className="text-xs text-muted-foreground mt-1">
                      마지막 방문: {new Date(visitData.lastVisit).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <Button
                  onClick={() => simulateVisit(url)}
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            );
          })}
        </div>

        {showAddButton && (
          <Button 
            variant="outline" 
            className="w-full border-border text-foreground hover:bg-muted"
            onClick={() => window.location.href = '/analytics'}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            전체 분석 보기
          </Button>
        )}
      </CardContent>
    </Card>
  );
}