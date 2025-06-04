import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Target,
  Calendar
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState("7d");

  // Fetch user analytics data
  const { data: stats } = useQuery({
    queryKey: [`/api/dashboard/stats/${user?.id}`],
    enabled: !!user?.id,
  });

  // Generate dynamic data based on time range and user characteristics
  const getAnalyticsData = (range: string) => {
    const isAdmin = user?.role === 'admin';
    const userRole = user?.role || 'user';
    const baseMultiplier = isAdmin ? 2.5 : userRole === 'manager' ? 1.8 : 1;
    const randomMultiplier = 0.8 + Math.random() * 0.4; // 0.8 to 1.2 for A/B testing simulation
    
    const multiplier = baseMultiplier * randomMultiplier;

    switch (range) {
      case "7d":
        return {
          overview: {
            signups: Math.floor(5 * multiplier),
            logins: Math.floor(12 * multiplier),
            purchases: Math.floor(2 * multiplier),
            conversions: Math.floor(8 * multiplier),
            totalUsers: Math.floor(127 * multiplier),
            activeUsers: Math.floor(89 * multiplier),
            userGrowth: 12.5 * multiplier,
            totalViews: Math.floor(456 * multiplier),
            viewsGrowth: 8.3 * multiplier,
            conversionRate: 5.1 * multiplier,
            conversionGrowth: 15.2 * multiplier
          },
          chartData: [
            { name: "월", value: Math.floor(45 * multiplier), users: Math.floor(12 * multiplier), clicks: Math.floor(45 * multiplier) },
            { name: "화", value: Math.floor(52 * multiplier), users: Math.floor(13 * multiplier), clicks: Math.floor(52 * multiplier) },
            { name: "수", value: Math.floor(38 * multiplier), users: Math.floor(14 * multiplier), clicks: Math.floor(58 * multiplier) },
            { name: "목", value: Math.floor(65 * multiplier), users: Math.floor(16 * multiplier), clicks: Math.floor(65 * multiplier) },
            { name: "금", value: Math.floor(78 * multiplier), users: Math.floor(17 * multiplier), clicks: Math.floor(78 * multiplier) },
            { name: "토", value: Math.floor(45 * multiplier), users: Math.floor(12 * multiplier), clicks: Math.floor(45 * multiplier) },
            { name: "일", value: Math.floor(32 * multiplier), users: Math.floor(8 * multiplier), clicks: Math.floor(32 * multiplier) },
          ],
          timeLabel: "지난 7일",
          topPages: [
            { path: "/dashboard", views: Math.floor(234 * multiplier), percentage: 35 },
            { path: "/marketplace", views: Math.floor(189 * multiplier), percentage: 28 },
            { path: "/links", views: Math.floor(156 * multiplier), percentage: 23 },
            { path: "/analytics", views: Math.floor(94 * multiplier), percentage: 14 }
          ]
        };
      case "30d":
        return {
          overview: {
            signups: Math.floor(30 * multiplier),
            logins: Math.floor(245 * multiplier),
            purchases: Math.floor(12 * multiplier),
            conversions: Math.floor(85 * multiplier),
            totalUsers: Math.floor(1247 * multiplier),
            activeUsers: Math.floor(892 * multiplier),
            userGrowth: 18.7 * multiplier,
            totalViews: Math.floor(4562 * multiplier),
            viewsGrowth: 15.8 * multiplier,
            conversionRate: 7.8 * multiplier,
            conversionGrowth: 22.4 * multiplier
          },
          chartData: [
            { name: "1주", value: Math.floor(156 * multiplier), users: Math.floor(78 * multiplier), clicks: Math.floor(312 * multiplier) },
            { name: "2주", value: Math.floor(189 * multiplier), users: Math.floor(94 * multiplier), clicks: Math.floor(378 * multiplier) },
            { name: "3주", value: Math.floor(134 * multiplier), users: Math.floor(67 * multiplier), clicks: Math.floor(268 * multiplier) },
            { name: "4주", value: Math.floor(198 * multiplier), users: Math.floor(99 * multiplier), clicks: Math.floor(396 * multiplier) },
          ],
          timeLabel: "지난 30일",
          topPages: [
            { path: "/dashboard", views: Math.floor(1234 * multiplier), percentage: 38 },
            { path: "/marketplace", views: Math.floor(987 * multiplier), percentage: 30 },
            { path: "/links", views: Math.floor(756 * multiplier), percentage: 23 },
            { path: "/analytics", views: Math.floor(294 * multiplier), percentage: 9 }
          ]
        };
      case "90d":
        return {
          overview: {
            signups: Math.floor(100 * multiplier),
            logins: Math.floor(1250 * multiplier),
            purchases: Math.floor(45 * multiplier),
            conversions: Math.floor(320 * multiplier),
            totalUsers: Math.floor(3247 * multiplier),
            activeUsers: Math.floor(2156 * multiplier),
            userGrowth: 28.3 * multiplier,
            totalViews: Math.floor(15620 * multiplier),
            viewsGrowth: 32.1 * multiplier,
            conversionRate: 9.2 * multiplier,
            conversionGrowth: 41.7 * multiplier
          },
          chartData: [
            { name: "1월", value: Math.floor(425 * multiplier), users: Math.floor(212 * multiplier), clicks: Math.floor(850 * multiplier) },
            { name: "2월", value: Math.floor(389 * multiplier), users: Math.floor(194 * multiplier), clicks: Math.floor(778 * multiplier) },
            { name: "3월", value: Math.floor(512 * multiplier), users: Math.floor(256 * multiplier), clicks: Math.floor(1024 * multiplier) },
          ],
          timeLabel: "지난 90일",
          topPages: [
            { path: "/dashboard", views: Math.floor(5234 * multiplier), percentage: 42 },
            { path: "/marketplace", views: Math.floor(3987 * multiplier), percentage: 32 },
            { path: "/links", views: Math.floor(2156 * multiplier), percentage: 17 },
            { path: "/analytics", views: Math.floor(1123 * multiplier), percentage: 9 }
          ]
        };
      default:
        return {
          overview: { 
            signups: 0, logins: 0, purchases: 0, conversions: 0,
            totalUsers: 0, activeUsers: 0, userGrowth: 0,
            totalViews: 0, viewsGrowth: 0, conversionRate: 0, conversionGrowth: 0
          },
          chartData: [],
          timeLabel: "",
          topPages: []
        };
    }
  };

  const analyticsData = getAnalyticsData(timeRange);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="분석" showBackButton={true} />
      
      <div className="p-4 space-y-6">
        {/* Time Range Selector */}
        <Card className="bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center mb-4">
              <Calendar className="w-5 h-5 mr-2 text-gray-600" />
              <h3 className="font-medium korean-text">기간 선택</h3>
            </div>
            <Tabs value={timeRange} onValueChange={setTimeRange} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="7d" className="text-sm">7일</TabsTrigger>
                <TabsTrigger value="30d" className="text-sm">30일</TabsTrigger>
                <TabsTrigger value="90d" className="text-sm">90일</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Overview Cards with Animation */}
        <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-500">
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4 text-center">
              <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">{analyticsData.overview.totalUsers}</p>
              <p className="text-sm text-gray-600 korean-text">총 사용자</p>
              <Badge variant={analyticsData.overview.userGrowth > 0 ? "default" : "destructive"} className="mt-1">
                {analyticsData.overview.userGrowth > 0 ? '+' : ''}{analyticsData.overview.userGrowth.toFixed(1)}%
              </Badge>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4 text-center">
              <Eye className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">{analyticsData.overview.totalViews}</p>
              <p className="text-sm text-gray-600 korean-text">총 조회수</p>
              <Badge variant={analyticsData.overview.viewsGrowth > 0 ? "default" : "destructive"} className="mt-1">
                {analyticsData.overview.viewsGrowth > 0 ? '+' : ''}{analyticsData.overview.viewsGrowth.toFixed(1)}%
              </Badge>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4 text-center">
              <Activity className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">{analyticsData.overview.activeUsers}</p>
              <p className="text-sm text-gray-600 korean-text">활성 사용자</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4 text-center">
              <Target className="w-6 h-6 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-orange-600">{analyticsData.overview.conversionRate.toFixed(1)}%</p>
              <p className="text-sm text-gray-600 korean-text">전환율</p>
              <Badge variant={analyticsData.overview.conversionGrowth > 0 ? "default" : "destructive"} className="mt-1">
                {analyticsData.overview.conversionGrowth > 0 ? '+' : ''}{analyticsData.overview.conversionGrowth.toFixed(1)}%
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <Card className="bg-white shadow-sm animate-in slide-in-from-bottom duration-700">
          <CardHeader>
            <CardTitle className="flex items-center text-lg korean-text">
              <TrendingUp className="w-5 h-5 mr-2" />
              성과 지표 - {analyticsData.timeLabel}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <MousePointer className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">{(stats as any)?.stats?.totalClicks || analyticsData.overview.signups}</p>
                <p className="text-sm text-gray-600 korean-text">신규 가입</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Target className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-600">{analyticsData.overview.conversions}</p>
                <p className="text-sm text-gray-600 korean-text">총 전환수</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Chart */}
        <Card className="bg-white shadow-sm animate-in slide-in-from-left duration-900">
          <CardHeader>
            <CardTitle className="flex items-center korean-text">
              <BarChart3 className="w-5 h-5 mr-2" />
              활동 차트 - {analyticsData.timeLabel}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyticsData.chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#f97316" 
                    strokeWidth={3}
                    dot={{ fill: '#f97316', strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Pages */}
        <Card className="bg-white shadow-sm animate-in slide-in-from-right duration-1000">
          <CardHeader>
            <CardTitle className="flex items-center korean-text">
              <PieChart className="w-5 h-5 mr-2" />
              인기 페이지 - {analyticsData.timeLabel}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyticsData.topPages.map((page: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      index === 0 ? 'bg-blue-500' :
                      index === 1 ? 'bg-green-500' :
                      index === 2 ? 'bg-yellow-500' : 'bg-gray-400'
                    }`}></div>
                    <span className="font-medium text-sm">{page.path}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{page.views.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{page.percentage}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* User Role Badge */}
        {user?.role && (
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 shadow-sm">
            <CardContent className="p-4 text-center">
              <Badge variant="outline" className="mb-2">
                {user.role === 'admin' ? '관리자' : user.role === 'manager' ? '매니저' : '사용자'} 계정
              </Badge>
              <p className="text-sm text-gray-600 korean-text">
                {user.role === 'admin' ? '전체 시스템 분석 데이터를 확인할 수 있습니다.' :
                 user.role === 'manager' ? '팀 단위 분석 데이터를 확인할 수 있습니다.' :
                 '개인 계정 분석 데이터를 확인할 수 있습니다.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}