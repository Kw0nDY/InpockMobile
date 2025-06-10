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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import NotificationDropdown from "@/components/ui/notification-dropdown";
import VisitCountWidget from "@/components/analytics/visit-count-widget";
import { ImageModal, VideoModal, LinkPreview } from "@/components/ui/media-modal";
import { useEffect, useState } from "react";
import { trackPageView } from "@/lib/analytics";
import { useAnalyticsData, useUrlVisitCounts, useRealTimeVisits } from "@/hooks/use-analytics-data";
import { clearAllAnalyticsData, initCleanAnalytics } from "@/lib/clear-analytics";

export default function DashboardPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [previewType, setPreviewType] = useState<string | null>(null);

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

  const { data: linksData } = useQuery({
    queryKey: [`/api/links/${user?.id}`],
    enabled: !!user?.id,
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

  // Get current content type, with previewType override for interactive preview
  const currentContentType = previewType || userSettings?.contentType || 'links';

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
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mr-3">
            <span className="text-white font-medium text-sm">
              {user?.name ? getInitials(user.name) : "사용자"}
            </span>
          </div>
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

        {/* Real-time Visit Tracking */}
        <VisitCountWidget 
          userDefinedUrl={`/dashboard?user_id=${user?.id}`}
          className="mb-6"
        />

        {/* Profile Content Section */}
        <div className="mt-6">
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800 korean-text">
                프로필 미리보기
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">


              {/* Content Type Selection Display */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700 korean-text">선택된 콘텐츠</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { type: 'image', label: '이미지', icon: Image },
                    { type: 'video', label: '비디오', icon: Video },
                    { type: 'links', label: '링크', icon: ExternalLink }
                  ].map(({ type, label, icon: Icon }) => (
                    <div
                      key={type}
                      onClick={() => setPreviewType(type)}
                      className={`p-3 rounded-lg border-2 transition-all cursor-pointer hover:border-primary/50 ${
                        currentContentType === type
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
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
                {currentContentType === 'image' && (
                  <div className="mb-4">
                    {currentUser?.profileImageUrl ? (
                      <ImageModal
                        src={currentUser.profileImageUrl}
                        alt="프로필 이미지"
                      >
                        <div className="w-full h-64 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                          <img
                            src={currentUser.profileImageUrl}
                            alt="Profile Content"
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                          />
                        </div>
                      </ImageModal>
                    ) : (
                      <div className="w-full h-64 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                        <div className="text-center">
                          <Image className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">이미지를 업로드해주세요</p>
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      {currentUser?.profileImageUrl ? '클릭하여 확대 보기' : '설정에서 이미지를 업로드할 수 있습니다'}
                    </p>
                  </div>
                )}

                {/* Video Content */}
                {currentContentType === 'video' && (
                  <div className="mb-4">
                    {currentUser?.introVideoUrl ? (
                      <VideoModal src={currentUser.introVideoUrl}>
                        <div className="w-full h-64 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity relative">
                          <video
                            src={currentUser.introVideoUrl}
                            className="w-full h-full object-cover"
                            muted
                          >
                            Your browser does not support the video tag.
                          </video>
                          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center hover:bg-opacity-20 transition-all">
                            <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                              <div className="w-0 h-0 border-l-[12px] border-l-gray-800 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent ml-1"></div>
                            </div>
                          </div>
                        </div>
                      </VideoModal>
                    ) : (
                      <div className="w-full h-64 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                        <div className="text-center">
                          <Video className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">비디오를 업로드해주세요</p>
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      {currentUser?.introVideoUrl ? '클릭하여 재생' : '설정에서 비디오를 업로드할 수 있습니다'}
                    </p>
                  </div>
                )}

                {/* Link Content */}
                {currentContentType === 'links' && (
                  <LinkPreview
                    url={userSettings?.linkUrl || 
                      (userSettings?.customUrl ? 
                        `https://amusefit.co.kr/users/${userSettings.customUrl}` : 
                        `https://amusefit.co.kr/users/${user?.username || 'default'}`)
                    }
                    title={userSettings?.linkTitle || `${user?.name || '사용자'}의 프로필`}
                    description={userSettings?.linkDescription || userSettings?.bio || currentUser?.bio || '안녕하세요! 반갑습니다.'}
                    userId={user?.id}
                  >
                    <div className="p-4 border border-gray-200 rounded-lg bg-white hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-2 mb-2">
                        <ExternalLink className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-gray-800">
                          {userSettings?.linkTitle || `${user?.name || '사용자'}의 프로필`}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-3">
                        {userSettings?.linkDescription || userSettings?.bio || currentUser?.bio || '안녕하세요! 반갑습니다.'}
                      </p>
                      <div className="flex items-center space-x-1 text-xs text-blue-600">
                        <span>클릭하여 새 탭에서 열기</span>
                        <ExternalLink className="w-3 h-3" />
                      </div>
                    </div>
                  </LinkPreview>
                )}

                {/* Upload Prompt for Empty Content */}
                {currentContentType === 'image' && !currentUser?.profileImageUrl && (
                  <div 
                    className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 cursor-pointer hover:border-gray-400 hover:bg-gray-100 transition-colors"
                    onClick={() => setLocation('/settings')}
                  >
                    <div className="text-center">
                      <Image className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">이미지를 업로드하세요</p>
                      <p className="text-sm text-blue-600 mt-2">설정에서 업로드하기</p>
                    </div>
                  </div>
                )}
                
                {currentContentType === 'video' && !currentUser?.introVideoUrl && (
                  <div 
                    className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 cursor-pointer hover:border-gray-400 hover:bg-gray-100 transition-colors"
                    onClick={() => setLocation('/settings')}
                  >
                    <div className="text-center">
                      <Video className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">동영상을 업로드하세요</p>
                      <p className="text-sm text-blue-600 mt-2">설정에서 업로드하기</p>
                    </div>
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
