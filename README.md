# 🏋️‍♂️ AmuseFit - 피트니스 전문가 플랫폼

피트니스 전문가들을 위한 종합 비즈니스 네트워킹 플랫폼

## ✨ 주요 기능

### 📱 모바일 최적화
- Instagram Reels 스타일의 세로형 콘텐츠
- 터치 친화적 인터페이스
- PWA 수준의 모바일 경험

### 🎥 멀티미디어 포트폴리오
- 운동 동영상 업로드 및 관리
- Before/After 이미지 갤러리
- 외부 링크 통합 관리
- 드래그 앤 드롭 순서 변경

### 📊 비즈니스 도구
- 실시간 방문자 분석
- 링크 클릭 추적
- 수익 및 성과 대시보드
- 고객 관계 관리(CRM)

### 🔐 강력한 인증 시스템
- 카카오 OAuth 소셜 로그인
- SMS 본인인증 (Twilio 연동)
- 이메일 인증 (Brevo API)
- ID/비밀번호 찾기 기능

### 🎨 전문 디자인
- 브라운 테마 디자인 시스템
- Noto Sans KR 폰트로 한국어 최적화
- 반응형 레이아웃
- 부드러운 애니메이션

## 🛠️ 기술 스택

### Frontend
- **React 18** + TypeScript
- **Tailwind CSS** + Shadcn/ui
- **TanStack Query** (서버 상태 관리)
- **Wouter** (라우팅)
- **Framer Motion** (애니메이션)

### Backend
- **Express.js** + TypeScript
- **PostgreSQL** + Drizzle ORM
- **Session 기반 인증**
- **파일 업로드** (Multer, Busboy)

### 외부 서비스
- **Neon Database** (PostgreSQL 호스팅)
- **Kakao OAuth** (소셜 로그인)
- **Twilio** (SMS 인증)
- **Brevo** (이메일 발송)
- **Google Analytics 4** (분석)

## 📄 페이지 구성

### 인증 페이지
- 랜딩 페이지
- 로그인/회원가입 (2단계)
- ID/비밀번호 찾기
- SMS/이메일 인증

### 메인 기능
- 대시보드 (비즈니스 지표)
- 링크 관리
- 이미지 갤러리
- 동영상 포트폴리오
- 설정 페이지
- 분석 대시보드

### 비즈니스 도구
- 마켓플레이스
- 매니저 페이지
- 공개 프로필 (고객용)

## 🚀 로컬 실행 방법

```bash
# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env
# .env 파일에 필요한 키들을 입력하세요

# 데이터베이스 스키마 푸시
npm run db:push

# 개발 서버 시작
npm run dev
```

## 🔧 필요한 환경변수

```bash
# 데이터베이스
DATABASE_URL=postgresql://...

# 카카오 OAuth
KAKAO_CLIENT_ID=your_kakao_client_id
KAKAO_CLIENT_SECRET=your_kakao_client_secret

# SMS 인증 (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number

# 이메일 (Brevo)
BREVO_API_KEY=your_brevo_key

# 세션 암호화
SESSION_SECRET=your_session_secret
```

## 📊 프로젝트 현황

### 개발 완료 기능 (✅)
- 전체 페이지 구현 (15개 페이지)
- 실제 SMS/이메일 인증 시스템
- 카카오 OAuth 로그인
- 파일 업로드 및 관리
- 실시간 분석 시스템
- 공개 프로필 페이지

### 아키텍처 특징
- 타입 안전성 (TypeScript 100% 적용)
- 모바일 퍼스트 반응형 디자인
- RESTful API 설계
- 세션 기반 보안 인증
- 실시간 데이터 동기화

## 📈 비즈니스 모델

AmuseFit은 피트니스 전문가들이 온라인에서 자신의 전문성을 어필하고 고객을 관리할 수 있는 올인원 플랫폼입니다:

- **개인 브랜딩**: 전문적인 프로필 페이지
- **고객 관리**: CRM 및 예약 시스템
- **성과 분석**: 방문자 추적 및 비즈니스 인사이트
- **마케팅 도구**: 소셜 미디어 연동 및 링크 관리

## 🏆 차별화 요소

1. **피트니스 특화**: 업계 전문 기능들
2. **모바일 최우선**: Instagram 스타일 UX
3. **실제 인증**: 허위 정보 방지
4. **한국 시장 최적화**: 카카오 로그인, 한국어 지원

## 📞 문의

프로젝트에 대한 문의사항이나 협업 제안은 GitHub Issues를 통해 연락해주세요.
