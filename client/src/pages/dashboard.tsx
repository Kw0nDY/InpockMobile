import {
  Bell,
  Link,
  TrendingUp,
  MessageCircle,
  BarChart3,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import NotificationDropdown from "@/components/ui/notification-dropdown";
import VisitCountWidget from "@/components/analytics/visit-count-widget";
import { useEffect } from "react";
import { trackPageView, trackCustomUrlVisit } from "@/lib/analytics";

export default function DashboardPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: [`/api/dashboard/stats/${user?.id}`],
    enabled: !!user?.id,
  });

  const typedData = dashboardData as any;

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
              <p className="text-xs text-gray-600 korean-text">접속 수</p>
            </CardContent>
          </Card>
        </div>

        {/* Real-time Visit Count Analytics Widget */}
        <div className="mt-6">
          <VisitCountWidget />
        </div>
      </div>
    </div>
  );
}
