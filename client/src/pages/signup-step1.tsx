import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Shield, FileText, Eye, Bell } from "lucide-react";

export default function SignupStep1() {
  const [, setLocation] = useLocation();
  const [consents, setConsents] = useState({
    terms: false,
    privacy: false,
    marketing: false,
    notifications: false
  });

  const requiredConsents = ['terms', 'privacy'];
  const allRequiredChecked = requiredConsents.every(key => consents[key as keyof typeof consents]);

  const handleConsentChange = (key: string, checked: boolean) => {
    setConsents(prev => ({
      ...prev,
      [key]: checked
    }));
  };

  const handleNext = () => {
    if (allRequiredChecked) {
      setLocation('/signup-step2');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 korean-text mb-2">약관 동의</h1>
          <p className="text-gray-600 korean-text">서비스 이용을 위해 약관에 동의해주세요</p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">1</span>
            </div>
            <div className="w-12 h-1 bg-gray-200 rounded"></div>
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-gray-400 text-sm font-medium">2</span>
            </div>
          </div>
        </div>

        {/* Terms and Conditions */}
        <Card className="bg-white shadow-lg mb-6">
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Required Consents */}
              <div>
                <h3 className="font-semibold text-gray-800 korean-text mb-4">필수 동의 항목</h3>
                
                {/* Terms of Service */}
                <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg mb-3">
                  <Checkbox
                    id="terms"
                    checked={consents.terms}
                    onCheckedChange={(checked) => handleConsentChange('terms', checked as boolean)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <label htmlFor="terms" className="font-medium text-gray-800 korean-text cursor-pointer">
                        서비스 이용약관 동의
                      </label>
                      <FileText className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600 korean-text mt-1">
                      INPOCK 서비스 이용에 대한 기본 약관입니다.
                    </p>
                    <button className="text-xs text-primary hover:underline mt-1">
                      전문 보기
                    </button>
                  </div>
                </div>

                {/* Privacy Policy */}
                <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                  <Checkbox
                    id="privacy"
                    checked={consents.privacy}
                    onCheckedChange={(checked) => handleConsentChange('privacy', checked as boolean)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <label htmlFor="privacy" className="font-medium text-gray-800 korean-text cursor-pointer">
                        개인정보 처리방침 동의
                      </label>
                      <Eye className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600 korean-text mt-1">
                      개인정보 수집 및 이용에 대한 동의입니다.
                    </p>
                    <button className="text-xs text-primary hover:underline mt-1">
                      전문 보기
                    </button>
                  </div>
                </div>
              </div>

              {/* Optional Consents */}
              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-800 korean-text mb-4">선택 동의 항목</h3>
                
                {/* Marketing */}
                <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg mb-3">
                  <Checkbox
                    id="marketing"
                    checked={consents.marketing}
                    onCheckedChange={(checked) => handleConsentChange('marketing', checked as boolean)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <label htmlFor="marketing" className="font-medium text-gray-800 korean-text cursor-pointer">
                        마케팅 정보 수신 동의
                      </label>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">선택</span>
                    </div>
                    <p className="text-sm text-gray-600 korean-text mt-1">
                      이벤트, 혜택, 새로운 기능에 대한 정보를 받아보세요.
                    </p>
                  </div>
                </div>

                {/* Push Notifications */}
                <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                  <Checkbox
                    id="notifications"
                    checked={consents.notifications}
                    onCheckedChange={(checked) => handleConsentChange('notifications', checked as boolean)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <label htmlFor="notifications" className="font-medium text-gray-800 korean-text cursor-pointer">
                        푸시 알림 수신 동의
                      </label>
                      <Bell className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600 korean-text mt-1">
                      중요한 알림과 업데이트를 실시간으로 받아보세요.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Button */}
        <Button
          onClick={handleNext}
          disabled={!allRequiredChecked}
          className={`w-full py-4 rounded-xl font-medium text-lg transition-all duration-300 ${
            allRequiredChecked
              ? 'bg-primary hover:bg-primary/90 text-white shadow-lg'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <span className="korean-text">다음</span>
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>

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