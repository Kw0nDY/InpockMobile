# API Key 관리 및 배포 가이드

## 📋 API Key 목록 및 관리

### 현재 설정된 필수 API Keys

#### 1. 카카오 로그인 (OAuth)
- **KAKAO_CLIENT_ID**: 카카오 앱의 REST API 키
- **KAKAO_CLIENT_SECRET**: 카카오 앱의 시크릿 키
- **획득 방법**: 
  1. [카카오 개발자 콘솔](https://developers.kakao.com/) 접속
  2. 새 애플리케이션 생성
  3. 앱 설정 > 플랫폼 > Web 플랫폼 추가
  4. 카카오 로그인 활성화
  5. Redirect URI 설정: `https://your-domain.replit.app/oauth/kakao/callback`

#### 2. 세션 관리
- **SESSION_SECRET**: 세션 암호화를 위한 랜덤 문자열 (최소 32자)
- **생성 방법**: `openssl rand -base64 32` 또는 온라인 랜덤 생성기 사용

#### 3. 데이터베이스
- **DATABASE_URL**: PostgreSQL 연결 URL
- **형식**: `postgresql://username:password@host:port/database?sslmode=require`
- **관리**: Replit에서 자동 제공되지만, 외부 DB 사용 시 별도 설정 필요

### 선택적 API Keys (향후 확장용)

#### 4. Google Analytics (선택사항)
- **GOOGLE_ANALYTICS_ID**: GA4 측정 ID (G-XXXXXXXXXX)
- **용도**: 사용자 행동 분석 및 트래픽 모니터링

#### 5. OpenAI (선택사항)
- **OPENAI_API_KEY**: AI 기능 확장용
- **용도**: 콘텐츠 생성, 추천 시스템 등

## 🚀 배포 및 도메인 관리

### Replit 배포 시스템

#### 1. 기본 배포 도메인
- **자동 제공 도메인**: `your-project-name.replit.app`
- **SSL 인증서**: 자동 제공 및 갱신
- **CDN**: 글로벌 캐싱 자동 적용

#### 2. 커스텀 도메인 연결
```bash
# Replit에서 커스텀 도메인 설정 방법
1. Replit 프로젝트 > Deployments 탭
2. "Add custom domain" 클릭
3. 도메인 입력 (예: myfitnessapp.com)
4. DNS 설정: CNAME 레코드 추가
   - Name: @ (또는 www)
   - Value: your-project-name.replit.app
```

#### 3. 환경별 도메인 관리
- **개발**: `localhost:5000`
- **스테이징**: `staging-your-project.replit.app`
- **프로덕션**: `your-custom-domain.com` 또는 `your-project.replit.app`

## 📈 서버 관리 및 확장성

### 1. Replit 인프라 특징
- **자동 스케일링**: 트래픽에 따라 자동 확장
- **무중단 배포**: 코드 변경 시 자동 재배포
- **모니터링**: 기본 성능 메트릭 제공
- **백업**: 자동 데이터 백업 및 복구

### 2. 성능 최적화 전략

#### 데이터베이스 최적화
```sql
-- 인덱스 생성으로 쿼리 성능 향상
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_links_userid ON links(userId);
CREATE INDEX idx_media_userid_type ON media_uploads(userId, mediaType);
```

#### 캐싱 전략
- **세션 캐싱**: PostgreSQL 기반 세션 저장소
- **API 응답 캐싱**: TanStack Query로 클라이언트 캐싱
- **이미지 최적화**: WebP 변환 및 압축

### 3. 트래픽 증가 대응 방안

#### 단계별 확장 계획
1. **초기 (1-1000명)**: 기본 Replit 인프라
2. **성장기 (1000-10000명)**: 
   - 데이터베이스 연결 풀 최적화
   - CDN 활용도 증대
   - 이미지/동영상 외부 스토리지 검토
3. **확장기 (10000명+)**: 
   - 마이크로서비스 아키텍처 고려
   - 별도 미디어 서버 구축
   - 로드 밸런싱 적용

#### 모니터링 및 알림
```javascript
// 성능 모니터링 코드 예시
const performanceMetrics = {
  responseTime: Date.now() - startTime,
  memoryUsage: process.memoryUsage(),
  activeConnections: connectionPool.totalCount
};

// 임계치 초과 시 알림
if (performanceMetrics.responseTime > 5000) {
  console.warn('응답 시간 임계치 초과:', performanceMetrics);
}
```

## 🔧 계정 변경 시 체크리스트

### 1. 카카오 개발자 계정 이전
- [ ] 새 카카오 개발자 계정으로 앱 재생성
- [ ] 새 CLIENT_ID, CLIENT_SECRET 발급
- [ ] Redirect URI 업데이트
- [ ] 기존 사용자 OAuth 토큰 무효화 알림

### 2. 데이터베이스 이전
- [ ] 데이터 백업 생성
- [ ] 새 데이터베이스 환경 구축
- [ ] 스키마 마이그레이션 실행
- [ ] 데이터 이전 및 검증

### 3. 도메인 및 SSL
- [ ] DNS 설정 업데이트
- [ ] SSL 인증서 재발급
- [ ] 리다이렉트 규칙 설정

## 💰 비용 관리

### Replit 요금제별 기능
1. **무료 플랜**: 
   - 기본 배포 기능
   - 제한된 컴퓨팅 리소스
   - 공용 리포지토리만 가능

2. **유료 플랜 ($7-20/월)**:
   - 커스텀 도메인 지원
   - 향상된 성능
   - 프라이빗 리포지토리
   - 고급 협업 기능

### 예상 운영 비용 (월간)
- **Replit Pro**: $20
- **커스텀 도메인**: $10-15 (도메인 등록비)
- **외부 스토리지** (필요시): $5-50
- **총 예상 비용**: $35-85/월

## 🛡️ 보안 및 백업

### 보안 모범 사례
- API Key 정기 교체 (3-6개월)
- HTTPS 강제 적용
- 입력값 검증 및 SQL 인젝션 방지
- 세션 만료 시간 설정
- 정기적인 보안 업데이트

### 백업 전략
- 데이터베이스 일일 자동 백업
- 코드 Git 버전 관리
- 미디어 파일 클라우드 백업
- 재해 복구 계획 수립

---

이 가이드는 프로젝트 성장에 따라 지속적으로 업데이트됩니다.