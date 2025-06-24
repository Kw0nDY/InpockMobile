// SMS 인증 시스템 (개발용 - 실제 SMS 발송 없이 콘솔 출력)

interface SmsVerificationCode {
  phone: string;
  code: string;
  purpose: 'find_id' | 'reset_password';
  expiresAt: Date;
  attempts: number;
  verified: boolean;
}

// 메모리 저장소 (실제 서비스에서는 Redis 사용 권장)
const smsVerificationCodes = new Map<string, SmsVerificationCode>();

// 6자리 랜덤 코드 생성
function generateSmsCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// SMS 발송 시뮬레이션
function sendSmsSimulation(phone: string, code: string, purpose: string): void {
  console.log(`\n📱 SMS 인증번호 (개발 모드)`);
  console.log(`전화번호: ${phone}`);
  console.log(`목적: ${purpose === 'find_id' ? 'ID 찾기' : '비밀번호 재설정'}`);
  console.log(`인증번호: ${code}`);
  console.log(`유효시간: 10분`);
  console.log(`만료시간: ${new Date(Date.now() + 10 * 60 * 1000).toLocaleString('ko-KR')}\n`);
}

// SMS 인증번호 발송
export async function sendSmsCode(phone: string, purpose: 'find_id' | 'reset_password'): Promise<{ success: boolean; message: string }> {
  try {
    const code = generateSmsCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10분 유효
    
    const key = `${phone}-${purpose}`;
    smsVerificationCodes.set(key, {
      phone,
      code,
      purpose,
      expiresAt,
      attempts: 0,
      verified: false
    });

    // SMS 발송 시뮬레이션
    sendSmsSimulation(phone, code, purpose);
    
    // 실제 SMS 발송은 여기에 구현 (Twilio, NHN Cloud SMS 등)
    // const smsResult = await sendRealSms(phone, code);
    
    return { success: true, message: "인증번호가 SMS로 발송되었습니다." };
  } catch (error) {
    console.error('SMS 발송 오류:', error);
    return { success: false, message: "SMS 발송에 실패했습니다." };
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
    const storedCode = smsVerificationCodes.get(key);
    
    if (!storedCode) {
      return { verified: false, message: "인증번호를 먼저 요청해주세요." };
    }
    
    if (storedCode.verified) {
      return { verified: false, message: "이미 사용된 인증번호입니다." };
    }
    
    if (new Date() > storedCode.expiresAt) {
      return { verified: false, message: "인증번호가 만료되었습니다. 새로 요청해주세요." };
    }
    
    storedCode.attempts += 1;
    
    if (storedCode.attempts > 3) {
      smsVerificationCodes.delete(key);
      return { verified: false, message: "인증 시도 횟수를 초과했습니다. 새로 요청해주세요." };
    }
    
    if (storedCode.code !== code) {
      return { verified: false, message: `인증번호가 일치하지 않습니다. (${storedCode.attempts}/3회)` };
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

// 인증 상태 확인
export function isSmsVerified(phone: string, purpose: 'find_id' | 'reset_password'): boolean {
  const key = `${phone}-${purpose}`;
  const storedCode = smsVerificationCodes.get(key);
  return !!(storedCode && storedCode.verified && new Date() <= storedCode.expiresAt);
}

// 인증 정보 삭제
export function clearSmsVerification(phone: string, purpose: 'find_id' | 'reset_password'): void {
  const key = `${phone}-${purpose}`;
  smsVerificationCodes.delete(key);
}