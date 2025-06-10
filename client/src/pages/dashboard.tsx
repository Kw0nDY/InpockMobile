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
import { trackPageView, trackCustomUrlVisit } from "@/lib/analytics";
import { useAnalyticsData } from "@/hooks/use-analytics-data";

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

  const typedData = dashboardData as any;
  const userSettings = settingsData as any;
  const userLinks = linksData as any;
  const currentUser = userData as any;

  // Get current content type, with previewType override for interactive preview
  const currentContentType = previewType || userSettings?.contentType || 'links';

  useEffect(() => {
    if (user) {
      // Track dashboard visit with user context
      trackPageView('/dashboard', `/dashboard?user_id=${user.id}`);
      trackCustomUrlVisit('/dashboard', { user_id: user.id.toString(), role: user.role }, user.id.toString());
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
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="flex items-center justify-between p-4 bg-white border-b border-gray-100">
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

      <div className="p-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4 text-center">
              <Link className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold text-primary">
                {userLinks?.length || 0}
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
                {currentUser?.visitCount || 0}
              </p>
              <p className="text-xs text-gray-600 korean-text">방문 횟수</p>
            </CardContent>
          </Card>
        </div>



        {/* Profile Preview Section - Mobile Wireframe Style */}
        <div className="mt-6">
          <div className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden max-w-sm mx-auto">
            {/* Profile Header */}
            <div className="p-6 text-center bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900 korean-text mb-2">
                {user?.name || currentUser?.name || '프로필 이름'}
              </h3>
              <p className="text-sm text-gray-600 korean-text">
                {currentUser?.bio || userSettings?.bio || '간단한 자기소개 및 설명'}
              </p>
            </div>

            {/* Main Content Area */}
            <div className="px-6 py-8 min-h-[300px] bg-white flex items-center justify-center">
              {/* Image Content */}
              {currentContentType === 'image' && currentUser?.profileImageUrl && (
                <ImageModal
                  src={currentUser.profileImageUrl}
                  alt="프로필 이미지"
                >
                  <div className="w-full max-w-[250px] aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity shadow-md">
                    <img
                      src={currentUser.profileImageUrl}
                      alt="Profile Content"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                </ImageModal>
              )}

              {/* Video Content */}
              {currentContentType === 'video' && currentUser?.introVideoUrl && (
                <VideoModal src={currentUser.introVideoUrl}>
                  <div className="w-full max-w-[250px] aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity relative shadow-md">
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
              )}

              {/* Link Content */}
              {currentContentType === 'links' && (
                <div className="w-full space-y-3">
                  {/* Show actual user links or default profile card */}
                  {linksData && Array.isArray(linksData) && linksData.length > 0 ? (
                    linksData.slice(0, 3).map((link: any) => (
                      <LinkPreview
                        key={link.id}
                        url={`${window.location.origin}/l/${link.shortCode}`}
                        title={link.title}
                        description={link.description || link.url}
                        userId={user?.id}
                      >
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900 korean-text mb-1">{link.title}</h4>
                              <p className="text-xs text-gray-600 korean-text">{link.description || link.url}</p>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                              <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                                <ExternalLink className="w-4 h-4 text-gray-400" />
                              </div>
                            </div>
                          </div>
                          <div className="mt-3">
                            <span className="inline-block bg-blue-500 text-white text-xs px-3 py-1 rounded-full korean-text">Link</span>
                          </div>
                        </div>
                      </LinkPreview>
                    ))
                  ) : (
                    // Show default profile link when no custom links exist
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
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900 korean-text mb-1">
                              {userSettings?.linkTitle || `${user?.name || '사용자'}의 프로필`}
                            </h4>
                            <p className="text-xs text-gray-600 korean-text">
                              {userSettings?.linkDescription || userSettings?.bio || currentUser?.bio || '안녕하세요! 반갑습니다.'}
                            </p>
                          </div>
                          <div className="ml-4 flex-shrink-0">
                            <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                              <ExternalLink className="w-4 h-4 text-gray-400" />
                            </div>
                          </div>
                        </div>
                        <div className="mt-3">
                          <span className="inline-block bg-blue-500 text-white text-xs px-3 py-1 rounded-full korean-text">Link</span>
                        </div>
                      </div>
                    </LinkPreview>
                  )}
                </div>
              )}

              {/* Empty States */}
              {currentContentType === 'image' && !currentUser?.profileImageUrl && (
                <div className="w-full max-w-[250px] aspect-square bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
                  <div className="text-center">
                    <Image className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 korean-text">이미지 없음</p>
                  </div>
                </div>
              )}
              
              {currentContentType === 'video' && !currentUser?.introVideoUrl && (
                <div className="w-full max-w-[250px] aspect-square bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
                  <div className="text-center">
                    <Video className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 korean-text">동영상 없음</p>
                  </div>
                </div>
              )}

              {currentContentType === 'links' && (!linksData || !Array.isArray(linksData) || linksData.length === 0) && (
                <div className="w-full bg-gray-100 rounded-xl p-8 flex items-center justify-center border-2 border-dashed border-gray-300">
                  <div className="text-center">
                    <ExternalLink className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 korean-text">링크 없음</p>
                    <p className="text-xs text-gray-400 korean-text mt-1">기본 프로필 링크가 표시됩니다</p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Navigation - Matching Wireframe */}
            <div className="px-6 pb-6">
              <div className="flex justify-center space-x-4">
                {[
                  { type: 'image', icon: Image },
                  { type: 'video', icon: Video },
                  { type: 'links', icon: ExternalLink }
                ].map(({ type, icon: Icon }) => (
                  <button
                    key={type}
                    onClick={() => setPreviewType(type)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      currentContentType === type
                        ? 'bg-gray-900 text-white shadow-lg'
                        : 'bg-gray-200 text-gray-400 hover:bg-gray-300 hover:text-gray-600'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Settings Button */}
        <div className="mt-4">
          <Button
            onClick={() => setLocation('/settings')}
            variant="outline"
            className="w-full border-brown-600 text-brown-600 hover:bg-brown-600 hover:text-white"
          >
            프로필 설정 수정
          </Button>
        </div>
      </div>
    </div>
  );
}
