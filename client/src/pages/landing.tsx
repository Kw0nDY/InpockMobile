import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const oauthSuccess = urlParams.get('oauth_success');
      const isNewUser = urlParams.get('is_new_user') === 'true';
      const oauthError = urlParams.get('oauth_error');
      
      // Handle OAuth success from immediate backend processing
      if (oauthSuccess === 'true') {
        console.log("OAuth authentication successful:", { isNewUser });
        window.history.replaceState({}, document.title, "/");
        
        toast({
          title: "로그인 성공",
          description: isNewUser ? "새 계정이 생성되었습니다." : "카카오 로그인이 완료되었습니다.",
        });
        
        // Navigate to dashboard after showing success message
        setTimeout(() => setLocation("/dashboard"), 1000);
        return;
      }
      
      // Handle OAuth errors from backend
      if (oauthError) {
        console.error("OAuth error from backend:", oauthError);
        window.history.replaceState({}, document.title, "/");
        
        let errorMessage = "카카오 로그인 중 오류가 발생했습니다.";
        
        // Provide user-friendly error messages
        if (oauthError.includes('KOE320')) {
          errorMessage = "인증 코드가 만료되었습니다. 다시 시도해주세요.";
        } else if (oauthError.includes('invalid_grant')) {
          errorMessage = "인증 정보가 유효하지 않습니다. 다시 시도해주세요.";
        } else if (oauthError.includes('user_fetch_failed')) {
          errorMessage = "사용자 정보를 가져오는데 실패했습니다.";
        }
        
        toast({
          title: "로그인 실패",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }
      
      // Check for legacy oauth_code parameter (fallback)
      const code = urlParams.get('oauth_code');
      const state = urlParams.get('state');
      
      if (code) {
        console.log("Processing legacy OAuth callback:", { hasCode: !!code, state });
        
        try {
          // Validate state parameter for CSRF protection
          const expectedState = sessionStorage.getItem('kakao_oauth_state');
          if (state && expectedState && state !== expectedState) {
            throw new Error('CSRF 보안 검증 실패');
          }

          const response = await apiRequest("POST", "/api/auth/kakao/token", { code });
          const result = await response.json();

          if (result.success) {
            sessionStorage.removeItem('kakao_oauth_state');
            window.history.replaceState({}, document.title, "/");
            
            toast({
              title: "로그인 성공",
              description: result.isNewUser ? "새 계정이 생성되었습니다." : "카카오 로그인이 완료되었습니다.",
            });
            
            setTimeout(() => setLocation("/dashboard"), 500);
          } else {
            throw new Error(result.message || "인증 처리 실패");
          }
        } catch (error: any) {
          console.error("Legacy OAuth callback error:", error);
          window.history.replaceState({}, document.title, "/");
          
          toast({
            title: "로그인 실패",
            description: "카카오 로그인 처리 중 오류가 발생했습니다.",
            variant: "destructive",
          });
        }
      }
    };

    handleOAuthCallback();
  }, [setLocation, toast]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-center p-4 bg-white">
        <h1 className="text-lg font-medium text-dark">AmuseFit</h1>
      </header>

      {/* Hero Section */}
      <section className="px-6 py-8 text-center">
        <div className="mb-8">
          <div className="w-24 h-24 bg-gradient-to-r from-pink-500 to-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <span className="text-white text-4xl">🏃‍♂️</span>
          </div>
        </div>
        <h2 className="text-3xl font-bold text-dark mb-3 korean-text">피트니스 전문가를 위한</h2>
        <h2 className="text-3xl font-bold text-primary mb-6 korean-text">올인원 플랫폼</h2>
        <p className="text-gray-600 text-lg mb-3 korean-text">Instagram Reels 스타일의 콘텐츠 공유</p>
        <p className="text-gray-600 text-lg mb-3 korean-text">전문성을 어필하는 개인 브랜딩</p>
        <p className="text-gray-600 text-lg mb-12 korean-text">고객과의 직접적인 연결</p>

        {/* Main Features Section */}
        <div className="space-y-8 mb-12">
          
          {/* Feature 1 - 9:16 콘텐츠 뷰어 */}
          <div className="bg-white rounded-3xl p-8 shadow-lg">
            <div className="flex items-center justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
                <span className="text-white text-3xl">📱</span>
              </div>
            </div>
            <h3 className="text-xl font-bold text-dark mb-3 korean-text text-center">9:16 몰입형 콘텐츠 뷰어</h3>
            <p className="text-gray-600 text-center mb-4 korean-text">Instagram Reels, YouTube Shorts와 동일한 세로형 콘텐츠 경험</p>
            <div className="bg-gray-50 rounded-xl p-4">
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center korean-text">
                  <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
                  터치 한번으로 다음 콘텐츠 이동
                </li>
                <li className="flex items-center korean-text">
                  <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
                  자동 재생 및 무한 스크롤
                </li>
                <li className="flex items-center korean-text">
                  <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
                  모바일 최적화된 인터페이스
                </li>
              </ul>
            </div>
          </div>

          {/* Feature 2 - 개인 브랜딩 */}
          <div className="bg-white rounded-3xl p-8 shadow-lg">
            <div className="flex items-center justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl flex items-center justify-center">
                <span className="text-white text-3xl">💪</span>
              </div>
            </div>
            <h3 className="text-xl font-bold text-dark mb-3 korean-text text-center">전문성 어필 도구</h3>
            <p className="text-gray-600 text-center mb-4 korean-text">피트니스 전문가로서의 신뢰성과 전문성을 한눈에 보여주세요</p>
            <div className="bg-gray-50 rounded-xl p-4">
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center korean-text">
                  <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
                  자격증 및 수상 내역 전시
                </li>
                <li className="flex items-center korean-text">
                  <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
                  개인 소개 및 전문 분야 소개
                </li>
                <li className="flex items-center korean-text">
                  <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
                  고객 후기 및 성과 사례
                </li>
              </ul>
            </div>
          </div>

          {/* Feature 3 - 올인원 포트폴리오 */}
          <div className="bg-white rounded-3xl p-8 shadow-lg">
            <div className="flex items-center justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-orange-500 rounded-2xl flex items-center justify-center">
                <span className="text-white text-3xl">🎯</span>
              </div>
            </div>
            <h3 className="text-xl font-bold text-dark mb-3 korean-text text-center">올인원 디지털 포트폴리오</h3>
            <p className="text-gray-600 text-center mb-4 korean-text">영상, 이미지, 링크를 하나의 플랫폼에서 통합 관리</p>
            <div className="bg-gray-50 rounded-xl p-4">
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center korean-text">
                  <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
                  운동 영상 및 사진 업로드
                </li>
                <li className="flex items-center korean-text">
                  <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
                  외부 링크 연결 (SNS, 홈페이지 등)
                </li>
                <li className="flex items-center korean-text">
                  <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
                  맞춤형 프로필 URL 제공
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Demo Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-8 mb-8">
          <h3 className="text-xl font-bold text-dark mb-4 korean-text text-center">실제 트레이너 프로필 체험하기</h3>
          <p className="text-gray-600 text-center mb-6 korean-text">AmuseFit이 제공하는 프로필 경험을 직접 확인해보세요</p>
          
          <div className="grid grid-cols-1 gap-4 max-w-sm mx-auto">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center mb-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-lg">김</span>
                </div>
                <div>
                  <p className="font-medium korean-text">김철수 트레이너</p>
                  <p className="text-sm text-gray-500 korean-text">헬스, 크로스핏 전문</p>
                </div>
              </div>
              <Button 
                className="bg-primary text-white w-full rounded-xl py-2"
                onClick={() => window.open("/demo_user", "_blank")}
              >
                프로필 보기
              </Button>
            </div>
            
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center mb-3">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-lg">권</span>
                </div>
                <div>
                  <p className="font-medium korean-text">권동영 트레이너</p>
                  <p className="text-sm text-gray-500 korean-text">요가, 필라테스 전문</p>
                </div>
              </div>
              <Button 
                className="bg-primary text-white w-full rounded-xl py-2"
                onClick={() => window.open("/미라지", "_blank")}
              >
                프로필 보기
              </Button>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h3 className="text-2xl font-bold text-dark mb-4 korean-text">당신도 시작해보세요</h3>
          <p className="text-gray-600 mb-8 korean-text">전문 트레이너를 위한 올인원 플랫폼으로 고객과 더 가깝게 연결되세요</p>
          
          <div className="space-y-4 flex flex-col items-center">
            <Button 
              className="bg-primary text-white font-medium py-4 px-8 rounded-xl w-full text-base hover:bg-primary/90 text-center"
              onClick={() => setLocation("/signup-step1")}
            >
              무료로 시작하기
            </Button>
            <Button 
              variant="ghost"
              className="text-gray-600 font-medium py-2 px-4 w-full text-center"
              onClick={() => setLocation("/login")}
            >
              이미 계정이 있나요? 로그인
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
