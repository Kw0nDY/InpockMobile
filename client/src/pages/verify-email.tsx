import { useState, useEffect } from "react";
import { ArrowLeft, Mail, CheckCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function VerifyEmailPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // URL에서 파라미터 가져오기
  const urlParams = new URLSearchParams(window.location.search);
  const email = urlParams.get('email') || '';
  const purpose = urlParams.get('purpose') as "reset_password" || 'reset_password';
  
  const [verificationCode, setVerificationCode] = useState("");
  const [timeLeft, setTimeLeft] = useState(600); // 10분
  const [isVerified, setIsVerified] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);

  // 타이머
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  // 개발 환경에서 인증번호 가져오기 (localhost에서만)
  useEffect(() => {
    if (window.location.hostname === 'localhost' && email) {
      fetchDevCode();
    }
  }, [email]);

  const fetchDevCode = async () => {
    try {
      const response = await fetch(`/api/auth/dev-get-code?email=${encodeURIComponent(email)}&purpose=reset_password`);
      const data = await response.json();
      if (data.success) {
        setDevCode(data.code);
      }
    } catch (error) {
      console.log('개발 코드 조회 실패:', error);
    }
  };

  // 인증 코드 확인
  const verifyCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest("POST", "/api/auth/verify-email-code", {
        email,
        code,
        purpose
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.verified) {
        setIsVerified(true);
        toast({
          title: "인증 성공",
          description: "이메일 인증이 완료되었습니다.",
        });
      } else {
        toast({
          title: "인증 실패",
          description: "인증번호가 올바르지 않습니다.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "인증 실패",
        description: error.message || "인증 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  // 인증번호 재전송
  const resendCodeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/send-email-code", {
        email,
        purpose
      });
      return response.json();
    },
    onSuccess: () => {
      setTimeLeft(600);
      toast({
        title: "재전송 완료",
        description: "새로운 인증번호를 이메일로 전송했습니다.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "재전송 실패",
        description: error.message || "재전송 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!verificationCode.trim()) {
      toast({
        title: "인증번호 입력 필요",
        description: "6자리 인증번호를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    
    if (verificationCode.length !== 6) {
      toast({
        title: "인증번호 형식 오류",
        description: "6자리 숫자를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    verifyCodeMutation.mutate(verificationCode);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleComplete = () => {
    setLocation(`/reset-password-new?email=${encodeURIComponent(email)}`);
  };

  // 인증 성공 화면
  if (isVerified) {
    return (
      <div className="min-h-screen bg-white">
        <header className="flex items-center justify-between p-4">
          <button className="p-2" onClick={() => setLocation("/login")}>
            <ArrowLeft className="w-6 h-6 text-dark" />
          </button>
          <h1 className="text-lg font-medium">AmuseFit</h1>
          <div className="w-10"></div>
        </header>

        <div className="px-6 py-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold mb-2 korean-text text-green-800">인증 완료</h2>
            <p className="text-gray-600 text-sm korean-text">
              이메일 인증이 성공적으로 완료되었습니다.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleComplete}
              className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90"
            >
              새 비밀번호 설정
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center justify-between p-4">
        <button className="p-2" onClick={() => window.history.back()}>
          <ArrowLeft className="w-6 h-6 text-dark" />
        </button>
        <h1 className="text-lg font-medium">AmuseFit</h1>
        <div className="w-10"></div>
      </header>

      <div className="px-6 py-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold mb-2 korean-text">이메일 인증</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800 text-center mb-2 font-medium">
              {email}로 인증번호를 발송했습니다
            </p>
            {devCode && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
                <p className="text-xs text-yellow-800 text-center mb-1">
                  개발 환경 전용 (콘솔 확인)
                </p>
                <div className="text-center">
                  <span className="text-lg font-mono font-bold text-yellow-900 bg-yellow-100 px-3 py-1 rounded">
                    {devCode}
                  </span>
                </div>
                <button
                  onClick={() => setVerificationCode(devCode)}
                  className="text-xs text-yellow-700 hover:text-yellow-900 mt-2 w-full text-center border border-yellow-300 rounded py-1 hover:bg-yellow-100"
                >
                  자동 입력
                </button>
              </div>
            )}
            <div className="bg-white rounded p-3 border border-blue-100">
              <p className="text-xs text-blue-700 text-center leading-relaxed">
                <strong>이메일이 오지 않았나요?</strong><br />
                Replit 화면 우측의 <strong>"워크플로우 콘솔"</strong>에서<br />
                "📧 이메일 인증번호" 항목을 찾아<br />
                <strong>6자리 인증번호</strong>를 확인하세요
              </p>
            </div>
          </div>
          <p className="text-amber-600 text-sm font-medium">
            남은 시간: {formatTime(timeLeft)}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="code" className="block text-sm font-medium mb-2">
              인증번호
            </Label>
            <Input
              id="code"
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full p-4 border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary text-center text-lg tracking-widest"
              placeholder="123456"
              maxLength={6}
              required
            />
          </div>

          <Button
            type="submit"
            disabled={verifyCodeMutation.isPending || timeLeft === 0}
            className="w-full bg-primary hover:bg-primary/90 text-white py-4 rounded-lg font-medium text-base"
          >
            {verifyCodeMutation.isPending ? "확인 중..." : "인증하기"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm mb-3">
            인증번호를 받지 못하셨나요?
          </p>
          <Button
            onClick={() => resendCodeMutation.mutate()}
            disabled={resendCodeMutation.isPending || timeLeft > 540} // 1분 후 재전송 가능
            variant="outline"
            className="font-medium"
          >
            {resendCodeMutation.isPending ? "재전송 중..." : "인증번호 재전송"}
          </Button>
          {timeLeft > 540 && (
            <p className="text-xs text-gray-500 mt-2">
              {formatTime(60 - (600 - timeLeft))} 후 재전송 가능
            </p>
          )}
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-2">알림</h3>
          <ul className="text-blue-600 text-sm space-y-1">
            <li>• 인증번호는 10분간 유효합니다</li>
            <li>• 3회 잘못 입력 시 재전송이 필요합니다</li>
            <li>• 이메일이 오지 않으면 스팸함을 확인해주세요</li>
          </ul>
        </div>
      </div>
    </div>
  );
}