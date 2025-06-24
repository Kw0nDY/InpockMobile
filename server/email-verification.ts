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

// 이메일 HTML 템플릿 생성
function generateEmailTemplate(code: string): { html: string; text: string } {
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #f59e0b; margin: 0; font-size: 28px;">AmuseFit</h1>
      </div>
      
      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
        <h2 style="color: #92400e; margin: 0 0 15px 0; font-size: 24px;">인증번호</h2>
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <span style="font-size: 36px; font-weight: bold; color: #f59e0b; letter-spacing: 4px;">${code}</span>
        </div>
        <p style="color: #92400e; margin: 0; font-size: 16px;">이 인증번호는 <strong>10분간</strong> 유효합니다.</p>
      </div>
      
      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b;">
        <h3 style="color: #374151; margin: 0 0 10px 0; font-size: 16px;">보안 안내</h3>
        <ul style="color: #6b7280; margin: 0; padding-left: 20px; font-size: 14px;">
          <li>인증번호를 타인에게 알려주지 마세요</li>
          <li>AmuseFit에서 먼저 인증번호를 요청하지 않습니다</li>
          <li>의심스러운 요청은 고객센터로 문의해주세요</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          본 메일은 발신전용입니다. 문의사항은 고객센터를 이용해주세요.
        </p>
      </div>
    </div>
  `;
  
  const text = `[AmuseFit] 인증번호: ${code}\n\n이 인증번호는 10분간 유효합니다.\n인증번호를 타인에게 알려주지 마세요.`;
  
  return { html, text };
}

// Brevo (Sendinblue) 이메일 발송
async function sendBrevoEmail(email: string, code: string): Promise<boolean> {
  try {
    const { html, text } = generateEmailTemplate(code);
    
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY!
      },
      body: JSON.stringify({
        sender: { name: 'AmuseFit', email: 'noreply@amusefit.com' },
        to: [{ email }],
        subject: '[AmuseFit] 인증번호',
        htmlContent: html,
        textContent: text
      })
    });

    if (response.ok) {
      console.log(`✅ Brevo 이메일 발송 성공: ${email}`);
      return true;
    } else {
      const error = await response.text();
      console.error('Brevo 이메일 발송 실패:', error);
      return false;
    }
  } catch (error) {
    console.error('Brevo 이메일 발송 오류:', error);
    return false;
  }
}

// Resend 이메일 발송
async function sendResendEmail(email: string, code: string): Promise<boolean> {
  try {
    const { html, text } = generateEmailTemplate(code);
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'AmuseFit <noreply@amusefit.com>',
        to: [email],
        subject: '[AmuseFit] 인증번호',
        html,
        text
      })
    });

    if (response.ok) {
      console.log(`✅ Resend 이메일 발송 성공: ${email}`);
      return true;
    } else {
      const error = await response.text();
      console.error('Resend 이메일 발송 실패:', error);
      return false;
    }
  } catch (error) {
    console.error('Resend 이메일 발송 오류:', error);
    return false;
  }
}

// SendGrid 이메일 발송
async function sendSendGridEmail(email: string, code: string): Promise<boolean> {
  try {
    const { html, text } = generateEmailTemplate(code);
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    await sgMail.send({
      to: email,
      from: 'noreply@amusefit.com',
      subject: '[AmuseFit] 인증번호',
      html,
      text
    });
    
    console.log(`✅ SendGrid 이메일 발송 성공: ${email}`);
    return true;
  } catch (error) {
    console.error('SendGrid 이메일 발송 실패:', error);
    return false;
  }
}

// 통합 이메일 발송 함수 (여러 서비스 지원)
async function sendRealEmail(email: string, code: string): Promise<boolean> {
  // 1. Brevo 우선 시도 (무료 한도가 가장 많음)
  if (process.env.BREVO_API_KEY) {
    const success = await sendBrevoEmail(email, code);
    if (success) return true;
  }

  // 2. Resend 시도 (일 한도 있음)
  if (process.env.RESEND_API_KEY) {
    const success = await sendResendEmail(email, code);
    if (success) return true;
  }

  // 3. SendGrid 시도 (무료 한도 적음)
  if (process.env.SENDGRID_API_KEY) {
    const success = await sendSendGridEmail(email, code);
    if (success) return true;
  }

  console.log('모든 이메일 서비스 사용 불가 - 개발 모드로 전환');
  return false;
}

// 이메일 인증번호 발송 (SendGrid 연동)
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

    // 실제 이메일 발송 시도 (여러 서비스 지원)
    const emailSent = await sendRealEmail(email, code);
    
    if (emailSent) {
      return { success: true, message: "인증번호가 이메일로 발송되었습니다." };
    } else {
      // 모든 서비스 실패 시 개발 모드로 폴백
      console.log(`\n📧 이메일 인증번호 (개발 모드)`);
      console.log(`이메일: ${email}`);
      console.log(`목적: ${purpose === 'reset_password' ? '비밀번호 재설정' : purpose}`);
      console.log(`인증번호: ${code}`);
      console.log(`유효시간: 10분`);
      console.log(`만료시간: ${expiresAt.toLocaleString('ko-KR')}\n`);
      
      return { success: true, message: "인증번호가 발송되었습니다. (개발 모드)" };
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

// 이메일 서비스 설정 확인 함수
export function checkEmailConfig(): { configured: boolean; message: string; services: any } {
  const services = {
    brevo: !!process.env.BREVO_API_KEY,
    resend: !!process.env.RESEND_API_KEY,
    sendgrid: !!process.env.SENDGRID_API_KEY
  };
  
  const configuredCount = Object.values(services).filter(Boolean).length;
  
  if (configuredCount === 0) {
    return {
      configured: false,
      message: "이메일 서비스가 설정되지 않았습니다. 개발 모드로 동작합니다.",
      services
    };
  }
  
  const configuredServices = Object.entries(services)
    .filter(([, configured]) => configured)
    .map(([name]) => name)
    .join(', ');
  
  return {
    configured: true,
    message: `이메일 서비스가 설정되었습니다: ${configuredServices}`,
    services
  };
}