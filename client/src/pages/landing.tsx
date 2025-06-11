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
      <header className="flex items-center justify-between p-4 bg-white">
        <button className="p-2">
          <ArrowLeft className="w-6 h-6 text-dark" />
        </button>
        <h1 className="text-lg font-medium text-dark">AmuseFit</h1>
        <div className="w-10"></div>
      </header>

      {/* Hero Section */}
      <section className="px-6 py-8 text-center">
        <h2 className="text-2xl font-bold text-dark mb-2 korean-text">운동이 더 즐거워지는</h2>
        <h2 className="text-2xl font-bold text-primary mb-4 korean-text">AmuseFit과 함께</h2>
        <p className="text-gray-600 text-sm mb-2 korean-text">건강한 만남, 즐거운 운동</p>
        <p className="text-gray-600 text-sm mb-2 korean-text">같은 관심사를 가진 사람들과 함께</p>
        <p className="text-gray-600 text-sm mb-8 korean-text">스와이프로 만나는 운동 파트너</p>

        {/* Service Preview Card */}
        <div className="feature-card-bg rounded-2xl p-6 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm mb-4 max-w-xs mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <span className="text-white text-2xl">💪</span>
              </div>
              <p className="text-sm font-medium mb-1 korean-text">AmuseFit</p>
              <p className="text-xs text-gray-600 mb-3">건강한 만남, 즐거운 운동</p>
              <Button 
                className="bg-primary text-white text-sm px-4 py-2 rounded-lg w-full"
                onClick={() => setLocation("/service-intro")}
              >
                서비스 체험하기
              </Button>
            </div>
          </div>
          <h3 className="font-bold text-dark mb-1 korean-text">운동이 더 즐거워지는 새로운 방법</h3>
          <p className="text-sm text-gray-600 korean-text">같은 관심사를 가진 사람들과 만나 함께 운동하고</p>
          <p className="text-sm text-gray-600 korean-text">건강한 라이프스타일을 공유하세요</p>
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
