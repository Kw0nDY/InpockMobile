import { useState } from "react";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function ForgotPasswordPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isEmailSent, setIsEmailSent] = useState(false);

  const forgotPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest("POST", "/api/auth/forgot-password", { email });
      return response.json();
    },
    onSuccess: () => {
      setIsEmailSent(true);
      toast({
        title: "이메일 전송 완료",
        description: "비밀번호 재설정 링크를 전송했습니다.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "전송 실패",
        description: error.message || "이메일 전송 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({
        title: "이메일 입력 필요",
        description: "이메일 주소를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    
    forgotPasswordMutation.mutate(email);
  };

  const handleResendEmail = () => {
    forgotPasswordMutation.mutate(email);
  };

  if (isEmailSent) {
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
            <h2 className="text-xl font-bold mb-2 korean-text">이메일 전송 완료</h2>
            <p className="text-gray-600 text-sm korean-text mb-4">
              {email}로 비밀번호 재설정 링크를 전송했습니다.
            </p>
            <p className="text-gray-500 text-xs korean-text">
              이메일을 받지 못하셨나요? 스팸 폴더를 확인해보세요.
            </p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={handleResendEmail}
              disabled={forgotPasswordMutation.isPending}
              variant="outline"
              className="w-full py-3 rounded-lg font-medium"
            >
              {forgotPasswordMutation.isPending ? "재전송 중..." : "이메일 재전송"}
            </Button>

            <Button
              onClick={() => setLocation("/login")}
              className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90"
            >
              로그인으로 돌아가기
            </Button>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-2">도움이 필요하신가요?</h3>
            <p className="text-sm text-blue-700 korean-text">
              이메일을 받지 못하셨거나 계정에 문제가 있으시면 고객지원팀에 문의해주세요.
            </p>
          </div>
        </div>
      </div>
    );
  }

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
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold mb-2 korean-text">비밀번호 찾기</h2>
          <p className="text-gray-600 text-sm korean-text">
            등록된 이메일 주소를 입력하시면 비밀번호 재설정 링크를 전송해드립니다.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="email" className="block text-sm font-medium mb-2">
              이메일 주소
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg input-focus"
              placeholder="example@company.com"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={forgotPasswordMutation.isPending}
            className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90"
          >
            {forgotPasswordMutation.isPending ? "전송 중..." : "재설정 링크 전송"}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 korean-text mb-2">
            비밀번호가 기억나셨나요?
          </p>
          <button
            type="button"
            onClick={() => setLocation("/login")}
            className="text-primary font-medium korean-text hover:underline"
          >
            로그인으로 돌아가기
          </button>
        </div>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2">보안 안내</h3>
          <ul className="text-sm text-gray-600 space-y-1 korean-text">
            <li>• 비밀번호 재설정 링크는 30분간 유효합니다</li>
            <li>• 링크는 한 번만 사용할 수 있습니다</li>
            <li>• 새로운 요청 시 이전 링크는 무효화됩니다</li>
          </ul>
        </div>
      </div>
    </div>
  );
}