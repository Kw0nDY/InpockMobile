import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Play, 
  Trophy, 
  Users, 
  BarChart3, 
  Smartphone, 
  Link as LinkIcon,
  Image as ImageIcon,
  Video,
  Star,
  TrendingUp,
  Shield,
  Zap,
  Heart,
  Target,
  Sparkles
} from "lucide-react";

export default function ServiceIntroPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100/40">
      {/* Mobile Header - Enhanced */}
      <div className="sticky top-0 z-50 bg-white/98 backdrop-blur-md border-b border-amber-200/50 shadow-sm">
        <div className="px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => setLocation("/login")}
            className="flex items-center text-amber-700 hover:text-amber-900 transition-colors p-2 -ml-2 rounded-lg hover:bg-amber-50"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            <span className="korean-text text-sm font-medium">돌아가기</span>
          </button>
          <h1 className="text-lg font-bold text-amber-900 korean-text">서비스 소개</h1>
          <div className="w-20"></div>
        </div>
      </div>

      <div className="px-4 pb-8">
        {/* Hero Section - Enhanced */}
        <div className="text-center py-10 mb-10">
          <div className="relative w-24 h-24 bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-xl">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/20 to-transparent"></div>
            <Sparkles className="w-12 h-12 text-white relative z-10" />
          </div>
          <h1 className="text-3xl font-extrabold text-amber-900 mb-4 korean-text leading-tight">
            피트니스 전문가를 위한
            <br />
            <span className="bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent">스마트 프로필</span>
          </h1>
          <p className="text-amber-700 korean-text text-base leading-relaxed max-w-xs mx-auto font-medium">
            운동 영상, 사진, 링크를 한 곳에서 관리하고
            <br />
            고객에게 전문성을 어필하세요
          </p>
          <div className="flex justify-center mt-6 space-x-2">
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse delay-100"></div>
            <div className="w-2 h-2 bg-amber-600 rounded-full animate-pulse delay-200"></div>
          </div>
        </div>

        {/* Main Features - Premium Cards */}
        <div className="space-y-5 mb-10">
          {/* 콘텐츠 관리 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-amber-200/30 hover:shadow-xl transition-all duration-300">
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-md">
                <Play className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-amber-900 mb-3 korean-text">
                  멀티미디어 콘텐츠
                </h3>
                <div className="space-y-2 text-sm text-amber-700">
                  <div className="flex items-center korean-text bg-amber-50 rounded-lg p-2">
                    <Video className="w-4 h-4 text-amber-600 mr-3" />
                    운동 동영상 업로드
                  </div>
                  <div className="flex items-center korean-text bg-amber-50 rounded-lg p-2">
                    <ImageIcon className="w-4 h-4 text-amber-600 mr-3" />
                    Before/After 사진
                  </div>
                  <div className="flex items-center korean-text bg-amber-50 rounded-lg p-2">
                    <LinkIcon className="w-4 h-4 text-amber-600 mr-3" />
                    SNS 및 외부 링크
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 모바일 최적화 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-amber-200/30 hover:shadow-xl transition-all duration-300">
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shrink-0 shadow-md">
                <Smartphone className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-amber-900 mb-3 korean-text">
                  모바일 최적화
                </h3>
                <div className="space-y-2 text-sm text-amber-700">
                  <div className="flex items-center korean-text bg-amber-50 rounded-lg p-2">
                    <Star className="w-4 h-4 text-amber-600 mr-3" />
                    Instagram Reels 스타일
                  </div>
                  <div className="flex items-center korean-text bg-amber-50 rounded-lg p-2">
                    <Target className="w-4 h-4 text-amber-600 mr-3" />
                    터치 친화적 인터페이스
                  </div>
                  <div className="flex items-center korean-text bg-amber-50 rounded-lg p-2">
                    <Zap className="w-4 h-4 text-amber-600 mr-3" />
                    빠른 로딩 속도
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 전문성 어필 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-amber-200/30 hover:shadow-xl transition-all duration-300">
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shrink-0 shadow-md">
                <Trophy className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-amber-900 mb-3 korean-text">
                  전문성 브랜딩
                </h3>
                <div className="space-y-2 text-sm text-amber-700">
                  <div className="flex items-center korean-text bg-amber-50 rounded-lg p-2">
                    <Shield className="w-4 h-4 text-amber-600 mr-3" />
                    자격증 및 수상 내역
                  </div>
                  <div className="flex items-center korean-text bg-amber-50 rounded-lg p-2">
                    <Heart className="w-4 h-4 text-amber-600 mr-3" />
                    고객 후기 관리
                  </div>
                  <div className="flex items-center korean-text bg-amber-50 rounded-lg p-2">
                    <TrendingUp className="w-4 h-4 text-amber-600 mr-3" />
                    개인 브랜드 구축
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 실시간 분석 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-amber-200/30 hover:shadow-xl transition-all duration-300">
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shrink-0 shadow-md">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-amber-900 mb-3 korean-text">
                  실시간 분석
                </h3>
                <div className="space-y-2 text-sm text-amber-700">
                  <div className="flex items-center korean-text bg-amber-50 rounded-lg p-2">
                    <BarChart3 className="w-4 h-4 text-amber-600 mr-3" />
                    방문자 통계
                  </div>
                  <div className="flex items-center korean-text bg-amber-50 rounded-lg p-2">
                    <TrendingUp className="w-4 h-4 text-amber-600 mr-3" />
                    콘텐츠 성과 측정
                  </div>
                  <div className="flex items-center korean-text bg-amber-50 rounded-lg p-2">
                    <Users className="w-4 h-4 text-amber-600 mr-3" />
                    고객 행동 분석
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Success Stories - Enhanced */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 rounded-2xl p-8 mb-10 shadow-xl border border-amber-500/20">
          <h2 className="text-2xl font-bold text-white mb-8 text-center korean-text">
            실제 성과 데이터
          </h2>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-extrabold text-white mb-1">+150%</div>
              <p className="text-amber-100 korean-text text-sm font-medium">고객 문의</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-extrabold text-white mb-1">3배</div>
              <p className="text-amber-100 korean-text text-sm font-medium">조회수</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Target className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-extrabold text-white mb-1">80%</div>
              <p className="text-amber-100 korean-text text-sm font-medium">효율성 개선</p>
            </div>
          </div>
        </div>

        {/* Why AmuseFit Section */}
        <div className="bg-gradient-to-r from-stone-100 to-amber-50 rounded-xl p-6 mb-8 border border-stone-200/50">
          <h2 className="text-xl font-bold text-gray-900 mb-4 text-center korean-text">
            왜 AmuseFit인가?
          </h2>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-center korean-text">
              <Sparkles className="w-4 h-4 text-primary mr-3 shrink-0" />
              Instagram과 YouTube 스타일의 직관적 UI
            </div>
            <div className="flex items-center korean-text">
              <Target className="w-4 h-4 text-primary mr-3 shrink-0" />
              피트니스 업계에 특화된 기능들
            </div>
            <div className="flex items-center korean-text">
              <Shield className="w-4 h-4 text-primary mr-3 shrink-0" />
              안전하고 신뢰할 수 있는 플랫폼
            </div>
            <div className="flex items-center korean-text">
              <Heart className="w-4 h-4 text-primary mr-3 shrink-0" />
              고객과의 진정한 소통 도구
            </div>
          </div>
        </div>

        {/* Call to Action - Premium */}
        <div className="bg-gradient-to-br from-amber-800 via-amber-900 to-stone-900 rounded-2xl p-8 text-center text-white mb-8 shadow-2xl border border-amber-600/30">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-4 korean-text">
            지금 바로 체험해보세요
          </h2>
          <p className="text-base mb-8 korean-text text-amber-100 leading-relaxed max-w-xs mx-auto">
            실제 트레이너 프로필로 AmuseFit의
            <br />
            모든 기능을 미리 체험할 수 있습니다
          </p>
          <div className="space-y-4">
            <Button
              onClick={() => setLocation("/demo_user")}
              className="w-full bg-white text-amber-900 hover:bg-amber-50 py-4 text-lg font-bold korean-text rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              데모 프로필 체험하기
            </Button>
            <Button
              onClick={() => setLocation("/signup-step1")}
              variant="outline"
              className="w-full border-2 border-white text-white hover:bg-white hover:text-amber-900 py-4 text-lg font-bold korean-text rounded-xl transition-all duration-300"
            >
              무료 회원가입 시작
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-stone-500 korean-text text-xs">
          <p>AmuseFit - 피트니스 전문가의 성공 파트너</p>
        </div>
      </div>
    </div>
  );
}