import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [settings, setSettings] = useState({
    notifications: true,
    marketing: false,
    darkMode: false,
    language: "한국어",
    timezone: "Seoul (UTC+9)",
    currency: "KRW (₩)",
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2);
  };

  const handleSaveSettings = () => {
    toast({
      title: "설정 저장됨",
      description: "변경사항이 성공적으로 저장되었습니다.",
    });
  };

  const handleSettingsAction = (action: string) => {
    toast({
      title: `${action} 선택됨`,
      description: `${action} 페이지로 이동합니다.`,
    });
  };

  const handleLogout = () => {
    logout();
    setLocation("/");
    toast({
      title: "로그아웃",
      description: "성공적으로 로그아웃되었습니다.",
    });
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header 
        title="설정" 
        rightAction={{ text: "저장", onClick: handleSaveSettings }} 
      />

      <div className="divide-y divide-gray-100">
        {/* Profile Section */}
        <div className="p-4 bg-white">
          <h3 className="font-medium mb-4 korean-text">프로필</h3>
          <div className="flex items-center mb-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mr-4">
              <span className="text-white font-medium text-lg">
                {user?.name ? getInitials(user.name) : "사용자"}
              </span>
            </div>
            <div className="flex-1">
              <p className="font-medium korean-text">{user?.name || "사용자"}</p>
              <p className="text-gray-500 text-sm">{user?.email}</p>
            </div>
            <button 
              onClick={() => handleSettingsAction("프로필 편집")}
              className="text-primary text-sm korean-text"
            >
              편집
            </button>
          </div>
        </div>

        {/* Account Settings */}
        <div className="p-4 bg-white">
          <h3 className="font-medium mb-4 korean-text">계정 설정</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm korean-text">알림 설정</span>
              <Switch
                checked={settings.notifications}
                onCheckedChange={(checked) => updateSetting("notifications", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm korean-text">마케팅 이메일</span>
              <Switch
                checked={settings.marketing}
                onCheckedChange={(checked) => updateSetting("marketing", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm korean-text">다크 모드</span>
              <Switch
                checked={settings.darkMode}
                onCheckedChange={(checked) => updateSetting("darkMode", checked)}
              />
            </div>
          </div>
        </div>

        {/* Language & Region */}
        <div className="p-4 bg-white">
          <h3 className="font-medium mb-4 korean-text">언어 및 지역</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm korean-text">언어</span>
              <Select value={settings.language} onValueChange={(value) => updateSetting("language", value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="한국어">한국어</SelectItem>
                  <SelectItem value="English">English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm korean-text">시간대</span>
              <Select value={settings.timezone} onValueChange={(value) => updateSetting("timezone", value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Seoul (UTC+9)">Seoul (UTC+9)</SelectItem>
                  <SelectItem value="Tokyo (UTC+9)">Tokyo (UTC+9)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm korean-text">통화</span>
              <Select value={settings.currency} onValueChange={(value) => updateSetting("currency", value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KRW (₩)">KRW (₩)</SelectItem>
                  <SelectItem value="USD ($)">USD ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="p-4 bg-white">
          <h3 className="font-medium mb-4 korean-text">보안</h3>
          <div className="space-y-3">
            <button
              onClick={() => handleSettingsAction("비밀번호 변경")}
              className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-sm korean-text">비밀번호 변경</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>

            <button
              onClick={() => handleSettingsAction("2단계 인증")}
              className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-sm korean-text">2단계 인증</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>

            <button
              onClick={() => handleSettingsAction("연결된 기기")}
              className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-sm korean-text">연결된 기기</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Subscription */}
        <div className="p-4 bg-white">
          <h3 className="font-medium mb-4 korean-text">구독 관리</h3>
          <div className="feature-card-bg rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium korean-text">INPOCK PRO</span>
              <span className="text-primary font-bold">₩19,000/월</span>
            </div>
            <p className="text-sm text-gray-600 mb-3 korean-text">다음 결제일: 2024년 2월 15일</p>
            <Button
              onClick={() => handleSettingsAction("구독 관리")}
              className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90"
            >
              구독 관리
            </Button>
          </div>
        </div>

        {/* Support */}
        <div className="p-4 bg-white">
          <h3 className="font-medium mb-4 korean-text">지원</h3>
          <div className="space-y-3">
            <button
              onClick={() => handleSettingsAction("고객 지원")}
              className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-sm korean-text">고객 지원</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>

            <button
              onClick={() => handleSettingsAction("도움말 센터")}
              className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-sm korean-text">도움말 센터</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>

            <button
              onClick={() => handleSettingsAction("피드백 보내기")}
              className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-sm korean-text">피드백 보내기</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Logout */}
        <div className="p-4 bg-white">
          <Button
            onClick={handleLogout}
            variant="destructive"
            className="w-full bg-red-500 text-white py-3 rounded-lg font-medium hover:bg-red-600"
          >
            로그아웃
          </Button>
        </div>
      </div>
    </div>
  );
}
