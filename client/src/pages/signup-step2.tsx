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
import { UsernameInput } from "@/components/ui/username-input";
import { z } from "zod";

const signupSchema = z.object({
  username: z.string().min(3, "사용자명은 3자 이상이어야 합니다").max(20, "사용자명은 20자 이하여야 합니다"),
  email: z.string().email("올바른 이메일 주소를 입력해주세요"),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다"),
  confirmPassword: z.string(),
  name: z.string().min(2, "이름은 2자 이상이어야 합니다"),
  phone: z.string().optional(),
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
    phone: "",
    company: "",
    role: ""
  });
  const [errors, setErrors] = useState<Partial<Record<keyof SignupForm, string>>>({});

  const signupMutation = useMutation({
    mutationFn: async (data: SignupForm) => {
      console.log("Attempting signup with data:", {
        username: data.username,
        email: data.email,
        name: data.name,
        phone: data.phone,
        company: data.company,
        role: data.role
      });
      
      const response = await apiRequest("POST", "/api/auth/signup", {
        username: data.username,
        email: data.email,
        password: data.password,
        name: data.name,
        phone: data.phone || "",
        company: data.company || "",
        role: data.role
      });
      
      const result = await response.json();
      console.log("Signup response:", result);
      return result;
    },
    onSuccess: () => {
      toast({
        title: "회원가입 완료",
        description: "계정이 성공적으로 생성되었습니다. 로그인해주세요.",
      });
      setLocation("/login");
    },
    onError: (error: any) => {
      console.error("Signup error:", error);
      let errorMessage = "회원가입 중 오류가 발생했습니다.";
      
      if (error.message) {
        // Parse error message to extract JSON if present
        try {
          const match = error.message.match(/400: (.+)/);
          if (match && match[1]) {
            const errorData = JSON.parse(match[1]);
            errorMessage = errorData.error || errorMessage;
          } else {
            errorMessage = error.message;
          }
        } catch (e) {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "회원가입 실패",
        description: errorMessage,
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
    
    // Real-time validation for password confirmation
    if (field === 'confirmPassword' && formData.password && value && formData.password !== value) {
      setErrors(prev => ({
        ...prev,
        confirmPassword: '비밀번호가 일치하지 않습니다'
      }));
    } else if (field === 'confirmPassword' && formData.password === value) {
      setErrors(prev => ({
        ...prev,
        confirmPassword: undefined
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
    // Check all required fields are filled
    const requiredFields: (keyof SignupForm)[] = ['username', 'email', 'password', 'confirmPassword', 'name', 'role'];
    const allFieldsFilled = requiredFields.every(field => {
      const value = formData[field];
      return value && value.trim() !== '';
    });
    
    // Check passwords match
    const passwordsMatch = formData.password === formData.confirmPassword && formData.password.length > 0;
    
    // Check password length
    const passwordValid = formData.password.length >= 8;
    
    // Check email format (basic validation)
    const emailValid = formData.email.includes('@') && formData.email.includes('.');
    
    // Check username length
    const usernameValid = formData.username.length >= 3;
    
    // Check name length
    const nameValid = formData.name.length >= 2;
    
    // Debug logging
    console.log('Form validation check:', {
      allFieldsFilled,
      passwordsMatch,
      passwordValid,
      emailValid,
      usernameValid,
      nameValid,
      formData: {
        username: formData.username,
        email: formData.email,
        password: formData.password ? '***' : '',
        confirmPassword: formData.confirmPassword ? '***' : '',
        name: formData.name,
        role: formData.role
      },
      errors
    });
    
    return allFieldsFilled && passwordsMatch && passwordValid && emailValid && usernameValid && nameValid;
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

              {/* Phone (Optional) */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 korean-text mb-2">
                  전화번호
                </label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="010-0000-0000 (선택사항)"
                  className="w-full"
                />
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
                ? 'bg-primary hover:bg-primary/90 text-white shadow-lg transform hover:scale-[1.02]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {signupMutation.isPending ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                <span className="korean-text">회원가입 중...</span>
              </div>
            ) : (
              <span className="korean-text">회원가입 완료</span>
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