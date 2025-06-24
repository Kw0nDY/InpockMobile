// Nodemailer 폴백 시스템 추가
const fs = require('fs');
const path = require('path');

const nodemailerFallback = `
// Nodemailer 폴백 (Gmail SMTP)
async function sendNodemailerEmail(email: string, code: string): Promise<boolean> {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    return false;
  }

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
      from: \`"AmuseFit 인증" <\${process.env.GMAIL_USER}>\`,
      to: email,
      subject: '🔐 AmuseFit 계정 인증번호',
      html: \`
        <div style="max-width: 500px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #8B4513; margin: 0;">AmuseFit</h1>
            <p style="color: #666; margin: 5px 0;">피트니스 비즈니스 플랫폼</p>
          </div>
          
          <div style="background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 30px; text-align: center;">
            <h2 style="color: #495057; margin: 0 0 20px 0;">계정 인증번호</h2>
            <div style="background: #ffffff; border: 2px solid #8B4513; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #8B4513; letter-spacing: 6px;">\${code}</span>
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
      \`,
      text: \`AmuseFit 계정 인증번호: \${code}\\n\\n이 번호는 10분간 유효합니다.\\n\\n본인이 요청하지 않았다면 무시하세요.\`
    };

    await transporter.sendMail(mailOptions);
    console.log(\`✅ Nodemailer 이메일 발송 성공: \${email}\`);
    return true;
  } catch (error) {
    console.log(\`❌ Nodemailer 이메일 발송 실패:\`, error.message);
    return false;
  }
}`;

// 기존 파일에 함수 추가
const emailFilePath = path.join(__dirname, 'server', 'email-verification.ts');
let content = fs.readFileSync(emailFilePath, 'utf8');

// sendBrevoEmail 함수 뒤에 추가
const insertPoint = content.indexOf('// Resend 이메일 발송');
if (insertPoint !== -1) {
  content = content.slice(0, insertPoint) + nodemailerFallback + '\n\n' + content.slice(insertPoint);
  fs.writeFileSync(emailFilePath, content);
  console.log('✅ Nodemailer 폴백 시스템 추가 완료');
} else {
  console.log('❌ 삽입 위치를 찾을 수 없습니다');
}