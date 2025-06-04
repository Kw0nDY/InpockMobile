import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Users, 
  Activity, 
  BarChart3, 
  PieChart, 
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  MousePointer,
  Target
} from "lucide-react";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState("7d");

  // Fetch user analytics data
  const { data: stats } = useQuery({
    queryKey: [`/api/dashboard/stats/${user?.id}`],
    enabled: !!user?.id,
  });

  const analyticsData = {
    overview: {
      totalUsers: 1247,
      activeUsers: 892,
      newUsers: 156,
      userGrowth: 12.5,
      totalViews: 45620,
      viewsGrowth: 8.3,
      conversions: 234,
      conversionRate: 5.1,
      conversionGrowth: 15.2
    },
    weeklyData: [
      { day: "월", users: 120, clicks: 450, conversions: 23 },
      { day: "화", users: 132, clicks: 520, conversions: 28 },
      { day: "수", users: 145, clicks: 580, conversions: 31 },
      { day: "목", users: 128, clicks: 490, conversions: 25 },
      { day: "금", users: 167, clicks: 670, conversions: 38 },
      { day: "토", users: 98, clicks: 380, conversions: 19 },
      { day: "일", users: 102, clicks: 420, conversions: 22 }
    ],
    topPages: [
      { page: "/dashboard", views: 8920, percentage: 19.5 },
      { page: "/links", views: 6750, percentage: 14.8 },
      { page: "/marketplace", views: 5430, percentage: 11.9 },
      { page: "/settings", views: 4680, percentage: 10.3 },
      { page: "/chat", views: 3840, percentage: 8.4 }
    ]
  };

  const timeRanges = [
    { label: "7일", value: "7d" },
    { label: "30일", value: "30d" },
    { label: "90일", value: "90d" }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header 
        title="분석" 
        rightAction={{
          text: "내보내기",
          onClick: () => {}
        }}
      />

      <div className="p-4 space-y-6">
        {/* Time Range Selector */}
        <div className="flex space-x-2">
          {timeRanges.map((range) => (
            <Button
              key={range.value}
              variant={timeRange === range.value ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(range.value)}
              className={timeRange === range.value ? "bg-orange-600 text-white" : ""}
            >
              {range.label}
            </Button>
          ))}
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">총 사용자</p>
                  <p className="text-2xl font-bold">{analyticsData.overview.totalUsers.toLocaleString()}</p>
                  <div className="flex items-center mt-1">
                    <ArrowUpRight className="w-3 h-3 text-green-500 mr-1" />
                    <span className="text-xs text-green-500">+{analyticsData.overview.userGrowth}%</span>
                  </div>
                </div>
                <Users className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">페이지 뷰</p>
                  <p className="text-2xl font-bold">{analyticsData.overview.totalViews.toLocaleString()}</p>
                  <div className="flex items-center mt-1">
                    <ArrowUpRight className="w-3 h-3 text-green-500 mr-1" />
                    <span className="text-xs text-green-500">+{analyticsData.overview.viewsGrowth}%</span>
                  </div>
                </div>
                <Eye className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">활성 사용자</p>
                  <p className="text-2xl font-bold">{analyticsData.overview.activeUsers.toLocaleString()}</p>
                  <div className="flex items-center mt-1">
                    <Activity className="w-3 h-3 text-orange-500 mr-1" />
                    <span className="text-xs text-gray-500">현재 온라인</span>
                  </div>
                </div>
                <Activity className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">전환율</p>
                  <p className="text-2xl font-bold">{analyticsData.overview.conversionRate}%</p>
                  <div className="flex items-center mt-1">
                    <ArrowUpRight className="w-3 h-3 text-green-500 mr-1" />
                    <span className="text-xs text-green-500">+{analyticsData.overview.conversionGrowth}%</span>
                  </div>
                </div>
                <Target className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <BarChart3 className="w-5 h-5 mr-2" />
              주간 활동
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.weeklyData.map((day, index) => {
                const maxValue = Math.max(...analyticsData.weeklyData.map(d => d.users));
                const percentage = (day.users / maxValue) * 100;
                
                return (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="w-8 text-sm font-medium text-gray-600">{day.day}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600">사용자: {day.users}</span>
                        <span className="text-sm text-gray-600">클릭: {day.clicks}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <PieChart className="w-5 h-5 mr-2" />
              인기 페이지
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyticsData.topPages.map((page, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-orange-600">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{page.page}</p>
                      <p className="text-xs text-gray-500">{page.views.toLocaleString()} 조회</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {page.percentage}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <TrendingUp className="w-5 h-5 mr-2" />
              성과 지표
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <MousePointer className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">{stats?.stats?.totalClicks || 0}</p>
                <p className="text-sm text-gray-600">총 클릭수</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Target className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-600">{analyticsData.overview.conversions}</p>
                <p className="text-sm text-gray-600">총 전환수</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}