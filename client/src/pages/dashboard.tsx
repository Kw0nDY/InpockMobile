import {
  Bell,
  Link,
  TrendingUp,
  MessageCircle,
  BarChart3,
  Users,
  Copy,
  Image,
  Video,
  ExternalLink,
  Plus,
  Trash2,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import NotificationDropdown from "@/components/ui/notification-dropdown";

import { ImageModal, VideoModal, LinkPreview } from "@/components/ui/media-modal";
import { useEffect, useState } from "react";
import { trackPageView } from "@/lib/analytics";
import { useAnalyticsData, useUrlVisitCounts, useRealTimeVisits } from "@/hooks/use-analytics-data";
import { clearAllAnalyticsData, initCleanAnalytics } from "@/lib/clear-analytics";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function DashboardPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: [`/api/dashboard/stats/${user?.id}`],
    enabled: !!user?.id,
  });

  const { data: userData } = useQuery({
    queryKey: [`/api/user/${user?.id}`],
    enabled: !!user?.id,
  });

  const { data: settingsData } = useQuery({
    queryKey: [`/api/settings/${user?.id}`],
    enabled: !!user?.id,
  });

  const { data: mediaData } = useQuery({
    queryKey: [`/api/media/${user?.id}`],
    enabled: !!user?.id,
  });

  const { data: images = [] } = useQuery({
    queryKey: [`/api/media/${user?.id}/image`],
    enabled: !!user?.id,
  });

  const { data: videos = [] } = useQuery({
    queryKey: [`/api/media/${user?.id}/video`],
    enabled: !!user?.id,
  });

  const { data: linksData } = useQuery({
    queryKey: [`/api/links/${user?.id}`],
    enabled: !!user?.id,
  });

  // Link deletion mutation
  const deleteLinkMutation = useMutation({
    mutationFn: async (linkId: number) => {
      const response = await fetch(`/api/links/${linkId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete link');
      }
      // DELETE requests return 204 No Content, so we don't parse JSON
      return { success: true };
    },
    onSuccess: () => {
      // 캐시 무효화를 더 강력하게 수행
      queryClient.invalidateQueries({ queryKey: [`/api/links`] });
      queryClient.refetchQueries({ queryKey: [`/api/links/${user?.id}`] });
      toast({
        title: "링크 삭제됨",
        description: "링크가 성공적으로 삭제되었습니다.",
      });
    },
    onError: (error: any) => {
      console.error('Link deletion error:', error);
      toast({
        title: "삭제 실패",
        description: error?.message?.includes('not found') ? "이미 삭제된 링크입니다." : "링크 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
      // 에러 발생 시에도 캐시 새로고침
      queryClient.refetchQueries({ queryKey: [`/api/links/${user?.id}`] });
    },
  });

  const { data: analyticsData } = useAnalyticsData();

  // Get tracked URLs from localStorage
  const [trackedUrls, setTrackedUrls] = useState<string[]>([]);
  
  useEffect(() => {
    const stored = localStorage.getItem(`tracked_urls_${user?.id}`);
    if (stored) {
      try {
        const urls = JSON.parse(stored);
        setTrackedUrls(urls);
      } catch (e) {
        console.error('Error parsing tracked URLs:', e);
      }
    }
  }, [user?.id]);

  // Listen for tracked URL updates
  useEffect(() => {
    const handleTrackedUrlsUpdate = () => {
      if (user?.id) {
        const stored = localStorage.getItem(`tracked_urls_${user?.id}`);
        if (stored) {
          try {
            const urls = JSON.parse(stored);
            setTrackedUrls(urls);
          } catch (e) {
            console.error('Error parsing tracked URLs:', e);
          }
        }
      }
    };

    window.addEventListener('tracked-urls-updated', handleTrackedUrlsUpdate);
    return () => window.removeEventListener('tracked-urls-updated', handleTrackedUrlsUpdate);
  }, [user?.id]);

  const { data: urlVisitData, isLoading: urlVisitsLoading } = useUrlVisitCounts(trackedUrls);
  const { visitCounts } = useRealTimeVisits(15000);

  // Calculate total visits from tracked URLs
  const getTotalTrackedVisits = () => {
    let totalFromData = 0;
    let totalRealtime = 0;
    
    if (urlVisitData) {
      totalFromData = urlVisitData.reduce((sum, item) => sum + item.visits, 0);
    }
    
    trackedUrls.forEach(url => {
      totalRealtime += visitCounts[url] || 0;
    });
    
    return totalFromData + totalRealtime;
  };

  const typedData = dashboardData as any;
  const userSettings = settingsData as any;
  const userLinks = linksData as any;
  const currentUser = userData as any;

  // Get current content type from settings only
  const currentContentType = userSettings?.contentType || 'links';

  useEffect(() => {
    if (user) {
      // Clear any existing analytics data that might cause automatic visitor increments
      clearAllAnalyticsData();
      initCleanAnalytics();
      
      // Only track page view for analytics, not URL visits
      trackPageView('/dashboard', `/dashboard?user_id=${user.id}`);
      // Remove automatic URL visit tracking - only track when user explicitly clicks links
    }
  }, [user]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2);
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return "방금 전";
    if (diffHours < 24) return `${diffHours}시간 전`;
    return `${Math.floor(diffHours / 24)}일 전`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="flex items-center justify-between p-4 bg-card border-b border-border">
          <div className="flex items-center">
            <Skeleton className="w-10 h-10 rounded-full mr-3" />
            <div>
              <Skeleton className="h-4 w-20 mb-1" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <Skeleton className="w-6 h-6" />
        </header>
        <div className="p-4 space-y-6">
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-60 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between p-4 bg-card border-b border-border sticky top-0 z-10">
        <div className="flex items-center">
          {(userData as any)?.profileImageUrl ? (
            <img 
              src={(userData as any).profileImageUrl} 
              alt={(userData as any)?.name || (userData as any)?.username}
              className="w-10 h-10 rounded-full object-cover mr-3"
            />
          ) : (
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mr-3">
              <span className="text-primary-foreground font-medium text-sm">
                {user?.name ? getInitials(user.name) : "사용자"}
              </span>
            </div>
          )}
          <div>
            <p className="font-medium text-sm korean-text">
              {(userData as any)?.name || user?.name || "사용자"}님
            </p>
            <p className="text-muted-foreground text-xs korean-text">
              오늘도 좋은 하루 되세요!
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <NotificationDropdown />
        </div>
      </header>

      <div className="p-4 pb-24 max-w-md mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="bg-card shadow-sm">
            <CardContent className="p-4 text-center">
              <Link className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold text-primary">
                {trackedUrls.length}
              </p>
              <p className="text-xs text-muted-foreground korean-text">연결</p>
            </CardContent>
          </Card>

          <Card className="bg-card shadow-sm">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold text-primary">
                {typedData?.stats?.deals || 0}
              </p>
              <p className="text-xs text-muted-foreground korean-text">딜</p>
            </CardContent>
          </Card>

          <Card className="bg-card shadow-sm">
            <CardContent className="p-4 text-center">
              <BarChart3 className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold text-primary">
                {getTotalTrackedVisits()}
              </p>
              <p className="text-xs text-muted-foreground korean-text">방문 횟수</p>
            </CardContent>
          </Card>
        </div>



        {/* Profile Content Section */}
        <div className="mt-6">
          <Card className="bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-card-foreground korean-text">
                프로필 미리보기
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">


              {/* Shortened URL Section */}
              <div className="mb-4 p-3 bg-muted rounded-lg border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">단축 URL</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 h-auto text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      const username = (userData as any)?.username || 'demo_user';
                      const url = (settingsData as any)?.customUrl ? 
                        `${window.location.protocol}//${window.location.host}/${(settingsData as any).customUrl}` : 
                        `${window.location.protocol}//${window.location.host}/${username}`;
                      navigator.clipboard.writeText(url);
                      toast({
                        title: "URL 복사됨",
                        description: "단축 URL이 클립보드에 복사되었습니다.",
                      });
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground font-mono">
                  {(settingsData as any)?.customUrl ? 
                    `${window.location.host}/${(settingsData as any).customUrl}` : 
                    `${window.location.host}/${(userData as any)?.username || 'demo_user'}`
                  }
                </div>
              </div>

              {/* Content Type Selection Display */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground korean-text">선택된 진입 경로</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { type: 'image', label: '이미지', icon: Image },
                    { type: 'video', label: '비디오', icon: Video },
                    { type: 'links', label: '링크', icon: ExternalLink }
                  ].map(({ type, label, icon: Icon }) => (
                    <div
                      key={type}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        currentContentType === type
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-muted'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-1">
                        <Icon className={`w-5 h-5 ${
                          currentContentType === type
                            ? 'text-primary'
                            : 'text-muted-foreground'
                        }`} />
                        <span className={`text-xs korean-text ${
                          currentContentType === type
                            ? 'text-primary font-medium'
                            : 'text-muted-foreground'
                        }`}>
                          {label}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Public View Preview */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-gray-600 korean-text">이용자 화면 미리보기</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(`/${(userData as any)?.username}`, '_blank')}
                    className="text-xs korean-text"
                  >
                    전체 화면으로 보기
                  </Button>
                </div>
                
                {/* Mobile-Style Preview Frame */}
                <div className="mx-auto max-w-xs">
                  <div className="relative bg-black rounded-3xl p-2 shadow-2xl">
                    {/* Phone frame */}
                    <div className="bg-gray-900 rounded-2xl overflow-hidden">
                      {/* Status bar */}
                      <div className="bg-black h-8 flex items-center justify-center">
                        <div className="w-16 h-4 bg-gray-800 rounded-full"></div>
                      </div>
                      
                      {/* Content area */}
                      <div className="h-96 relative overflow-hidden"
                           style={{
                             background: (settingsData as any)?.backgroundTheme || 
                                       "linear-gradient(135deg, #F5F5DC 0%, #EFE5DC 50%, #F5F5DC 100%)"
                           }}>
                        
                        {/* Image Content */}
                        {currentContentType === 'image' && (() => {
                          if (Array.isArray(images) && images.length > 0) {
                            const firstImage = images[0] as any;
                            const imageUrl = firstImage.filePath || firstImage.mediaUrl;
                            
                            return (
                              <div className="h-full flex items-center justify-center">
                                <img 
                                  src={imageUrl} 
                                  alt={firstImage.title || '이미지'} 
                                  className="max-w-full max-h-full object-contain"
                                />
                                {/* Image indicator dots */}
                                {images.length > 1 && (
                                  <div className="absolute top-4 right-4 flex space-x-1">
                                    {images.slice(0, 3).map((_, index) => (
                                      <div
                                        key={index}
                                        className={`w-2 h-2 rounded-full ${
                                          index === 0 ? "bg-white" : "bg-white/50"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          }
                          
                          return (
                            <div className="h-full flex items-center justify-center text-white/70">
                              <div className="text-center">
                                <Image className="w-12 h-12 mx-auto mb-2" />
                                <p className="text-xs korean-text">이미지 없음</p>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Video Content */}
                        {currentContentType === 'video' && (() => {
                          if (Array.isArray(videos) && videos.length > 0) {
                            const firstVideo = videos[0] as any;
                            const videoUrl = firstVideo.filePath || firstVideo.mediaUrl;
                            
                            return (
                              <div className="h-full flex items-center justify-center">
                                <video 
                                  src={videoUrl} 
                                  className="max-w-full max-h-full object-contain"
                                  controls={false}
                                  muted
                                  loop
                                />
                              </div>
                            );
                          }
                          
                          return (
                            <div className="h-full flex items-center justify-center text-white/70">
                              <div className="text-center">
                                <Video className="w-12 h-12 mx-auto mb-2" />
                                <p className="text-xs korean-text">동영상 없음</p>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Links Content */}
                        {currentContentType === 'link' && (() => {
                          if (Array.isArray(linksData) && linksData.length > 0) {
                            return (
                              <div className="h-full p-4 overflow-y-auto">
                                <div className="space-y-3">
                                  {linksData.slice(0, 3).map((link: any, index: number) => (
                                    <div key={index} className="bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-sm">
                                      <h3 className="font-medium text-sm text-gray-800 mb-1 truncate">
                                        {link.title || "링크"}
                                      </h3>
                                      <p className="text-xs text-gray-600 truncate">
                                        {link.originalUrl || link.shortUrl}
                                      </p>
                                    </div>
                                  ))}
                                  {linksData.length > 3 && (
                                    <div className="text-center">
                                      <p className="text-xs text-white/70">+{linksData.length - 3} 더보기</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          }
                          
                          return (
                            <div className="h-full flex items-center justify-center text-white/70">
                              <div className="text-center">
                                <Link className="w-12 h-12 mx-auto mb-2" />
                                <p className="text-xs korean-text">링크 없음</p>
                              </div>
                            </div>
                          );
                        })()}
                        
                      </div>
                      
                      {/* Bottom navigation */}
                      <div className="bg-white/10 backdrop-blur-sm h-16 flex items-center justify-center">
                        <div className="flex space-x-8">
                          {[
                            { type: 'link', icon: Link, label: '링크' },
                            { type: 'image', icon: Image, label: '이미지' },
                            { type: 'video', icon: Video, label: '동영상' }
                          ].map(({ type, icon: Icon, label }) => (
                            <div key={type} className="flex flex-col items-center">
                              <Icon className={`w-4 h-4 ${
                                currentContentType === type ? 'text-white' : 'text-white/50'
                              }`} />
                              <span className={`text-xs mt-1 ${
                                currentContentType === type ? 'text-white' : 'text-white/50'
                              }`}>
                                {label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
              </div>

                {/* Links Content - Display with actual configured styles */}
                {currentContentType === 'links' && (
                  <div className="space-y-3">
                    {linksData && Array.isArray(linksData) && linksData.length > 0 ? (
                      linksData.map((link: any) => (
                        <div key={link.id}>
                          {/* Thumbnail Style */}
                          {link.style === 'thumbnail' && (
                            <div 
                              className="flex items-center gap-3 p-3 bg-white rounded-lg border relative cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() => window.open(link.originalUrl, '_blank')}
                            >
                              {(link.customImageUrl || link.imageUrl) ? (
                                <img 
                                  src={link.customImageUrl || link.imageUrl} 
                                  alt={link.title}
                                  className="w-12 h-12 rounded object-cover flex-shrink-0"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-gray-300 rounded flex-shrink-0"></div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-800 truncate hover:text-[#A0825C]">
                                  {link.title}
                                </div>
                                {link.description && (
                                  <div className="text-xs text-gray-600 mt-1 line-clamp-1">{link.description}</div>
                                )}
                                <div className="text-xs text-gray-500 mt-1">
                                  단축 URL: {window.location.host}/{link.shortCode}
                                </div>
                                <div className="text-xs text-blue-600 mt-1">
                                  내 방문: {link.ownerVisits || 0} · 외부 방문: {link.externalVisits || 0}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Simple Style */}
                          {link.style === 'simple' && (
                            <div 
                              className="bg-white rounded-lg border p-3 cursor-pointer hover:bg-gray-50 transition-colors" 
                              onClick={() => window.open(link.originalUrl, '_blank')}
                            >
                              {(link.customImageUrl || link.imageUrl) && (
                                <img 
                                  src={link.customImageUrl || link.imageUrl} 
                                  alt={link.title}
                                  className="w-full h-20 object-cover rounded mb-2"
                                />
                              )}
                              <div className="text-sm font-medium text-gray-800 truncate mb-2 hover:text-[#A0825C]">{link.title}</div>
                              {link.description && (
                                <div className="text-xs text-gray-600 mb-2 line-clamp-2">{link.description}</div>
                              )}
                              <div className="text-xs text-gray-500 mb-1">
                                단축 URL: {window.location.host}/{link.shortCode}
                              </div>
                              <div className="text-xs text-blue-600 mb-2">
                                내 방문: {link.ownerVisits || 0} · 외부 방문: {link.externalVisits || 0}
                              </div>
                              <div className="w-full h-2 bg-gray-300 rounded"></div>
                            </div>
                          )}
                          
                          {/* Card Style */}
                          {link.style === 'card' && (
                            <div 
                              className="bg-gray-400 rounded-lg h-32 flex flex-col justify-center p-3 relative cursor-pointer hover:bg-gray-500 transition-colors" 
                              onClick={() => window.open(link.originalUrl, '_blank')}
                            >
                              {(link.customImageUrl || link.imageUrl) && (
                                <img 
                                  src={link.customImageUrl || link.imageUrl} 
                                  alt={link.title}
                                  className="absolute inset-0 w-full h-full object-cover rounded-lg"
                                />
                              )}
                              <div className="relative z-10 bg-black bg-opacity-50 text-white p-2 rounded">
                                <div className="text-sm font-medium truncate">{link.title}</div>
                                {link.description && (
                                  <div className="text-xs opacity-90 mt-1 line-clamp-1">{link.description}</div>
                                )}
                                <div className="text-xs text-gray-300 mt-1">
                                  단축 URL: {window.location.host}/{link.shortCode}
                                </div>
                                <div className="text-xs text-blue-200 mt-1">
                                  내 방문: {link.ownerVisits || 0} · 외부 방문: {link.externalVisits || 0}
                                </div>
                              </div>
                              <div className="absolute bottom-2 right-2 w-6 h-6 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                                <div className="w-3 h-3 border-2 border-white rounded-full"></div>
                              </div>
                            </div>
                          )}
                          
                          {/* Background Style */}
                          {link.style === 'background' && (
                            <div 
                              className="h-32 flex flex-col justify-center p-3 relative rounded-lg cursor-pointer hover:opacity-90 transition-opacity overflow-hidden" 
                              style={{
                                backgroundImage: (link.customImageUrl || link.imageUrl) 
                                  ? `url(${link.customImageUrl || link.imageUrl})` 
                                  : 'repeating-linear-gradient(45deg, #f5f5f5, #f5f5f5 10px, #e0e0e0 10px, #e0e0e0 20px)',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat'
                              }}
                              onClick={() => window.open(link.originalUrl, '_blank')}
                            >
                              {/* Dark overlay for text readability */}
                              <div className="absolute inset-0 bg-black bg-opacity-40 rounded-lg"></div>
                              
                              <div className="relative z-10 text-white">
                                <div className="text-sm font-medium truncate mb-2 drop-shadow-lg">{link.title}</div>
                                {link.description && (
                                  <div className="text-xs text-gray-200 mb-2 line-clamp-1 drop-shadow-lg">{link.description}</div>
                                )}
                                <div className="text-xs text-gray-300 drop-shadow-lg">
                                  단축 URL: {window.location.host}/{link.shortCode}
                                </div>
                                <div className="text-xs text-blue-200 drop-shadow-lg">
                                  내 방문: {link.ownerVisits || 0} · 외부 방문: {link.externalVisits || 0}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <ExternalLink className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground text-lg">링크 없음</p>
                        <p className="text-muted-foreground text-sm mt-2">아직 등록된 링크가 없습니다.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Settings Button */}
              <Button
                onClick={() => setLocation('/settings')}
                variant="outline"
                className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                프로필 설정 수정
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
