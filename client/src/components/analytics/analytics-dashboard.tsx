import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Eye, 
  ExternalLink, 
  Plus,
  Trash2,
  RefreshCw,
  Clock
} from 'lucide-react';
import { useAnalyticsData, useUrlVisitCounts, useRealTimeVisits } from '@/hooks/use-analytics-data';
import { trackCustomUrlVisit } from '@/lib/analytics';
import { useAuth } from '@/hooks/use-auth';

interface TrackedUrl {
  id: string;
  url: string;
  label: string;
  parameters?: Record<string, string>;
}

export default function AnalyticsDashboard() {
  const { user } = useAuth();
  const [trackedUrls, setTrackedUrls] = useState<TrackedUrl[]>([]);

  // Load tracked URLs from localStorage
  useEffect(() => {
    if (user?.id) {
      const stored = localStorage.getItem(`tracked_urls_${user.id}`);
      if (stored) {
        try {
          const urls = JSON.parse(stored);
          const trackedUrlObjects = urls.map((url: string, index: number) => ({
            id: index.toString(),
            url,
            label: getUrlLabel(url),
            parameters: getUrlParameters(url)
          }));
          setTrackedUrls(trackedUrlObjects);
        } catch (e) {
          console.error('Error loading tracked URLs:', e);
        }
      }
    }
  }, [user?.id]);

  // Listen for tracked URL updates
  useEffect(() => {
    const handleTrackedUrlsUpdate = () => {
      if (user?.id) {
        const stored = localStorage.getItem(`tracked_urls_${user.id}`);
        if (stored) {
          try {
            const urls = JSON.parse(stored);
            const trackedUrlObjects = urls.map((url: string, index: number) => ({
              id: index.toString(),
              url,
              label: getUrlLabel(url),
              parameters: getUrlParameters(url)
            }));
            setTrackedUrls(trackedUrlObjects);
          } catch (e) {
            console.error('Error loading tracked URLs:', e);
          }
        }
      }
    };

    window.addEventListener('tracked-urls-updated', handleTrackedUrlsUpdate);
    return () => window.removeEventListener('tracked-urls-updated', handleTrackedUrlsUpdate);
  }, [user?.id]);

  const getUrlLabel = (url: string) => {
    if (url.includes('dashboard')) return '대시보드';
    if (url.includes('marketplace')) return '마켓플레이스';
    if (url.includes('links')) return '링크';
    if (url.includes('analytics')) return '분석';
    if (url.includes('settings')) return '설정';
    if (url.includes('perplexity')) return 'Perplexity 검색';
    return new URL(url).hostname || 'URL';
  };

  const getUrlParameters = (url: string) => {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `http://localhost${url}`);
      const params: Record<string, string> = {};
      urlObj.searchParams.forEach((value, key) => {
        params[key] = value;
      });
      return Object.keys(params).length > 0 ? params : undefined;
    } catch (e) {
      return undefined;
    }
  };
  
  const [newUrl, setNewUrl] = useState('');
  const [newLabel, setNewLabel] = useState('');
  
  const { data: analyticsData, isLoading: analyticsLoading, refetch: refetchAnalytics } = useAnalyticsData();
  const { data: urlVisitData, isLoading: urlVisitsLoading, refetch: refetchUrlVisits } = useUrlVisitCounts(
    trackedUrls.map(item => item.url)
  );
  
  const { visitCounts, incrementVisit, lastUpdate } = useRealTimeVisits(15000);

  // Calculate total visits across all tracked URLs
  const getTotalCustomVisits = () => {
    let totalFromData = 0;
    let totalRealtime = 0;
    
    if (urlVisitData) {
      totalFromData = urlVisitData.reduce((sum, item) => sum + item.visits, 0);
    }
    
    trackedUrls.forEach(url => {
      totalRealtime += visitCounts[url.url] || 0;
    });
    
    return totalFromData + totalRealtime;
  };

  // Calculate total unique visitors
  const getTotalUniqueVisitors = () => {
    if (!urlVisitData) return 0;
    return urlVisitData.reduce((sum, item) => sum + item.uniqueVisitors, 0);
  };

  const addTrackedUrl = () => {
    if (!newUrl.trim() || !newLabel.trim()) return;
    
    // Add to localStorage for persistence across components
    if (user?.id) {
      const stored = localStorage.getItem(`tracked_urls_${user.id}`);
      let urls: string[] = [];
      if (stored) {
        try {
          urls = JSON.parse(stored);
        } catch (e) {
          console.error('Error parsing stored URLs:', e);
        }
      }
      
      if (!urls.includes(newUrl.trim())) {
        urls.push(newUrl.trim());
        localStorage.setItem(`tracked_urls_${user.id}`, JSON.stringify(urls));
        
        // Trigger update event
        window.dispatchEvent(new Event('tracked-urls-updated'));
      }
    }
    
    setNewUrl('');
    setNewLabel('');
  };

  const removeTrackedUrl = (id: string) => {
    setTrackedUrls(prev => prev.filter(item => item.id !== id));
  };

  const simulateVisit = (url: string) => {
    const trackedUrl = trackedUrls.find(item => item.url === url);
    if (trackedUrl) {
      // Track the visit first
      trackCustomUrlVisit(url, trackedUrl.parameters, user?.id.toString());
      incrementVisit(url);
      
      // Navigate to the URL if it's an internal route
      if (url.startsWith('/')) {
        window.location.href = url;
      } else {
        // For external URLs, open in new tab
        window.open(url, '_blank');
      }
    }
  };

  const formatLastUpdate = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}초 전`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
    return `${Math.floor(diffInSeconds / 3600)}시간 전`;
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-[#F5F3F0] border-[#E8E3DD]">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Eye className="w-5 h-5 text-[#8B4513]" />
              <div>
                <p className="text-sm text-[#A0825C]">총 방문</p>
                <p className="text-xl font-bold text-[#8B4513]">
                  {urlVisitsLoading ? '...' : (
                    urlVisitData?.reduce((total, item) => total + item.visits, 0) || 0
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#F5F3F0] border-[#E8E3DD]">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-[#8B4513]" />
              <div>
                <p className="text-sm text-[#A0825C]">순 방문자</p>
                <p className="text-xl font-bold text-[#8B4513]">
                  {urlVisitsLoading ? '...' : (
                    urlVisitData?.reduce((total, item) => total + item.uniqueVisitors, 0) || 0
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#F5F3F0] border-[#E8E3DD]">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-[#8B4513]" />
              <div>
                <p className="text-sm text-[#A0825C]">커스텀 URL</p>
                <p className="text-xl font-bold text-[#8B4513]">
                  {trackedUrls.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#F5F3F0] border-[#E8E3DD]">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-[#8B4513]" />
              <div>
                <p className="text-sm text-[#A0825C]">업데이트</p>
                <p className="text-sm font-medium text-[#8B4513]">
                  {formatLastUpdate(lastUpdate)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add New URL Tracking */}
      <Card className="bg-[#F5F3F0] border-[#E8E3DD]">
        <CardHeader>
          <CardTitle className="text-[#8B4513] flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>새 URL 추적 추가</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-[#8B4513] mb-2 block">URL</label>
              <Input
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="/page?param1=value1&param2=value2"
                className="bg-[#EAE5DE] border-[#D4CAB8] text-[#8B4513] focus:border-[#8B4513]"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#8B4513] mb-2 block">라벨</label>
              <Input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="설명적인 라벨"
                className="bg-[#EAE5DE] border-[#D4CAB8] text-[#8B4513] focus:border-[#8B4513]"
              />
            </div>
          </div>
          <Button 
            onClick={addTrackedUrl}
            disabled={!newUrl.trim() || !newLabel.trim()}
            className="bg-[#8B4513] text-white hover:bg-[#7A3F0F]"
          >
            <Plus className="w-4 h-4 mr-2" />
            URL 추가
          </Button>
        </CardContent>
      </Card>

      {/* Tracked URLs */}
      <Card className="bg-[#F5F3F0] border-[#E8E3DD]">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-[#8B4513] flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>추적 중인 URL 방문 횟수</span>
          </CardTitle>
          <Button
            onClick={() => {
              refetchAnalytics();
              refetchUrlVisits();
            }}
            size="sm"
            variant="outline"
            className="border-[#D4CAB8] text-[#8B4513] hover:bg-[#EAE5DE] hover:text-[#5D2F0A]"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {trackedUrls.map((trackedUrl) => {
              const visitData = urlVisitData?.find(data => data.url === trackedUrl.url);
              const realtimeCount = visitCounts[trackedUrl.url] || 0;
              const totalVisits = (visitData?.visits || 0) + realtimeCount;
              
              return (
                <div 
                  key={trackedUrl.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#EAE5DE] rounded-lg border border-[#D4CAB8] gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h4 className="font-medium text-[#8B4513] truncate">{trackedUrl.label}</h4>
                      <Badge variant="secondary" className="bg-[#D4CAB8] text-[#8B4513] flex-shrink-0">
                        {totalVisits.toLocaleString()} 방문
                      </Badge>
                      {realtimeCount > 0 && (
                        <Badge variant="outline" className="border-green-500 text-green-600 flex-shrink-0">
                          +{realtimeCount} 실시간
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-[#A0825C] font-mono mb-2 break-all">{trackedUrl.url}</p>
                    
                    {trackedUrl.parameters && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {Object.entries(trackedUrl.parameters).map(([key, value]) => (
                          <Badge 
                            key={key} 
                            variant="outline"
                            className="text-xs border-[#D4CAB8] text-[#8B4513]"
                          >
                            {key}: {value}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {visitData && (
                      <div className="text-xs text-[#B8967A]">
                        순 방문자: {visitData.uniqueVisitors} | 
                        마지막 방문: {new Date(visitData.lastVisit).toLocaleDateString('ko-KR')}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      onClick={() => simulateVisit(trackedUrl.url)}
                      size="sm"
                      variant="outline"
                      className="border-[#D4CAB8] text-[#A0825C] hover:bg-[#D4CAB8] hover:text-[#5D2F0A] h-8 w-8 p-0"
                      title="방문 시뮬레이션"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => removeTrackedUrl(trackedUrl.id)}
                      size="sm"
                      variant="outline"
                      className="border-[#CD5C5C] text-[#CD5C5C] hover:bg-[#F0D0D0] hover:text-[#B22222] h-8 w-8 p-0"
                      title="URL 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
            
            {trackedUrls.length === 0 && (
              <div className="text-center py-8 text-[#A0825C]">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>아직 추적 중인 URL이 없습니다.</p>
                <p className="text-sm">위에서 새 URL을 추가해보세요.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}