# AmuseFit 개발 로드맵

## 프로젝트 현황 (2025년 6월 24일 기준)

### 구현 완료 기능 ✅

#### 인증 시스템
- **로컬 계정 인증**: 사용자명/비밀번호 로그인
- **카카오 OAuth**: 소셜 로그인 및 자동 사용자 생성
- **불완전 회원가입 처리**: 필수 정보 누락 시 자동 리다이렉트
- **ID 찾기**: 전화번호 기반 사용자명 검색
- **비밀번호 재설정**: 토큰 기반 재설정 시스템 (이메일/SMS 발송 제외)

#### 사용자 관리
- **프로필 시스템**: 공개/비공개 프로필 관리
- **회원가입 완료**: 실시간 닉네임 중복 확인, 유효성 검사
- **사용자 설정**: 테마, 레이아웃, 표시 옵션
- **방문 추적**: IP 기반 방문자 통계

#### 컨텐츠 관리
- **링크 관리**: CRUD, 단축링크, 클릭 통계
- **미디어 업로드**: 이미지/동영상 업로드 및 관리
- **공개 프로필**: 사용자별 컨텐츠 공개 페이지
- **URL 메타데이터**: 링크 미리보기 정보 자동 수집

#### 분석 및 알림
- **대시보드**: 통계 및 분석 데이터
- **실시간 알림**: 프로필 방문, 활동 알림
- **Google Analytics**: 방문자 추적 및 분석

### 현재 해결 필요한 문제 🔧

#### 세션 관리 오류
- **문제**: 카카오 로그인 후 세션 설정 실패
- **증상**: `Cannot set properties of undefined (setting 'userId')`
- **원인**: Express 세션 미들웨어 설정 부족
- **해결 방안**: session 미들웨어 우선 등록 필요

#### 인증 기능 미완성
- **SMS 발송**: ID 찾기, 비밀번호 재설정에 실제 SMS 없음
- **이메일 발송**: 비밀번호 재설정에 실제 이메일 없음
- **인증번호 확인**: 6자리 코드 확인 시스템 없음

## 우선순위별 개발 계획

### 1단계: 핵심 문제 해결 (1주 내)

#### A. 세션 관리 수정 (긴급)
```typescript
// server/index.ts에 session 미들웨어 추가
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true, maxAge: 24*60*60*1000 }
}));
```

#### B. SMS 인증 시스템 구현 (높음)
**필요 API:**
- `POST /api/auth/send-sms-code` - SMS 인증번호 발송
- `POST /api/auth/verify-sms-code` - SMS 인증번호 확인

**추천 서비스:**
- **한국**: NHN Cloud SMS, 알리고
- **국제**: Twilio

**구현 내용:**
- 6자리 랜덤 코드 생성
- 5분 유효시간 설정
- 3회 시도 제한
- 데이터베이스에 인증 코드 저장

#### C. 이메일 인증 시스템 구현 (높음)
**필요 API:**
- `POST /api/auth/send-email-code` - 이메일 인증번호 발송
- `POST /api/auth/verify-email-code` - 이메일 인증번호 확인

**추천 서비스:**
- SendGrid, Amazon SES, Mailgun

### 2단계: 보안 강화 (2주 내)

#### API 보안 시스템
- **속도 제한**: IP별 API 호출 제한 (express-rate-limit)
- **입력 검증**: 모든 API 입력 데이터 Zod 스키마 검증
- **로깅 시스템**: API 사용 추적 및 오류 로깅
- **CORS 설정**: 도메인 기반 접근 제어

#### 인증 강화
- **JWT 토큰**: 확장성을 위한 토큰 기반 인증 (선택사항)
- **계정 보안**: 연속 로그인 실패 시 계정 잠금
- **세션 보안**: 안전한 세션 관리 및 만료 처리

### 3단계: 고급 기능 개발 (1개월 내)

#### 소셜 기능
**필요 API:**
```
POST /api/user/:userId/follow - 팔로우
DELETE /api/user/:userId/follow - 언팔로우
GET /api/user/:userId/followers - 팔로워 목록
GET /api/user/:userId/following - 팔로잉 목록
POST /api/content/like - 좋아요
DELETE /api/content/like - 좋아요 취소
POST /api/content/comment - 댓글 작성
GET /api/content/:id/comments - 댓글 목록
```

#### 고급 컨텐츠 관리
```
POST /api/content/share - 컨텐츠 공유
GET /api/content/trending - 인기 컨텐츠
GET /api/content/recent - 최신 컨텐츠
GET /api/search/users - 사용자 검색
GET /api/search/content - 컨텐츠 검색
```

### 4단계: 플랫폼 확장 (3개월 내)

#### 관리자 도구
```
GET /api/admin/users - 사용자 관리
GET /api/admin/stats - 전체 통계
POST /api/admin/user/:id/suspend - 사용자 정지
POST /api/admin/content/:id/moderate - 컨텐츠 검토
GET /api/admin/logs - 시스템 로그
```

#### 마케팅 및 수익화
```
POST /api/subscription/create - 구독 생성
GET /api/subscription/plans - 구독 플랜 목록
POST /api/payment/process - 결제 처리
GET /api/analytics/revenue - 수익 분석
POST /api/marketing/campaign - 마케팅 캠페인
```

## 기술 스택 확장 계획

### 현재 기술 스택
- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Express.js, TypeScript, Drizzle ORM
- **Database**: PostgreSQL (Neon)
- **Authentication**: 세션 기반 + 카카오 OAuth
- **Deployment**: Replit

### 추가 필요 기술

#### 외부 서비스 연동
- **SMS**: Twilio / NHN Cloud SMS / 알리고
- **Email**: SendGrid / Amazon SES
- **Payment**: 토스페이먼츠 / 아임포트
- **Storage**: AWS S3 (대용량 파일용)

#### 성능 및 확장성
- **Caching**: Redis (세션, 캐시)
- **CDN**: CloudFlare (정적 파일)
- **Monitoring**: Sentry (오류 추적)
- **Analytics**: Mixpanel (사용자 행동 분석)

#### 개발 도구
- **API Documentation**: Swagger/OpenAPI
- **Testing**: Jest, Cypress
- **CI/CD**: GitHub Actions
- **Code Quality**: ESLint, Prettier, Husky

## 데이터베이스 스키마 확장 계획

### 현재 테이블
- users, links, media_uploads, user_settings
- notifications, password_reset_tokens, subscriptions

### 추가 필요 테이블
```sql
-- 인증 관련
sms_verification_codes
email_verification_codes
login_attempts

-- 소셜 기능
user_follows
content_likes
content_comments
content_shares

-- 관리 및 로깅
admin_logs
api_usage_logs
content_reports

-- 마케팅 및 수익
subscription_plans
payment_transactions
marketing_campaigns
```

## 성능 최적화 계획

### 데이터베이스 최적화
- 인덱스 최적화 (사용자 검색, 컨텐츠 조회)
- 쿼리 최적화 (N+1 문제 해결)
- 연결 풀링 (커넥션 풀 크기 조정)

### 캐싱 전략
- API 응답 캐싱 (인기 컨텐츠, 사용자 프로필)
- 데이터베이스 쿼리 캐싱 (통계 데이터)
- 정적 파일 캐싱 (이미지, CSS, JS)

### 모니터링 및 측정
- API 응답 시간 모니터링
- 데이터베이스 성능 추적
- 사용자 경험 지표 (Core Web Vitals)

## 보안 강화 로드맵

### 데이터 보호
- 개인정보 암호화 (전화번호, 이메일)
- 파일 업로드 보안 (파일 타입 검증, 스캔)
- SQL 인젝션 방지 (Prepared Statements)

### 접근 제어
- 역할 기반 접근 제어 (RBAC)
- API 권한 관리 (스코프 기반)
- 컨텐츠 접근 권한 (공개/비공개)

### 규정 준수
- GDPR 준수 (유럽 사용자)
- 개인정보보호법 준수 (한국)
- 데이터 보관 정책 (로그 관리)

## 다음 단계 실행 계획

### 이번 주 목표
1. 세션 관리 오류 수정
2. SMS 인증 시스템 기본 구조 구현
3. API 입력 검증 강화

### 다음 주 목표
1. SMS/이메일 인증 완전 구현
2. 속도 제한 및 보안 강화
3. 오류 로깅 시스템 구축

### 이번 달 목표
1. 소셜 기능 기본 구현 (팔로우, 좋아요)
2. 검색 기능 구현
3. 관리자 도구 기초 구현