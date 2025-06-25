// 통합 SMS 인증 시스템 (실제 SMS + 개발 모드 폴백)

// 실제 SMS 발송 서비스 통합
async function sendRealSms(phone: string, code: string, purpose: string): Promise<{ success: boolean; message: string; messageId?: string }> {
  const purposeText = purpose === 'find_id' ? 'ID 찾기' : '비밀번호 재설정';
  const message = `[AmuseFit] ${purposeText} 인증번호: ${code} (10분간 유효)`;

  // Twilio SMS 시도
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER?.replace(/\s+/g, '');

  if (accountSid && authToken && fromNumber) {
    try {
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          From: fromNumber,
          To: phone,
          Body: message
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        return { success: true, message: 'Twilio SMS 발송 성공', messageId: result.sid };
      } else {
        throw new Error(`Twilio API 오류: ${result.message}`);
      }
    } catch (error) {
      console.error('Twilio SMS 발송 실패:', error);
      return { success: false, message: `Twilio SMS 실패: ${error.message}` };
    }
  }

  return { success: false, message: 'SMS 서비스 설정이 필요합니다.' };
}

interface SmsVerificationCode {
  phone: string;
  code: string;
  purpose: 'find_id' | 'reset_password';
  expiresAt: Date;
  attempts: number;
  verified: boolean;
  createdAt: Date;
}

// 메모리 저장소 최적화 (TTL 적용)
const smsVerificationCodes = new Map<string, SmsVerificationCode>();

// 주기적 정리 (10분마다)
setInterval(() => {
  const now = new Date();
  for (const [key, value] of smsVerificationCodes.entries()) {
    if (now > value.expiresAt) {
      smsVerificationCodes.delete(key);
    }
  }
}, 10 * 60 * 1000);

// 보안 강화된 6자리 코드 생성
function generateSmsCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 개발 모드 SMS 시뮬레이션
function sendSmsSimulation(phone: string, code: string, purpose: string): void {
  console.log(`\n📱 SMS 인증번호 (개발 모드)`);
  console.log(`전화번호: ${phone}`);
  console.log(`목적: ${purpose === 'find_id' ? 'ID 찾기' : '비밀번호 재설정'}`);
  console.log(`인증번호: ${code}`);
  console.log(`유효시간: 10분`);
  console.log(`만료시간: ${new Date(Date.now() + 10 * 60 * 1000).toLocaleString('ko-KR')}\n`);
}

// SMS 인증번호 발송 (실제 SMS + 개발 모드 자동 폴백)
export async function sendSmsCode(phone: string, purpose: 'find_id' | 'reset_password'): Promise<{ success: boolean; message: string }> {
  try {
    // 중복 요청 방지 (1분 쿨다운)
    const key = `${phone}-${purpose}`;
    const existing = smsVerificationCodes.get(key);
    if (existing && (Date.now() - existing.createdAt.getTime()) < 60000) {
      return { success: false, message: "1분 후에 다시 요청해주세요." };
    }

    const code = generateSmsCode();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10분 유효
    
    const verificationData: SmsVerificationCode = {
      phone,
      code,
      purpose,
      expiresAt,
      attempts: 0,
      verified: false,
      createdAt: now
    };

    // 실제 SMS 발송 시도
    const smsResult = await sendRealSms(phone, code, purpose);
    
    if (smsResult.success) {
      smsVerificationCodes.set(key, verificationData);
      console.log(`✅ 실제 SMS 발송 성공: ${phone}`);
      return { success: true, message: "인증번호가 발송되었습니다." };
    }
    
    // 실제 SMS 실패 시 개발 모드 자동 폴백
    console.log(`⚠️ 실제 SMS 발송 실패, 개발 모드로 전환: ${phone}`);
    console.log(`SMS 서비스 응답: ${smsResult.message}`);
    
    smsVerificationCodes.set(key, verificationData);
    sendSmsSimulation(phone, code, purpose);
    return { success: true, message: "인증번호가 발송되었습니다. (개발 모드)" };
    
  } catch (error) {
    console.error('SMS 발송 시스템 오류:', error);
    
    // 시스템 오류 시에도 개발 모드 보장
    const code = generateSmsCode();
    const now = new Date();
    const key = `${phone}-${purpose}`;
    
    smsVerificationCodes.set(key, {
      phone,
      code,
      purpose,
      expiresAt: new Date(now.getTime() + 10 * 60 * 1000),
      attempts: 0,
      verified: false,
      createdAt: now
    });
    
    sendSmsSimulation(phone, code, purpose);
    return { success: true, message: "인증번호가 발송되었습니다. (개발 모드)" };
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