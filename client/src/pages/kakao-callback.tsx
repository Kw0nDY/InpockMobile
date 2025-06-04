import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function KakaoCallback() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleKakaoCallback = async () => {
      try {
        // Extract code from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');

        if (error) {
          throw new Error(`Kakao authentication failed: ${error}`);
        }

        if (!code) {
          throw new Error('No authorization code received from Kakao');
        }

        // Exchange code for access token and user info
        const response = await apiRequest("POST", "/api/auth/kakao/token", {
          code: code
        });

        const result = await response.json();

        if (result.success) {
          toast({
            title: "로그인 성공",
            description: result.isNewUser ? "새 계정이 생성되었습니다." : "카카오 로그인이 완료되었습니다.",
          });
          
          // Redirect to dashboard
          setLocation("/dashboard");
        } else {
          throw new Error(result.message || "Authentication failed");
        }

      } catch (error: any) {
        console.error("Kakao OAuth error:", error);
        toast({
          title: "로그인 실패",
          description: error.message || "카카오 로그인 중 오류가 발생했습니다.",
          variant: "destructive",
        });
        
        // Redirect back to login page
        setLocation("/login");
      } finally {
        setIsProcessing(false);
      }
    };

    handleKakaoCallback();
  }, [setLocation, toast]);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2C6.477 2 2 5.582 2 9.999c0 2.831 1.848 5.318 4.603 6.818l-1.234 4.505c-.097.356.269.649.589.472l5.232-2.798c.264.017.532.026.81.026 5.523 0 10-3.582 10-7.999S17.523 2 12 2z"
                fill="#3C1E1E"
              />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-800 korean-text mb-2">
            카카오 로그인 중...
          </h1>
          <p className="text-gray-600 korean-text">
            잠시만 기다려주세요
          </p>
          <div className="mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}