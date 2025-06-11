import { useState } from "react";
import { ArrowLeft, Mail, Phone, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function ForgotPasswordPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [contactMethod, setContactMethod] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isSent, setIsSent] = useState(false);

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: { email?: string; phone?: string }) => {
      const response = await apiRequest("POST", "/api/auth/forgot-password", data);
      return response.json();
    },
    onSuccess: () => {
      setIsSent(true);
      toast({
        title: "전송 완료",
        description: contactMethod === "email" 
          ? "비밀번호 재설정 링크를 이메일로 전송했습니다."
          : "비밀번호 재설정 링크를 문자로 전송했습니다.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "전송 실패",
        description: error.message || "전송 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (contactMethod === "email") {
      if (!email.trim()) {
        toast({
          title: "이메일 입력 필요",
          description: "이메일 주소를 입력해주세요.",
          variant: "destructive",
        });
        return;
      }
      forgotPasswordMutation.mutate({ email });
    } else {
      if (!phone.trim()) {
        toast({
          title: "전화번호 입력 필요",
          description: "전화번호를 입력해주세요.",
          variant: "destructive",
        });
        return;
      }
      forgotPasswordMutation.mutate({ phone });
    }
  };

  const handleResend = () => {
    if (contactMethod === "email") {
      forgotPasswordMutation.mutate({ email });
    } else {
      forgotPasswordMutation.mutate({ phone });
    }
  };

  if (isSent) {
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
            <h2 className="text-xl font-bold mb-2 korean-text">전송 완료</h2>
            <p className="text-gray-600 text-sm korean-text mb-4">
              {contactMethod === "email" 
                ? `${email}로 비밀번호 재설정 링크를 전송했습니다.`
                : `${phone}로 비밀번호 재설정 링크를 전송했습니다.`
              }
            </p>
            <p className="text-gray-500 text-xs korean-text">
              {contactMethod === "email" 
                ? "이메일을 받지 못하셨나요? 스팸 폴더를 확인해보세요."
                : "문자를 받지 못하셨나요? 다시 시도해보세요."
              }
            </p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={handleResend}
              disabled={forgotPasswordMutation.isPending}
              variant="outline"
              className="w-full py-3 rounded-lg font-medium"
            >
              {forgotPasswordMutation.isPending ? "재전송 중..." : 
                contactMethod === "email" ? "이메일 재전송" : "문자 재전송"
              }
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
            <p className="text-blue-600 text-sm korean-text">
              비밀번호를 재설정할 수 없거나 다른 문제가 있으시면 고객센터로 문의해주세요.
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
            {contactMethod === "email" ? (
              <Mail className="w-8 h-8 text-primary" />
            ) : (
              <Phone className="w-8 h-8 text-primary" />
            )}
          </div>
          <h2 className="text-xl font-bold mb-2 korean-text">비밀번호 찾기</h2>
          <p className="text-gray-600 text-sm korean-text">
            등록된 연락처로 비밀번호 재설정<br />
            링크를 전송해드립니다.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contact Method Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium korean-text">연락 방법 선택</Label>
            <RadioGroup
              value={contactMethod}
              onValueChange={(value) => setContactMethod(value as "email" | "phone")}
              className="flex space-x-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="email" id="email" />
                <Label htmlFor="email" className="text-sm korean-text cursor-pointer">이메일</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="phone" id="phone" />
                <Label htmlFor="phone" className="text-sm korean-text cursor-pointer">전화번호</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Input Field */}
          <div className="space-y-2">
            {contactMethod === "email" ? (
              <>
                <Label htmlFor="email-input" className="text-sm font-medium korean-text">
                  이메일 주소
                </Label>
                <Input
                  id="email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@domain.com"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                  required
                />
              </>
            ) : (
              <>
                <Label htmlFor="phone-input" className="text-sm font-medium korean-text">
                  전화번호
                </Label>
                <Input
                  id="phone-input"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="010-0000-0000"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                  required
                />
              </>
            )}
          </div>

          <Button
            type="submit"
            disabled={forgotPasswordMutation.isPending}
            className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {forgotPasswordMutation.isPending ? "전송 중..." : "비밀번호 재설정 링크 전송"}
          </Button>
        </form>

        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500 korean-text">또는</span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <Button
              onClick={() => setLocation("/find-id")}
              variant="outline"
              className="w-full py-3 rounded-lg font-medium"
            >
              아이디 찾기
            </Button>
            
            <Button
              onClick={() => setLocation("/signup-step1")}
              variant="outline"
              className="w-full py-3 rounded-lg font-medium"
            >
              회원가입
            </Button>
          </div>
        </div>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-800 mb-2">비밀번호 찾기 안내</h3>
          <ul className="text-sm text-gray-600 space-y-1 korean-text">
            <li>• 가입 시 등록한 이메일 또는 전화번호를 선택해주세요</li>
            <li>• 재설정 링크는 선택한 연락처로만 전송됩니다</li>
            <li>• 링크는 24시간 동안만 유효합니다</li>
          </ul>
        </div>
      </div>
    </div>
  );
}