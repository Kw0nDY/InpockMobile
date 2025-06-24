import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowRight, Shield, FileText, Eye, Bell, X, Check, UserPlus } from "lucide-react";
import KakaoLoginButton from "@/components/ui/kakao-login-button";

export default function SignupStep1() {
  const [, setLocation] = useLocation();
  const [consents, setConsents] = useState({
    terms: false,
    privacy: false,
    marketing: false,
    notifications: false
  });

  const [openModal, setOpenModal] = useState<string | null>(null);

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

  const getModalContent = (type: string) => {
    switch (type) {
      case 'terms':
        return {
          title: '서비스 이용약관',
          content: (
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-semibold mb-2">제1조 (목적)</h3>
                <p className="text-gray-600 leading-relaxed">
                  본 약관은 INPOCK(이하 "회사")이 제공하는 비즈니스 네트워킹 플랫폼 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">제2조 (서비스의 내용)</h3>
                <p className="text-gray-600 leading-relaxed mb-2">회사가 제공하는 서비스는 다음과 같습니다:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                  <li>비즈니스 프로필 관리 및 공유</li>
                  <li>네트워킹 및 연락처 관리</li>
                  <li>딜/상품 정보 공유 및 관리</li>
                  <li>실시간 채팅 및 커뮤니케이션</li>
                  <li>방문자 분석 및 통계</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">제3조 (회원의 의무)</h3>
                <p className="text-gray-600 leading-relaxed">
                  회원은 서비스 이용 시 관련 법령, 본 약관의 규정, 이용안내 및 서비스상에 공지한 주의사항을 준수하여야 하며, 기타 회사의 업무에 방해되는 행위를 하여서는 안 됩니다.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">제4조 (서비스 이용시간)</h3>
                <p className="text-gray-600 leading-relaxed">
                  서비스 이용은 연중무휴, 1일 24시간 원칙으로 합니다. 단, 회사의 업무상이나 기술상의 이유로 서비스가 일시 중단될 수 있으며, 이 경우 사전 또는 사후에 공지합니다.
                </p>
              </div>
            </div>
          )
        };
      case 'privacy':
        return {
          title: '개인정보 처리방침',
          content: (
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-semibold mb-2">수집하는 개인정보 항목</h3>
                <div className="bg-blue-50 p-3 rounded-lg mb-3">
                  <p className="font-medium text-blue-800 mb-2">필수 정보</p>
                  <ul className="list-disc list-inside text-blue-700 space-y-1">
                    <li>이름, 이메일 주소</li>
                    <li>비밀번호 (암호화 저장)</li>
                    <li>회사명, 직책</li>
                    <li>서비스 이용 기록</li>
                  </ul>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="font-medium text-green-800 mb-2">선택 정보</p>
                  <ul className="list-disc list-inside text-green-700 space-y-1">
                    <li>프로필 이미지, 소개 영상</li>
                    <li>자기소개, 관심분야</li>
                    <li>연락처 정보</li>
                    <li>마케팅 수신 동의 여부</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">개인정보 수집 및 이용 목적</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                  <li>회원 가입 및 본인 확인</li>
                  <li>서비스 제공 및 계약 이행</li>
                  <li>회원 관리 및 고객 지원</li>
                  <li>서비스 개선 및 신규 서비스 개발</li>
                  <li>맞춤형 콘텐츠 및 광고 제공</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">개인정보 보유 및 이용 기간</h3>
                <p className="text-gray-600 leading-relaxed">
                  회원 탈퇴 시까지 보유하며, 탈퇴 후에는 즉시 파기합니다. 단, 관련 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">개인정보 제3자 제공</h3>
                <p className="text-gray-600 leading-relaxed">
                  회사는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 단, 법령에 의한 요구가 있는 경우는 예외로 합니다.
                </p>
              </div>
            </div>
          )
        };
      case 'marketing':
        return {
          title: '마케팅 정보 수신 동의',
          content: (
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-semibold mb-2">수신 정보 유형</h3>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <ul className="list-disc list-inside text-orange-700 space-y-1">
                    <li>새로운 기능 및 서비스 안내</li>
                    <li>이벤트 및 프로모션 정보</li>
                    <li>맞춤형 비즈니스 기회 추천</li>
                    <li>네트워킹 이벤트 초대</li>
                    <li>산업 트렌드 및 인사이트</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">발송 방법</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                  <li>이메일을 통한 뉴스레터</li>
                  <li>앱 내 푸시 알림</li>
                  <li>SMS (중요 정보에 한함)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">수신 거부</h3>
                <p className="text-gray-600 leading-relaxed">
                  언제든지 설정 페이지에서 마케팅 수신을 거부하실 수 있으며, 각 이메일 하단의 '수신거부' 링크를 클릭하여 즉시 차단할 수 있습니다.
                </p>
              </div>

              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-yellow-800 text-xs">
                  ※ 마케팅 수신 동의는 선택사항으로, 거부하셔도 서비스 이용에는 제한이 없습니다.
                </p>
              </div>
            </div>
          )
        };
      case 'notifications':
        return {
          title: '푸시 알림 수신 동의',
          content: (
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-semibold mb-2">알림 유형</h3>
                <div className="space-y-3">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="font-medium text-blue-800 mb-1">서비스 알림</p>
                    <ul className="list-disc list-inside text-blue-700 text-xs space-y-1">
                      <li>새로운 메시지 수신</li>
                      <li>프로필 방문자 알림</li>
                      <li>네트워킹 요청</li>
                      <li>딜 문의 및 응답</li>
                    </ul>
                  </div>
                  
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="font-medium text-green-800 mb-1">시스템 알림</p>
                    <ul className="list-disc list-inside text-green-700 text-xs space-y-1">
                      <li>보안 관련 중요 알림</li>
                      <li>서비스 점검 안내</li>
                      <li>계정 관련 알림</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">알림 설정 관리</h3>
                <p className="text-gray-600 leading-relaxed">
                  앱 설정에서 알림 유형별로 세부 설정이 가능하며, 언제든지 변경하실 수 있습니다. 시스템 알림은 서비스 이용에 필수적인 정보로 차단할 수 없습니다.
                </p>
              </div>

              <div className="bg-red-50 p-3 rounded-lg">
                <p className="text-red-800 text-xs">
                  ※ 푸시 알림을 허용하지 않으면 실시간 소통에 제약이 있을 수 있습니다.
                </p>
              </div>
            </div>
          )
        };
      default:
        return { title: '', content: null };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-white" />
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
                    <Dialog open={openModal === 'terms'} onOpenChange={(open) => setOpenModal(open ? 'terms' : null)}>
                      <DialogTrigger asChild>
                        <button className="text-xs text-primary hover:underline mt-1">
                          전문 보기
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="korean-text">{getModalContent('terms').title}</DialogTitle>
                        </DialogHeader>
                        <div className="korean-text">
                          {getModalContent('terms').content}
                        </div>
                      </DialogContent>
                    </Dialog>
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
                    <Dialog open={openModal === 'privacy'} onOpenChange={(open) => setOpenModal(open ? 'privacy' : null)}>
                      <DialogTrigger asChild>
                        <button className="text-xs text-primary hover:underline mt-1">
                          전문 보기
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="korean-text">{getModalContent('privacy').title}</DialogTitle>
                        </DialogHeader>
                        <div className="korean-text">
                          {getModalContent('privacy').content}
                        </div>
                      </DialogContent>
                    </Dialog>
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
                    <Dialog open={openModal === 'marketing'} onOpenChange={(open) => setOpenModal(open ? 'marketing' : null)}>
                      <DialogTrigger asChild>
                        <button className="text-xs text-primary hover:underline mt-1">
                          전문 보기
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="korean-text">{getModalContent('marketing').title}</DialogTitle>
                        </DialogHeader>
                        <div className="korean-text">
                          {getModalContent('marketing').content}
                        </div>
                      </DialogContent>
                    </Dialog>
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
                    <Dialog open={openModal === 'notifications'} onOpenChange={(open) => setOpenModal(open ? 'notifications' : null)}>
                      <DialogTrigger asChild>
                        <button className="text-xs text-primary hover:underline mt-1">
                          전문 보기
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="korean-text">{getModalContent('notifications').title}</DialogTitle>
                        </DialogHeader>
                        <div className="korean-text">
                          {getModalContent('notifications').content}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Signup Options */}
        <div className="space-y-3">
          {/* Continue with Form */}
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

          {/* Divider */}
          {allRequiredChecked && (
            <>
              <div className="flex items-center">
                <div className="flex-1 border-t border-gray-200"></div>
                <span className="px-4 text-sm text-gray-500 korean-text">또는</span>
                <div className="flex-1 border-t border-gray-200"></div>
              </div>

              {/* Kakao Signup */}
              <KakaoLoginButton variant="signup" />
            </>
          )}
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