import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function ServiceIntroPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-white">
        <button 
          className="p-2" 
          onClick={() => setLocation("/login")}
        >
          <ArrowLeft className="w-6 h-6 text-dark" />
        </button>
        <h1 className="text-lg font-medium text-dark">AmuseFit</h1>
        <div className="w-10"></div>
      </header>

      {/* Main Content */}
      <section className="px-6 py-8 text-center">        
        <h2 className="text-2xl font-bold text-dark mb-2 korean-text">피트니스 전문가를 위한</h2>
        <h2 className="text-2xl font-bold text-primary mb-4 korean-text">올인원 프로필 플랫폼</h2>
        
        <p className="text-gray-600 text-sm mb-2 korean-text">세로형 비디오와 이미지로 전문성을 어필하고</p>
        <p className="text-gray-600 text-sm mb-2 korean-text">링크 관리로 고객과의 연결을 강화하세요</p>
        <p className="text-gray-600 text-sm mb-8 korean-text">실시간 방문 알림으로 성과를 추적하세요</p>

        {/* Main Service Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-8 max-w-sm mx-auto">
          <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">🏋️</span>
          </div>
          <h3 className="font-bold text-dark mb-2 korean-text">AmuseFit Pro</h3>
          <p className="text-sm text-gray-600 mb-4 korean-text">피트니스 전문가의 디지털 프로필</p>
          <Button 
            className="bg-primary text-white text-sm px-6 py-2 rounded-lg w-full font-medium"
            onClick={() => setLocation("/demo_user")}
          >
            데모 체험하기
          </Button>
        </div>

        {/* Features Section */}
        <div className="space-y-6 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <span className="text-blue-600 text-lg">📱</span>
            </div>
            <h4 className="font-semibold text-dark mb-2 korean-text">모바일 최적화 프로필</h4>
            <p className="text-xs text-gray-600 korean-text">세로형 비디오와 이미지로 운동 전문성을 효과적으로 어필</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <span className="text-green-600 text-lg">🔗</span>
            </div>
            <h4 className="font-semibold text-dark mb-2 korean-text">스마트 링크 관리</h4>
            <p className="text-xs text-gray-600 korean-text">PT 예약, 온라인 강의, SNS 등 모든 링크를 한 곳에서 관리</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <span className="text-purple-600 text-lg">📊</span>
            </div>
            <h4 className="font-semibold text-dark mb-2 korean-text">실시간 성과 분석</h4>
            <p className="text-xs text-gray-600 korean-text">프로필 방문자 수, 링크 클릭률 등을 실시간으로 추적</p>
          </div>
        </div>

        {/* Bottom CTA Button */}
        <Button 
          className="bg-primary text-white font-medium py-4 px-8 rounded-xl w-full hover:bg-primary/90"
          onClick={() => setLocation("/demo_user")}
        >
          지금 체험해보기
        </Button>
      </section>
    </div>
  );
}