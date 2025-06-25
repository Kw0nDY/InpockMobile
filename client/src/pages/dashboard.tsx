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
  Dumbbell,
  User,
  Clock,
  Eye,
  DollarSign,
  Activity,
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
  const { user, checkRegistrationComplete } = useAuth();
  const [, setLocation] = useLocation();

  // 회원가입 완료 리다이렉트 제거 - 이미 로그인된 사용자는 그대로 진행

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: [`/api/dashboard/stats/${user?.id}`],
    enabled: !!user?.id,
  });

  // 비즈니스 대시보드 지표 조회
  const { data: dashboardAnalytics, refetch: refetchAnalytics } = useQuery({
    queryKey: [`/api/dashboard/analytics/${user?.id}`],
    enabled: !!user?.id,
    refetchInterval: 30000, // 30초마다 자동 새로고침
  });

  // 세션 활동 업데이트
  useEffect(() => {
    if (!user?.id) return;

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const updateSession = async () => {
      try {
        await apiRequest(`/api/user/${user.id}/session`, {
          method: 'POST',
          body: { sessionId }
        });
      } catch (error) {
        console.error('Failed to update session:', error);
      }
    };

    updateSession();
    const sessionInterval = setInterval(updateSession, 5 * 60 * 1000);

    return () => {
      clearInterval(sessionInterval);
    };
  }, [user?.id]);

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
                    className="p-1 h-auto text-muted-foreground hover:bg-amber-800 hover:text-white group"
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
                    <Copy className="w-4 h-4 group-hover:text-white" />
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

              {/* Content Preview Based on Type */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-3 korean-text">콘텐츠 미리보기</p>
                
                {/* Image Content */}
                {currentContentType === 'image' && (() => {
                  if (Array.isArray(images) && images.length > 0) {
                    const firstImage = images[0] as any;
                    const imageUrl = firstImage.filePath || firstImage.mediaUrl;
                    
                    return (
                      <div className="mb-4">
                        <div className="relative w-full h-64 rounded-lg overflow-hidden bg-gray-100">
                          <img 
                            src={imageUrl} 
                            alt={firstImage.title || '이미지'} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <div className="hidden w-full h-full flex items-center justify-center absolute inset-0">
                            <div className="text-center">
                              <Image className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-500">이미지를 불러올 수 없습니다</p>
                            </div>
                          </div>
                          
                          {/* Count badge */}
                          {images.length > 1 && (
                            <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                              +{images.length - 1} 더보기
                            </div>
                          )}
                          
                          {/* Text overlay at bottom */}
                          {firstImage.title && (
                            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                              <p className="text-white text-sm font-medium" style={{textShadow: '0 1px 2px rgba(0,0,0,0.7)'}}>
                                {firstImage.title}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="mt-2 text-center">
                          <p className="text-xs text-gray-600">총 {images.length}개의 이미지</p>
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="text-center py-8 text-gray-500">
                      <Image className="w-16 h-16 mx-auto mb-2 text-gray-400" />
                      <p className="korean-text">아직 이미지가 없습니다</p>
                      <p className="text-sm korean-text">이미지 페이지에서 업로드하세요</p>
                    </div>
                  );
                })()}

                {/* Video Content */}
                {currentContentType === 'video' && (() => {
                  if (Array.isArray(videos) && videos.length > 0) {
                    const firstVideo = videos[0] as any;
                    const videoUrl = firstVideo.filePath || firstVideo.mediaUrl;
                    
                    return (
                      <div className="mb-4">
                        <div className="relative w-full h-64 rounded-lg overflow-hidden bg-gray-100">
                          <video 
                            src={videoUrl} 
                            controls 
                            preload="metadata"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLVideoElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          >
                            동영상을 재생할 수 없습니다.
                          </video>
                          <div className="hidden w-full h-full flex items-center justify-center absolute inset-0">
                            <div className="text-center">
                              <Video className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-500">동영상을 불러올 수 없습니다</p>
                            </div>
                          </div>
                          
                          {/* Count badge */}
                          {videos.length > 1 && (
                            <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                              +{videos.length - 1} 더보기
                            </div>
                          )}
                          
                          {/* Text overlay at bottom */}
                          {firstVideo.title && (
                            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                              <p className="text-white text-sm font-medium" style={{textShadow: '0 1px 2px rgba(0,0,0,0.7)'}}>
                                {firstVideo.title}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="mt-2 text-center">
                          <p className="text-xs text-gray-600">총 {videos.length}개의 동영상</p>
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="text-center py-8 text-gray-500">
                      <Video className="w-16 h-16 mx-auto mb-2 text-gray-400" />
                      <p className="korean-text">아직 동영상이 없습니다</p>
                      <p className="text-sm korean-text">동영상 페이지에서 업로드하세요</p>
                    </div>
                  );
                })()}

                {/* Links Content - Display with actual configured styles */}
                {currentContentType === 'links' && (
                  <div className="space-y-4">
                    {linksData && Array.isArray(linksData) && linksData.length > 0 ? (
                      linksData.map((link: any) => (
                        <div key={link.id}>
                          {/* Thumbnail Style - 개선된 디자인 */}
                          {link.style === 'thumbnail' && (
                            <div 
                              className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
                            >
                              <div className="flex items-start gap-4 p-4">
                                {/* 썸네일 이미지 */}
                                <div className="relative flex-shrink-0">
                                  {(link.customImageUrl || link.imageUrl) ? (
                                    <img 
                                      src={link.customImageUrl || link.imageUrl} 
                                      alt={link.title}
                                      className="w-16 h-16 rounded-lg object-cover ring-1 ring-gray-200"
                                    />
                                  ) : (
                                    <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center ring-1 ring-gray-200">
                                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                      </svg>
                                    </div>
                                  )}
                                </div>

                                {/* 콘텐츠 영역 */}
                                <div className="flex-1 min-w-0">
                                  {/* 제목 */}
                                  <h3 className="font-semibold text-gray-900 text-sm truncate mb-1 group-hover:text-primary transition-colors">
                                    {link.title}
                                  </h3>
                                  
                                  {/* 설명 */}
                                  {link.description && (
                                    <p className="text-xs text-gray-600 line-clamp-2 mb-2 leading-relaxed">
                                      {link.description}
                                    </p>
                                  )}
                                  
                                  {/* URL */}
                                  <div className="flex items-center gap-1 mb-2">
                                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                    </svg>
                                    <span className="text-xs text-gray-500 truncate font-mono">
                                      amusefit.com/{link.shortCode}
                                    </span>
                                  </div>
                                  
                                  {/* 통계 */}
                                  <div className="flex items-center gap-4 text-xs">
                                    <div className="flex items-center gap-1 text-blue-600">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                      <span>내 방문: {link.ownerVisits || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-green-600">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                      </svg>
                                      <span>외부 방문: {link.externalVisits || 0}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* 액션 버튼 */}
                                <div className="flex-shrink-0">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(link.originalUrl, '_blank');
                                    }}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="링크 열기"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Simple Style - 개선된 디자인 */}
                          {link.style === 'simple' && (
                            <div className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                              {/* 이미지 영역 */}
                              {(link.customImageUrl || link.imageUrl) && (
                                <div className="relative">
                                  <img 
                                    src={link.customImageUrl || link.imageUrl} 
                                    alt={link.title}
                                    className="w-full h-32 object-cover"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                                  
                                  {/* 액션 버튼 - 이미지 위 */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(link.originalUrl, '_blank');
                                    }}
                                    className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-white hover:text-gray-900 rounded-lg transition-all shadow-sm"
                                    title="링크 열기"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                  </button>
                                </div>
                              )}
                              
                              {/* 콘텐츠 영역 */}
                              <div className="p-4">
                                {/* 제목 */}
                                <h3 className="font-semibold text-gray-900 text-sm mb-2 group-hover:text-primary transition-colors line-clamp-1">
                                  {link.title}
                                </h3>
                                
                                {/* 설명 */}
                                {link.description && (
                                  <p className="text-xs text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                                    {link.description}
                                  </p>
                                )}
                                
                                {/* URL */}
                                <div className="flex items-center gap-1 mb-3 p-2 bg-gray-50 rounded-lg">
                                  <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                  </svg>
                                  <span className="text-xs text-gray-500 truncate font-mono">
                                    amusefit.com/{link.shortCode}
                                  </span>
                                </div>
                                
                                {/* 통계 */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3 text-xs">
                                    <div className="flex items-center gap-1 text-blue-600">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                      <span>{link.ownerVisits || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-green-600">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                      </svg>
                                      <span>{link.externalVisits || 0}</span>
                                    </div>
                                  </div>
                                  
                                  {/* 이미지가 없을 때 액션 버튼 */}
                                  {!(link.customImageUrl || link.imageUrl) && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(link.originalUrl, '_blank');
                                      }}
                                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                      title="링크 열기"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                      </svg>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Card Style - 개선된 디자인 */}
                          {link.style === 'card' && (
                            <div className="group relative bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden h-48">
                              {/* 배경 이미지 */}
                              <div className="absolute inset-0">
                                {(link.customImageUrl || link.imageUrl) ? (
                                  <img 
                                    src={link.customImageUrl || link.imageUrl} 
                                    alt={link.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50"></div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                              </div>

                              {/* 액션 버튼 - 우측 상단 */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(link.originalUrl, '_blank');
                                }}
                                className="absolute top-3 right-3 z-20 p-2 bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-white hover:text-gray-900 rounded-full transition-all shadow-sm opacity-0 group-hover:opacity-100"
                                title="링크 열기"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </button>

                              {/* 콘텐츠 영역 - 하단 */}
                              <div className="absolute bottom-0 left-0 right-0 z-10 p-4">
                                {/* 제목 */}
                                <h3 className="font-bold text-white text-base mb-2 drop-shadow-lg line-clamp-2">
                                  {link.title}
                                </h3>
                                
                                {/* 설명 */}
                                {link.description && (
                                  <p className="text-sm text-gray-200 mb-3 line-clamp-2 drop-shadow-lg">
                                    {link.description}
                                  </p>
                                )}
                                
                                {/* URL과 통계를 한 줄에 */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1 flex-1 min-w-0">
                                    <svg className="w-3 h-3 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                    </svg>
                                    <span className="text-xs text-gray-300 truncate font-mono drop-shadow-lg">
                                      amusefit.com/{link.shortCode}
                                    </span>
                                  </div>
                                  
                                  {/* 통계 */}
                                  <div className="flex items-center gap-3 text-xs ml-3">
                                    <div className="flex items-center gap-1 text-blue-200">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                      <span className="drop-shadow-lg">{link.ownerVisits || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-green-200">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                      </svg>
                                      <span className="drop-shadow-lg">{link.externalVisits || 0}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Background Style - 개선된 디자인 */}
                          {link.style === 'background' && (
                            <div className="group relative bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden h-40">
                              {/* 배경 이미지/패턴 */}
                              <div 
                                className="absolute inset-0"
                                style={{
                                  backgroundImage: (link.customImageUrl || link.imageUrl) 
                                    ? `url(${link.customImageUrl || link.imageUrl})` 
                                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center',
                                  backgroundRepeat: 'no-repeat'
                                }}
                              >
                                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/70"></div>
                              </div>

                              {/* 액션 버튼 - 우측 상단 */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(link.originalUrl, '_blank');
                                }}
                                className="absolute top-3 right-3 z-20 p-2 bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 rounded-full transition-all shadow-sm opacity-0 group-hover:opacity-100"
                                title="링크 열기"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </button>

                              {/* 콘텐츠 영역 - 전체 가운데 */}
                              <div className="absolute inset-0 flex flex-col justify-center z-10 p-4 text-center">
                                {/* 제목 */}
                                <h3 className="font-bold text-white text-lg mb-2 drop-shadow-xl line-clamp-2">
                                  {link.title}
                                </h3>
                                
                                {/* 설명 */}
                                {link.description && (
                                  <p className="text-sm text-gray-100 mb-4 line-clamp-2 drop-shadow-lg opacity-90">
                                    {link.description}
                                  </p>
                                )}
                                
                                {/* URL - 가운데 정렬 */}
                                <div className="flex items-center justify-center gap-1 mb-3 bg-black/30 backdrop-blur-sm rounded-full px-3 py-1 mx-auto">
                                  <svg className="w-3 h-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                  </svg>
                                  <span className="text-xs text-gray-200 font-mono drop-shadow-lg">
                                    amusefit.com/{link.shortCode}
                                  </span>
                                </div>
                                
                                {/* 통계 - 가운데 정렬 */}
                                <div className="flex items-center justify-center gap-4 text-xs">
                                  <div className="flex items-center gap-1 text-blue-200 bg-black/20 backdrop-blur-sm rounded-full px-2 py-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    <span className="drop-shadow-lg">{link.ownerVisits || 0}</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-green-200 bg-black/20 backdrop-blur-sm rounded-full px-2 py-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <span className="drop-shadow-lg">{link.externalVisits || 0}</span>
                                  </div>
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
