// 간단한 이메일 인증 시스템
interface EmailCode {
  email: string;
  code: string;
  purpose: 'reset_password';
  expiresAt: Date;
  attempts: number;
}

// 메모리에 저장된 인증 코드들
const emailCodes = new Map<string, EmailCode>();

// 6자리 인증 코드 생성
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 실제 이메일 발송 함수
async function sendRealEmail(email: string, code: string): Promise<{ success: boolean; message: string }> {
  // Brevo API를 사용한 실제 이메일 발송
  if (process.env.BREVO_API_KEY) {
    try {
      const senderEmail = 'dy.kwon@dxt.co.kr';
      console.log(`🔍 실제 사용할 발신자: ${senderEmail}`);
      
      const requestBody = {
        sender: { 
          name: 'AmuseFit', 
          email: senderEmail 
        },
        to: [{ email: email }],
        subject: `[AmuseFit] 비밀번호 재설정 인증번호`,
        htmlContent: `<div style="padding: 20px; font-family: Arial, sans-serif;"><h2 style="color: #8B4513;">AmuseFit Password Reset</h2><div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;"><p>Your verification code:</p><div style="background: white; padding: 15px; border: 2px solid #8B4513; border-radius: 5px; margin: 15px 0;"><span style="font-size: 28px; font-weight: bold; color: #8B4513;">${code}</span></div><p style="color: #666;">This code is valid for 10 minutes.</p></div></div>`,
        textContent: `AmuseFit 비밀번호 재설정\n\n인증번호: ${code}\n\n이 인증번호는 10분간 유효합니다.\n인증번호를 타인에게 알려주지 마세요.`
      };
      
      console.log(`📧 요청 본문 확인:`, JSON.stringify({ sender: requestBody.sender }, null, 2));
      
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'api-key': process.env.BREVO_API_KEY
        },
        body: JSON.stringify(requestBody)
      });

      console.log(`📊 응답 상태: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Brevo 이메일 발송 성공: ${email}`);
        console.log(`📧 메시지 ID: ${result.messageId}`);
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

    // 실제 이메일 발송
    const emailResult = await sendRealEmail(email, code);
    
    console.log(`📧 실제 이메일 발송 성공: ${email} (인증번호: ${code})`);
    return { success: true, message: "인증번호가 이메일로 발송되었습니다." };
    
  } catch (error: any) {
    console.error('이메일 발송 실패:', error?.message || error);
    
    // 실패 시 개발 모드로 폴백
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    const key = `${email}-${purpose}`;
    emailCodes.set(key, {
      email,
      code,
      purpose,
      expiresAt,
      attempts: 0
    });
    
    console.log(`\n📧 이메일 인증번호 (개발 모드)`);
    console.log(`이메일: ${email}`);
    console.log(`목적: ${purpose === 'reset_password' ? '비밀번호 재설정' : purpose}`);
    console.log(`인증번호: ${code}`);
    console.log(`유효시간: 10분`);
    console.log(`만료시간: ${expiresAt.toLocaleString('ko-KR')}\n`);
    
    return { success: true, message: "인증번호가 발송되었습니다. (개발 모드)" };
  }
}

// 이메일 인증번호 검증
export async function verifyEmailCode(
  email: string, 
  code: string, 
  purpose: 'reset_password'
): Promise<{ success: boolean; message: string; data?: any }> {
  const key = `${email}-${purpose}`;
  const storedCode = emailCodes.get(key);
  
  if (!storedCode) {
    return { success: false, message: "인증번호가 존재하지 않습니다. 다시 요청해주세요." };
  }
  
  if (new Date() > storedCode.expiresAt) {
    emailCodes.delete(key);
    return { success: false, message: "인증번호가 만료되었습니다. 다시 요청해주세요." };
  }
  
  if (storedCode.attempts >= 5) {
    emailCodes.delete(key);
    return { success: false, message: "시도 횟수를 초과했습니다. 다시 요청해주세요." };
  }
  
  if (storedCode.code !== code) {
    storedCode.attempts++;
    return { success: false, message: "인증번호가 일치하지 않습니다." };
  }
  
  // 인증 성공 시 코드 삭제
  emailCodes.delete(key);
  return { success: true, message: "인증이 완료되었습니다." };
}

// 개발용 코드 확인 함수
export function getDevCode(email: string, purpose: string): { success: boolean; code?: string; message: string; timeLeft?: number } {
  const key = `${email}-${purpose}`;
  const storedCode = emailCodes.get(key);
  
  if (!storedCode) {
    return { success: false, message: "발송된 인증번호가 없습니다." };
  }
  
  const now = new Date();
  const timeLeft = Math.max(0, Math.floor((storedCode.expiresAt.getTime() - now.getTime()) / 1000));
  
  if (timeLeft <= 0) {
    emailCodes.delete(key);
    return { success: false, message: "인증번호가 만료되었습니다." };
  }
  
  return { 
    success: true, 
    code: storedCode.code, 
    message: `남은 시간: ${Math.floor(timeLeft / 60)}분 ${timeLeft % 60}초`,
    timeLeft 
  };
}

// 이메일 인증 완료 확인
export function isEmailVerified(email: string, purpose: 'reset_password'): boolean {
  // 간단한 구현을 위해 항상 false 반환
  // 실제로는 별도의 verified 상태를 관리해야 함
  return false;
}

// 이메일 인증 정보 삭제
export function clearEmailVerification(email: string, purpose: 'reset_password'): void {
  const key = `${email}-${purpose}`;
  emailCodes.delete(key);
}