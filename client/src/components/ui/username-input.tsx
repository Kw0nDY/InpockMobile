import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface UsernameInputProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
}

export function UsernameInput({ value, onChange, required = false, className = "" }: UsernameInputProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [availability, setAvailability] = useState<{
    available: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    const checkUsername = async () => {
      if (!value || value.length < 2) {
        setAvailability(null);
        return;
      }

      setIsChecking(true);
      try {
        const response = await apiRequest("POST", "/api/auth/check-username", { username: value });
        const data = await response.json();
        setAvailability(data);
      } catch (error) {
        setAvailability({ available: false, message: "확인 중 오류가 발생했습니다" });
      } finally {
        setIsChecking(false);
      }
    };

    const timeoutId = setTimeout(checkUsername, 500); // Debounce for 500ms
    return () => clearTimeout(timeoutId);
  }, [value]);

  const getStatusIcon = () => {
    if (isChecking) {
      return <Loader2 className="w-4 h-4 animate-spin text-gray-400" />;
    }
    if (availability?.available) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    if (availability && !availability.available) {
      return <XCircle className="w-4 h-4 text-red-500" />;
    }
    return null;
  };

  const getStatusColor = () => {
    if (availability?.available) return "text-green-600";
    if (availability && !availability.available) return "text-red-600";
    return "text-gray-600";
  };

  return (
    <div className={className}>
      <Label htmlFor="username" className="block text-sm font-medium text-gray-700 korean-text mb-2">
        닉네임 {required && "*"}
      </Label>
      <div className="relative">
        <Input
          id="username"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-4 border border-gray-300 rounded-lg bg-white focus:border-primary focus:ring-1 focus:ring-primary pr-10"
          placeholder="사용할 닉네임을 입력하세요"
          required={required}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {getStatusIcon()}
        </div>
      </div>
      {availability && (
        <p className={`text-xs mt-1 korean-text ${getStatusColor()}`}>
          {availability.message}
        </p>
      )}
      <p className="text-xs text-gray-500 mt-1 korean-text">
        한글, 영문, 숫자, _, - 사용 가능 (2-20자)
      </p>
    </div>
  );
}