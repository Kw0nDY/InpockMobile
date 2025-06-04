import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";

const signupSchema = z.object({
  fullName: z.string()
    .min(2, "이름은 최소 2자 이상이어야 합니다")
    .max(50, "이름은 50자를 초과할 수 없습니다")
    .regex(/^[가-힣a-zA-Z\s]+$/, "이름은 한글, 영문, 공백만 입력 가능합니다"),
  email: z.string()
    .email("올바른 이메일 주소를 입력해주세요")
    .min(1, "이메일을 입력해주세요"),
  password: z.string()
    .min(8, "비밀번호는 최소 8자 이상이어야 합니다")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "비밀번호는 대문자, 소문자, 숫자를 포함해야 합니다"),
  phoneNumber: z.string()
    .min(10, "올바른 전화번호를 입력해주세요")
    .regex(/^[0-9-+\s()]+$/, "올바른 전화번호 형식이 아닙니다"),
  dateOfBirth: z.string()
    .min(1, "생년월일을 입력해주세요")
    .refine((date) => {
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 14 && age <= 120;
    }, "만 14세 이상이어야 가입 가능합니다"),
  referralCode: z.string().optional(),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: "서비스 이용약관에 동의해주세요"
  })
});

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      phoneNumber: "",
      dateOfBirth: "",
      referralCode: "",
      agreeToTerms: false,
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: SignupForm) => {
      // Validate data before sending
      const validatedData = signupSchema.parse(data);
      
      const response = await apiRequest("POST", "/api/auth/signup", {
        username: validatedData.email.split("@")[0],
        email: validatedData.email,
        password: validatedData.password,
        name: validatedData.fullName,
        company: "",
        role: "user",
        phoneNumber: validatedData.phoneNumber,
        dateOfBirth: validatedData.dateOfBirth,
        referralCode: validatedData.referralCode || null,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || "회원가입에 실패했습니다");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "🎉 회원가입 완료",
        description: `${data.user.name}님, INPOCK에 오신 것을 환영합니다! 로그인해주세요.`,
      });
      
      // Clear form
      form.reset();
      
      // Redirect to login after delay
      setTimeout(() => {
        setLocation("/login");
      }, 2000);
    },
    onError: (error: any) => {
      let errorMessage = "회원가입 중 오류가 발생했습니다.";
      
      if (error.message.includes("already exists")) {
        errorMessage = "이미 가입된 이메일 주소입니다.";
      } else if (error.message.includes("Username already taken")) {
        errorMessage = "이미 사용 중인 사용자명입니다.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "회원가입 실패",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SignupForm) => {
    signupMutation.mutate(data);
  };

  // Enhanced form validation logic
  const watchedFields = form.watch();
  const isFormValid = 
    watchedFields.fullName?.trim().length >= 2 &&
    watchedFields.email?.includes("@") &&
    watchedFields.password?.length >= 8 &&
    watchedFields.phoneNumber?.length >= 10 &&
    watchedFields.dateOfBirth?.length > 0 &&
    watchedFields.agreeToTerms === true &&
    Object.keys(form.formState.errors).length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white p-4 pb-28 md:pb-24">
      <div className="w-full max-w-md mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={() => setLocation("/login")}
            className="absolute top-6 left-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-orange-600 mb-2">INPOCK</h1>
            <p className="text-gray-600 text-sm">비즈니스 플랫폼</p>
          </div>
          
          <h2 className="text-xl font-semibold text-gray-800 mb-2">회원가입</h2>
          <p className="text-gray-500 text-sm">새로운 계정을 만들어보세요</p>
        </div>

        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                  이름 *
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="전체 이름을 입력해주세요"
                  className="border-gray-200 focus:border-orange-400 focus:ring-orange-400"
                  {...form.register("fullName")}
                />
                {form.formState.errors.fullName && (
                  <p className="text-xs text-red-500">
                    {form.formState.errors.fullName.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  이메일 *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="이메일 주소를 입력해주세요"
                  className="border-gray-200 focus:border-orange-400 focus:ring-orange-400"
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <p className="text-xs text-red-500">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  비밀번호 *
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="8자 이상의 비밀번호를 입력해주세요"
                    className="border-gray-200 focus:border-orange-400 focus:ring-orange-400 pr-10"
                    {...form.register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-xs text-red-500">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">
                  전화번호 *
                </Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="010-0000-0000"
                  className="border-gray-200 focus:border-orange-400 focus:ring-orange-400"
                  {...form.register("phoneNumber")}
                />
                {form.formState.errors.phoneNumber && (
                  <p className="text-xs text-red-500">
                    {form.formState.errors.phoneNumber.message}
                  </p>
                )}
              </div>

              {/* Date of Birth */}
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth" className="text-sm font-medium text-gray-700">
                  생년월일 *
                </Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  className="border-gray-200 focus:border-orange-400 focus:ring-orange-400"
                  {...form.register("dateOfBirth")}
                />
                {form.formState.errors.dateOfBirth && (
                  <p className="text-xs text-red-500">
                    {form.formState.errors.dateOfBirth.message}
                  </p>
                )}
              </div>

              {/* Referral Code */}
              <div className="space-y-2">
                <Label htmlFor="referralCode" className="text-sm font-medium text-gray-700">
                  추천인 코드 (선택사항)
                </Label>
                <Input
                  id="referralCode"
                  type="text"
                  placeholder="추천인 코드가 있다면 입력해주세요"
                  className="border-gray-200 focus:border-orange-400 focus:ring-orange-400"
                  {...form.register("referralCode")}
                />
              </div>

              {/* Terms Agreement */}
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="agreeToTerms"
                    checked={form.watch("agreeToTerms")}
                    onCheckedChange={(checked) => 
                      form.setValue("agreeToTerms", checked === true)
                    }
                    className="mt-1 border-gray-300 data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
                  />
                  <div className="space-y-1">
                    <Label htmlFor="agreeToTerms" className="text-sm text-gray-700 leading-relaxed cursor-pointer">
                      서비스 이용약관 및 개인정보처리방침에 동의합니다 *
                    </Label>
                    <div className="text-xs text-gray-500">
                      <button type="button" className="text-orange-600 hover:underline">
                        이용약관
                      </button>
                      {" 및 "}
                      <button type="button" className="text-orange-600 hover:underline">
                        개인정보처리방침
                      </button>
                      을 확인했습니다.
                    </div>
                  </div>
                </div>
                {form.formState.errors.agreeToTerms && (
                  <p className="text-xs text-red-500 ml-6">
                    {form.formState.errors.agreeToTerms.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={!isFormValid || signupMutation.isPending}
                  className={`w-full py-3 text-sm font-medium rounded-lg transition-all duration-300 transform ${
                    isFormValid && !signupMutation.isPending
                      ? "bg-orange-600 hover:bg-orange-700 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed opacity-60"
                  }`}
                >
                  {signupMutation.isPending ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>가입 처리 중...</span>
                    </div>
                  ) : (
                    "회원가입"
                  )}
                </Button>
                
                {/* Form validation status */}
                {!isFormValid && (
                  <div className="mt-2 text-xs text-gray-500 text-center">
                    모든 필수 항목을 올바르게 입력하고 약관에 동의해주세요
                  </div>
                )}
              </div>

              {/* Login Link */}
              <div className="text-center pt-4 pb-8">
                <p className="text-sm text-gray-600">
                  이미 계정이 있으신가요?{" "}
                  <button
                    type="button"
                    onClick={() => setLocation("/login")}
                    className="text-orange-600 hover:text-orange-700 font-medium hover:underline"
                  >
                    로그인
                  </button>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}