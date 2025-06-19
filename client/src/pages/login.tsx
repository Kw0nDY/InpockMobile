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
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(username, password, rememberMe);
      toast({
        title: "로그인 성공",
        description: rememberMe 
          ? "AmuseFit에 오신 것을 환영합니다! 로그인 상태가 유지됩니다."
          : "AmuseFit에 오신 것을 환영합니다!",
      });
      setLocation("/dashboard");
    } catch (error) {
      toast({
        title: "로그인 실패",
        description: "닉네임 또는 비밀번호를 확인해주세요.",
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
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between p-4 bg-white">
        <button className="p-2" onClick={() => setLocation("/")}>
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-lg font-medium text-gray-900">AmuseFit</h1>
        <div className="w-10"></div>
      </header>

      <div className="px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2 korean-text text-gray-900">로그인</h2>
          <p className="text-gray-600 text-sm korean-text">
            AmuseFit 계정으로 로그인하세요.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <Label htmlFor="username" className="block text-sm font-medium mb-2 text-gray-700">
              닉네임
            </Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-lg bg-white focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="트레이너닉네임"
              required
            />
          </div>

          <div>
            <Label
              htmlFor="password"
              className="block text-sm font-medium mb-2 text-gray-700"
            >
              비밀번호
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-lg bg-white focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="flex items-center justify-between text-sm mb-2">
            <label className="flex items-center">
              <Checkbox
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                className="mr-2"
              />
              <span className="text-gray-600">로그인 상태 유지</span>
            </label>
          </div>

          <div className="flex items-center justify-center gap-4 text-sm mb-4">
            <button 
              type="button" 
              onClick={() => setLocation("/find-id")}
              className="text-primary hover:underline"
            >
              닉네임 찾기
            </button>
            <span className="text-gray-300">|</span>
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
            className="w-full bg-primary hover:bg-primary/90 text-white py-4 rounded-lg font-medium text-base"
          >
            {isLoading ? "로그인 중..." : "로그인"}
          </Button>
        </form>

        {/* Divider */}
        <div className="my-8 flex items-center">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-sm text-gray-500 korean-text">또는</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Kakao Login */}
        <div className="mb-8">
          <KakaoLoginButton variant="login" />
        </div>

        <div className="text-center mb-8">
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

        {/* AmuseFit Service Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="font-semibold mb-2 text-gray-900">AmuseFit Service</h3>
          <p className="text-sm text-gray-600 mb-4 korean-text">
            AmuseFit 서비스를 원활하게 이용하세요
          </p>
          <Button
            onClick={() => setLocation("/service-intro")}
            className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-medium"
          >
            서비스 체험하기
          </Button>
        </div>
      </div>
    </div>
  );
}
