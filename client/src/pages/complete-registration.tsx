import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function CompleteRegistration() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    nickname: "",
    name: "",
    phone: ""
  });
  
  const [validation, setValidation] = useState({
    nickname: { isValid: false, isChecking: false, message: "" },
    name: { isValid: false, message: "" },
    phone: { isValid: false, message: "" }
  });

  // Get current user data
  const { data: currentUser, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  // Check nickname availability
  const checkNicknameMutation = useMutation({
    mutationFn: async (nickname: string) => {
      const response = await apiRequest(`/api/auth/check-nickname`, {
        method: "POST",
        body: JSON.stringify({ nickname }),
        headers: { "Content-Type": "application/json" }
      });
      return response;
    },
    onSuccess: (data, nickname) => {
      setValidation(prev => ({
        ...prev,
        nickname: {
          isValid: data.available,
          isChecking: false,
          message: data.available ? "사용 가능한 닉네임입니다" : "이미 사용 중인 닉네임입니다"
        }
      }));
    },
    onError: () => {
      setValidation(prev => ({
        ...prev,
        nickname: {
          isValid: false,
          isChecking: false,
          message: "닉네임 확인 중 오류가 발생했습니다"
        }
      }));
    }
  });

  // Complete registration mutation
  const completeRegistrationMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest(`/api/auth/complete-registration`, {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" }
      });
    },
    onSuccess: () => {
      toast({
        title: "회원가입 완료",
        description: "추가 정보가 성공적으로 등록되었습니다.",
      });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "등록 실패",
        description: error.message || "회원가입 완료 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  });

  // Initialize form with current user data
  useEffect(() => {
    if (currentUser) {
      setFormData({
        nickname: currentUser.username || "",
        name: currentUser.name || "",
        phone: currentUser.phone || ""
      });
    }
  }, [currentUser]);

  // Validate nickname with debounce
  useEffect(() => {
    if (formData.nickname && formData.nickname.length >= 2) {
      const timer = setTimeout(() => {
        if (formData.nickname !== currentUser?.username) {
          setValidation(prev => ({
            ...prev,
            nickname: { ...prev.nickname, isChecking: true }
          }));
          checkNicknameMutation.mutate(formData.nickname);
        } else {
          setValidation(prev => ({
            ...prev,
            nickname: { isValid: true, isChecking: false, message: "현재 닉네임입니다" }
          }));
        }
      }, 500);
      return () => clearTimeout(timer);
    } else if (formData.nickname.length > 0) {
      setValidation(prev => ({
        ...prev,
        nickname: { isValid: false, isChecking: false, message: "닉네임은 2자 이상이어야 합니다" }
      }));
    }
  }, [formData.nickname, currentUser]);

  // Validate name
  useEffect(() => {
    if (formData.name.trim().length >= 2) {
      setValidation(prev => ({
        ...prev,
        name: { isValid: true, message: "유효한 이름입니다" }
      }));
    } else if (formData.name.length > 0) {
      setValidation(prev => ({
        ...prev,
        name: { isValid: false, message: "이름은 2자 이상이어야 합니다" }
      }));
    }
  }, [formData.name]);

  // Validate phone
  useEffect(() => {
    const phoneRegex = /^01[0-9]-?[0-9]{4}-?[0-9]{4}$/;
    if (phoneRegex.test(formData.phone.replace(/-/g, ""))) {
      setValidation(prev => ({
        ...prev,
        phone: { isValid: true, message: "유효한 전화번호입니다" }
      }));
    } else if (formData.phone.length > 0) {
      setValidation(prev => ({
        ...prev,
        phone: { isValid: false, message: "올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)" }
      }));
    }
  }, [formData.phone]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validation.nickname.isValid || !validation.name.isValid || !validation.phone.isValid) {
      toast({
        title: "입력 확인",
        description: "모든 필수 정보를 올바르게 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    completeRegistrationMutation.mutate(formData);
  };

  const getValidationIcon = (field: keyof typeof validation) => {
    const fieldValidation = validation[field];
    if (field === 'nickname' && fieldValidation.isChecking) {
      return <Loader2 className="h-4 w-4 animate-spin text-gray-400" />;
    }
    if (fieldValidation.isValid) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (fieldValidation.message) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-amber-900">회원가입 완료</CardTitle>
          <CardDescription className="text-amber-700">
            서비스 이용을 위해 추가 정보를 입력해주세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nickname Field */}
            <div className="space-y-2">
              <Label htmlFor="nickname" className="text-amber-800 font-medium">
                닉네임 *
              </Label>
              <div className="relative">
                <Input
                  id="nickname"
                  type="text"
                  value={formData.nickname}
                  onChange={(e) => handleInputChange("nickname", e.target.value)}
                  placeholder="사용할 닉네임을 입력하세요"
                  className="pr-10 border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                  required
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {getValidationIcon('nickname')}
                </div>
              </div>
              {validation.nickname.message && (
                <p className={`text-sm ${validation.nickname.isValid ? 'text-green-600' : 'text-red-600'}`}>
                  {validation.nickname.message}
                </p>
              )}
            </div>

            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-amber-800 font-medium">
                이름 *
              </Label>
              <div className="relative">
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="실명을 입력하세요"
                  className="pr-10 border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                  required
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {getValidationIcon('name')}
                </div>
              </div>
              {validation.name.message && (
                <p className={`text-sm ${validation.name.isValid ? 'text-green-600' : 'text-red-600'}`}>
                  {validation.name.message}
                </p>
              )}
            </div>

            {/* Phone Field */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-amber-800 font-medium">
                전화번호 *
              </Label>
              <div className="relative">
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="010-1234-5678"
                  className="pr-10 border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                  required
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {getValidationIcon('phone')}
                </div>
              </div>
              {validation.phone.message && (
                <p className={`text-sm ${validation.phone.isValid ? 'text-green-600' : 'text-red-600'}`}>
                  {validation.phone.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 mt-6"
              disabled={
                completeRegistrationMutation.isPending ||
                !validation.nickname.isValid ||
                !validation.name.isValid ||
                !validation.phone.isValid ||
                validation.nickname.isChecking
              }
            >
              {completeRegistrationMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  완료 중...
                </>
              ) : (
                "회원가입 완료"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}