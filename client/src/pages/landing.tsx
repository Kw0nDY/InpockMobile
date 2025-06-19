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
        <h2 className="text-2xl font-bold text-dark mb-2 korean-text">피트니스를 더 즐겁게</h2>
        <h2 className="text-2xl font-bold text-primary mb-4 korean-text">AmuseFit과 함께</h2>
        <p className="text-gray-600 text-sm mb-2 korean-text">전문 트레이너의 포트폴리오</p>
        <p className="text-gray-600 text-sm mb-2 korean-text">콘텐츠 공유의 새로운 방식</p>
        <p className="text-gray-600 text-sm mb-8 korean-text">전문성과 신뢰를 바탕으로 한 연결</p>

        {/* Feature Card 1 - 포트폴리오 관리 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6 max-w-sm mx-auto">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">📱</span>
          </div>
          <div className="text-left">
            <p className="text-sm font-medium mb-1 korean-text">모바일 포트폴리오</p>
            <p className="text-sm text-gray-600 mb-3 korean-text">영상, 이미지, 링크를 한곳에</p>
            <Button className="bg-primary text-white text-sm px-4 py-2 rounded-lg w-full">
              시작하기
            </Button>
          </div>
        </div>

        <div className="text-center mb-6">
          <h3 className="font-bold text-dark mb-1 korean-text">전문 트레이너를 위한 플랫폼</h3>
          <p className="text-sm text-gray-600 korean-text">9:16 모바일 최적화 콘텐츠 뷰어</p>
          <p className="text-sm text-gray-600 korean-text">Instagram Reels, YouTube Shorts 스타일</p>
        </div>

        {/* Feature Card 2 - 콘텐츠 공유 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6 max-w-sm mx-auto">
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">🎥</span>
          </div>
          <div className="text-left">
            <p className="text-sm font-medium mb-1 korean-text">몰입형 콘텐츠 뷰어</p>
            <p className="text-sm text-gray-600 mb-3 korean-text">수직형 영상과 이미지 전용</p>
            <Button className="bg-primary text-white text-sm px-4 py-2 rounded-lg w-full">
              체험하기
            </Button>
          </div>
        </div>

        <div className="text-center mb-6">
          <h3 className="font-bold text-dark mb-1 korean-text">개인화된 프로필 페이지</h3>
          <p className="text-sm text-gray-600 korean-text">트레이너 전용 포트폴리오 관리</p>
          <p className="text-sm text-gray-600 korean-text">고객과의 직접적인 연결</p>
        </div>

        {/* Feature Card 3 - 프로필 관리 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-8 max-w-sm mx-auto">
          <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">👤</span>
          </div>
          <div className="text-left">
            <p className="text-sm font-medium mb-1 korean-text">개인 브랜딩 툴</p>
            <p className="text-xs text-gray-600 mb-2">자격증 및 수상 내역</p>
            <p className="text-xs text-gray-600 mb-2">피트니스 전문성 어필</p>
            <p className="text-xs text-gray-600 mb-3">맞춤형 프로필 URL</p>
            <Button className="bg-primary text-white text-sm px-4 py-2 rounded-lg w-full">
              지금 체험해보기
            </Button>
          </div>
        </div>

        <div className="text-center mb-8">
          <h3 className="font-bold text-dark mb-1 korean-text">트레이너 전용 디지털 명함</h3>
          <p className="text-sm text-gray-600 korean-text">QR 코드로 간편한 프로필 공유</p>
          <p className="text-sm text-gray-600 korean-text">소셜미디어 연동 기능</p>
          <p className="text-sm text-gray-600 korean-text">방문자 수 추적 및 분석</p>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <Button 
            className="bg-primary text-white font-medium py-4 px-8 rounded-xl w-full hover:bg-primary/90"
            onClick={() => setLocation("/login")}
          >
            로그인
          </Button>
          <Button 
            variant="outline"
            className="border-primary text-primary font-medium py-4 px-8 rounded-xl w-full hover:bg-primary/5"
            onClick={() => setLocation("/signup-step1")}
          >
            회원가입
          </Button>
          
          {/* Demo Link */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-600 mb-2 korean-text">데모 프로필 보기</p>
            <div className="flex justify-center space-x-4">
              <Button 
                variant="link"
                className="text-primary text-sm underline p-0"
                onClick={() => window.open("/demo_user", "_blank")}
              >
                김철수 트레이너
              </Button>
              <Button 
                variant="link"
                className="text-primary text-sm underline p-0"
                onClick={() => window.open("/미라지", "_blank")}
              >
                권동영 트레이너
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
