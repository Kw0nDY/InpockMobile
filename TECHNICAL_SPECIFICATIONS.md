# AmuseFit 기술 명세서

## 시스템 아키텍처

### 전체 구조
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   React 18      │◄──►│   Express.js    │◄──►│  PostgreSQL     │
│   TypeScript    │    │   TypeScript    │    │  (Neon)         │
│   Tailwind CSS  │    │   Drizzle ORM   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Static Assets  │    │  External APIs  │    │   File Storage  │
│  Vite Build     │    │  Kakao OAuth    │    │  Local/Uploads  │
│  CDN Ready      │    │  SMS/Email      │    │  Image Files    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 데이터 플로우
```
사용자 요청 → React Router → API 호출 → Express 미들웨어 → 
비즈니스 로직 → Drizzle ORM → PostgreSQL → 응답 반환
```

## 데이터베이스 설계

### 현재 스키마 (ERD)
```
users (사용자)
├── id (PK)
├── username
├── email  
├── phone
├── password
├── provider (local/kakao)
├── profileImageUrl
└── timestamps

links (링크)                 media_uploads (미디어)
├── id (PK)                 ├── id (PK)
├── userId (FK → users)     ├── userId (FK → users)
├── originalUrl             ├── filename
├── shortCode               ├── originalName
├── clickCount              ├── mimeType
└── timestamps              └── timestamps

notifications (알림)         user_settings (설정)
├── id (PK)                 ├── id (PK)
├── userId (FK → users)     ├── userId (FK → users)
├── type                    ├── contentType
├── title                   ├── customUrl
├── message                 ├── theme
└── timestamps              └── display options

password_reset_tokens       subscriptions
├── id (PK)                 ├── id (PK)
├── userId (FK → users)     ├── userId (FK → users)
├── token                   ├── status
├── expiresAt               ├── pricePerMonth
└── used                    └── period dates
```

### 추가 필요 테이블
```sql
-- SMS/이메일 인증
CREATE TABLE sms_verification_codes (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE email_verification_codes (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 보안 및 로깅
CREATE TABLE login_attempts (
  id SERIAL PRIMARY KEY,
  identifier VARCHAR(255) NOT NULL, -- username, email, or phone
  ip_address INET,
  success BOOLEAN NOT NULL,
  attempted_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE api_rate_limits (
  id SERIAL PRIMARY KEY,
  ip_address INET NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  count INTEGER DEFAULT 1,
  window_start TIMESTAMP DEFAULT NOW(),
  INDEX idx_ip_endpoint (ip_address, endpoint)
);

-- 소셜 기능
CREATE TABLE user_follows (
  id SERIAL PRIMARY KEY,
  follower_id INTEGER REFERENCES users(id),
  following_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

CREATE TABLE content_likes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  content_type VARCHAR(50) NOT NULL, -- 'link', 'media'
  content_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, content_type, content_id)
);

CREATE TABLE content_comments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  content_type VARCHAR(50) NOT NULL,
  content_id INTEGER NOT NULL,
  comment TEXT NOT NULL,
  parent_id INTEGER REFERENCES content_comments(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## API 명세서

### 인증 관련 API

#### 기본 인증
```typescript
POST /api/auth/login
Content-Type: application/json
{
  "username": "string", // 사용자명/이메일/전화번호
  "password": "string"
}
Response: { user: User, session: string }

POST /api/auth/register  
{
  "username": "string",
  "email": "string",
  "password": "string",
  "phone": "string",
  "name": "string"
}

GET /api/auth/me
Headers: Cookie: session=...
Response: User
```

#### SMS/이메일 인증 (신규 구현 필요)
```typescript
POST /api/auth/send-sms-code
{
  "phone": "01012345678",
  "purpose": "find_id" | "reset_password" | "verification"
}
Response: { message: "인증번호가 발송되었습니다" }

POST /api/auth/verify-sms-code
{
  "phone": "01012345678", 
  "code": "123456",
  "purpose": "find_id" | "reset_password" | "verification"
}
Response: { verified: boolean, data?: any }

POST /api/auth/send-email-code
{
  "email": "user@example.com",
  "purpose": "reset_password" | "verification"
}

POST /api/auth/verify-email-code
{
  "email": "user@example.com",
  "code": "123456", 
  "purpose": "reset_password" | "verification"
}
```

### 컨텐츠 관리 API

#### 링크 관리
```typescript
GET /api/links/:userId
Response: Link[]

POST /api/links
{
  "originalUrl": "string",
  "title": "string",
  "description": "string",
  "thumbnailStyle": "thumbnail" | "simple" | "card"
}

PUT /api/links/:id
{...updates}

DELETE /api/links/:id
Response: { success: boolean }

GET /api/links/:id/stats
Response: {
  clickCount: number,
  recentClicks: ClickEvent[],
  topReferrers: Referrer[]
}
```

#### 미디어 관리
```typescript
POST /api/media-upload
Content-Type: multipart/form-data
file: File

GET /api/media/:userId
Response: MediaUpload[]

PUT /api/media/:id
{
  "title": "string",
  "description": "string",
  "displayStyle": "thumbnail" | "simple" | "card"
}
```

### 사용자 관리 API

#### 프로필 관리
```typescript
GET /api/user/:userId
Response: {
  user: User,
  stats: UserStats,
  settings: UserSettings
}

PUT /api/user/:userId
{
  "name": "string",
  "bio": "string", 
  "profileImageUrl": "string",
  "company": "string"
}

GET /api/profile/:identifier  // username or customUrl
Response: PublicProfile
```

### 소셜 기능 API (신규 구현 필요)

```typescript
POST /api/user/:userId/follow
Response: { following: boolean }

DELETE /api/user/:userId/follow  
Response: { following: boolean }

GET /api/user/:userId/followers
Response: User[]

GET /api/user/:userId/following
Response: User[]

POST /api/content/like
{
  "contentType": "link" | "media",
  "contentId": number
}

GET /api/content/:contentType/:id/likes
Response: { count: number, users: User[] }

POST /api/content/comment
{
  "contentType": "link" | "media",
  "contentId": number,
  "comment": "string",
  "parentId"?: number
}
```

## 보안 명세

### 인증 및 권한
```typescript
// 세션 기반 인증
interface Session {
  userId: number;
  createdAt: Date;
  expiresAt: Date;
  ipAddress: string;
  userAgent: string;
}

// API 권한 검사
middleware: requireAuth
middleware: requireOwnership(resourceType, resourceId)
middleware: requireRole(role: 'admin' | 'user')
```

### 입력 검증
```typescript
// Zod 스키마 예시
const createLinkSchema = z.object({
  originalUrl: z.string().url().max(2048),
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  thumbnailStyle: z.enum(['thumbnail', 'simple', 'card'])
});

const phoneSchema = z.string().regex(/^01[0-9]{8,9}$/);
const emailSchema = z.string().email().max(255);
```

### 속도 제한
```typescript
// Rate limiting 설정
const rateLimits = {
  '/api/auth/send-sms-code': { max: 3, window: '15min' },
  '/api/auth/login': { max: 5, window: '15min' },
  '/api/links': { max: 100, window: '1hour' },
  '/api/media-upload': { max: 10, window: '1hour' }
};
```

### 데이터 암호화
```typescript
// 민감 데이터 암호화 필드
const encryptedFields = [
  'users.phone',
  'users.email', 
  'sms_verification_codes.phone',
  'email_verification_codes.email'
];

// 비밀번호 해싱
const passwordHash = await bcrypt.hash(password, 12);
```

## 파일 구조

### 프론트엔드 구조
```
client/
├── src/
│   ├── components/
│   │   ├── ui/          # shadcn/ui 컴포넌트
│   │   └── layout/      # 레이아웃 컴포넌트
│   ├── pages/           # 페이지 컴포넌트
│   ├── hooks/           # 커스텀 훅
│   ├── lib/             # 유틸리티 함수
│   ├── types/           # TypeScript 타입
│   └── assets/          # 정적 자산
├── public/              # 공개 파일
└── package.json
```

### 백엔드 구조
```
server/
├── routes.ts           # API 라우트 정의
├── storage.ts          # 데이터베이스 추상화 계층
├── kakao-auth.ts       # 카카오 OAuth 처리
├── upload.ts           # 파일 업로드 처리
├── middleware/         # Express 미들웨어
│   ├── auth.ts         # 인증 미들웨어
│   ├── rateLimit.ts    # 속도 제한
│   └── validation.ts   # 입력 검증
├── services/           # 비즈니스 로직
│   ├── smsService.ts   # SMS 발송
│   ├── emailService.ts # 이메일 발송
│   └── authService.ts  # 인증 서비스
└── utils/              # 유틸리티 함수
```

### 공유 코드
```
shared/
├── schema.ts           # 데이터베이스 스키마 (Drizzle)
├── types.ts            # 공유 TypeScript 타입
└── validation.ts       # 공유 검증 스키마
```

## 성능 최적화

### 데이터베이스 최적화
```sql
-- 필수 인덱스
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);  
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_links_userId ON links(user_id);
CREATE INDEX idx_links_shortCode ON links(short_code);
CREATE INDEX idx_media_userId ON media_uploads(user_id);
CREATE INDEX idx_notifications_userId ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read);

-- 복합 인덱스
CREATE INDEX idx_user_follows_composite ON user_follows(follower_id, following_id);
CREATE INDEX idx_content_likes_composite ON content_likes(user_id, content_type, content_id);
```

### 캐싱 전략
```typescript
// Redis 캐싱 키 패턴
const cacheKeys = {
  userProfile: (userId: number) => `user:${userId}:profile`,
  userStats: (userId: number) => `user:${userId}:stats`,
  linkStats: (linkId: number) => `link:${linkId}:stats`,
  trendingContent: () => `content:trending:${Date.now().toString(36)}`,
  apiResponse: (endpoint: string, params: string) => `api:${endpoint}:${params}`
};

// 캐시 TTL 설정
const cacheTTL = {
  userProfile: 300,    // 5분
  userStats: 600,      // 10분  
  linkStats: 60,       // 1분
  trendingContent: 900 // 15분
};
```

### API 응답 최적화
```typescript
// 페이지네이션
interface PaginationParams {
  page: number;
  limit: number; // max 100
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 필드 선택
interface FieldSelection {
  include?: string[]; // 포함할 필드
  exclude?: string[]; // 제외할 필드
}

// 응답 압축
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));
```

## 배포 및 운영

### 환경 변수
```bash
# 데이터베이스
DATABASE_URL=postgresql://...
PGHOST=...
PGPORT=5432
PGUSER=...
PGPASSWORD=...
PGDATABASE=...

# 인증
SESSION_SECRET=...
KAKAO_CLIENT_ID=...
KAKAO_CLIENT_SECRET=...

# 외부 서비스
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
SENDGRID_API_KEY=...

# 기타
NODE_ENV=production
PORT=5000
REPLIT_DEV_DOMAIN=...
```

### 모니터링 지표
```typescript
// 추적할 메트릭
const metrics = {
  // 성능 지표
  apiResponseTime: 'avg response time per endpoint',
  databaseQueryTime: 'avg query execution time',
  errorRate: '4xx/5xx error percentage',
  
  // 비즈니스 지표  
  dailyActiveUsers: 'unique users per day',
  linkCreationRate: 'links created per day',
  profileViews: 'profile views per day',
  
  // 보안 지표
  failedLoginAttempts: 'failed login attempts',
  rateLimitHits: 'rate limit violations',
  suspiciousActivity: 'anomaly detection alerts'
};
```

이 문서는 AmuseFit의 기술적 세부사항을 포함한 완전한 명세서입니다. 개발팀이 일관된 기준으로 개발할 수 있도록 상세한 가이드라인을 제공합니다.