# SMS/이메일 API 통합 가이드

## 현재 상황

현재 인증 시스템은 **개발용 목 시스템**으로 구현되어 있습니다:
- SMS/이메일 인증번호가 **콘솔에 출력**됨
- 실제 SMS/이메일 발송은 하지 않음
- 개발 및 테스트 단계에서는 완전히 작동

## 실제 서비스를 위한 API 통합 방법

### 1. SMS 발송 서비스 선택

#### 한국 서비스 (추천)
**NHN Cloud SMS**
- 비용: 건당 8원~12원
- 월 최소 사용량: 없음
- 장점: 한국 통신사 직접 연동, 안정적
- 설정: 간단한 REST API

**알리고 (Aligo)**
- 비용: 건당 8원~15원
- 월 최소 사용량: 10,000원
- 장점: 국내 업체, 한국어 지원 완벽

#### 국제 서비스
**Twilio**
- 비용: 건당 약 100원
- 장점: 글로벌 서비스, 안정적
- 단점: 한국 SMS 비용이 높음

### 2. 이메일 발송 서비스 선택

#### 완전 무료 서비스들 (추천)
**Brevo (구 Sendinblue)**
- 무료: 월 300통, 일 한도 없음
- 장점: SendGrid보다 3배 많음, 한국어 지원
- 설정: 매우 간단한 API

**Mailgun**
- 무료: 월 5,000통 (첫 3개월)
- 이후: 월 1,000통 무료
- 장점: 개발자 친화적, 검증 없이 사용 가능

**Resend**
- 무료: 월 3,000통, 일 100통
- 장점: 현대적 API, 개발자 경험 최고
- 단점: 상대적으로 신생 서비스

#### 기존 서비스들
**SendGrid**
- 무료: 월 100통
- 유료: 월 $14.95부터
- 장점: 안정적, 좋은 전송률

**Amazon SES**
- 비용: 1000통당 $1
- 장점: AWS 생태계, 저렴
- 단점: 초기 설정 복잡, 도메인 인증 필요

## 구현 방법

### 1단계: API 키 설정

환경 변수에 API 키 추가:
```bash
# SMS 서비스 (NHN Cloud 예시)
NHN_SMS_ACCESS_KEY=your_access_key
NHN_SMS_SECRET_KEY=your_secret_key
NHN_SMS_SERVICE_ID=your_service_id
NHN_SMS_SENDER_PHONE=01012345678

# 또는 Twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# 이메일 서비스 (SendGrid 예시)
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=noreply@amusefit.com
```

### 2단계: 실제 API 구현

#### NHN Cloud SMS 구현 예시
```typescript
// server/sms-service.ts
import axios from 'axios';

export async function sendRealSms(phone: string, code: string): Promise<boolean> {
  try {
    const timestamp = Date.now().toString();
    const signature = generateSignature(timestamp); // HMAC 서명 생성
    
    const response = await axios.post(
      `https://sens.apigw.ntruss.com/sms/v2/services/${process.env.NHN_SMS_SERVICE_ID}/messages`,
      {
        type: 'SMS',
        from: process.env.NHN_SMS_SENDER_PHONE,
        content: `[AmuseFit] 인증번호: ${code}`,
        messages: [{ to: phone }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-ncp-apigw-timestamp': timestamp,
          'x-ncp-iam-access-key': process.env.NHN_SMS_ACCESS_KEY,
          'x-ncp-apigw-signature-v2': signature
        }
      }
    );
    
    return response.status === 202;
  } catch (error) {
    console.error('SMS 발송 실패:', error);
    return false;
  }
}
```

#### SendGrid 이메일 구현 예시
```typescript
// server/email-service.ts
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendRealEmail(email: string, code: string): Promise<boolean> {
  try {
    const msg = {
      to: email,
      from: process.env.FROM_EMAIL!,
      subject: '[AmuseFit] 인증번호',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f59e0b;">AmuseFit 인증번호</h2>
          <p>요청하신 인증번호입니다:</p>
          <div style="background: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #f59e0b; font-size: 32px; margin: 0;">${code}</h1>
          </div>
          <p>이 인증번호는 10분간 유효합니다.</p>
          <hr>
          <small style="color: #6b7280;">본 메일은 발신전용입니다.</small>
        </div>
      `
    };
    
    await sgMail.send(msg);
    return true;
  } catch (error) {
    console.error('이메일 발송 실패:', error);
    return false;
  }
}
```

### 3단계: 기존 코드 업데이트

`server/sms-verification.ts`와 `server/email-verification.ts`에서:

```typescript
// 개발/프로덕션 환경 분기
export async function sendSmsCode(phone: string, purpose: 'find_id' | 'reset_password') {
  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  
  // 인증번호 저장
  const key = `${phone}-${purpose}`;
  verificationCodes.set(key, { phone, code, purpose, expiresAt, attempts: 0, verified: false });

  if (process.env.NODE_ENV === 'production') {
    // 실제 SMS 발송
    const success = await sendRealSms(phone, code);
    return { success, message: success ? "인증번호가 발송되었습니다." : "발송에 실패했습니다." };
  } else {
    // 개발 환경: 콘솔 출력
    console.log(`📱 SMS 인증번호: ${code} (${phone})`);
    return { success: true, message: "인증번호가 발송되었습니다." };
  }
}
```

## 비용 계산

### 예상 사용량 기준 (월간)
- 일일 가입자: 100명
- 아이디/비밀번호 찾기: 200회
- 총 SMS: 9,000건/월
- 총 이메일: 6,000건/월

### 비용 예상
**NHN Cloud SMS + SendGrid 조합:**
- SMS: 9,000건 × 10원 = 90,000원
- 이메일: SendGrid $14.95 = 약 20,000원
- **월 총비용: 약 110,000원**

**Twilio + Amazon SES 조합:**
- SMS: 9,000건 × 100원 = 900,000원
- 이메일: 6,000건 × $0.001 = $6 = 약 8,000원
- **월 총비용: 약 908,000원**

## 권장 방법

### 즉시 적용 가능한 방법
1. **SendGrid 무료 플랜** 먼저 적용
   - 월 100통까지 무료
   - 이메일 인증부터 시작

2. **NHN Cloud SMS** 테스트 계정 생성
   - 무료 크레딧으로 테스트 가능
   - 실제 서비스 런칭 시 적용

### 단계별 적용 계획
1. **1단계**: 이메일 인증만 실제 API로 전환
2. **2단계**: SMS 인증도 실제 API로 전환
3. **3단계**: 사용량 모니터링 및 최적화

## 현재 코드의 장점

현재 구현의 **좋은 점**:
- API 교체가 매우 쉬움
- 개발/테스트 환경에서 완전 작동
- 인증 로직과 발송 로직이 분리됨
- 환경 변수로 쉽게 전환 가능

실제 서비스 런칭 시 API 키만 추가하고 함수 몇 개만 교체하면 됩니다!

## 다음 단계

어떤 API 서비스를 우선적으로 연동하고 싶으신가요?
1. SendGrid (이메일) - 무료로 바로 테스트 가능
2. NHN Cloud SMS - 한국 SMS에 최적화
3. 둘 다 한번에 설정