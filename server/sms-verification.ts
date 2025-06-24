// SMS 인증 시스템 (개발용 - 실제 SMS 발송 없이 콘솔 출력)

interface VerificationCode {
  phone: string;
  code: string;
  purpose: 'find_id' | 'reset_password';
  expiresAt: Date;
  attempts: number;
  verified: boolean;
}

// 메모리 저장소 (실제 서비스에서는 Redis 사용 권장)
const verificationCodes = new Map<string, VerificationCode>();

// 6자리 랜덤 코드 생성
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// SMS 인증번호 발송 (개발용)
export async function sendSmsCode(phone: string, purpose: 'find_id' | 'reset_password'): Promise<{ success: boolean; message: string }> {
  try {
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5분 유효
    
    const key = `${phone}-${purpose}`;
    verificationCodes.set(key, {
      phone,
      code,
      purpose,
      expiresAt,
      attempts: 0,
      verified: false
    });

    // 개발 환경에서는 콘솔에 인증번호 출력
    console.log(`\n📱 SMS 인증번호 발송 (개발용)`);
    console.log(`전화번호: ${phone}`);
    console.log(`목적: ${purpose === 'find_id' ? '아이디 찾기' : '비밀번호 재설정'}`);
    console.log(`인증번호: ${code}`);
    console.log(`유효시간: 5분`);
    console.log(`만료시간: ${expiresAt.toLocaleString('ko-KR')}\n`);

    return { success: true, message: "인증번호가 발송되었습니다." };
  } catch (error) {
    console.error('SMS 발송 오류:', error);
    return { success: false, message: "인증번호 발송에 실패했습니다." };
  }
}

// SMS 인증번호 확인
export async function verifySmsCode(
  phone: string, 
  code: string, 
  purpose: 'find_id' | 'reset_password'
): Promise<{ verified: boolean; message: string; data?: any }> {
  try {
    const key = `${phone}-${purpose}`;
    const storedCode = verificationCodes.get(key);

    if (!storedCode) {
      return { verified: false, message: "인증번호를 다시 요청해주세요." };
    }

    // 만료 시간 확인
    if (new Date() > storedCode.expiresAt) {
      verificationCodes.delete(key);
      return { verified: false, message: "인증번호가 만료되었습니다. 다시 요청해주세요." };
    }

    // 시도 횟수 증가
    storedCode.attempts += 1;

    // 3회 초과 시 차단
    if (storedCode.attempts > 3) {
      verificationCodes.delete(key);
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
    storedCode.verified = true;
    console.log(`✅ SMS 인증 성공: ${phone} (${purpose})`);

    return { 
      verified: true, 
      message: "인증이 완료되었습니다.",
      data: { phone, purpose }
    };
  } catch (error) {
    console.error('SMS 인증 확인 오류:', error);
    return { verified: false, message: "인증 확인 중 오류가 발생했습니다." };
  }
}

// 인증된 번호인지 확인
export function isPhoneVerified(phone: string, purpose: 'find_id' | 'reset_password'): boolean {
  const key = `${phone}-${purpose}`;
  const storedCode = verificationCodes.get(key);
  return storedCode?.verified === true;
}

// 인증 완료 후 정리
export function clearVerification(phone: string, purpose: 'find_id' | 'reset_password'): void {
  const key = `${phone}-${purpose}`;
  verificationCodes.delete(key);
}

// 실제 서비스에서 사용할 SMS 발송 함수 (Twilio, NHN Cloud SMS 등)
/*
export async function sendRealSms(phone: string, code: string): Promise<boolean> {
  // Twilio 예시
  try {
    const client = require('twilio')(accountSid, authToken);
    const message = await client.messages.create({
      body: `[AmuseFit] 인증번호: ${code}`,
      from: '+1234567890',
      to: phone
    });
    return true;
  } catch (error) {
    console.error('SMS 발송 실패:', error);
    return false;
  }
}
*/