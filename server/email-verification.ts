// 이메일 인증 시스템 (개발용 - 실제 이메일 발송 없이 콘솔 출력)

interface EmailVerificationCode {
  email: string;
  code: string;
  purpose: 'reset_password';
  expiresAt: Date;
  attempts: number;
  verified: boolean;
}

// 메모리 저장소 (실제 서비스에서는 Redis 사용 권장)
const emailVerificationCodes = new Map<string, EmailVerificationCode>();

// 6자리 랜덤 코드 생성
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 이메일 인증번호 발송 (개발용)
export async function sendEmailCode(email: string, purpose: 'reset_password'): Promise<{ success: boolean; message: string }> {
  try {
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10분 유효
    
    const key = `${email}-${purpose}`;
    emailVerificationCodes.set(key, {
      email,
      code,
      purpose,
      expiresAt,
      attempts: 0,
      verified: false
    });

    // 개발 환경에서는 콘솔에 인증번호 출력
    console.log(`\n📧 이메일 인증번호 발송 (개발용)`);
    console.log(`이메일: ${email}`);
    console.log(`목적: ${purpose === 'reset_password' ? '비밀번호 재설정' : purpose}`);
    console.log(`인증번호: ${code}`);
    console.log(`유효시간: 10분`);
    console.log(`만료시간: ${expiresAt.toLocaleString('ko-KR')}\n`);

    return { success: true, message: "인증번호가 발송되었습니다." };
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
): Promise<{ verified: boolean; message: string; data?: any }> {
  try {
    const key = `${email}-${purpose}`;
    const storedCode = emailVerificationCodes.get(key);

    if (!storedCode) {
      return { verified: false, message: "인증번호를 다시 요청해주세요." };
    }

    // 만료 시간 확인
    if (new Date() > storedCode.expiresAt) {
      emailVerificationCodes.delete(key);
      return { verified: false, message: "인증번호가 만료되었습니다. 다시 요청해주세요." };
    }

    // 시도 횟수 증가
    storedCode.attempts += 1;

    // 3회 초과 시 차단
    if (storedCode.attempts > 3) {
      emailVerificationCodes.delete(key);
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
    console.log(`✅ 이메일 인증 성공: ${email} (${purpose})`);

    return { 
      verified: true, 
      message: "인증이 완료되었습니다.",
      data: { email, purpose }
    };
  } catch (error) {
    console.error('이메일 인증 확인 오류:', error);
    return { verified: false, message: "인증 확인 중 오류가 발생했습니다." };
  }
}

// 인증된 이메일인지 확인
export function isEmailVerified(email: string, purpose: 'reset_password'): boolean {
  const key = `${email}-${purpose}`;
  const storedCode = emailVerificationCodes.get(key);
  return storedCode?.verified === true;
}

// 인증 완료 후 정리
export function clearEmailVerification(email: string, purpose: 'reset_password'): void {
  const key = `${email}-${purpose}`;
  emailVerificationCodes.delete(key);
}

// 실제 서비스에서 사용할 이메일 발송 함수 (SendGrid, Amazon SES 등)
/*
export async function sendRealEmail(email: string, code: string): Promise<boolean> {
  // SendGrid 예시
  try {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    const msg = {
      to: email,
      from: 'noreply@amusefit.com',
      subject: '[AmuseFit] 인증번호',
      text: `인증번호: ${code}`,
      html: `
        <h2>AmuseFit 인증번호</h2>
        <p>요청하신 인증번호입니다:</p>
        <h1 style="color: #f59e0b;">${code}</h1>
        <p>이 인증번호는 10분간 유효합니다.</p>
      `
    };
    
    await sgMail.send(msg);
    return true;
  } catch (error) {
    console.error('이메일 발송 실패:', error);
    return false;
  }
}
*/