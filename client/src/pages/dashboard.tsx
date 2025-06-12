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

  const { data: settingsData } = useQuery({
    queryKey: [`/api/settings/${user?.id}`],
    enabled: !!user?.id,
  });

  const { data: userData } = useQuery({
    queryKey: [`/api/user/${user?.id}`],
    enabled: !!user?.id,
  });

  const { data: mediaData } = useQuery({
    queryKey: [`/api/media/${user?.id}`],
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
      <div className="min-h-screen bg-gray-50">
        <header className="flex items-center justify-between p-4 bg-white border-b border-gray-100">
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
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between p-4 bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center">
          {(userData as any)?.profileImageUrl ? (
            <img 
              src={(userData as any).profileImageUrl} 
              alt={(userData as any)?.name || (userData as any)?.username}
              className="w-10 h-10 rounded-full object-cover mr-3"
            />
          ) : (
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mr-3">
              <span className="text-white font-medium text-sm">
                {user?.name ? getInitials(user.name) : "사용자"}
              </span>
            </div>
          )}
          <div>
            <p className="font-medium text-sm korean-text">
              {user?.name || "사용자"}님
            </p>
            <p className="text-gray-500 text-xs korean-text">
              오늘도 좋은 하루 되세요!
            </p>
          </div>
        </div>
        <NotificationDropdown />
      </header>

      <div className="p-4 pb-24 max-w-md mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4 text-center">
              <Link className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold text-primary">
                {trackedUrls.length}
              </p>
              <p className="text-xs text-gray-600 korean-text">연결</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold text-primary">
                {typedData?.stats?.deals || 0}
              </p>
              <p className="text-xs text-gray-600 korean-text">딜</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="p-4 text-center">
              <BarChart3 className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold text-primary">
                {getTotalTrackedVisits()}
              </p>
              <p className="text-xs text-gray-600 korean-text">방문 횟수</p>
            </CardContent>
          </Card>
        </div>



        {/* Profile Content Section */}
        <div className="mt-6">
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800 korean-text">
                프로필 미리보기
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">


              {/* Shortened URL Section */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">단축 URL</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 h-auto text-gray-500 hover:text-gray-700"
                    onClick={() => {
                      const url = (settingsData as any)?.customUrl ? 
                        `https://amusefit.co.kr/users/${(settingsData as any).customUrl}` : 
                        `https://amusefit.co.kr/users/${(userData as any)?.username || 'user'}`;
                      navigator.clipboard.writeText(url);
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <div className="text-sm text-gray-600 font-mono">
                  {(settingsData as any)?.customUrl ? 
                    `amusefit.co.kr/users/${(settingsData as any).customUrl}` : 
                    `amusefit.co.kr/users/${(userData as any)?.username || 'user'}`
                  }
                </div>
              </div>

              {/* Content Type Selection Display */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700 korean-text">선택된 진입 경로</p>
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
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-1">
                        <Icon className={`w-5 h-5 ${
                          currentContentType === type
                            ? 'text-primary'
                            : 'text-gray-400'
                        }`} />
                        <span className={`text-xs korean-text ${
                          currentContentType === type
                            ? 'text-primary font-medium'
                            : 'text-gray-500'
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
                  const imageMedia = Array.isArray(mediaData) ? mediaData.find((media: any) => media.mediaType === 'image') : null;
                  const imageSettings = settingsData as any;
                  const imageUrl = imageMedia?.mediaUrl || (imageSettings?.contentType === 'image' ? imageSettings?.linkUrl : null);
                  
                  if (imageUrl) {
                    return (
                      <div className="mb-4">
                        <div className="relative w-full h-96 rounded-lg overflow-hidden bg-gray-100">
                          <img 
                            src={imageUrl} 
                            alt={imageMedia?.title || imageSettings?.linkTitle || '이미지'} 
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
                          
                          {/* Gradient overlay for text readability */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                          
                          {/* Text overlay at bottom */}
                          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                            <h3 className="text-xl font-bold mb-2" style={{textShadow: '0 2px 4px rgba(0,0,0,0.7)'}}>
                              {imageMedia?.title || imageSettings?.linkTitle || '프로필 이미지'}
                            </h3>
                            {(imageMedia?.description || imageSettings?.linkDescription) && (
                              <p className="text-sm text-white/90" style={{textShadow: '0 1px 3px rgba(0,0,0,0.5)'}}>
                                {imageMedia?.description || imageSettings?.linkDescription}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div className="mb-4">
                        <div className="w-full h-96 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                          <div className="text-center">
                            <Image className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">이미지를 업로드하세요</p>
                            <p className="text-xs text-blue-600 mt-1 cursor-pointer hover:underline">설정에서 업로드하기</p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                })()}

                {/* Video Content */}
                {currentContentType === 'video' && (() => {
                  const videoMedia = Array.isArray(mediaData) ? mediaData.find((media: any) => media.mediaType === 'video') : null;
                  const videoSettings = settingsData as any;
                  const videoUrl = videoMedia?.mediaUrl || (videoSettings?.contentType === 'video' ? videoSettings?.linkUrl : null);
                  
                  if (videoUrl) {
                    return (
                      <div className="mb-4">
                        <div className="relative w-full h-96 rounded-lg overflow-hidden bg-gray-100">
                          <video 
                            src={videoUrl} 
                            controls 
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
                          
                          {/* Gradient overlay for text readability */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>
                          
                          {/* Text overlay at bottom */}
                          <div className="absolute bottom-0 left-0 right-0 p-6 text-white pointer-events-none">
                            <h3 className="text-xl font-bold mb-2" style={{textShadow: '0 2px 4px rgba(0,0,0,0.7)'}}>
                              {videoMedia?.title || videoSettings?.linkTitle || '프로필 동영상'}
                            </h3>
                            {(videoMedia?.description || videoSettings?.linkDescription) && (
                              <p className="text-sm text-white/90" style={{textShadow: '0 1px 3px rgba(0,0,0,0.5)'}}>
                                {videoMedia?.description || videoSettings?.linkDescription}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div className="mb-4">
                        <div className="w-full h-96 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                          <div className="text-center">
                            <Video className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">동영상을 업로드하세요</p>
                            <p className="text-xs text-blue-600 mt-1 cursor-pointer hover:underline">설정에서 업로드하기</p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                })()}

                {/* Links Content - Match Public View Page */}
                {currentContentType === 'links' && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-700 korean-text mb-2">방문자가 볼 링크 화면</p>
                    {linksData && Array.isArray(linksData) && linksData.length > 0 ? (
                      linksData.map((link: any) => (
                        <div key={link.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow cursor-pointer">
                          <div className="flex items-center space-x-3">
                            {(link.customImageUrl || link.imageUrl) ? (
                              <img 
                                src={link.customImageUrl || link.imageUrl} 
                                alt={link.title}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                <ExternalLink className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                            <div className="flex-1">
                              <h3 className="font-medium text-[#8B4513] text-sm">{link.title}</h3>
                              {link.description && (
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{link.description}</p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">{new URL(link.originalUrl).hostname}</p>
                            </div>
                            <ExternalLink className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <Link className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">링크 없음</p>
                        <p className="text-gray-400 text-sm mt-2">아직 등록된 링크가 없습니다.</p>
                      </div>
                    )}




                  </div>
                )}
              </div>

              {/* Settings Button */}
              <Button
                onClick={() => setLocation('/settings')}
                variant="outline"
                className="w-full border-primary text-primary hover:bg-primary hover:text-white"
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
