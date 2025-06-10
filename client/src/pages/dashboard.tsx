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
import { useEffect } from "react";
import { trackPageView, trackCustomUrlVisit } from "@/lib/analytics";
import { useAnalyticsData } from "@/hooks/use-analytics-data";

export default function DashboardPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: [`/api/dashboard/stats/${user?.id}`],
    enabled: !!user?.id,
  });

  const { data: settingsData } = useQuery({
    queryKey: [`/api/settings/${user?.id}`],
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
                {analyticsData?.totalVisits || 0}
              </p>
              <p className="text-xs text-gray-600 korean-text">총 접속</p>
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
              {/* Short URL Display */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 korean-text">단축 URL</p>
                  <p className="font-mono text-sm text-primary">
                    {userSettings?.customUrl ? 
                      `amusefit.co.kr/users/${userSettings.customUrl}` : 
                      `amusefit.co.kr/users/${user?.username || 'default'}`
                    }
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const url = userSettings?.customUrl ? 
                      `amusefit.co.kr/users/${userSettings.customUrl}` : 
                      `amusefit.co.kr/users/${user?.username || 'default'}`;
                    navigator.clipboard.writeText(url);
                  }}
                  className="text-gray-600 hover:text-primary"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>

              {/* Content Type Selection Display */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700 korean-text">선택된 콘텐츠</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { type: 'image', label: '이미지', icon: Image },
                    { type: 'video', label: '비디오', icon: Video },
                    { type: 'link', label: '링크', icon: ExternalLink }
                  ].map(({ type, label, icon: Icon }) => (
                    <div
                      key={type}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        (userSettings?.contentType || 'link') === type
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-1">
                        <Icon className={`w-5 h-5 ${
                          (userSettings?.contentType || 'link') === type
                            ? 'text-primary'
                            : 'text-gray-400'
                        }`} />
                        <span className={`text-xs korean-text ${
                          (userSettings?.contentType || 'link') === type
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

              {/* Content Preview */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2 korean-text">콘텐츠 미리보기</p>
                {(userSettings?.contentType || 'link') === 'image' && (
                  <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                    <Image className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                {(userSettings?.contentType || 'link') === 'video' && (
                  <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                    <Video className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                {(userSettings?.contentType || 'link') === 'link' && (
                  <div className="p-3 border border-gray-200 rounded-lg bg-white">
                    <div className="flex items-center space-x-2">
                      <ExternalLink className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-gray-800">
                        {user?.name || '사용자'}의 프로필
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {userSettings?.bio || '안녕하세요! 반갑습니다.'}
                    </p>
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
