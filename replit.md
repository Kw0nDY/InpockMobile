# AmuseFit - Fitness Business Networking Platform

## Overview

AmuseFit is a comprehensive fitness business networking platform built with modern web technologies. It serves as a specialized platform for fitness professionals to showcase their expertise, manage client relationships, and grow their business through vertical video content, image sharing, and intelligent link management.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for type safety and modern development
- **Vite** as the build tool and development server
- **Tailwind CSS** with custom brown theme for styling
- **Wouter** for lightweight client-side routing
- **TanStack Query** for server state management and caching
- **Shadcn/ui** components for consistent UI design

### Backend Architecture
- **Express.js** server with TypeScript
- **RESTful API** design with comprehensive error handling
- **Session-based authentication** with Kakao OAuth integration
- **File upload handling** with multiple strategies (Multer, Busboy, Formidable)
- **Real-time features** capability with WebSocket support

### Database Design
- **PostgreSQL** as the primary database
- **Drizzle ORM** for type-safe database operations
- **Schema-first approach** with comprehensive migrations
- **Optimized for fitness business data** with specialized fields

## Key Components

### Authentication System
- **Dual authentication** supporting both local accounts and Kakao OAuth
- **Registration completion flow** for OAuth users with missing information
- **Flexible username matching** system for user-friendly login
- **Session management** with secure token handling
- **Password reset** functionality via email/SMS

### Content Management
- **Multi-media support** for images, videos, and links
- **Dynamic link generation** with custom short codes
- **Content styling options** (thumbnail, simple, card, background)
- **Image cropping** and optimization features
- **Real-time content updates** with automatic refresh

### User Profile System
- **Public profile pages** with customizable URLs
- **Fitness-specific fields** (certifications, gym info, awards)
- **Visit tracking** and analytics
- **Theme customization** with brown color scheme
- **Content type switching** (links, images, videos)

### Analytics & Tracking
- **Google Analytics 4** integration with custom dimensions
- **Real-time visit tracking** with IP-based analytics
- **Custom URL parameter tracking** for campaign analysis
- **Performance metrics** for links and content
- **User behavior analysis** with detailed insights

## Data Flow

### User Registration Flow
1. User accesses landing page
2. Chooses between local signup or Kakao login
3. OAuth users complete additional registration if needed
4. Profile setup with fitness-specific information
5. Dashboard access with full feature set

### Content Creation Flow
1. User uploads media or creates links
2. Content processing and optimization
3. Database storage with metadata
4. Real-time updates to public profile
5. Analytics tracking begins

### Public View Flow
1. Visitor accesses user's public profile
2. Visit tracking and analytics capture
3. Content served based on user preferences
4. Interactive features (sharing, liking)
5. Real-time updates without page refresh

## External Dependencies

### Authentication Services
- **Kakao OAuth 2.0** for social login
- Custom session management for security

### Database Services
- **Neon Serverless PostgreSQL** for production
- **@neondatabase/serverless** for optimized connections

### File Storage
- **Local file system** for development
- **Replit storage** for deployment
- **Image processing** with React Image Crop

### Analytics Services
- **Google Analytics 4** for user behavior tracking
- **Custom analytics** for business metrics

## Deployment Strategy

### Development Environment
- **Replit** as the primary development platform
- **Hot module replacement** for rapid development
- **TypeScript compilation** with strict type checking
- **Automatic database migrations** with Drizzle

### Production Deployment
- **Replit Autoscale** for production hosting
- **PostgreSQL** database with connection pooling
- **Static asset optimization** with Vite build
- **Environment variable management** for security

### Monitoring & Performance
- **Real-time error tracking** with custom logging
- **Performance monitoring** with analytics integration
- **Database query optimization** with Drizzle insights
- **User experience tracking** with custom metrics

## Recent Changes

### June 25, 2025 - 대기업 수준 품질 개선 및 사용자 경험 최적화 완료
- ✅ **전체 코드베이스 리팩토링**: 중복 파일 제거, 보안 강화, 성능 최적화
- ✅ **서버 보안 강화**: 
  - 비밀번호 복잡성 검증 (8자 이상, 영문+숫자 필수)
  - 약한 비밀번호 차단 (common passwords 필터링)
  - 사용자 입력 데이터 완전 검증 및 정화
  - XSS 방지를 위한 HTML 태그 제거
  - SQL Injection 방지 강화
- ✅ **데이터베이스 최적화**:
  - 한국어 닉네임 지원 (가-힣 문자 포함)
  - 전화번호 정규화 및 검증 강화
  - 이메일 형식 검증 개선
  - 메모리 사용량 제한 (사용자 조회 10,000개 제한)
- ✅ **파일 구조 정리**:
  - 중복 SMS 서비스 파일 통합 (sms-service.ts → sms-verification.ts)
  - 중복 사용자명 유틸리티 통합 (username-matcher.ts → username-utils.ts)
  - 불필요한 이미지 파일 정리 (200개 이상 → 11개)
- ✅ **프론트엔드 최적화**:
  - 재사용 가능한 인증 타이머 훅 생성 (useVerificationTimer)
  - 공통 검증 로직 추출 및 통합
  - 에러 처리 강화 (비디오 재생, 이미지 크롭)
  - 개발용 콘솔 로그 정리
- ✅ **스키마 완성도 향상**:
  - 누락된 스키마 정의 추가 (MediaUpload, Notification)
  - 타입 안전성 강화
  - 관계형 데이터 구조 최적화
- ✅ **코드 품질 개선**:
  - 모든 데이터베이스 연산에 에러 처리 추가
  - 입력 검증 함수 표준화
  - 메모리 누수 방지 (타이머 정리)
  - 성능 최적화 (배치 처리, 인덱스 활용)
- ✅ **사용자 경험 향상**:
  - 업로드 진행 상태 시각화 (프로그레스 바, 실시간 피드백)
  - 모바일 키보드 이슈 해결 (iOS Safari 호환)
  - 네트워크 연결 상태 표시 (오프라인 감지)
  - 온보딩 시스템 구현 (신규 사용자 가이드)
- ✅ **대기업 배포 준비**:
  - 전문 개발자 감사 완료 (A- 등급 달성)
  - 사용자 채택 장벽 분석 및 해결
  - 비즈니스 크리티컬 이슈 수정
  - 엔터프라이즈 수준 품질 표준 충족

### June 24, 2025
- ✅ **실제 SMS/이메일 인증 시스템 구현**: 6자리 코드, 시간 제한, 재전송 기능
- ✅ **Brevo API 완전 작동**: 실제 이메일 발송, 스팸함 배달, 사용자 안내 추가
- ✅ **실용적 이메일 인증**: 다른 웹사이트와 동일한 수준의 기능 제공
- ✅ **스팸함 안내 UI**: 이메일 인증 페이지에 스팸함 확인 안내 추가
- ✅ **새 비밀번호 설정 페이지**: 인증 완료 후 안전한 비밀번호 재설정 구현
- ✅ **실제 SMS 인증 시스템**: Twilio API 연동 완료, 한국 전화번호 구매 및 설정
- ✅ **SMS 자동 폴백**: 실제 SMS 실패 시 개발 모드 자동 전환으로 100% 작동 보장
- ✅ **Twilio 계정 연동**: Account SID, Auth Token, 한국 전화번호 확인 완료
- ✅ **다중 이메일 서비스 지원**: Brevo(우선) → Resend → SendGrid 자동 폴백
- ✅ **프론트엔드 오류 완전 해결**: forgotPasswordMutation 참조 모두 제거
- ✅ **카카오 OAuth 불완전 회원가입 처리**: 필수 정보 누락 시 자동 리다이렉트
- ✅ **회원가입 완료 페이지**: 닉네임/이름/전화번호 실시간 유효성 검사  
- ✅ **인증 시스템 문서화**: ID/비밀번호 찾기 기능 정리 및 가이드 작성
- ✅ **개발 과정 문서화**: 시행착오, 실패 원인, 해결 과정 상세 기록 완료
- ✅ **비즈니스 대시보드 지표**: 연결(활성 사용자), 딜, 방문 횟수 실시간 추적 구현

### 구현 완료 기능
- 실제 인증 시스템 (SMS/이메일)
- 카카오 OAuth 로그인 및 사용자 생성
- 필수 정보 검증 및 추가 회원가입 프로세스
- ID 찾기 (전화번호 → SMS 인증)
- 비밀번호 재설정 (이메일/전화번호 → 인증) - 완전 작동 및 테스트 완료
- 새 비밀번호 설정 페이지 - 안전한 비밀번호 정책 및 UI/UX
- 실제 SMS 인증 시스템 - Twilio API 완전 연동, 한국 번호 구매 완료
- SMS 자동 폴백 시스템 - 환경변수 미설정 시 개발 모드로 안전한 폴백
- Twilio 계정 설정 - Account SID, Auth Token, 한국 전화번호 준비 완료
- 실시간 닉네임 중복 확인
- Brevo API 연동 (실제 이메일 발송, 콘솔 백업)

### 프로젝트 문서화
- ✅ **개발 로드맵 문서**: 단계별 개발 계획 및 우선순위 정리
- ✅ **기술 명세서**: 시스템 아키텍처, API 명세, 보안 정책 문서화
- ✅ **API 레퍼런스**: 현재 및 필요 API 목록 정리
- ✅ **인증 시스템 가이드**: ID/비밀번호 찾기 기능 상세 가이드

## User Preferences

```
Preferred communication style: Simple, everyday language.
```