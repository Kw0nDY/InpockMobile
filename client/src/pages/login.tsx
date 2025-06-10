import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import KakaoLoginButton from "@/components/ui/kakao-login-button";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("demo@amusefit.com");
  const [password, setPassword] = useState("password123");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast({
        title: "로그인 성공",
        description: "AmuseFit에 오신 것을 환영합니다!",
      });
      setLocation("/dashboard");
    } catch (error) {
      toast({
        title: "로그인 실패",
        description: "이메일 또는 비밀번호를 확인해주세요.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBusinessRegister = () => {
    setLocation("/manager");
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center justify-between p-4">
        <button className="p-2" onClick={() => setLocation("/")}>
          <ArrowLeft className="w-6 h-6 text-dark" />
        </button>
        <h1 className="text-lg font-medium">AmuseFit</h1>
        <div className="w-10"></div>
      </header>

      <div className="px-6 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-2 korean-text">로그인</h2>
          <p className="text-gray-600 text-sm korean-text">
            비즈니스 계정으로 로그인하세요
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="email" className="block text-sm font-medium mb-2">
              이메일
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

          <div>
            <Label
              htmlFor="password"
              className="block text-sm font-medium mb-2"
            >
              비밀번호
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg input-focus"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center">
              <Checkbox
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                className="mr-2"
              />
              <span>로그인 상태 유지</span>
            </label>
            <button 
              type="button" 
              onClick={() => setLocation("/forgot-password")}
              className="text-primary hover:underline"
            >
              비밀번호 찾기
            </button>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90"
          >
            {isLoading ? "로그인 중..." : "로그인"}
          </Button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center">
          <div className="flex-1 border-t border-gray-200"></div>
          <span className="px-4 text-sm text-gray-500 korean-text">또는</span>
          <div className="flex-1 border-t border-gray-200"></div>
        </div>

        {/* Kakao Login */}
        <KakaoLoginButton variant="login" />

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 korean-text">
            계정이 없으신가요?
          </p>
          <button
            type="button"
            onClick={() => setLocation("/signup-step1")}
            className="text-primary font-medium korean-text hover:underline"
          >
            회원가입
          </button>
        </div>

        {/* Business Registration Option */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2">INPOCK BUSINESS</h3>
          <p className="text-sm text-gray-600 mb-3 korean-text">
            비즈니스 계정으로 더 많은 기능을 이용하세요
          </p>
          <Button
            onClick={handleBusinessRegister}
            className="w-full bg-dark text-white py-3 rounded-lg font-medium hover:bg-dark/90"
          >
            비즈니스 계정 등록
          </Button>
        </div>
      </div>
    </div>
  );
}
