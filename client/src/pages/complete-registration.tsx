import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";

const completeRegistrationSchema = z.object({
  username: z.string().min(3, "닉네임은 최소 3자 이상이어야 합니다").max(20, "닉네임은 최대 20자까지 가능합니다"),
  phone: z.string().min(10, "올바른 전화번호를 입력해주세요").max(15),
  name: z.string().min(2, "이름은 최소 2자 이상이어야 합니다").max(50),
});

export default function CompleteRegistrationPage() {
  const { user, setUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    username: user?.username || '',
    phone: user?.phone || '',
    name: user?.name || '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 이미 완료된 사용자는 대시보드로 리다이렉트
  useEffect(() => {
    if (user && user.username && user.phone && user.name) {
      setLocation('/dashboard');
    }
  }, [user, setLocation]);

  // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (!user) {
      setLocation('/login');
    }
  }, [user, setLocation]);

  const validateField = (name: string, value: string) => {
    try {
      completeRegistrationSchema.pick({ [name]: true } as any).parse({ [name]: value });
      setErrors(prev => ({ ...prev, [name]: '' }));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(prev => ({ ...prev, [name]: error.errors[0].message }));
      }
      return false;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // 실시간 유효성 검사
    if (value.trim()) {
      validateField(name, value);
    }
  };

  const checkUsernameAvailable = async (username: string) => {
    if (!username || username.length < 3) return false;
    
    try {
      const response = await apiRequest('POST', '/api/auth/check-username', { username });
      return response.available;
    } catch (error) {
      console.error('Username check error:', error);
      return false;
    }
  };

  const handleUsernameBlur = async () => {
    const { username } = formData;
    if (!validateField('username', username)) return;
    
    const isAvailable = await checkUsernameAvailable(username);
    if (!isAvailable) {
      setErrors(prev => ({ ...prev, username: '이미 사용중인 닉네임입니다' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    try {
      // 전체 폼 유효성 검사
      completeRegistrationSchema.parse(formData);
      
      // 닉네임 중복 체크
      const isUsernameAvailable = await checkUsernameAvailable(formData.username);
      if (!isUsernameAvailable) {
        setErrors(prev => ({ ...prev, username: '이미 사용중인 닉네임입니다' }));
        return;
      }
      
      setIsSubmitting(true);
      
      // 사용자 정보 업데이트
      const response = await apiRequest('PATCH', `/api/user/${user?.id}`, {
        username: formData.username,
        phone: formData.phone,
        name: formData.name,
      });
      
      if (response.user) {
        setUser(response.user);
        toast({
          title: "회원가입 완료",
          description: "추가 정보가 성공적으로 등록되었습니다.",
        });
        setLocation('/dashboard');
      }
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        toast({
          title: "오류 발생",
          description: "회원가입 완료 중 오류가 발생했습니다. 다시 시도해주세요.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMissingFields = () => {
    const missing = [];
    if (!user?.username) missing.push('닉네임');
    if (!user?.phone) missing.push('전화번호');
    if (!user?.name) missing.push('이름');
    return missing;
  };

  if (!user) {
    return null; // 로딩 중이거나 리다이렉트 중
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-foreground">
            회원가입 완료
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            카카오 로그인이 완료되었습니다.<br />
            서비스 이용을 위해 추가 정보를 입력해주세요.
          </p>
          {getMissingFields().length > 0 && (
            <p className="text-sm text-orange-600 mt-2">
              필요한 정보: {getMissingFields().join(', ')}
            </p>
          )}
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 닉네임 */}
            <div className="space-y-2">
              <Label htmlFor="username">닉네임 *</Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                onBlur={handleUsernameBlur}
                placeholder="사용할 닉네임을 입력하세요"
                className={errors.username ? "border-red-500" : ""}
              />
              {errors.username && (
                <p className="text-sm text-red-500">{errors.username}</p>
              )}
            </div>

            {/* 이름 */}
            <div className="space-y-2">
              <Label htmlFor="name">이름 *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="실명을 입력하세요"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* 전화번호 */}
            <div className="space-y-2">
              <Label htmlFor="phone">전화번호 *</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="010-1234-5678"
                className={errors.phone ? "border-red-500" : ""}
              />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone}</p>
              )}
            </div>

            {/* 카카오에서 가져온 정보 표시 */}
            {user.email && (
              <div className="space-y-2">
                <Label>이메일 (카카오 연동)</Label>
                <Input
                  value={user.email}
                  disabled
                  className="bg-muted text-muted-foreground"
                />
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={isSubmitting || Object.values(errors).some(error => error !== '')}
            >
              {isSubmitting ? '등록 중...' : '회원가입 완료'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              회원가입을 완료하면 서비스 이용약관 및 개인정보 처리방침에 동의하는 것으로 간주됩니다.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}