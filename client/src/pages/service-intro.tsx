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
    <div className="min-h-screen bg-[#F5F5DC]">
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setLocation("/login")}
            className="flex items-center text-[#4E342E] hover:text-[#8D6E63] transition-colors p-2 -ml-2"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            <span className="korean-text text-sm">돌아가기</span>
          </button>
          <h1 className="text-lg font-bold text-[#4E342E] korean-text">서비스 소개</h1>
          <div className="w-16"></div>
        </div>
      </div>

      <div className="px-4 pb-8">
        {/* Hero Section */}
        <div className="text-center py-8 mb-8">
          <div className="w-20 h-20 bg-[#4E342E] rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#4E342E] mb-3 korean-text leading-tight">
            피트니스 전문가를 위한
            <br />
            <span className="text-[#8D6E63]">스마트 프로필</span>
          </h1>
          <p className="text-[#A1887F] korean-text text-sm leading-relaxed max-w-sm mx-auto">
            운동 영상, 사진, 링크를 한 곳에서 관리하고
            <br />
            고객에게 전문성을 어필하세요
          </p>
        </div>

        {/* Main Features */}
        <div className="space-y-4 mb-8">
          {/* 콘텐츠 관리 */}
          <div className="bg-[#EFE5DC] rounded-xl p-5 shadow-sm border border-[#D7CCC8]">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#8D6E63] rounded-lg flex items-center justify-center shrink-0">
                <Play className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-[#4E342E] mb-2 korean-text">
                  멀티미디어 콘텐츠
                </h3>
                <div className="space-y-1.5 text-sm text-[#A1887F]">
                  <div className="flex items-center korean-text">
                    <Video className="w-3.5 h-3.5 text-[#8D6E63] mr-2" />
                    운동 동영상 업로드
                  </div>
                  <div className="flex items-center korean-text">
                    <ImageIcon className="w-3.5 h-3.5 text-[#8D6E63] mr-2" />
                    Before/After 사진
                  </div>
                  <div className="flex items-center korean-text">
                    <LinkIcon className="w-3.5 h-3.5 text-[#8D6E63] mr-2" />
                    SNS 및 외부 링크
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 모바일 최적화 */}
          <div className="bg-[#EFE5DC] rounded-xl p-5 shadow-sm border border-[#D7CCC8]">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#8D6E63] rounded-lg flex items-center justify-center shrink-0">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-[#4E342E] mb-2 korean-text">
                  모바일 최적화
                </h3>
                <div className="space-y-1.5 text-sm text-[#A1887F]">
                  <div className="flex items-center korean-text">
                    <Star className="w-3.5 h-3.5 text-[#8D6E63] mr-2" />
                    Instagram Reels 스타일
                  </div>
                  <div className="flex items-center korean-text">
                    <Target className="w-3.5 h-3.5 text-[#8D6E63] mr-2" />
                    터치 친화적 인터페이스
                  </div>
                  <div className="flex items-center korean-text">
                    <Zap className="w-3.5 h-3.5 text-[#8D6E63] mr-2" />
                    빠른 로딩 속도
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 전문성 어필 */}
          <div className="bg-[#EFE5DC] rounded-xl p-5 shadow-sm border border-[#D7CCC8]">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#8D6E63] rounded-lg flex items-center justify-center shrink-0">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-[#4E342E] mb-2 korean-text">
                  전문성 브랜딩
                </h3>
                <div className="space-y-1.5 text-sm text-[#A1887F]">
                  <div className="flex items-center korean-text">
                    <Shield className="w-3.5 h-3.5 text-[#8D6E63] mr-2" />
                    자격증 및 수상 내역
                  </div>
                  <div className="flex items-center korean-text">
                    <Heart className="w-3.5 h-3.5 text-[#8D6E63] mr-2" />
                    고객 후기 관리
                  </div>
                  <div className="flex items-center korean-text">
                    <TrendingUp className="w-3.5 h-3.5 text-[#8D6E63] mr-2" />
                    개인 브랜드 구축
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 실시간 분석 */}
          <div className="bg-[#EFE5DC] rounded-xl p-5 shadow-sm border border-[#D7CCC8]">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#8D6E63] rounded-lg flex items-center justify-center shrink-0">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-[#4E342E] mb-2 korean-text">
                  실시간 분석
                </h3>
                <div className="space-y-1.5 text-sm text-[#A1887F]">
                  <div className="flex items-center korean-text">
                    <BarChart3 className="w-3.5 h-3.5 text-[#8D6E63] mr-2" />
                    방문자 통계
                  </div>
                  <div className="flex items-center korean-text">
                    <TrendingUp className="w-3.5 h-3.5 text-[#8D6E63] mr-2" />
                    콘텐츠 성과 측정
                  </div>
                  <div className="flex items-center korean-text">
                    <Users className="w-3.5 h-3.5 text-[#8D6E63] mr-2" />
                    고객 행동 분석
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Success Stories */}
        <div className="bg-[#EFE5DC] rounded-xl p-6 mb-8 shadow-sm border border-[#D7CCC8]">
          <h2 className="text-xl font-bold text-[#4E342E] mb-6 text-center korean-text">
            실제 성과 데이터
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#8D6E63] mb-1">+150%</div>
              <p className="text-[#A1887F] korean-text text-xs">고객 문의</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#8D6E63] mb-1">3배</div>
              <p className="text-[#A1887F] korean-text text-xs">조회수</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#8D6E63] mb-1">80%</div>
              <p className="text-[#A1887F] korean-text text-xs">효율성 개선</p>
            </div>
          </div>
        </div>

        {/* Why AmuseFit Section */}
        <div className="bg-[#EFE5DC] rounded-xl p-6 mb-8 border border-[#D7CCC8]">
          <h2 className="text-xl font-bold text-[#4E342E] mb-4 text-center korean-text">
            왜 AmuseFit인가?
          </h2>
          <div className="space-y-3 text-sm text-[#A1887F]">
            <div className="flex items-center korean-text">
              <Sparkles className="w-4 h-4 text-[#8D6E63] mr-3 shrink-0" />
              Instagram과 YouTube 스타일의 직관적 UI
            </div>
            <div className="flex items-center korean-text">
              <Target className="w-4 h-4 text-[#8D6E63] mr-3 shrink-0" />
              피트니스 업계에 특화된 기능들
            </div>
            <div className="flex items-center korean-text">
              <Shield className="w-4 h-4 text-[#8D6E63] mr-3 shrink-0" />
              안전하고 신뢰할 수 있는 플랫폼
            </div>
            <div className="flex items-center korean-text">
              <Heart className="w-4 h-4 text-[#8D6E63] mr-3 shrink-0" />
              고객과의 진정한 소통 도구
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-[#4E342E] rounded-xl p-6 text-center text-white mb-6 shadow-lg">
          <h2 className="text-xl font-bold mb-3 korean-text">
            지금 바로 체험해보세요
          </h2>
          <p className="text-sm mb-6 korean-text opacity-90 leading-relaxed">
            실제 트레이너 프로필로 AmuseFit의
            <br />
            모든 기능을 미리 체험할 수 있습니다
          </p>
          <div className="space-y-3">
            <Button
              onClick={() => setLocation("/demo_user")}
              className="w-full bg-white text-[#4E342E] hover:bg-gray-100 py-3 text-base font-semibold korean-text"
            >
              데모 프로필 체험하기
            </Button>
            <Button
              onClick={() => setLocation("/signup-step1")}
              variant="outline"
              className="w-full border-white text-white hover:bg-white hover:text-[#4E342E] py-3 text-base font-semibold korean-text"
            >
              무료 회원가입 시작
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[#A1887F] korean-text text-xs">
          <p>AmuseFit - 피트니스 전문가의 성공 파트너</p>
        </div>
      </div>
    </div>
  );
}