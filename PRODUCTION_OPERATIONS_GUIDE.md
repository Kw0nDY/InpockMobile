# 프로덕션 운영 가이드

## 🚀 배포 프로세스

### 배포 전 체크리스트
- [ ] 모든 테스트 통과 확인
- [ ] 환경 변수 검증
- [ ] 데이터베이스 마이그레이션 준비
- [ ] 백업 생성
- [ ] 모니터링 대시보드 준비

### Replit 배포 단계별 가이드

#### 1단계: 프로젝트 준비
```bash
# package.json의 scripts 확인
{
  "scripts": {
    "build": "vite build",
    "start": "node server/index.js",
    "dev": "npm run dev"
  }
}
```

#### 2단계: 환경 변수 설정
Replit Secrets에 다음 값들 입력:
- `KAKAO_CLIENT_ID`: 새 카카오 앱 REST API 키
- `KAKAO_CLIENT_SECRET`: 새 카카오 앱 시크릿
- `SESSION_SECRET`: 32자 이상 랜덤 문자열
- `DATABASE_URL`: PostgreSQL 연결 문자열

#### 3단계: 도메인 설정
```
배포 도메인 예시:
- 개발: https://프로젝트명-개발계정.replit.app
- 프로덕션: https://프로젝트명-운영계정.replit.app
- 커스텀: https://yourdomain.com (DNS 설정 필요)
```

## 📊 서버 성능 관리

### 현재 아키텍처 분석
```
클라이언트 (React + Vite)
    ↓
Express.js 서버 (Node.js)
    ↓
PostgreSQL 데이터베이스
    ↓
미디어 파일 저장소
```

### 성능 메트릭 모니터링

#### 핵심 지표
1. **응답 시간**: < 2초 (목표)
2. **동시 접속자**: 현재 처리 가능 ~100명
3. **메모리 사용량**: < 512MB (Replit 기본 제한)
4. **데이터베이스 연결**: 최대 10개 풀

#### 모니터링 코드 구현
```javascript
// server/monitoring.js
const express = require('express');
const app = express();

// 성능 미들웨어
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${duration}ms`);
    
    // 느린 응답 경고
    if (duration > 3000) {
      console.warn(`⚠️ 느린 응답: ${req.path} - ${duration}ms`);
    }
  });
  next();
});

// 헬스체크 엔드포인트
app.get('/health', (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: 'connected' // DB 연결 상태 확인
  };
  res.json(health);
});
```

### 사용자 증가에 따른 대응 방안

#### Phase 1: 0-500명 (현재 상태)
- **인프라**: Replit 기본 플랜
- **데이터베이스**: 단일 PostgreSQL 인스턴스
- **예상 비용**: $0-20/월

#### Phase 2: 500-2,000명
- **업그레이드 필요사항**:
  - Replit Pro 플랜 ($20/월)
  - 데이터베이스 최적화 (인덱싱, 쿼리 튜닝)
  - 이미지 압축 및 CDN 활용
- **예상 비용**: $50-100/월

#### Phase 3: 2,000-10,000명
- **인프라 확장**:
  - 외부 클라우드 DB (AWS RDS, Neon 등)
  - 미디어 파일 별도 저장소 (AWS S3, Cloudinary)
  - Redis 캐시 레이어 추가
- **예상 비용**: $200-500/월

#### Phase 4: 10,000명+
- **엔터프라이즈 솔루션**:
  - 마이크로서비스 아키텍처
  - 로드 밸런서
  - 별도 미디어 서버
  - 전담 DBA 및 DevOps
- **예상 비용**: $1,000+/월

## 🔧 운영 중 발생할 수 있는 문제들

### 일반적인 문제 및 해결방안

#### 1. 서버 응답 속도 저하
**증상**: 페이지 로딩이 3초 이상 걸림
**원인**: 
- 데이터베이스 쿼리 비효율
- 미디어 파일 크기 과다
- 동시 요청 처리 한계

**해결방안**:
```sql
-- 느린 쿼리 식별
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC LIMIT 10;

-- 인덱스 추가
CREATE INDEX CONCURRENTLY idx_links_userid_created 
ON links(userId, createdAt DESC);
```

#### 2. 메모리 부족
**증상**: 서버 재시작 빈발, 502 에러
**원인**: 메모리 누수, 대용량 파일 처리

**해결방안**:
```javascript
// 메모리 모니터링
setInterval(() => {
  const usage = process.memoryUsage();
  if (usage.heapUsed > 400 * 1024 * 1024) { // 400MB 초과
    console.warn('메모리 사용량 경고:', usage);
  }
}, 60000);

// 파일 업로드 크기 제한
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
```

#### 3. 데이터베이스 연결 한계
**증상**: "connection pool exhausted" 에러
**해결방안**:
```javascript
// 연결 풀 최적화
const pool = new Pool({
  max: 20, // 최대 연결 수 증가
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### 장애 대응 매뉴얼

#### 단계별 대응 프로세스
1. **즉시 대응** (5분 이내)
   - 서버 상태 확인
   - 에러 로그 분석
   - 필요시 서버 재시작

2. **임시 조치** (30분 이내)
   - 문제 원인 파악
   - 임시 우회 방법 적용
   - 사용자 공지

3. **근본 해결** (24시간 이내)
   - 코드 수정 및 배포
   - 모니터링 강화
   - 재발 방지 대책 수립

## 📈 확장성 계획

### 기술 스택 진화 로드맵

#### 현재 (MVP)
```
React + Express.js + PostgreSQL
└── 단일 서버, 모놀리식 구조
```

#### 6개월 후 (확장형)
```
React (CDN) + Express.js + PostgreSQL + Redis
├── 정적 파일 CDN 분리
├── 세션/캐시용 Redis
└── 데이터베이스 최적화
```

#### 1년 후 (스케일업)
```
React (CDN) + API Gateway + Microservices + Cloud DB
├── 사용자 관리 서비스
├── 미디어 처리 서비스
├── 링크 관리 서비스
└── 알림 서비스
```

### 비용 효율적인 확장 전략

#### 1. 점진적 최적화
- 현재 코드 성능 튜닝 우선
- 불필요한 기능 제거
- 캐싱 전략 강화

#### 2. 클라우드 네이티브 전환
- Serverless 함수 활용
- 자동 스케일링 적용
- Pay-as-you-use 모델

#### 3. 수익화 연계
- 프리미엄 기능 도입
- 광고 수익 모델
- 구독 서비스 런칭

## 🔒 보안 및 컴플라이언스

### 보안 체크리스트
- [ ] HTTPS 강제 적용
- [ ] API 요청 제한 (Rate Limiting)
- [ ] 입력값 검증 및 sanitization
- [ ] SQL 인젝션 방지
- [ ] XSS 공격 방지
- [ ] CSRF 토큰 적용
- [ ] 민감 정보 암호화

### 개인정보보호 대응
- 사용자 데이터 최소 수집
- 데이터 보관 기간 설정
- 사용자 계정 삭제 기능
- 데이터 다운로드/이동 기능

---

이 가이드를 통해 안정적이고 확장 가능한 서비스 운영이 가능합니다. 각 단계별로 필요한 시점에 해당 섹션을 참고하여 대응하시기 바랍니다.