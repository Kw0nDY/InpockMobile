import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function KakaoCallback() {
  const [, setLocation] = useLocation();
  const { setUser } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleKakaoCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');

        if (error) {
          toast({
            title: "로그인 실패",
            description: "카카오 로그인 중 오류가 발생했습니다.",
            variant: "destructive",
          });
          setLocation('/login');
          return;
        }

        if (!code) {
          toast({
            title: "로그인 실패",
            description: "인증 코드가 없습니다.",
            variant: "destructive",
          });
          setLocation('/login');
          return;
        }

        // 카카오 인증 코드로 사용자 정보 요청
        const response = await apiRequest('POST', '/api/auth/kakao/token', {
          code
        });

        if (response.user) {
          setUser(response.user);

          // 서버에서 전달된 registrationComplete 상태 확인
          if (!response.registrationComplete) {
            toast({
              title: "추가 정보 입력 필요",
              description: "서비스 이용을 위해 추가 정보를 입력해주세요.",
            });
            setLocation('/complete-registration');
          } else {
            toast({
              title: "로그인 성공",
              description: `안녕하세요, ${response.user.name || response.user.username}님!`,
            });
            setLocation('/dashboard');
          }
        }
      } catch (error) {
        console.error('Kakao callback error:', error);
        toast({
          title: "로그인 실패",
          description: "카카오 로그인 처리 중 오류가 발생했습니다.",
          variant: "destructive",
        });
        setLocation('/login');
      } finally {
        setIsProcessing(false);
      }
    };

    handleKakaoCallback();
  }, [setUser, setLocation, toast]);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">카카오 로그인 처리 중...</p>
        </div>
      </div>
    );
  }

  return null;
}