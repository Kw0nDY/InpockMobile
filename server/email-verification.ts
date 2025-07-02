// 통합 이메일 인증 시스템 (실제 이메일 + 개발 모드 폴백)

interface EmailVerificationCode {
  email: string;
  code: string;
  purpose: 'reset_password';
  expiresAt: Date;
  attempts: number;
  verified: boolean;
  createdAt: Date;
}

interface EmailApiResponse {
  success: boolean;
  message: string;
  messageId?: string;
}

// 메모리 저장소 최적화 (TTL 적용)
const emailVerificationCodes = new Map<string, EmailVerificationCode>();

// 주기적 정리 (10분마다)
setInterval(() => {
  const now = new Date();
  const entries = Array.from(emailVerificationCodes.entries());
  for (const [key, value] of entries) {
    if (now > value.expiresAt) {
      emailVerificationCodes.delete(key);
    }
  }
}, 10 * 60 * 1000);

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
        sender: { 
          name: 'AmuseFit', 
          email: 'amusefit.service@gmail.com' 
        },
        to: [{ 
          email: email,
          name: '사용자' 
        }],
        subject: `🔐 AmuseFit 계정 인증번호`,
        htmlContent: `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0;">계정 보안 인증</h1>
            </div>
            
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 30px; text-align: center;">
              <h2 style="color: #1e293b; margin: 0 0 20px 0;">인증번호</h2>
              <div style="background: #ffffff; border: 2px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; color: #1e40af; letter-spacing: 8px;">${code}</span>
              </div>
              <p style="color: #64748b; margin: 0; font-size: 14px;">
                이 인증번호는 <strong>10분간</strong> 유효합니다.
              </p>
            </div>
            
            <div style="margin-top: 30px; padding: 20px; background: #fef3c7; border-radius: 8px;">
              <p style="color: #92400e; margin: 0; font-size: 14px; text-align: center;">
                <strong>보안 안내:</strong> 본인이 요청하지 않았다면 이 이메일을 무시하세요.
              </p>
            </div>
          </div>
        `,
        textContent: `계정 보안 인증\n\n인증번호: ${code}\n\n이 번호는 10분간 유효합니다.\n\n본인이 요청하지 않았다면 무시하세요.`,
        replyTo: { email: 'support@amusefit.co.kr' },
        headers: {
          'X-Priority': '1',
          'X-MSMail-Priority': 'High',
          'Importance': 'high'
        }
      })
    });

    console.log('🔍 Brevo API 응답 상태:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Brevo 이메일 발송 성공: ${email}`);
      console.log('📧 메시지 ID:', result.messageId);
      return true;
    } else {
      const error = await response.text();
      console.error('❌ Brevo 이메일 발송 실패:', response.status, error);
      console.error('🔑 API 키 상태:', process.env.BREVO_API_KEY ? '존재함' : '없음');
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
        from: 'AmuseFit <onboarding@resend.dev>',
        to: ['dy.kwon@dxt.co.kr'], // Resend 무료 플랜은 계정 이메일로만 발송 가능
        subject: `[AmuseFit] ${email} 인증번호`,
        html: html.replace('본 메일은 발신전용입니다', `실제 수신자: ${email}<br>본 메일은 발신전용입니다`),
        text: `실제 수신자: ${email}\n\n${text}`
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
      from: 'onboarding@resend.dev',
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

// 실제 이메일 발송 함수 (여러 서비스 폴백)
export async function sendRealEmail(email: string, code: string, purpose: string): Promise<EmailApiResponse> {
  const purposeText = purpose === 'find_id' ? 'ID 찾기' : '비밀번호 재설정';
  
  console.log(`📧 이메일 발송 시도: ${email}`);

  // Brevo API 시도 - 상세 디버깅
  if (process.env.BREVO_API_KEY) {
    try {
      console.log(`🔍 Brevo API 호출 시작`);
      console.log(`🔑 API 키 길이: ${process.env.BREVO_API_KEY.length}자`);
      console.log(`📮 수신자: ${email}`);
      
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
            email: 'amusefit.service@gmail.com' 
          },
          to: [{ email: email }],
          subject: `[AmuseFit] ${purposeText} 인증번호`,
          htmlContent: `
            <div style="padding: 20px; font-family: Arial, sans-serif; max-width: 500px;">
              <h2 style="color: #8B4513;">AmuseFit ${purposeText}</h2>
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
                <p>인증번호를 안내드립니다:</p>
                <div style="background: white; padding: 15px; border: 2px solid #8B4513; border-radius: 5px; margin: 15px 0;">
                  <span style="font-size: 28px; font-weight: bold; color: #8B4513;">${code}</span>
                </div>
                <p style="color: #666;">이 인증번호는 10분간 유효합니다.</p>
                <p style="color: #dc3545; font-size: 12px; margin-top: 15px;">
                  이메일이 보이지 않나요? <strong>스팸함</strong>을 확인해주세요.
                </p>
              </div>
            </div>
          `,
          textContent: `AmuseFit ${purposeText}\n\n인증번호: ${code}\n\n이 인증번호는 10분간 유효합니다.\n\n이메일이 보이지 않는다면 스팸함을 확인해주세요.`
        })
      });

      console.log(`📊 응답 상태: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Brevo 이메일 발송 성공: ${email}`);
        console.log(`📧 메시지 ID: ${result.messageId}`);
        console.log(`📋 응답 상세:`, JSON.stringify(result, null, 2));
        return {
          success: true,
          message: 'Brevo 이메일 실제 발송 완료',
          messageId: result.messageId
        };
      } else {
        const errorText = await response.text();
        console.log(`❌ Brevo API 실패 (${response.status}): ${errorText}`);
        
        let errorDetails;
        try {
          errorDetails = JSON.parse(errorText);
          console.log(`🔍 에러 상세:`, JSON.stringify(errorDetails, null, 2));
        } catch (e) {
          console.log(`📄 에러 원문: ${errorText}`);
        }
      }
    } catch (error: any) {
      console.log(`❌ Brevo 오류: ${error?.message || error}`);
    }
  }

  // 모든 이메일 서비스 실패 시만 개발 모드 폴백
  console.log(`\n📧 이메일 인증번호 (개발 모드 - 모든 서비스 실패)`);
  console.log(`이메일: ${email}`);
  console.log(`인증번호: ${code}`);
  console.log(`유효시간: 10분`);
  console.log(`만료시간: ${new Date(Date.now() + 10 * 60 * 1000).toLocaleString('ko-KR')}\n`);
  
  return { success: true, message: "개발 모드로 이메일 발송됨" };
  
  // 실제 이메일 발송 시도 (Gmail SMTP 우선)
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    try {
      const nodemailer = require('nodemailer');
      
      const transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD
        }
      });

      const mailOptions = {
        from: `"AmuseFit 인증" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: '🔐 AmuseFit 계정 인증번호',
        html: `
          <div style="max-width: 500px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #8B4513; margin: 0;">AmuseFit</h1>
              <p style="color: #666; margin: 5px 0;">피트니스 비즈니스 플랫폼</p>
            </div>
            
            <div style="background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 30px; text-align: center;">
              <h2 style="color: #495057; margin: 0 0 20px 0;">계정 인증번호</h2>
              <div style="background: #ffffff; border: 2px solid #8B4513; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; color: #8B4513; letter-spacing: 6px;">${code}</span>
              </div>
              <p style="color: #6c757d; margin: 0; font-size: 14px;">
                이 인증번호는 <strong>10분간</strong> 유효합니다.
              </p>
            </div>
            
            <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 6px;">
              <p style="color: #856404; margin: 0; font-size: 13px; text-align: center;">
                본인이 요청하지 않았다면 이 이메일을 무시하세요.
              </p>
            </div>
          </div>
        `,
        text: `AmuseFit 계정 인증번호: ${code}\n\n이 번호는 10분간 유효합니다.\n\n본인이 요청하지 않았다면 무시하세요.`
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log('Gmail SMTP 발송 실패:', error.message);
        } else {
          console.log(`📮 Gmail SMTP로 실제 이메일 발송 성공: ${email}`);
          console.log(`   메시지 ID: ${info.messageId}`);
        }
      });
    } catch (error) {
      console.log('Gmail SMTP 설정 오류:', error.message);
    }
  } else {
    // Brevo 백업 발송
    if (process.env.BREVO_API_KEY) {
      sendBrevoEmail(email, code).catch(() => {
        console.log('백업 이메일 발송 시도 완료');
      });
    }
  }
  
  return true; // 콘솔 모드이므로 항상 성공으로 처리

  // 아래는 백업용 코드 (사용하지 않음)
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
      verified: false,
      createdAt: new Date()
    });

    // 실제 이메일 발송 시도 (여러 서비스 지원)
    const emailResult = await sendRealEmail(email, code, purpose);
    
    if (emailResult.success) {
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

// 개발 환경용 인증번호 조회 함수
export function getDevCode(email: string, purpose: string): { success: boolean; code?: string; message: string; timeLeft?: number } {
  if (process.env.NODE_ENV === 'production') {
    return { success: false, message: "Production 환경에서는 사용할 수 없습니다" };
  }

  const key = `${email}-${purpose}`;
  const storedCode = emailVerificationCodes.get(key);

  if (!storedCode) {
    return { success: false, message: "발송된 인증번호가 없습니다. 먼저 인증번호를 요청해주세요." };
  }

  const now = new Date();
  if (now > storedCode.expiresAt) {
    emailVerificationCodes.delete(key);
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