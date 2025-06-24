import { useState } from "react";
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function ResetPasswordNewPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // URL에서 파라미터 가져오기
  const urlParams = new URLSearchParams(window.location.search);
  const phone = urlParams.get('phone');
  const email = urlParams.get('email');
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const resetPasswordMutation = useMutation({
    mutationFn: async (newPassword: string) => {
      const response = await apiRequest("POST", "/api/auth/reset-password-new", {
        newPassword,
        phone: phone || undefined,
        email: email || undefined
      });
      return response.json();
    },
    onSuccess: () => {
      setIsCompleted(true);
      toast({
        title: "비밀번호 변경 완료",
        description: "새로운 비밀번호로 설정되었습니다.",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      toast({
        title: "비밀번호 입력 필요",
        description: "새로운 비밀번호를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    
    if (password.length < 8) {
      toast({
        title: "비밀번호 길이 부족",
        description: "비밀번호는 8자 이상이어야 합니다.",
        variant: "destructive",
      });
      return;
    }
    
    if (password !== confirmPassword) {
      toast({
        title: "비밀번호 불일치",
        description: "비밀번호 확인이 일치하지 않습니다.",
        variant: "destructive",
      });
      return;
    }

    resetPasswordMutation.mutate(password);
  };

  // 완료 화면
  if (isCompleted) {
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
            <h2 className="text-xl font-bold mb-2 korean-text text-green-800">
              비밀번호 변경 완료
            </h2>
            <p className="text-gray-600 text-sm korean-text">
              새로운 비밀번호로 성공적으로 변경되었습니다.
            </p>
          </div>

          <div className="space-y-3">
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
        <button className="p-2" onClick={() => window.history.back()}>
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
                className="w-full p-4 pr-12 border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="8자 이상 입력하세요"
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
                className="w-full p-4 pr-12 border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="비밀번호를 다시 입력하세요"
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
            className="w-full bg-primary hover:bg-primary/90 text-white py-4 rounded-lg font-medium text-base"
          >
            {resetPasswordMutation.isPending ? "변경 중..." : "비밀번호 변경"}
          </Button>
        </form>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-2">비밀번호 설정 조건</h3>
          <ul className="text-blue-600 text-sm space-y-1">
            <li>• 8자 이상 입력해주세요</li>
            <li>• 영문, 숫자, 특수문자 조합을 권장합니다</li>
            <li>• 이전에 사용한 비밀번호는 피해주세요</li>
          </ul>
        </div>
      </div>
    </div>
  );
}