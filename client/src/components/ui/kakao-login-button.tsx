import { Button } from "@/components/ui/button";

interface KakaoLoginButtonProps {
  variant?: "login" | "signup";
  className?: string;
}

export default function KakaoLoginButton({ variant = "login", className = "" }: KakaoLoginButtonProps) {
  const handleKakaoAuth = () => {
    // Generate CSRF protection state
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('kakao_oauth_state', state);
    
    // Redirect with state parameter
    window.location.href = `/api/auth/kakao?state=${encodeURIComponent(state)}`;
  };

  return (
    <Button
      onClick={handleKakaoAuth}
      variant="outline"
      className={`w-full py-3 rounded-xl font-medium border-2 border-yellow-400 text-gray-800 hover:bg-yellow-50 transition-all duration-300 ${className}`}
    >
      <div className="flex items-center justify-center">
        {/* Kakao Logo SVG */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          className="mr-3"
        >
          <path
            d="M12 2C6.477 2 2 5.582 2 9.999c0 2.831 1.848 5.318 4.603 6.818l-1.234 4.505c-.097.356.269.649.589.472l5.232-2.798c.264.017.532.026.81.026 5.523 0 10-3.582 10-7.999S17.523 2 12 2z"
            fill="#3C1E1E"
          />
        </svg>
        <span className="korean-text">
          {variant === "login" ? "카카오로 로그인" : "카카오로 회원가입"}
        </span>
      </div>
    </Button>
  );
}