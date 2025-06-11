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
        <h2 className="text-2xl font-bold text-dark mb-2 korean-text">비즈니스를 즐겁게</h2>
        <h2 className="text-2xl font-bold text-primary mb-4 korean-text">AmuseFit과 함께</h2>
        <p className="text-gray-600 text-sm mb-2 korean-text">스마트한 비즈니스 관리</p>
        <p className="text-gray-600 text-sm mb-2 korean-text">네트워킹의 새로운 패러다임</p>
        <p className="text-gray-600 text-sm mb-8 korean-text">전문적이고 신뢰할 수 있는 비즈니스 연결</p>

        {/* Feature Card 1 - 통계 관리 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6 max-w-sm mx-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">통계 관리</span>
            <button className="w-4 h-4 text-gray-400">✕</button>
          </div>
          <div className="text-left">
            <p className="text-sm font-medium mb-1 korean-text">보편적 데이터 통계</p>
            <p className="text-sm text-gray-600 mb-3 korean-text">직관 비즈니스 통계</p>
            <Button className="bg-primary text-white text-sm px-4 py-2 rounded-lg w-full">
              시작하기
            </Button>
          </div>
        </div>

        <div className="text-center mb-6">
          <h3 className="font-bold text-dark mb-1 korean-text">퀄리티 높은 비즈니스 매칭</h3>
          <p className="text-sm text-gray-600 korean-text">검증된 비즈니스 파트너와의 안전한 거래</p>
          <p className="text-sm text-gray-600 korean-text">전문성과 신뢰성을 바탕으로 한 네트워킹</p>
        </div>

        {/* Feature Card 2 - 전문 컨설턴트 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6 max-w-sm mx-auto">
          <div className="text-left">
            <p className="text-sm font-medium mb-1 korean-text">전문 컨설턴트</p>
            <p className="text-sm text-gray-600 mb-3 korean-text">직관 비즈니스 솔루션 제공</p>
            <Button className="bg-primary text-white text-sm px-4 py-2 rounded-lg w-full">
              상담하기
            </Button>
          </div>
        </div>

        <div className="text-center mb-6">
          <h3 className="font-bold text-dark mb-1 korean-text">전문가와 함께하는 비즈니스 성장</h3>
          <p className="text-sm text-gray-600 korean-text">다양한 분야의 전문가 네트워크</p>
          <p className="text-sm text-gray-600 korean-text">맞춤형 컨설팅 서비스</p>
        </div>

        {/* Feature Card 3 - 스마트 매칭 시스템 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-8 max-w-sm mx-auto">
          <div className="text-left">
            <p className="text-sm font-medium mb-1 korean-text">스마트 매칭 시스템</p>
            <p className="text-xs text-gray-600 mb-2">AI 기반 추천</p>
            <p className="text-xs text-gray-600 mb-2">빅데이터 분석</p>
            <p className="text-xs text-gray-600 mb-3">맞춤형 솔루션</p>
            <Button className="bg-primary text-white text-sm px-4 py-2 rounded-lg w-full">
              지금 체험해보기
            </Button>
          </div>
        </div>

        <div className="text-center mb-8">
          <h3 className="font-bold text-dark mb-1 korean-text">AI 기반 스마트 매칭</h3>
          <p className="text-sm text-gray-600 korean-text">최적의 비즈니스 파트너 추천</p>
          <p className="text-sm text-gray-600 korean-text">데이터 기반 정확한 매칭</p>
          <p className="text-sm text-gray-600 korean-text">효율적인 비즈니스 연결</p>
        </div>

        {/* CTA Button */}
        <Button 
          className="bg-primary text-white font-medium py-4 px-8 rounded-xl w-full hover:bg-primary/90"
          onClick={() => setLocation("/login")}
        >
          지금 시작하기
        </Button>
      </section>
    </div>
  );
}
