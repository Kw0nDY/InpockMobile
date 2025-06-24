// 서버에서 사용 가능한 간단한 이메일 서비스들

interface EmailResponse {
  success: boolean;
  message: string;
  messageId?: string;
}

// Nodemailer with Gmail SMTP (가장 간단하고 확실한 방법)
export async function sendEmailViaNodemailer(email: string, code: string, purpose: string): Promise<EmailResponse> {
  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      return { success: false, message: 'Gmail SMTP 설정이 필요합니다' };
    }

    const nodemailer = await import('nodemailer');
    const purposeText = purpose === 'find_id' ? 'ID 찾기' : '비밀번호 재설정';
    
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    const mailOptions = {
      from: `AmuseFit <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `[AmuseFit] ${purposeText} 인증번호`,
      html: `
        <div style="max-width: 500px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #8B4513; text-align: center;">AmuseFit</h2>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
            <h3>${purposeText}</h3>
            <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <span style="font-size: 24px; font-weight: bold; color: #8B4513;">${code}</span>
            </div>
            <p>이 인증번호는 10분간 유효합니다.</p>
          </div>
        </div>
      `,
      text: `[AmuseFit] ${purposeText}\n\n인증번호: ${code}\n\n이 인증번호는 10분간 유효합니다.`
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Gmail SMTP 이메일 발송 성공: ${email}`);
    
    return {
      success: true,
      message: 'Gmail SMTP 이메일 발송 성공',
      messageId: result.messageId
    };
  } catch (error) {
    console.error('Gmail SMTP 발송 실패:', error);
    return { 
      success: false, 
      message: `Gmail SMTP 발송 실패: ${error.message}` 
    };
  }
}

// 무료 SMTP 서비스 (Gmail 대안)
export async function sendEmailViaFreeSMTP(email: string, code: string, purpose: string): Promise<EmailResponse> {
  try {
    // Outlook/Hotmail SMTP 사용
    if (process.env.OUTLOOK_USER && process.env.OUTLOOK_PASSWORD) {
      const nodemailer = await import('nodemailer');
      const purposeText = purpose === 'find_id' ? 'ID 찾기' : '비밀번호 재설정';
      
      const transporter = nodemailer.createTransporter({
        service: 'hotmail',
        auth: {
          user: process.env.OUTLOOK_USER,
          pass: process.env.OUTLOOK_PASSWORD
        }
      });

      const result = await transporter.sendMail({
        from: `AmuseFit <${process.env.OUTLOOK_USER}>`,
        to: email,
        subject: `[AmuseFit] ${purposeText} 인증번호`,
        text: `인증번호: ${code}\n\n이 인증번호는 10분간 유효합니다.`
      });

      console.log(`✅ Outlook SMTP 이메일 발송 성공: ${email}`);
      return {
        success: true,
        message: 'Outlook SMTP 이메일 발송 성공',
        messageId: result.messageId
      };
    }

    return { success: false, message: 'Outlook SMTP 설정이 필요합니다' };
  } catch (error) {
    console.error('Outlook SMTP 발송 실패:', error);
    return { 
      success: false, 
      message: `Outlook SMTP 발송 실패: ${error.message}` 
    };
  }
}

// Brevo API 개선된 버전
export async function sendEmailViaBrevoImproved(email: string, code: string, purpose: string): Promise<EmailResponse> {
  try {
    if (!process.env.BREVO_API_KEY) {
      return { success: false, message: 'Brevo API 설정이 필요합니다' };
    }

    const purposeText = purpose === 'find_id' ? 'ID 찾기' : '비밀번호 재설정';
    
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Api-Key': process.env.BREVO_API_KEY
      },
      body: JSON.stringify({
        sender: { 
          name: 'AmuseFit', 
          email: 'noreply@amusefit.co.kr' 
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
            </div>
          </div>
        `,
        textContent: `AmuseFit ${purposeText}\n\n인증번호: ${code}\n\n이 인증번호는 10분간 유효합니다.`
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Brevo 이메일 발송 성공: ${email}`);
      return {
        success: true,
        message: 'Brevo 이메일 발송 성공',
        messageId: result.messageId
      };
    } else {
      const error = await response.text();
      throw new Error(error);
    }
  } catch (error) {
    console.error('Brevo 발송 실패:', error);
    return { 
      success: false, 
      message: `Brevo 발송 실패: ${error.message}` 
    };
  }
}

// 서비스 설정 확인
export function checkEmailServiceConfig(): { available: string[]; recommended: string } {
  const available = [];
  
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    available.push('Gmail SMTP');
  }
  if (process.env.OUTLOOK_USER && process.env.OUTLOOK_PASSWORD) {
    available.push('Outlook SMTP');
  }
  if (process.env.BREVO_API_KEY) {
    available.push('Brevo API');
  }

  const recommended = available.length > 0 ? 
    'Gmail SMTP (가장 안정적)' : 
    'Gmail 앱 비밀번호 설정 권장';

  return { available, recommended };
}