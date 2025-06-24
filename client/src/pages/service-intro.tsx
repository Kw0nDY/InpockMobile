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
  Zap
} from "lucide-react";

export default function ServiceIntroPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => setLocation("/login")}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            돌아가기
          </button>
          <h1 className="text-xl font-bold text-gray-900 korean-text">AmuseFit 서비스 소개</h1>
          <div className="w-20"></div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-gradient-to-r from-primary to-amber-600 rounded-3xl mx-auto mb-6 flex items-center justify-center">
            <Zap className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4 korean-text">
            피트니스 전문가를 위한
            <br />
            올인원 플랫폼
          </h1>
          <p className="text-xl text-gray-600 korean-text max-w-2xl mx-auto">
            AmuseFit으로 당신의 피트니스 비즈니스를 한 단계 업그레이드하세요. 
            콘텐츠 관리부터 고객 소통까지, 모든 것이 하나로 통합됩니다.
          </p>
        </div>

        {/* Main Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {/* Feature 1 - 콘텐츠 관리 */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
              <Play className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4 korean-text">
              멀티미디어 콘텐츠 관리
            </h3>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-center korean-text">
                <Video className="w-4 h-4 text-primary mr-3" />
                운동 동영상 업로드 및 관리
              </li>
              <li className="flex items-center korean-text">
                <ImageIcon className="w-4 h-4 text-primary mr-3" />
                Before/After 사진 갤러리
              </li>
              <li className="flex items-center korean-text">
                <LinkIcon className="w-4 h-4 text-primary mr-3" />
                외부 링크 통합 관리
              </li>
            </ul>
          </div>

          {/* Feature 2 - 모바일 최적화 */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mb-6">
              <Smartphone className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4 korean-text">
              모바일 퍼스트 디자인
            </h3>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-center korean-text">
                <Star className="w-4 h-4 text-primary mr-3" />
                Instagram Reels 스타일 UI
              </li>
              <li className="flex items-center korean-text">
                <Star className="w-4 h-4 text-primary mr-3" />
                터치 최적화 인터페이스
              </li>
              <li className="flex items-center korean-text">
                <Star className="w-4 h-4 text-primary mr-3" />
                빠른 로딩 속도
              </li>
            </ul>
          </div>

          {/* Feature 3 - 전문성 어필 */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
              <Trophy className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4 korean-text">
              전문성 브랜딩
            </h3>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-center korean-text">
                <Shield className="w-4 h-4 text-primary mr-3" />
                자격증 및 수상 내역 전시
              </li>
              <li className="flex items-center korean-text">
                <Users className="w-4 h-4 text-primary mr-3" />
                고객 후기 및 성과 사례
              </li>
              <li className="flex items-center korean-text">
                <TrendingUp className="w-4 h-4 text-primary mr-3" />
                개인 브랜드 구축
              </li>
            </ul>
          </div>

          {/* Feature 4 - 분석 도구 */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mb-6">
              <BarChart3 className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4 korean-text">
              실시간 분석
            </h3>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-center korean-text">
                <BarChart3 className="w-4 h-4 text-primary mr-3" />
                방문자 통계 및 분석
              </li>
              <li className="flex items-center korean-text">
                <TrendingUp className="w-4 h-4 text-primary mr-3" />
                콘텐츠 성과 측정
              </li>
              <li className="flex items-center korean-text">
                <Users className="w-4 h-4 text-primary mr-3" />
                고객 행동 패턴 분석
              </li>
            </ul>
          </div>

          {/* Feature 5 - 맞춤형 URL */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
              <LinkIcon className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4 korean-text">
              개인 맞춤 URL
            </h3>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-center korean-text">
                <LinkIcon className="w-4 h-4 text-primary mr-3" />
                기억하기 쉬운 개인 URL
              </li>
              <li className="flex items-center korean-text">
                <Shield className="w-4 h-4 text-primary mr-3" />
                브랜드 일관성 유지
              </li>
              <li className="flex items-center korean-text">
                <TrendingUp className="w-4 h-4 text-primary mr-3" />
                마케팅 효과 극대화
              </li>
            </ul>
          </div>

          {/* Feature 6 - 고객 소통 */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-teal-100 rounded-xl flex items-center justify-center mb-6">
              <Users className="w-8 h-8 text-teal-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4 korean-text">
              효율적 고객 관리
            </h3>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-center korean-text">
                <Users className="w-4 h-4 text-primary mr-3" />
                통합 고객 관리 시스템
              </li>
              <li className="flex items-center korean-text">
                <Star className="w-4 h-4 text-primary mr-3" />
                실시간 알림 기능
              </li>
              <li className="flex items-center korean-text">
                <Shield className="w-4 h-4 text-primary mr-3" />
                안전한 소통 환경
              </li>
            </ul>
          </div>
        </div>

        {/* Success Stories */}
        <div className="bg-white rounded-3xl p-8 mb-16 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center korean-text">
            실제 트레이너들의 성공 사례
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">150%</div>
              <p className="text-gray-600 korean-text">고객 문의 증가</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">3x</div>
              <p className="text-gray-600 korean-text">콘텐츠 조회수 향상</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">80%</div>
              <p className="text-gray-600 korean-text">업무 효율성 개선</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-primary to-amber-600 rounded-3xl p-8 text-center text-white mb-8">
          <h2 className="text-2xl font-bold mb-4 korean-text">
            지금 바로 AmuseFit을 체험해보세요
          </h2>
          <p className="text-lg mb-8 korean-text opacity-90">
            실제 트레이너 프로필을 통해 AmuseFit의 모든 기능을 미리 체험해보실 수 있습니다
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => setLocation("/demo_user")}
              className="bg-white text-primary hover:bg-gray-100 px-8 py-3 text-lg font-semibold"
            >
              데모 프로필 체험하기
            </Button>
            <Button
              onClick={() => setLocation("/signup-step1")}
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-primary px-8 py-3 text-lg font-semibold"
            >
              무료 회원가입
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 korean-text">
          <p>AmuseFit - 피트니스 전문가를 위한 최고의 선택</p>
        </div>
      </div>
    </div>
  );
}