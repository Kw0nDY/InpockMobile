import { Bell, Link, TrendingUp, MessageCircle, BarChart3, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import NotificationDropdown from "@/components/ui/notification-dropdown";

export default function DashboardPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: [`/api/dashboard/stats/${user?.id}`],
    enabled: !!user?.id,
  });

  const typedData = dashboardData as any;

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
              <p className="text-2xl font-bold text-primary">
                {typedData?.stats?.connections || 127}
              </p>
              <p className="text-xs text-gray-600 korean-text">연결</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">
                {typedData?.stats?.deals || 43}
              </p>
              <p className="text-xs text-gray-600 korean-text">딜</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">
                {typedData?.stats?.revenue || 892}
              </p>
              <p className="text-xs text-gray-600 korean-text">수익</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-white shadow-sm mb-6">
          <CardContent className="p-4">
            <h3 className="font-medium mb-3 korean-text">빠른 작업</h3>
            <Button
              onClick={() => setLocation("/links")}
              className="w-full bg-primary text-white py-3 rounded-lg font-medium mb-3 hover:bg-primary/90"
            >
              새 링크 만들기
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                onClick={() => setLocation("/analytics")}
                className="bg-gray-50 text-dark py-3 rounded-lg text-sm font-medium hover:bg-gray-100 flex items-center justify-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                분석 보기
              </Button>
              <Button
                variant="secondary"
                onClick={() => setLocation("/contacts")}
                className="bg-gray-50 text-dark py-3 rounded-lg text-sm font-medium hover:bg-gray-100 flex items-center justify-center gap-2"
              >
                <Users className="w-4 h-4" />
                연락처 관리
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-white shadow-sm">
          <CardContent className="p-4">
            <h3 className="font-medium mb-3 korean-text">최근 활동</h3>
            <div className="space-y-3">
              {typedData?.activities?.length > 0 ? (
                typedData.activities.map((activity: any) => (
                  <div key={activity.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-primary-light rounded-full flex items-center justify-center mr-3">
                        {activity.type === "connection" && <Link className="w-4 h-4 text-white" />}
                        {activity.type === "deal" && <TrendingUp className="w-4 h-4 text-white" />}
                        {activity.type === "message" && <MessageCircle className="w-4 h-4 text-white" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium korean-text">{activity.title}</p>
                        <p className="text-xs text-gray-500">
                          {formatTime(new Date(activity.timestamp))}
                        </p>
                      </div>
                    </div>
                    <div className="w-4 h-4 text-gray-400">›</div>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-primary-light rounded-full flex items-center justify-center mr-3">
                        <Link className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium korean-text">새로운 비즈니스 연결</p>
                        <p className="text-xs text-gray-500">2시간 전</p>
                      </div>
                    </div>
                    <div className="w-4 h-4 text-gray-400">›</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                        <TrendingUp className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium korean-text">딜 성사</p>
                        <p className="text-xs text-gray-500">5시간 전</p>
                      </div>
                    </div>
                    <div className="w-4 h-4 text-gray-400">›</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                        <MessageCircle className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium korean-text">새 메시지</p>
                        <p className="text-xs text-gray-500">1일 전</p>
                      </div>
                    </div>
                    <div className="w-4 h-4 text-gray-400">›</div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
