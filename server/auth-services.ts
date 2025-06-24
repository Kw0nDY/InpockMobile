import crypto from 'crypto';

// 이메일 서비스 옵션들
export interface EmailService {
  sendEmail(to: string, subject: string, content: string): Promise<boolean>;
}

// Gmail SMTP를 사용한 이메일 서비스 (NodeMailer)
export class GmailEmailService implements EmailService {
  private transporter: any;

  constructor() {
    // Gmail SMTP 설정 (사용자가 App Password 설정 필요)
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      const nodemailer = require('nodemailer');
      this.transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD
        }
      });
    }
  }

  async sendEmail(to: string, subject: string, content: string): Promise<boolean> {
    if (!this.transporter) {
      console.log('Gmail 설정이 없어 이메일을 콘솔로 출력합니다:');
      console.log(`TO: ${to}`);
      console.log(`SUBJECT: ${subject}`);
      console.log(`CONTENT: ${content}`);
      return true; // 개발 환경에서는 성공으로 처리
    }

    try {
      await this.transporter.sendMail({
        from: process.env.GMAIL_USER,
        to,
        subject,
        html: content
      });
      return true;
    } catch (error) {
      console.error('Gmail 이메일 발송 실패:', error);
      return false;
    }
  }
}

// Resend API를 사용한 이메일 서비스
export class ResendEmailService implements EmailService {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY;
  }

  async sendEmail(to: string, subject: string, content: string): Promise<boolean> {
    if (!this.apiKey) {
      console.log('Resend API 키가 없어 이메일을 콘솔로 출력합니다:');
      console.log(`TO: ${to}`);
      console.log(`SUBJECT: ${subject}`);
      console.log(`CONTENT: ${content}`);
      return true;
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'noreply@yourdomain.com', // 실제 도메인으로 변경 필요
          to: [to],
          subject,
          html: content
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Resend 이메일 발송 실패:', error);
      return false;
    }
  }
}

// SMS 서비스 인터페이스
export interface SMSService {
  sendSMS(to: string, message: string): Promise<boolean>;
}

// Twilio SMS 서비스
export class TwilioSMSService implements SMSService {
  private accountSid: string | undefined;
  private authToken: string | undefined;
  private phoneNumber: string | undefined;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.phoneNumber = process.env.TWILIO_PHONE_NUMBER;
  }

  async sendSMS(to: string, message: string): Promise<boolean> {
    if (!this.accountSid || !this.authToken || !this.phoneNumber) {
      console.log('Twilio 설정이 없어 SMS를 콘솔로 출력합니다:');
      console.log(`TO: ${to}`);
      console.log(`MESSAGE: ${message}`);
      return true;
    }

    try {
      const twilio = require('twilio');
      const client = twilio(this.accountSid, this.authToken);
      
      await client.messages.create({
        body: message,
        from: this.phoneNumber,
        to: to
      });
      
      return true;
    } catch (error) {
      console.error('Twilio SMS 발송 실패:', error);
      return false;
    }
  }
}

// NHN Toast SMS 서비스 (한국 SMS 서비스)
export class ToastSMSService implements SMSService {
  private appKey: string | undefined;
  private secretKey: string | undefined;
  private sendNumber: string | undefined;

  constructor() {
    this.appKey = process.env.TOAST_SMS_APP_KEY;
    this.secretKey = process.env.TOAST_SMS_SECRET_KEY;
    this.sendNumber = process.env.TOAST_SMS_SEND_NUMBER;
  }

  async sendSMS(to: string, message: string): Promise<boolean> {
    if (!this.appKey || !this.secretKey || !this.sendNumber) {
      console.log('Toast SMS 설정이 없어 SMS를 콘솔로 출력합니다:');
      console.log(`TO: ${to}`);
      console.log(`MESSAGE: ${message}`);
      return true;
    }

    try {
      const response = await fetch(`https://api-sms.cloud.toast.com/sms/v3.0/appKeys/${this.appKey}/sender/sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Secret-Key': this.secretKey
        },
        body: JSON.stringify({
          body: message,
          sendNo: this.sendNumber,
          recipientList: [{
            recipientNo: to,
            internationalRecipientNo: to
          }]
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Toast SMS 발송 실패:', error);
      return false;
    }
  }
}

// 인증 코드 생성 및 관리
export class AuthCodeManager {
  // 6자리 랜덤 숫자 코드 생성
  static generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // 보안 토큰 생성 (비밀번호 재설정용)
  static generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // 만료 시간 계산 (분 단위)
  static getExpiryTime(minutes: number): Date {
    const now = new Date();
    now.setMinutes(now.getMinutes() + minutes);
    return now;
  }

  // 이메일 템플릿
  static getEmailTemplate(code: string, purpose: string): { subject: string; content: string } {
    const templates = {
      password_reset: {
        subject: '[AMUSEFIT] 비밀번호 재설정 인증 코드',
        content: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>비밀번호 재설정</h2>
            <p>비밀번호 재설정을 위한 인증 코드입니다:</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0;">
              ${code}
            </div>
            <p>이 코드는 10분간 유효합니다.</p>
            <p>본인이 요청하지 않았다면 이 이메일을 무시해주세요.</p>
          </div>
        `
      },
      email_verify: {
        subject: '[AMUSEFIT] 이메일 인증 코드',
        content: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>이메일 인증</h2>
            <p>계정 등록을 완료하기 위한 인증 코드입니다:</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0;">
              ${code}
            </div>
            <p>이 코드는 10분간 유효합니다.</p>
          </div>
        `
      }
    };

    return templates[purpose as keyof typeof templates] || templates.password_reset;
  }

  // SMS 템플릿
  static getSMSTemplate(code: string, purpose: string): string {
    const templates = {
      password_reset: `[AMUSEFIT] 비밀번호 재설정 인증 코드: ${code} (10분 유효)`,
      phone_verify: `[AMUSEFIT] 휴대폰 인증 코드: ${code} (10분 유효)`
    };

    return templates[purpose as keyof typeof templates] || templates.password_reset;
  }
}

// 서비스 팩토리
export class AuthServiceFactory {
  static createEmailService(): EmailService {
    // 우선순위: Resend > Gmail > 콘솔 출력
    if (process.env.RESEND_API_KEY) {
      return new ResendEmailService();
    } else if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      return new GmailEmailService();
    } else {
      return new GmailEmailService(); // 콘솔 출력 모드
    }
  }

  static createSMSService(): SMSService {
    // 우선순위: Toast (한국) > Twilio > 콘솔 출력
    if (process.env.TOAST_SMS_APP_KEY) {
      return new ToastSMSService();
    } else if (process.env.TWILIO_ACCOUNT_SID) {
      return new TwilioSMSService();
    } else {
      return new TwilioSMSService(); // 콘솔 출력 모드
    }
  }
}