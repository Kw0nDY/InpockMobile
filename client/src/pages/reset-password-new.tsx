import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Eye, EyeOff, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function ResetPasswordNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // URL에서 이메일 파라미터 가져오기
  const urlParams = new URLSearchParams(window.location.search);
  const email = urlParams.get('email') || '';

  // 비밀번호 유효성 검사
  const isPasswordValid = password.length >= 6;
  const doPasswordsMatch = password === confirmPassword;
  const isFormValid = isPasswordValid && doPasswordsMatch && password.trim() && confirmPassword.trim();

  // 비밀번호 재설정 API 호출
  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/reset-password", {
        email,
        newPassword: password
      });
      return response.json();
    },
    onSuccess: () => {
      setIsSuccess(true);
      toast({
        title: "비밀번호 변경 완료",
        description: "새로운 비밀번호로 로그인하세요.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "변경 실패",
        description: error.message || "비밀번호 변경에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    resetPasswordMutation.mutate();
  };

  // 성공 화면
  if (isSuccess) {
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
            <h2 className="text-xl font-bold mb-2 korean-text text-green-800">변경 완료</h2>
            <p className="text-gray-600 text-sm korean-text">
              비밀번호가 성공적으로 변경되었습니다.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => setLocation("/login")}
              className="w-full bg-primary hover:bg-primary/90 text-white py-4 text-base font-medium korean-text"
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
        <button className="p-2" onClick={() => window.history.back()}>
          <ArrowLeft className="w-6 h-6 text-dark" />
        </button>
        <h1 className="text-lg font-medium">AmuseFit</h1>
        <div className="w-10"></div>
      </header>

      <div className="px-6 py-8">
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold mb-2 korean-text">새 비밀번호 설정</h2>
          <p className="text-gray-600 text-sm korean-text">
            {email}의 새로운 비밀번호를 설정하세요.
          </p>
        </div>

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
                className="w-full p-4 border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary pr-12"
                placeholder="새 비밀번호 입력"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {password && !isPasswordValid && (
              <p className="text-red-500 text-sm mt-1">비밀번호는 6자리 이상이어야 합니다.</p>
            )}
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
                className="w-full p-4 border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary pr-12"
                placeholder="비밀번호 확인"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {confirmPassword && !doPasswordsMatch && (
              <p className="text-red-500 text-sm mt-1">비밀번호가 일치하지 않습니다.</p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-blue-800 text-sm">
              <strong>비밀번호 요구사항:</strong>
            </p>
            <ul className="text-blue-700 text-xs mt-1 space-y-1">
              <li className={isPasswordValid ? "text-green-600" : ""}>
                • 6자리 이상
              </li>
              <li className={doPasswordsMatch && password ? "text-green-600" : ""}>
                • 비밀번호 확인 일치
              </li>
            </ul>
          </div>

          <Button
            type="submit"
            disabled={!isFormValid || resetPasswordMutation.isPending}
            className="w-full bg-primary hover:bg-primary/90 disabled:bg-gray-300 text-white py-4 text-base font-medium korean-text"
          >
            {resetPasswordMutation.isPending ? "변경 중..." : "비밀번호 변경"}
          </Button>
        </form>
      </div>
    </div>
  );
}