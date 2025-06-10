import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BarChart3, TrendingUp, Eye, ExternalLink, RefreshCw, Plus, Trash2 } from 'lucide-react';
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
  const [trackedUrls, setTrackedUrls] = useState<string[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  
  const { data: analyticsData, isLoading, refetch } = useAnalyticsData();
  
  const simulateVisit = (url: string) => {
    trackCustomUrlVisit(url, {}, user?.id.toString());
    refetch();
  };

  const addUrl = () => {
    if (newUrl.trim() && !trackedUrls.includes(newUrl.trim())) {
      setTrackedUrls([...trackedUrls, newUrl.trim()]);
      setNewUrl('');
      setShowAddForm(false);
    }
  };

  const removeUrl = (urlToRemove: string) => {
    setTrackedUrls(trackedUrls.filter(url => url !== urlToRemove));
  };

  const getUrlLabel = (url: string) => {
    if (url.includes('dashboard')) return '대시보드';
    if (url.includes('marketplace')) return '마켓플레이스';
    if (url.includes('links')) return '링크';
    if (url.includes('analytics')) return '분석';
    if (url.includes('settings')) return '설정';
    return 'URL';
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
    <Card className={`bg-white border border-gray-200 shadow-sm ${className || ''}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-4 pt-4">
        <CardTitle className="text-gray-800 flex items-center space-x-2">
          <Eye className="w-5 h-5 text-blue-600" />
          <span className="text-base font-semibold">실시간 방문 추적</span>
        </CardTitle>
        <Button
          onClick={() => refetch()}
          size="sm"
          variant="ghost"
          className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 h-8 w-8 p-0"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="px-4 pb-4 space-y-4">
        {/* Quick Stats - Real Data */}
        <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="text-center">
            <p className="text-xl font-bold text-gray-800">
              {trackedUrls.reduce((total, url) => total + getUrlVisitData(url).visits, 0)}
            </p>
            <p className="text-xs text-gray-600">총 방문</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-gray-800">
              {trackedUrls.length}
            </p>
            <p className="text-xs text-gray-600">추적 URL</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-gray-800">
              {trackedUrls.filter(url => getUrlVisitData(url).visits > 0).length}
            </p>
            <p className="text-xs text-gray-600">활성 URL</p>
          </div>
        </div>

        {/* Real-time URL Tracking */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-800">최근 추적 URL</h4>
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>실시간</span>
            </div>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {trackedUrls.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">추적 가능한 URL 없음</p>
                <p className="text-xs text-muted-foreground mt-1">URL을 추가하여 방문 추적을 시작하세요</p>
              </div>
            ) : (
              trackedUrls.map((url, index) => {
                const visitData = getUrlVisitData(url);
                const label = getUrlLabel(url);
                
                return (
                  <div key={index} className="bg-background rounded-lg border border-gray-200 overflow-hidden">
                    <div className="p-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-foreground truncate">{label}</span>
                            <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0">
                              {visitData.visits}회 방문
                            </span>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground font-mono break-all leading-relaxed bg-gray-50 px-2 py-1 rounded">
                              {url}
                            </p>
                            {visitData.lastVisit && (
                              <p className="text-xs text-muted-foreground">
                                마지막 방문: {new Date(visitData.lastVisit).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          
                          {/* URL Parameters Tags */}
                          {url.includes('?') && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {url.split('?')[1]?.split('&').slice(0, 3).map((param, paramIndex) => {
                                const [key, value] = param.split('=');
                                return (
                                  <span key={paramIndex} className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-nowrap">
                                    {key}: {value}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-1 flex-shrink-0">
                          <Button
                            onClick={() => simulateVisit(url)}
                            size="sm"
                            variant="ghost"
                            className="text-muted-foreground hover:text-blue-600 hover:bg-blue-50 h-7 w-7 p-0"
                            title="방문 시뮬레이션"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            onClick={() => removeUrl(url)}
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-600 hover:bg-red-50 h-7 w-7 p-0"
                            title="URL 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            
            {/* Add URL Form */}
            {showAddForm ? (
              <div className="border border-dashed border-gray-300 rounded-lg p-3 bg-gray-50/50">
                <div className="space-y-3">
                  <Input
                    placeholder="URL 입력 (예: /dashboard?utm_source=email)"
                    value={newUrl}
                    onChange={(e: any) => setNewUrl(e.target.value)}
                    onKeyPress={(e: any) => e.key === 'Enter' && addUrl()}
                    className="text-sm border-gray-300 focus:border-primary"
                    autoFocus
                  />
                  <div className="flex space-x-2">
                    <Button
                      onClick={addUrl}
                      size="sm"
                      className="flex-1 h-8"
                      disabled={!newUrl.trim()}
                    >
                      추가
                    </Button>
                    <Button
                      onClick={() => {
                        setShowAddForm(false);
                        setNewUrl('');
                      }}
                      size="sm"
                      variant="outline"
                      className="flex-1 h-8"
                    >
                      취소
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => setShowAddForm(true)}
                variant="outline"
                size="sm"
                className="w-full border-dashed border-gray-300 hover:border-primary hover:bg-primary/5 h-10"
              >
                <Plus className="w-4 h-4 mr-2" />
                URL 추가하기
              </Button>
            )}
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