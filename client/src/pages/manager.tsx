import { Users, FileText, BarChart2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function ManagerPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleManagementAction = (action: string) => {
    toast({
      title: `${action} 선택됨`,
      description: `${action} 페이지로 이동합니다.`,
    });
  };

  const mockBusinessStats = {
    dailyVisits: 127,
    newLeads: 23,
    activeDeals: 8,
    revenue: "₩892만",
  };

  const mockNotifications = [
    {
      id: 1,
      title: "새로운 PT 회원 등록",
      description: "5명의 새로운 회원이 퍼스널 트레이닝에 등록했습니다",
      time: "30분 전",
      priority: "normal",
    },
    {
      id: 2,
      title: "운동 프로그램 업데이트",
      description: "새로운 HIIT 운동 프로그램이 추가되었습니다",
      time: "2시간 전",
      priority: "normal",
    },
    {
      id: 3,
      title: "헬스장 이용 집중 시간",
      description: "오후 7-9시 헬스장 이용률이 90%를 초과했습니다",
      time: "4시간 전",
      priority: "high",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-dark text-white p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-medium">INPOCK BUSINESS</h1>
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-2">
              <span className="text-white text-xs font-medium">관</span>
            </div>
            <span className="text-sm korean-text">관리자</span>
          </div>
        </div>
        <p className="text-gray-300 text-sm mt-1 korean-text">비즈니스 관리 대시보드</p>
      </header>

      <div className="p-4">
        {/* Business Overview */}
        <Card className="bg-white shadow-sm mb-6">
          <CardContent className="p-4">
            <h3 className="font-medium mb-4 korean-text">오늘의 비즈니스 현황</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{mockBusinessStats.dailyVisits}</p>
                <p className="text-xs text-gray-600 korean-text">일일 방문자</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{mockBusinessStats.newLeads}</p>
                <p className="text-xs text-gray-600 korean-text">신규 리드</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{mockBusinessStats.activeDeals}</p>
                <p className="text-xs text-gray-600 korean-text">진행중 딜</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{mockBusinessStats.revenue}</p>
                <p className="text-xs text-gray-600 korean-text">월 수익</p>
              </div>
            </div>
            <Button
              onClick={() => handleManagementAction("상세 분석")}
              className="w-full bg-primary text-white py-3 rounded-lg mt-4 font-medium hover:bg-primary/90"
            >
              상세 분석 보기
            </Button>
          </CardContent>
        </Card>

        {/* Management Tools */}
        <Card className="bg-white shadow-sm mb-6">
          <CardContent className="p-4">
            <h3 className="font-medium mb-4 korean-text">관리 도구</h3>
            <div className="space-y-3">
              <button
                onClick={() => handleManagementAction("사용자 관리")}
                className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center">
                  <Users className="w-5 h-5 text-gray-600 mr-3" />
                  <span className="font-medium korean-text">사용자 관리</span>
                </div>
                <div className="w-5 h-5 text-gray-400">›</div>
              </button>

              <button
                onClick={() => handleManagementAction("콘텐츠 관리")}
                className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-gray-600 mr-3" />
                  <span className="font-medium korean-text">콘텐츠 관리</span>
                </div>
                <div className="w-5 h-5 text-gray-400">›</div>
              </button>

              <button
                onClick={() => handleManagementAction("보고서")}
                className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center">
                  <BarChart2 className="w-5 h-5 text-gray-600 mr-3" />
                  <span className="font-medium korean-text">보고서</span>
                </div>
                <div className="w-5 h-5 text-gray-400">›</div>
              </button>

              <button
                onClick={() => handleManagementAction("시스템 설정")}
                className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center">
                  <Settings className="w-5 h-5 text-gray-600 mr-3" />
                  <span className="font-medium korean-text">시스템 설정</span>
                </div>
                <div className="w-5 h-5 text-gray-400">›</div>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Notifications */}
        <Card className="bg-white shadow-sm">
          <CardContent className="p-4">
            <h3 className="font-medium mb-4 korean-text">최근 알림</h3>
            <div className="space-y-3">
              {mockNotifications.map((notification) => (
                <div key={notification.id} className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium korean-text">{notification.title}</p>
                    <p className="text-xs text-gray-500 korean-text">{notification.description}</p>
                    <p className="text-xs text-gray-400">{notification.time}</p>
                  </div>
                  <div 
                    className={`w-2 h-2 rounded-full ${
                      notification.priority === "high" ? "bg-red-500" : "bg-primary"
                    }`}
                  ></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
