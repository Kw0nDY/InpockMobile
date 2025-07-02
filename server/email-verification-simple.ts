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

// 실제 이메일 발송 함수
async function sendRealEmail(email: string, code: string): Promise<{ success: boolean; message: string }> {
  // Brevo API를 사용한 실제 이메일 발송
  if (process.env.BREVO_API_KEY) {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'api-key': process.env.BREVO_API_KEY
        },
        body: JSON.stringify({
          sender: { 
            name: 'AmuseFit', 
            email: 'dy.kwon@dxt.co.kr' 
          },
          to: [{ email: email }],
          subject: `[AmuseFit] 비밀번호 재설정 인증번호`,
          htmlContent: `
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
              <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #8B4513; margin: 0; font-size: 28px; font-weight: bold;">AmuseFit</h1>
                  <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">피트니스 비즈니스 플랫폼</p>
                </div>
                
                <div style="text-align: center; margin-bottom: 30px;">
                  <h2 style="color: #333; margin: 0 0 10px 0; font-size: 24px;">비밀번호 재설정</h2>
                  <p style="color: #666; margin: 0; font-size: 16px;">아래 인증번호를 입력하여 새 비밀번호를 설정하세요</p>
                </div>
                
                <div style="background: linear-gradient(135deg, #f8f4e6 0%, #f0e6d2 100%); border: 2px solid #8B4513; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
                  <p style="color: #8B4513; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">인증번호</p>
                  <div style="font-size: 36px; font-weight: bold; color: #8B4513; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                    ${code}
                  </div>
                  <p style="color: #8B4513; margin: 15px 0 0 0; font-size: 14px;">유효시간: <strong>10분</strong></p>
                </div>
                
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 30px 0;">
                  <h3 style="color: #856404; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">보안 안내</h3>
                  <ul style="color: #856404; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6;">
                    <li>인증번호를 타인에게 알려주지 마세요</li>
                    <li>본인이 요청하지 않았다면 이 이메일을 무시하세요</li>
                    <li>문의사항은 고객센터로 연락해주세요</li>
                  </ul>
                </div>
                
                <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
                  <p style="color: #999; font-size: 12px; margin: 0;">
                    본 메일은 발신전용입니다. 문의사항은 AmuseFit 고객센터를 이용해주세요.
                  </p>
                </div>
              </div>
            </div>
          `,
          textContent: `AmuseFit 비밀번호 재설정\n\n인증번호: ${code}\n\n이 인증번호는 10분간 유효합니다.\n\n본인이 요청하지 않았다면 이 이메일을 무시하세요.`
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Brevo 이메일 발송 성공: ${email}`);
        return {
          success: true,
          message: 'Brevo 이메일 발송 성공'
        };
      } else {
        const error = await response.text();
        console.log(`❌ Brevo 실패: ${error}`);
        throw new Error(`Brevo API 오류: ${error}`);
      }
    } catch (error: any) {
      console.log(`❌ Brevo 오류: ${error?.message || error}`);
      throw error;
    }
  }
  
  throw new Error('이메일 서비스가 설정되지 않았습니다');
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

    // 실제 이메일 발송 시도
    try {
      await sendRealEmail(email, code);
      console.log(`📧 실제 이메일 발송 성공: ${email} (인증번호: ${code})`);
      return { 
        success: true, 
        message: "인증번호가 이메일로 발송되었습니다. 메일함을 확인해주세요." 
      };
    } catch (emailError: any) {
      // 실제 이메일 발송 실패 시 개발 모드로 폴백
      console.log(`❌ 실제 이메일 발송 실패: ${emailError.message}`);
      console.log(`\n📧 이메일 인증번호 (개발 모드 폴백)`);
      console.log(`이메일: ${email}`);
      console.log(`목적: 비밀번호 재설정`);
      console.log(`인증번호: ${code}`);
      console.log(`유효시간: 10분`);
      console.log(`만료시간: ${expiresAt.toLocaleString('ko-KR')}\n`);
      
      return { 
        success: true, 
        message: "인증번호가 발송되었습니다. 이메일 발송에 문제가 있어 관리자에게 문의하세요." 
      };
    }
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