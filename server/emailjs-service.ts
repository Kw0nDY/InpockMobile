// EmailJS - 가장 간단한 이메일 발송 서비스
// 회원가입만 하면 즉시 사용 가능, 환경변수 1개만 필요

interface EmailJSResponse {
  success: boolean;
  message: string;
  messageId?: string;
}

export async function sendEmailViaEmailJS(email: string, code: string, purpose: string): Promise<EmailJSResponse> {
  try {
    if (!process.env.EMAILJS_SERVICE_ID || !process.env.EMAILJS_TEMPLATE_ID || !process.env.EMAILJS_PUBLIC_KEY) {
      throw new Error('EmailJS 설정이 필요합니다');
    }

    console.log('EmailJS 설정 확인:', {
      serviceId: process.env.EMAILJS_SERVICE_ID,
      templateId: process.env.EMAILJS_TEMPLATE_ID,
      publicKey: process.env.EMAILJS_PUBLIC_KEY?.substring(0, 5) + '...'
    });

    const purposeText = purpose === 'find_id' ? 'ID 찾기' : '비밀번호 재설정';
    
    // EmailJS REST API 사용
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        service_id: process.env.EMAILJS_SERVICE_ID,
        template_id: process.env.EMAILJS_TEMPLATE_ID,
        user_id: process.env.EMAILJS_PUBLIC_KEY,
        template_params: {
          to_email: email,
          from_name: 'AmuseFit',
          message: `안녕하세요, AmuseFit입니다.\n\n${purposeText} 인증번호: ${code}\n\n이 인증번호는 10분간 유효합니다.\n\n감사합니다.`,
          verification_code: code
        }
      })
    });

    if (response.ok) {
      console.log(`✅ EmailJS 발송 성공: ${email}`);
      return {
        success: true,
        message: 'EmailJS 발송 성공',
        messageId: 'emailjs_' + Date.now()
      };
    } else {
      const error = await response.text();
      throw new Error(`EmailJS API 오류: ${error}`);
    }
  } catch (error) {
    console.error('EmailJS 발송 실패:', error);
    return { 
      success: false, 
      message: `EmailJS 발송 실패: ${error.message}` 
    };
  }
}

// Mailgun - 신뢰성 높은 이메일 서비스
export async function sendEmailViaMailgun(email: string, code: string, purpose: string): Promise<EmailJSResponse> {
  try {
    if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
      throw new Error('Mailgun 설정이 필요합니다 (회원가입 후 API Key, Domain 복사)');
    }

    const purposeText = purpose === 'find_id' ? 'ID 찾기' : '비밀번호 재설정';
    
    const formData = new FormData();
    formData.append('from', `AmuseFit <noreply@${process.env.MAILGUN_DOMAIN}>`);
    formData.append('to', email);
    formData.append('subject', `[AmuseFit] ${purposeText} 인증번호`);
    formData.append('html', `
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="color: #8B4513;">[AmuseFit] ${purposeText}</h2>
        <p>안녕하세요!</p>
        <div style="background: #f0f0f0; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
          <h3 style="color: #8B4513; font-size: 24px; margin: 0;">인증번호: ${code}</h3>
        </div>
        <p>이 인증번호는 <strong>10분간</strong> 유효합니다.</p>
        <p>감사합니다.<br>AmuseFit</p>
      </div>
    `);

    const response = await fetch(`https://api.mailgun.net/v3/${process.env.MAILGUN_DOMAIN}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`api:${process.env.MAILGUN_API_KEY}`).toString('base64')}`
      },
      body: formData
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Mailgun 발송 성공: ${email}`);
      return {
        success: true,
        message: 'Mailgun 발송 성공',
        messageId: result.id
      };
    } else {
      const error = await response.json();
      throw new Error(`Mailgun API 오류: ${error.message}`);
    }
  } catch (error) {
    console.error('Mailgun 발송 실패:', error);
    return { 
      success: false, 
      message: `Mailgun 발송 실패: ${error.message}` 
    };
  }
}

// 간단한 이메일 서비스 확인
export function checkSimpleEmailServices(): { configured: string[]; recommended: string[] } {
  const configured = [];
  
  if (process.env.EMAILJS_SERVICE_ID) configured.push('EmailJS');
  if (process.env.MAILGUN_API_KEY) configured.push('Mailgun');
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) configured.push('Gmail SMTP');
  if (process.env.BREVO_API_KEY) configured.push('Brevo');

  const recommended = [
    'EmailJS (월 200통 무료, 즉시 사용)',
    'Mailgun (월 5000통 무료, 높은 신뢰성)',
    'Gmail SMTP (무제한, 앱 비밀번호 필요)'
  ];

  return { configured, recommended };
}