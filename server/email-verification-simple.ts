// 간단한 이메일 인증 시스템 (개발용)

interface EmailCode {
  email: string;
  code: string;
  purpose: 'reset_password';
  expiresAt: Date;
  attempts: number;
}

// 메모리 저장소
const emailCodes = new Map<string, EmailCode>();

// 정리 작업 (10분마다)
setInterval(() => {
  const now = new Date();
  const entries = Array.from(emailCodes.entries());
  for (const [key, value] of entries) {
    if (now > value.expiresAt) {
      emailCodes.delete(key);
    }
  }
}, 10 * 60 * 1000);

// 6자리 인증번호 생성
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 이메일 인증번호 발송
export async function sendEmailCode(email: string, purpose: 'reset_password'): Promise<{ success: boolean; message: string }> {
  try {
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10분 유효
    
    const key = `${email}-${purpose}`;
    emailCodes.set(key, {
      email,
      code,
      purpose,
      expiresAt,
      attempts: 0
    });

    // 개발 모드에서 콘솔에 출력
    console.log(`\n📧 이메일 인증번호 (개발 모드)`);
    console.log(`이메일: ${email}`);
    console.log(`목적: 비밀번호 재설정`);
    console.log(`인증번호: ${code}`);
    console.log(`유효시간: 10분`);
    console.log(`만료시간: ${expiresAt.toLocaleString('ko-KR')}\n`);
    
    return { 
      success: true, 
      message: "인증번호가 발송되었습니다. 개발 모드에서는 콘솔을 확인해주세요." 
    };
  } catch (error) {
    console.error('이메일 발송 오류:', error);
    return { success: false, message: "인증번호 발송에 실패했습니다." };
  }
}

// 이메일 인증번호 확인
export async function verifyEmailCode(
  email: string, 
  code: string, 
  purpose: 'reset_password'
): Promise<{ verified: boolean; message: string }> {
  try {
    const key = `${email}-${purpose}`;
    const storedCode = emailCodes.get(key);

    if (!storedCode) {
      return { verified: false, message: "인증번호를 다시 요청해주세요." };
    }

    // 만료 시간 확인
    if (new Date() > storedCode.expiresAt) {
      emailCodes.delete(key);
      return { verified: false, message: "인증번호가 만료되었습니다. 다시 요청해주세요." };
    }

    // 시도 횟수 증가
    storedCode.attempts += 1;

    // 3회 초과 시 차단
    if (storedCode.attempts > 3) {
      emailCodes.delete(key);
      return { verified: false, message: "인증 시도 횟수를 초과했습니다. 다시 요청해주세요." };
    }

    // 인증번호 확인
    if (storedCode.code !== code) {
      return { 
        verified: false, 
        message: `인증번호가 일치하지 않습니다. (${storedCode.attempts}/3회)` 
      };
    }

    // 인증 성공
    emailCodes.delete(key);
    return { verified: true, message: "이메일 인증이 완료되었습니다." };
  } catch (error) {
    console.error("이메일 인증 확인 오류:", error);
    return { verified: false, message: "인증 확인 중 오류가 발생했습니다." };
  }
}

// 개발 환경용 인증번호 조회
export function getDevCode(email: string, purpose: string): { success: boolean; code?: string; message: string; timeLeft?: number } {
  if (process.env.NODE_ENV === 'production') {
    return { success: false, message: "Production 환경에서는 사용할 수 없습니다" };
  }

  const key = `${email}-${purpose}`;
  const storedCode = emailCodes.get(key);

  if (!storedCode) {
    return { success: false, message: "발송된 인증번호가 없습니다. 먼저 인증번호를 요청해주세요." };
  }

  const now = new Date();
  if (now > storedCode.expiresAt) {
    emailCodes.delete(key);
    return { success: false, message: "인증번호가 만료되었습니다" };
  }

  const timeLeft = Math.floor((storedCode.expiresAt.getTime() - now.getTime()) / 1000);

  return {
    success: true,
    code: storedCode.code,
    message: "개발 모드 인증번호",
    timeLeft
  };
}

// 인증 완료 여부 확인
export function isEmailVerified(email: string, purpose: 'reset_password'): boolean {
  // 실제 구현에서는 별도의 verified 상태를 관리할 수 있지만
  // 현재는 단순히 인증번호가 없으면 인증된 것으로 간주
  const key = `${email}-${purpose}`;
  return !emailCodes.has(key);
}

// 인증 정보 초기화
export function clearEmailVerification(email: string, purpose: 'reset_password'): void {
  const key = `${email}-${purpose}`;
  emailCodes.delete(key);
}