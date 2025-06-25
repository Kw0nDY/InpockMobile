import { useState, useEffect } from "react";

// 재사용 가능한 인증 타이머 훅
export const useVerificationTimer = (initialTime: number) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const resetTimer = () => setTimeLeft(initialTime);

  return { timeLeft, formatTime, resetTimer };
};

// 공통 인증 폼 검증 유틸리티
export const validateVerificationCode = (code: string) => {
  if (!code.trim()) {
    return { valid: false, message: "인증번호를 입력해주세요." };
  }
  
  if (code.length !== 6) {
    return { valid: false, message: "6자리 숫자를 입력해주세요." };
  }
  
  if (!/^\d{6}$/.test(code)) {
    return { valid: false, message: "숫자만 입력 가능합니다." };
  }

  return { valid: true };
};