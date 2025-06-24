# AmuseFit API 레퍼런스

## 현재 구현된 API 목록

### 인증 관련 API

#### 기본 인증
- `POST /api/auth/login` - 로컬 계정 로그인
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/logout` - 로그아웃
- `GET /api/auth/me` - 현재 사용자 정보 조회

#### 사용자명/비밀번호 찾기
- `POST /api/auth/find-id` - ID 찾기 (전화번호 기반)
- `POST /api/auth/forgot-password` - 비밀번호 재설정 요청
- `GET /api/auth/verify-reset-token/:token` - 재설정 토큰 검증
- `POST /api/auth/reset-password` - 비밀번호 재설정

#### 회원가입 완료 프로세스
- `POST /api/auth/check-username` - 사용자명 중복 확인
- `POST /api/auth/check-nickname` - 닉네임 중복 확인
- `POST /api/auth/complete-registration` - 회원가입 완료
- `GET /api/auth/check-registration/:userId` - 회원가입 완성도 확인

#### 카카오 OAuth
- `GET /api/auth/kakao` - 카카오 로그인 시작
- `GET /oauth/kakao/callback` - 카카오 콜백 처리
- `POST /api/auth/kakao/token` - 카카오 토큰 교환

### 컨텐츠 관리 API

#### 링크 관리
- `GET /api/links/:userId` - 사용자 링크 목록
- `POST /api/links` - 링크 생성
- `PUT /api/links/:id` - 링크 수정
- `DELETE /api/links/:id` - 링크 삭제
- `GET /api/links/:id/stats` - 링크 통계

#### 미디어 업로드
- `POST /api/upload/profile` - 프로필 이미지 업로드
- `POST /api/media-upload` - 일반 미디어 업로드
- `GET /uploads/:filename` - 업로드된 파일 조회

#### 미디어 관리
- `GET /api/media/:userId` - 사용자 미디어 목록
- `POST /api/media` - 미디어 생성
- `PUT /api/media/:id` - 미디어 수정
- `DELETE /api/media/:id` - 미디어 삭제

### 사용자 프로필 API

#### 프로필 관리
- `GET /api/user/:userId` - 사용자 프로필 조회
- `PUT /api/user/:userId` - 사용자 프로필 수정
- `GET /api/profile/:identifier` - 공개 프로필 조회

#### 설정 관리
- `GET /api/user/:userId/settings` - 사용자 설정 조회
- `PUT /api/user/:userId/settings` - 사용자 설정 수정
- `GET /api/profile/:identifier/settings` - 공개 프로필 설정

### 통계/분석 API

#### 대시보드 통계
- `GET /api/dashboard/stats/:userId` - 대시보드 통계
- `GET /api/user/:userId/link-stats` - 사용자 링크 통계

#### 방문 추적
- `POST /api/track-visit` - 방문 추적
- `GET /api/analytics/:userId` - 분석 데이터

### 알림 API

#### 알림 관리
- `GET /api/notifications/:userId` - 사용자 알림 목록
- `GET /api/notifications/:userId/unread-count` - 읽지 않은 알림 수
- `POST /api/notifications/:id/read` - 알림 읽음 처리

### 유틸리티 API

#### 메타데이터
- `POST /api/url-metadata` - URL 메타데이터 가져오기

#### 디버그
- `GET /test/oauth/config` - OAuth 설정 확인
- `GET /api/debug/users` - 사용자 디버그 정보

## 미구현 또는 필요한 API

### 1. 실시간 인증 API (우선순위: 높음)
```
POST /api/auth/send-sms-code - SMS 인증번호 발송
POST /api/auth/verify-sms-code - SMS 인증번호 확인
POST /api/auth/send-email-code - 이메일 인증번호 발송
POST /api/auth/verify-email-code - 이메일 인증번호 확인
```

### 2. 고급 사용자 관리 API (우선순위: 중간)
```
POST /api/user/block - 사용자 차단
POST /api/user/unblock - 사용자 차단 해제
GET /api/user/:userId/followers - 팔로워 목록
GET /api/user/:userId/following - 팔로잉 목록
POST /api/user/:userId/follow - 팔로우
DELETE /api/user/:userId/follow - 언팔로우
```

### 3. 고급 컨텐츠 API (우선순위: 중간)
```
POST /api/content/share - 컨텐츠 공유
POST /api/content/like - 좋아요
DELETE /api/content/like - 좋아요 취소
POST /api/content/comment - 댓글 작성
GET /api/content/:id/comments - 댓글 목록
```

### 4. 검색 및 필터링 API (우선순위: 낮음)
```
GET /api/search/users - 사용자 검색
GET /api/search/content - 컨텐츠 검색
GET /api/content/trending - 인기 컨텐츠
GET /api/content/recent - 최신 컨텐츠
```

### 5. 관리자 API (우선순위: 낮음)
```
GET /api/admin/users - 사용자 관리
GET /api/admin/stats - 전체 통계
POST /api/admin/user/:id/suspend - 사용자 정지
POST /api/admin/content/:id/moderate - 컨텐츠 검토
```

### 6. 마케팅/비즈니스 API (우선순위: 낮음)
```
POST /api/subscription/create - 구독 생성
GET /api/subscription/plans - 구독 플랜 목록
POST /api/payment/process - 결제 처리
GET /api/analytics/revenue - 수익 분석
```

## API 보안 및 인증

### 현재 인증 방식
- 세션 기반 인증 (`req.session.userId`)
- 카카오 OAuth 2.0

### 필요한 보안 강화
1. **JWT 토큰** - 확장성을 위한 토큰 기반 인증
2. **API 속도 제한** - DDoS 방지
3. **CORS 설정** - 도메인 기반 접근 제어
4. **입력 검증** - 모든 API 입력 데이터 검증
5. **로깅 시스템** - API 사용 추적

## 다음 우선순위

### 즉시 필요 (1주 내)
1. SMS/이메일 인증번호 API 구현
2. 세션 관리 오류 수정
3. API 입력 검증 강화

### 단기 목표 (1개월 내)
1. 고급 사용자 관리 기능
2. 컨텐츠 상호작용 API
3. 보안 강화

### 장기 목표 (3개월 내)
1. 검색 및 추천 시스템
2. 마케팅 도구 API
3. 관리자 도구