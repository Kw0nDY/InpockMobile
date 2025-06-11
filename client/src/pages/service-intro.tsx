import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function ServiceIntroPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-white">
        <button 
          className="p-2" 
          onClick={() => setLocation("/login")}
        >
          <ArrowLeft className="w-6 h-6 text-dark" />
        </button>
        <h1 className="text-lg font-medium text-dark">AmuseFit</h1>
        <div className="w-10"></div>
      </header>

      {/* Main Content */}
      <section className="px-6 py-8 text-center">        
        <h2 className="text-2xl font-bold text-dark mb-2 korean-text">운동이 더 즐거워지는</h2>
        <h2 className="text-2xl font-bold text-primary mb-4 korean-text">AmuseFit과 함께</h2>
        
        <p className="text-gray-600 text-sm mb-2 korean-text">건강한 만남, 즐거운 운동</p>
        <p className="text-gray-600 text-sm mb-2 korean-text">같은 관심사를 가진 사람들과 함께</p>
        <p className="text-gray-600 text-sm mb-8 korean-text">스와이프로 만나는 운동 파트너</p>

        {/* Main Service Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-8 max-w-sm mx-auto">
          <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">💪</span>
          </div>
          <h3 className="font-bold text-dark mb-2 korean-text">AmuseFit</h3>
          <p className="text-sm text-gray-600 mb-4 korean-text">건강한 만남, 즐거운 운동</p>
          <Button 
            className="bg-primary text-white text-sm px-6 py-2 rounded-lg w-full font-medium"
            onClick={() => setLocation("/signup-step1")}
          >
            서비스 체험하기
          </Button>
        </div>

        {/* Description Section */}
        <div className="text-center mb-8">
          <h3 className="font-bold text-dark mb-2 korean-text">운동이 더 즐거워지는 새로운 방법</h3>
          <p className="text-sm text-gray-600 mb-1 korean-text">같은 관심사를 가진 사람들과 만나 함께 운동하고</p>
          <p className="text-sm text-gray-600 korean-text">건강한 라이프스타일을 공유하세요</p>
        </div>

        {/* Bottom CTA Button */}
        <Button 
          className="bg-primary text-white font-medium py-4 px-8 rounded-xl w-full hover:bg-primary/90"
          onClick={() => setLocation("/signup-step1")}
        >
          지금 시작하기
        </Button>
      </section>
    </div>
  );
}