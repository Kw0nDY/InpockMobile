# SMS API 설정 가이드

AmuseFit에서 실제 SMS 인증을 사용하기 위한 SMS API 서비스 설정 가이드입니다.

## 지원하는 SMS 서비스

### 1. NHN Cloud SMS (토스트 클라우드) - 추천
**한국 최대 클라우드 서비스, 안정적이고 저렴**

#### 장점:
- 한국 기업, 한국어 지원
- 저렴한 요금 (건당 8원~)
- 안정적인 발송률
- 대량 발송 지원

#### 설정 방법:
1. [NHN Cloud 콘솔](https://console.nhncloud.com) 회원가입
2. SMS 서비스 활성화
3. 발신번호 등록 (승인 필요, 1-2일 소요)
4. 환경변수 설정:
```bash
NHN_SMS_SECRET_KEY=your_secret_key
SMS_SENDER_NUMBER=your_registered_number
```

#### 요금:
- SMS: 건당 8원
- LMS: 건당 24원
- 월 최소 사용료 없음

### 2. Twilio - 국제 서비스
**전 세계에서 가장 많이 사용되는 SMS API**

#### 장점:
- 전 세계 지원
- 개발자 친화적 API
- 상세한 문서
- 무료 체험 크레딧 제공

#### 설정 방법:
1. [Twilio 콘솔](https://console.twilio.com) 가입
2. 전화번호 구매 (월 $1)
3. 환경변수 설정:
```bash
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_number
```

#### 요금:
- SMS: 건당 약 150원 (한국 발송 시)
- 전화번호 월 사용료: $1

### 3. 알리고 - 한국 SMS 서비스
**한국 전문 SMS 서비스**

#### 장점:
- 한국 전문 서비스
- 저렴한 요금
- 간단한 API

#### 설정 방법:
1. [알리고](https://smartsms.aligo.in) 회원가입
2. 발신번호 등록
3. 환경변수 설정:
```bash
ALIGO_API_KEY=your_api_key
ALIGO_USER_ID=your_user_id
ALIGO_SENDER_NUMBER=your_sender_number
```

#### 요금:
- SMS: 건당 9원
- 선불제 충전 방식

## 환경변수 설정

Replit 시크릿에서 다음 환경변수를 설정하세요:

### NHN Cloud SMS 사용 시:
```
NHN_SMS_SECRET_KEY=your_nhn_secret_key
SMS_SENDER_NUMBER=01012345678
```

### Twilio 사용 시:
```
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+15551234567
```

### 알리고 사용 시:
```
ALIGO_API_KEY=your_api_key
ALIGO_USER_ID=your_user_id
ALIGO_SENDER_NUMBER=01012345678
```

## 자동 폴백 시스템

시스템은 다음 순서로 SMS 발송을 시도합니다:

1. **NHN Cloud SMS** (설정되어 있는 경우)
2. **Twilio** (NHN Cloud 실패 시)
3. **알리고** (Twilio 실패 시)
4. **개발 모드** (모든 서비스 실패 시 - 콘솔 출력)

## 추천 설정

### 개발/테스트 단계:
- 개발 모드 사용 (환경변수 설정 없음)
- 콘솔에서 인증번호 확인

### 실제 서비스 단계:
1. **NHN Cloud SMS** (한국 사용자 대상)
2. **Twilio** (국제 사용자 포함)

## 발신번호 등록 주의사항

### 한국 SMS 서비스 (NHN Cloud, 알리고):
- 발신번호 등록 필수
- 사업자등록증 또는 신분증 필요
- 승인까지 1-2일 소요
- 등록된 번호만 발신 가능

### Twilio:
- 구매한 전화번호 즉시 사용 가능
- 별도 승인 절차 없음

## 테스트 방법

환경변수 설정 후 다음 API로 테스트:

```bash
curl -X POST "http://localhost:5000/api/auth/send-sms-code" \
  -H "Content-Type: application/json" \
  -d '{"phone":"01012345678","purpose":"reset_password"}'
```

성공 시 실제 SMS가 발송되며, 실패 시 콘솔에 개발 모드 메시지가 출력됩니다.

## 보안 고려사항

1. **환경변수 보안**: API 키는 절대 코드에 하드코딩하지 말고 환경변수로 관리
2. **발송 제한**: 동일 번호에 대한 발송 빈도 제한 (현재 구현됨)
3. **번호 검증**: 유효한 한국 휴대폰 번호만 허용
4. **로그 관리**: 개인정보 보호를 위해 민감한 정보 로깅 제한

## 문제 해결

### 1. SMS 발송 실패
- 환경변수 확인
- API 키 유효성 확인
- 발신번호 등록 상태 확인
- 계정 잔액 확인

### 2. 발신번호 오류
- 발신번호가 올바르게 등록되었는지 확인
- 번호 형식 확인 (하이픈 제거)

### 3. 권한 오류
- API 키 권한 확인
- 계정 상태 확인

도움이 필요하면 각 서비스의 고객지원에 문의하세요.