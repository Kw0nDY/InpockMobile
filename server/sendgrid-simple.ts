// SendGrid - 가장 간단하고 신뢰성 높은 이메일 서비스
// 다른 웹사이트들이 가장 많이 사용하는 방법

interface SendGridResponse {
  success: boolean;
  message: string;
  messageId?: string;
}

export async function sendEmailViaSendGrid(email: string, code: string, purpose: string): Promise<SendGridResponse> {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      return { 
        success: false, 
        message: 'SendGrid API 키가 필요합니다 (https://sendgrid.com 회원가입 후 API Key 생성)' 
      };
    }

    const purposeText = purpose === 'find_id' ? 'ID 찾기' : '비밀번호 재설정';
    
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: email }],
          subject: `[AmuseFit] ${purposeText} 인증번호`
        }],
        from: { 
          email: 'noreply@amusefit.com', 
          name: 'AmuseFit' 
        },
        content: [{
          type: 'text/html',
          value: `
            <div style="max-width: 500px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #8B4513; margin: 0;">AmuseFit</h1>
                <p style="color: #666; margin: 5px 0;">피트니스 비즈니스 플랫폼</p>
              </div>
              
              <div style="background: #f8f9fa; border-radius: 8px; padding: 30px; text-align: center;">
                <h2 style="color: #495057; margin: 0 0 20px 0;">${purposeText}</h2>
                <p style="color: #666; margin: 0 0 20px 0;">인증번호를 안내드립니다:</p>
                
                <div style="background: #ffffff; border: 3px solid #8B4513; border-radius: 8px; padding: 25px; margin: 20px 0;">
                  <span style="font-size: 36px; font-weight: bold; color: #8B4513; letter-spacing: 4px;">${code}</span>
                </div>
                
                <p style="color: #dc3545; font-weight: bold; margin: 20px 0 0 0;">
                  이 인증번호는 10분간 유효합니다.
                </p>
              </div>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center;">
                <p style="color: #6c757d; font-size: 14px; margin: 0;">
                  본인이 요청하지 않았다면 이 메일을 무시하세요.
                </p>
              </div>
            </div>
          `
        }, {
          type: 'text/plain',
          value: `[AmuseFit] ${purposeText}\n\n인증번호: ${code}\n\n이 인증번호는 10분간 유효합니다.\n\n본인이 요청하지 않았다면 이 메일을 무시하세요.`
        }]
      })
    });

    if (response.ok || response.status === 202) {
      console.log(`✅ SendGrid 이메일 발송 성공: ${email}`);
      return {
        success: true,
        message: 'SendGrid 이메일 발송 성공 (받은편지함 배달)',
        messageId: response.headers.get('x-message-id') || 'sendgrid_' + Date.now()
      };
    } else {
      const error = await response.text();
      console.error('SendGrid API 응답:', {
        status: response.status,
        statusText: response.statusText,
        error: error
      });
      
      if (response.status === 401) {
        throw new Error('SendGrid API 키가 잘못되었습니다');
      } else if (response.status === 403) {
        throw new Error('SendGrid 계정 인증이 필요합니다');
      } else {
        throw new Error(`SendGrid API 오류 (${response.status}): ${error}`);
      }
    }
  } catch (error) {
    console.error('SendGrid 발송 실패:', error);
    return { 
      success: false, 
      message: `SendGrid 발송 실패: ${error.message}` 
    };
  }
}

// Mailgun - SendGrid 대안
export async function sendEmailViaMailgun(email: string, code: string, purpose: string): Promise<SendGridResponse> {
  try {
    if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
      return { 
        success: false, 
        message: 'Mailgun 설정이 필요합니다 (API Key, Domain)' 
      };
    }

    const purposeText = purpose === 'find_id' ? 'ID 찾기' : '비밀번호 재설정';
    
    const formData = new FormData();
    formData.append('from', `AmuseFit <noreply@${process.env.MAILGUN_DOMAIN}>`);
    formData.append('to', email);
    formData.append('subject', `[AmuseFit] ${purposeText} 인증번호`);
    formData.append('html', `
      <div style="padding: 20px; font-family: Arial, sans-serif; max-width: 500px;">
        <h2 style="color: #8B4513;">AmuseFit ${purposeText}</h2>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
          <p>인증번호를 안내드립니다:</p>
          <div style="background: white; padding: 15px; border: 2px solid #8B4513; border-radius: 5px; margin: 15px 0;">
            <span style="font-size: 28px; font-weight: bold; color: #8B4513;">${code}</span>
          </div>
          <p style="color: #666;">이 인증번호는 10분간 유효합니다.</p>
        </div>
      </div>
    `);
    formData.append('text', `AmuseFit ${purposeText}\n\n인증번호: ${code}\n\n이 인증번호는 10분간 유효합니다.`);

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

// 현재 설정된 서비스 확인
export function checkSimpleEmailServices(): { 
  configured: string[]; 
  recommended: string;
  instructions: string;
} {
  const configured = [];
  
  if (process.env.SENDGRID_API_KEY) configured.push('SendGrid');
  if (process.env.MAILGUN_API_KEY) configured.push('Mailgun');
  if (process.env.BREVO_API_KEY) configured.push('Brevo');

  const recommended = configured.length > 0 ? 
    configured[0] : 
    'SendGrid 무료 계정 (월 100통)';

  const instructions = configured.length === 0 ? 
    '1. https://sendgrid.com 회원가입\n2. API Key 생성\n3. SENDGRID_API_KEY 환경변수 설정' :
    '이미 설정된 서비스가 있습니다';

  return { configured, recommended, instructions };
}