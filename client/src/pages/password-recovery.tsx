import { useState } from "react";
import { ChevronLeft, Mail, Phone, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

type RecoveryType = 'username' | 'password';
type VerificationType = 'email' | 'sms';

export default function PasswordRecoveryPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // State management
  const [recoveryType, setRecoveryType] = useState<RecoveryType>('password');
  const [verificationType, setVerificationType] = useState<VerificationType>('email');
  const [step, setStep] = useState<'contact' | 'code' | 'reset'>('contact');
  
  // Form data
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');

  // API mutations
  const findUsernameMutation = useMutation({
    mutationFn: async (data: { email?: string; phone?: string }) => {
      return await apiRequest('POST', '/api/auth/find-username', data);
    },
    onSuccess: (data: any) => {
      toast({
        title: "아이디 찾기 완료",
        description: `찾은 아이디: ${data.username}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "아이디 찾기 실패",
        description: error.message || "계정을 찾을 수 없습니다",
        variant: "destructive",
      });
    },
  });

  const sendCodeMutation = useMutation({
    mutationFn: async (data: { email?: string; phone?: string; type: VerificationType }) => {
      return await apiRequest('POST', '/api/auth/send-reset-code', data);
    },
    onSuccess: () => {
      setStep('code');
      toast({
        title: "인증 코드 발송",
        description: verificationType === 'email' ? "이메일을 확인해주세요" : "SMS를 확인해주세요",
      });
    },
    onError: (error: any) => {
      toast({
        title: "발송 실패",
        description: error.message || "인증 코드 발송에 실패했습니다",
        variant: "destructive",
      });
    },
  });

  const verifyCodeMutation = useMutation({
    mutationFn: async (data: { code: string; type: VerificationType; email?: string; phone?: string }) => {
      return await apiRequest('POST', '/api/auth/verify-reset-code', data);
    },
    onSuccess: (data: any) => {
      setResetToken(data.resetToken);
      setStep('reset');
      toast({
        title: "인증 완료",
        description: "새 비밀번호를 설정해주세요",
      });
    },
    onError: (error: any) => {
      toast({
        title: "인증 실패",
        description: error.message || "인증 코드가 일치하지 않습니다",
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { resetToken: string; newPassword: string; email?: string; phone?: string }) => {
      return await apiRequest('POST', '/api/auth/reset-password', data);
    },
    onSuccess: () => {
      toast({
        title: "비밀번호 변경 완료",
        description: "새 비밀번호로 로그인해주세요",
      });
      setLocation('/login');
    },
    onError: (error: any) => {
      toast({
        title: "비밀번호 변경 실패",
        description: error.message || "비밀번호 변경에 실패했습니다",
        variant: "destructive",
      });
    },
  });

  // Event handlers
  const handleFindUsername = () => {
    const data = verificationType === 'email' ? { email } : { phone };
    findUsernameMutation.mutate(data);
  };

  const handleSendCode = () => {
    if (verificationType === 'email' && !email) {
      toast({
        title: "입력 오류",
        description: "이메일을 입력해주세요",
        variant: "destructive",
      });
      return;
    }
    if (verificationType === 'sms' && !phone) {
      toast({
        title: "입력 오류", 
        description: "전화번호를 입력해주세요",
        variant: "destructive",
      });
      return;
    }

    const data = {
      type: verificationType,
      ...(verificationType === 'email' ? { email } : { phone })
    };
    sendCodeMutation.mutate(data);
  };

  const handleVerifyCode = () => {
    if (!verificationCode) {
      toast({
        title: "입력 오류",
        description: "인증 코드를 입력해주세요",
        variant: "destructive",
      });
      return;
    }

    const data = {
      code: verificationCode,
      type: verificationType,
      ...(verificationType === 'email' ? { email } : { phone })
    };
    verifyCodeMutation.mutate(data);
  };

  const handleResetPassword = () => {
    if (!newPassword || !confirmPassword) {
      toast({
        title: "입력 오류",
        description: "모든 필드를 입력해주세요",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "입력 오류",
        description: "비밀번호가 일치하지 않습니다",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "입력 오류",
        description: "비밀번호는 최소 6자 이상이어야 합니다",
        variant: "destructive",
      });
      return;
    }

    const data = {
      resetToken,
      newPassword,
      ...(verificationType === 'email' ? { email } : { phone })
    };
    resetPasswordMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/login')}
            className="text-muted-foreground hover:text-white mr-3"
          >
            <ChevronLeft className="w-5 h-5 hover:text-white" />
          </Button>
          <h1 className="text-xl font-semibold text-foreground">계정 찾기</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {recoveryType === 'username' ? '아이디 찾기' : '비밀번호 찾기'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Recovery Type Selection */}
            <Tabs value={recoveryType} onValueChange={(value) => {
              setRecoveryType(value as RecoveryType);
              setStep('contact');
              setVerificationCode('');
              setResetToken('');
            }}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="username">아이디 찾기</TabsTrigger>
                <TabsTrigger value="password">비밀번호 찾기</TabsTrigger>
              </TabsList>

              <TabsContent value="username" className="space-y-4">
                {/* Username Recovery */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium">인증 방법 선택</Label>
                  <RadioGroup
                    value={verificationType}
                    onValueChange={(value) => setVerificationType(value as VerificationType)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="email" id="email-username" />
                      <Label htmlFor="email-username" className="flex items-center cursor-pointer">
                        <Mail className="w-4 h-4 mr-2" />
                        이메일
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="sms" id="sms-username" />
                      <Label htmlFor="sms-username" className="flex items-center cursor-pointer">
                        <Phone className="w-4 h-4 mr-2" />
                        전화번호
                      </Label>
                    </div>
                  </RadioGroup>

                  {verificationType === 'email' ? (
                    <div className="space-y-2">
                      <Label htmlFor="email">이메일 주소</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="등록된 이메일을 입력하세요"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="phone">전화번호</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="010-1234-5678"
                      />
                    </div>
                  )}

                  <Button
                    onClick={handleFindUsername}
                    disabled={findUsernameMutation.isPending}
                    className="w-full"
                  >
                    {findUsernameMutation.isPending ? '검색 중...' : '아이디 찾기'}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="password" className="space-y-4">
                {/* Password Recovery */}
                {step === 'contact' && (
                  <div className="space-y-4">
                    <Label className="text-sm font-medium">인증 방법 선택</Label>
                    <RadioGroup
                      value={verificationType}
                      onValueChange={(value) => setVerificationType(value as VerificationType)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="email" id="email-password" />
                        <Label htmlFor="email-password" className="flex items-center cursor-pointer">
                          <Mail className="w-4 h-4 mr-2" />
                          이메일
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sms" id="sms-password" />
                        <Label htmlFor="sms-password" className="flex items-center cursor-pointer">
                          <Phone className="w-4 h-4 mr-2" />
                          전화번호
                        </Label>
                      </div>
                    </RadioGroup>

                    {verificationType === 'email' ? (
                      <div className="space-y-2">
                        <Label htmlFor="email-reset">이메일 주소</Label>
                        <Input
                          id="email-reset"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="등록된 이메일을 입력하세요"
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor="phone-reset">전화번호</Label>
                        <Input
                          id="phone-reset"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="010-1234-5678"
                        />
                      </div>
                    )}

                    <Button
                      onClick={handleSendCode}
                      disabled={sendCodeMutation.isPending}
                      className="w-full"
                    >
                      {sendCodeMutation.isPending ? '발송 중...' : '인증 코드 발송'}
                    </Button>
                  </div>
                )}

                {step === 'code' && (
                  <div className="space-y-4">
                    <div className="text-center space-y-2">
                      <KeyRound className="w-12 h-12 mx-auto text-primary" />
                      <p className="text-sm text-muted-foreground">
                        {verificationType === 'email' ? '이메일' : 'SMS'}로 전송된 인증 코드를 입력하세요
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="verification-code">인증 코드 (6자리)</Label>
                      <Input
                        id="verification-code"
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        placeholder="123456"
                        maxLength={6}
                        className="text-center text-lg tracking-widest"
                      />
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setStep('contact')}
                        className="flex-1"
                      >
                        이전
                      </Button>
                      <Button
                        onClick={handleVerifyCode}
                        disabled={verifyCodeMutation.isPending}
                        className="flex-1"
                      >
                        {verifyCodeMutation.isPending ? '인증 중...' : '인증 확인'}
                      </Button>
                    </div>

                    <Button
                      variant="link"
                      onClick={handleSendCode}
                      disabled={sendCodeMutation.isPending}
                      className="w-full text-sm"
                    >
                      인증 코드 재발송
                    </Button>
                  </div>
                )}

                {step === 'reset' && (
                  <div className="space-y-4">
                    <div className="text-center space-y-2">
                      <KeyRound className="w-12 h-12 mx-auto text-primary" />
                      <p className="text-sm text-muted-foreground">
                        새 비밀번호를 설정하세요
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-password">새 비밀번호</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="최소 6자 이상"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">비밀번호 확인</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="비밀번호를 다시 입력하세요"
                      />
                    </div>

                    <Button
                      onClick={handleResetPassword}
                      disabled={resetPasswordMutation.isPending}
                      className="w-full"
                    >
                      {resetPasswordMutation.isPending ? '변경 중...' : '비밀번호 변경'}
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <Button
            variant="link"
            onClick={() => setLocation('/login')}
            className="text-sm text-muted-foreground"
          >
            로그인 페이지로 돌아가기
          </Button>
        </div>
      </div>
    </div>
  );
}