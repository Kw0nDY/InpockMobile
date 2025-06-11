import { ChevronLeft, Heart, Users, Activity, Target, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";

export default function ServiceIntroPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-orange-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/login')}
            className="text-gray-600 hover:text-gray-800"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            돌아가기
          </Button>
          <h1 className="text-lg font-bold text-gray-800">서비스 소개</h1>
          <div className="w-8"></div>
        </div>
      </header>

      <div className="p-6 space-y-8">
        {/* Logo and Title */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto">
            <Heart className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">AmuseFit</h1>
            <p className="text-gray-600">건강한 만남, 즐거운 운동</p>
          </div>
        </div>

        {/* Main Description */}
        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              운동이 더 즐거워지는 새로운 방법
            </h2>
            <p className="text-gray-600 leading-relaxed">
              같은 관심사를 가진 사람들과 만나 함께 운동하고, 
              건강한 라이프스타일을 공유하세요. 
              스와이프 방식으로 쉽고 재미있게!
            </p>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 text-center mb-6">주요 기능</h3>
          
          <div className="grid gap-4">
            {/* Feature 1 */}
            <Card className="bg-white shadow-sm">
              <CardContent className="p-4 flex items-start space-x-4">
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Heart className="w-6 h-6 text-pink-500" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">스마트 매칭</h4>
                  <p className="text-sm text-gray-600">
                    운동 취향과 지역을 바탕으로 나와 잘 맞는 운동 파트너를 찾아드려요
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="bg-white shadow-sm">
              <CardContent className="p-4 flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-blue-500" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">운동 모임</h4>
                  <p className="text-sm text-gray-600">
                    그룹 운동부터 개인 트레이닝까지, 다양한 운동 모임에 참여하세요
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="bg-white shadow-sm">
              <CardContent className="p-4 flex items-start space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Activity className="w-6 h-6 text-green-500" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">운동 기록</h4>
                  <p className="text-sm text-gray-600">
                    운동 일정과 성과를 기록하고 친구들과 공유해 동기부여를 받아보세요
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="bg-white shadow-sm">
              <CardContent className="p-4 flex items-start space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Target className="w-6 h-6 text-purple-500" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">목표 관리</h4>
                  <p className="text-sm text-gray-600">
                    개인 목표를 설정하고 달성 과정을 체계적으로 관리할 수 있어요
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* How it Works */}
        <Card className="bg-gradient-to-r from-pink-500 to-orange-500">
          <CardContent className="p-6 text-center text-white">
            <Zap className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-2">간단한 3단계</h3>
            <div className="space-y-2 text-sm">
              <p>1. 프로필 작성 & 관심 운동 선택</p>
              <p>2. 마음에 드는 사람에게 스와이프</p>
              <p>3. 매칭되면 채팅하고 운동 약속!</p>
            </div>
          </CardContent>
        </Card>

        {/* CTA Button */}
        <div className="text-center pt-4">
          <Button
            size="lg"
            className="w-full bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white font-semibold py-4 rounded-xl"
            onClick={() => setLocation('/login')}
          >
            지금 시작하기
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 pt-8">
          <p>건강한 만남의 시작, AmuseFit과 함께하세요</p>
        </div>
      </div>
    </div>
  );
}