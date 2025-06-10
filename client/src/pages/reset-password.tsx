import { useState, useEffect } from "react";
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation, useRoute } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function ResetPasswordPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/reset-password/:token");
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isResetComplete, setIsResetComplete] = useState(false);

  const token = params?.token;

  // Verify token validity
  const { data: tokenValid, isLoading: isVerifying, error: tokenError } = useQuery({
    queryKey: [`/api/auth/verify-reset-token/${token}`],
    enabled: !!token,
    retry: false,
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ password, token }: { password: string; token: string }) => {
      const response = await apiRequest("POST", "/api/auth/reset-password", { password, token });
      return response.json();
    },
    onSuccess: () => {
      setIsResetComplete(true);
      toast({
        title: "비밀번호 변경 완료",
        description: "새로운 비밀번호로 로그인해주세요.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "비밀번호 변경 실패",
        description: error.message || "비밀번호 변경 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      toast({
        title: "비밀번호 입력 필요",
        description: "새 비밀번호를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "비밀번호가 너무 짧습니다",
        description: "비밀번호는 최소 8자 이상이어야 합니다.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "비밀번호 불일치",
        description: "비밀번호와 비밀번호 확인이 일치하지 않습니다.",
        variant: "destructive",
      });
      return;
    }

    if (!token) {
      toast({
        title: "유효하지 않은 링크",
        description: "비밀번호 재설정 링크가 유효하지 않습니다.",
        variant: "destructive",
      });
      return;
    }

    resetPasswordMutation.mutate({ password, token });
  };

  // Handle invalid or expired token
  if (!isVerifying && (tokenError || !tokenValid)) {
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
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold mb-2 korean-text text-red-800">링크가 만료되었습니다</h2>
            <p className="text-gray-600 text-sm korean-text mb-6">
              비밀번호 재설정 링크가 만료되었거나 유효하지 않습니다.
              새로운 링크를 요청해주세요.
            </p>
            
            <div className="space-y-4">
              <Button
                onClick={() => setLocation("/forgot-password")}
                className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90"
              >
                새 링크 요청하기
              </Button>
              
              <Button
                onClick={() => setLocation("/login")}
                variant="outline"
                className="w-full py-3 rounded-lg font-medium"
              >
                로그인으로 돌아가기
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show success page after password reset
  if (isResetComplete) {
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
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold mb-2 korean-text">비밀번호 변경 완료</h2>
            <p className="text-gray-600 text-sm korean-text mb-6">
              비밀번호가 성공적으로 변경되었습니다.
              새로운 비밀번호로 로그인해주세요.
            </p>
            
            <Button
              onClick={() => setLocation("/login")}
              className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90"
            >
              로그인하기
            </Button>
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
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold mb-2 korean-text">새 비밀번호 설정</h2>
          <p className="text-gray-600 text-sm korean-text">
            새로운 비밀번호를 입력해주세요.
          </p>
        </div>

        {isVerifying ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 korean-text">링크 확인 중...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="password" className="block text-sm font-medium mb-2">
                새 비밀번호
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg input-focus pr-12"
                  placeholder="최소 8자 이상"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                비밀번호 확인
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg input-focus pr-12"
                  placeholder="비밀번호를 다시 입력"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={resetPasswordMutation.isPending}
              className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90"
            >
              {resetPasswordMutation.isPending ? "변경 중..." : "비밀번호 변경"}
            </Button>
          </form>
        )}

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2">비밀번호 요구사항</h3>
          <ul className="text-sm text-gray-600 space-y-1 korean-text">
            <li>• 최소 8자 이상</li>
            <li>• 영문, 숫자 조합 권장</li>
            <li>• 특수문자 포함 권장</li>
            <li>• 개인정보와 관련없는 비밀번호 사용</li>
          </ul>
        </div>
      </div>
    </div>
  );
}