import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, User, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";

const signupSchema = z.object({
  username: z.string().min(3, "사용자명은 3자 이상이어야 합니다").max(20, "사용자명은 20자 이하여야 합니다"),
  email: z.string().email("올바른 이메일 주소를 입력해주세요"),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다"),
  confirmPassword: z.string(),
  name: z.string().min(2, "이름은 2자 이상이어야 합니다"),
  company: z.string().optional(),
  role: z.string().min(1, "역할을 선택해주세요")
}).refine((data) => data.password === data.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다",
  path: ["confirmPassword"]
});

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupStep2() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState<SignupForm>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    company: "",
    role: ""
  });
  const [errors, setErrors] = useState<Partial<Record<keyof SignupForm, string>>>({});

  const signupMutation = useMutation({
    mutationFn: async (data: SignupForm) => {
      const response = await apiRequest("POST", "/api/auth/signup", {
        username: data.username,
        email: data.email,
        password: data.password,
        name: data.name,
        company: data.company,
        role: data.role
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "회원가입 완료",
        description: "계정이 성공적으로 생성되었습니다. 로그인해주세요.",
      });
      setLocation("/login");
    },
    onError: (error: any) => {
      toast({
        title: "회원가입 실패",
        description: error.message || "회원가입 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: keyof SignupForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const validateForm = () => {
    try {
      signupSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<Record<keyof SignupForm, string>> = {};
        error.errors.forEach((err) => {
          const path = err.path[0];
          if (path && typeof path === 'string') {
            newErrors[path as keyof SignupForm] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      signupMutation.mutate(formData);
    }
  };

  const isFormValid = () => {
    const requiredFields: (keyof SignupForm)[] = ['username', 'email', 'password', 'confirmPassword', 'name', 'role'];
    return requiredFields.every(field => formData[field].trim() !== '') && 
           formData.password === formData.confirmPassword &&
           Object.keys(errors).length === 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 korean-text mb-2">계정 정보</h1>
          <p className="text-gray-600 korean-text">회원가입을 위한 정보를 입력해주세요</p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
            <div className="w-12 h-1 bg-primary rounded"></div>
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">2</span>
            </div>
          </div>
        </div>

        {/* Signup Form */}
        <Card className="bg-white shadow-lg mb-6">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 korean-text mb-2">
                  사용자명 *
                </label>
                <Input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  placeholder="사용자명을 입력하세요"
                  className={`w-full ${errors.username ? 'border-red-500' : ''}`}
                />
                {errors.username && (
                  <p className="text-red-500 text-xs mt-1 korean-text">{errors.username}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 korean-text mb-2">
                  이메일 *
                </label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="example@email.com"
                  className={`w-full ${errors.email ? 'border-red-500' : ''}`}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1 korean-text">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 korean-text mb-2">
                  비밀번호 *
                </label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="8자 이상 입력하세요"
                  className={`w-full ${errors.password ? 'border-red-500' : ''}`}
                />
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1 korean-text">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 korean-text mb-2">
                  비밀번호 확인 *
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="비밀번호를 다시 입력하세요"
                  className={`w-full ${errors.confirmPassword ? 'border-red-500' : ''}`}
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1 korean-text">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 korean-text mb-2">
                  이름 *
                </label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="실명을 입력하세요"
                  className={`w-full ${errors.name ? 'border-red-500' : ''}`}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1 korean-text">{errors.name}</p>
                )}
              </div>

              {/* Company (Optional) */}
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 korean-text mb-2">
                  회사명
                </label>
                <Input
                  id="company"
                  type="text"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  placeholder="회사명 (선택사항)"
                  className="w-full"
                />
              </div>

              {/* Role */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 korean-text mb-2">
                  역할 *
                </label>
                <Select onValueChange={(value) => handleInputChange('role', value)}>
                  <SelectTrigger className={`w-full ${errors.role ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="역할을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrepreneur">창업가</SelectItem>
                    <SelectItem value="marketer">마케터</SelectItem>
                    <SelectItem value="developer">개발자</SelectItem>
                    <SelectItem value="designer">디자이너</SelectItem>
                    <SelectItem value="student">학생</SelectItem>
                    <SelectItem value="other">기타</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p className="text-red-500 text-xs mt-1 korean-text">{errors.role}</p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid() || signupMutation.isPending}
            className={`w-full py-4 rounded-xl font-medium text-lg transition-all duration-300 ${
              isFormValid() && !signupMutation.isPending
                ? 'bg-primary hover:bg-primary/90 text-white shadow-lg'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {signupMutation.isPending ? (
              <span className="korean-text">회원가입 중...</span>
            ) : (
              <span className="korean-text">회원가입</span>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={() => setLocation('/signup-step1')}
            className="w-full py-3 rounded-xl font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="korean-text">이전</span>
          </Button>
        </div>

        {/* Back to Login */}
        <div className="text-center mt-6">
          <p className="text-gray-600 korean-text">
            이미 계정이 있으신가요?{' '}
            <button
              onClick={() => setLocation('/login')}
              className="text-primary hover:underline font-medium"
            >
              로그인하기
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}