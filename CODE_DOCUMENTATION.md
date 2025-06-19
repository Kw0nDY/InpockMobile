# AmuseFit 코드 구조 및 한국어 주석 문서

## 개요
이 문서는 AmuseFit 프로젝트의 주요 코드 파일들과 그 기능을 설명합니다. 모든 주석은 한국어로 작성되어 있으며, 개발자가 쉽게 이해할 수 있도록 구성되었습니다.

## 완료된 한국어 주석 작업

### ✅ 완료된 파일들
1. **`client/src/App.tsx`** - 메인 앱 라우팅 및 네비게이션 관리
2. **`client/src/pages/login.tsx`** - 로그인 페이지 (브라우저 패스워드 제안 방지 시스템)
3. **`client/src/pages/settings.tsx`** - 설정 페이지 (프로필 관리 시스템)
4. **`client/src/hooks/use-auth.tsx`** - 인증 상태 관리 훅
5. **`server/routes.ts`** - 백엔드 API 라우트 (인증, 사용자 관리)
6. **`server/username-utils.ts`** - 닉네임 유틸리티 함수들
7. **`server/username-matcher.ts`** - 플렉시블 닉네임 매칭 시스템
8. **`SCREEN_DOCUMENTATION.md`** - 화면 플로우 문서
9. **`CODE_DOCUMENTATION.md`** - 코드 구조 문서

### 🔄 진행중인 작업
- 남은 컴포넌트 파일들의 주석 한국어 변환
- 데이터베이스 관련 파일 주석 업데이트

---

## 프론트엔드 구조 (Client)

### 1. 메인 앱 컴포넌트 (`client/src/App.tsx`)

```typescript
// 주요 라우팅 및 앱 구조 관리
import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";

// 페이지 컴포넌트들
import LandingPage from "./pages/landing";
import LoginPage from "./pages/login";
// ... 기타 페이지들

function Router() {
  const [location] = useLocation();
  
  // 모든 페이지 내비게이션에 대한 분석 추적 초기화
  useAnalytics();
  
  // 하단 네비게이션을 표시하지 않을 페이지들
  const hideNavPages = ["/login", "/signup", "/signup-step1", "/signup-step2"];
  
  // 현재 위치가 공개 프로필 뷰인지 확인
  const isPublicProfileView = location.startsWith("/users/") || 
    (location.match(/^\/[^\/]+$/) && location !== "/");
}
```

**주요 기능**:
- 페이지별 라우팅 관리
- 조건부 하단 네비게이션 표시
- 공개 프로필 URL 감지
- Google Analytics 초기화

### 2. 인증 시스템

#### 2.1 로그인 페이지 (`client/src/pages/login.tsx`)

```typescript
// 브라우저 비밀번호 제안 방지
useEffect(() => {
  const disablePasswordSuggestions = () => {
    // 모든 형태의 브라우저 패스워드 관리 비활성화
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      form.setAttribute('autocomplete', 'off');
      form.setAttribute('data-lpignore', 'true');
    });
  };
  
  disablePasswordSuggestions();
}, []);

// 플렉시블 닉네임 로그인 처리
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    // 닉네임과 비밀번호로 로그인 시도
    await login(username, password, rememberMe);
    
    toast({
      title: "로그인 성공",
      description: "AmuseFit에 오신 것을 환영합니다!",
    });
    
    setLocation("/dashboard");
  } catch (error) {
    toast({
      title: "로그인 실패", 
      description: "닉네임 또는 비밀번호를 확인해주세요.",
      variant: "destructive",
    });
  }
};
```

**특별 기능**:
- 플렉시블 닉네임 매칭 (자동생성 닉네임 단축 입력)
- 브라우저 자동 비밀번호 제안 완전 차단
- Kakao OAuth 통합
- 로그인 상태 유지 옵션

#### 2.2 회원가입 2단계 (`client/src/pages/signup-step2.tsx`)

```typescript
// 실시간 폼 검증 시스템
const validateForm = () => {
  try {
    signupSchema.parse(formData);
    setErrors({});
    return true;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const newErrors: Partial<Record<keyof SignupForm, string>> = {};
      error.errors.forEach((err) => {
        const path = err.path[0];
        if (path && typeof path === 'string') {
          newErrors[path as keyof SignupForm] = err.message;
        }
      });
      setErrors(newErrors);
    }
    return false;
  }
};

// 입력 변경 실시간 처리
const handleInputChange = (field: keyof SignupForm, value: string) => {
  setFormData(prev => ({
    ...prev,
    [field]: value
  }));
  
  // 사용자가 입력을 시작하면 오류 메시지 제거
  if (errors[field]) {
    setErrors(prev => ({
      ...prev,
      [field]: undefined
    }));
  }
  
  // 비밀번호 확인 실시간 검증
  if (field === 'confirmPassword' && formData.password && value && formData.password !== value) {
    setErrors(prev => ({
      ...prev,
      confirmPassword: '비밀번호가 일치하지 않습니다'
    }));
  }
};
```

**주요 기능**:
- Zod 기반 실시간 폼 검증
- 비밀번호 확인 즉시 검증
- 사용자 친화적 오류 메시지
- 프로그레스 인디케이터

### 3. 닉네임 관리 시스템

#### 3.1 닉네임 입력 컴포넌트 (`client/src/components/ui/username-input.tsx`)

```typescript
// 닉네임 유효성 검사 훅
const { 
  isValid, 
  isChecking, 
  message, 
  checkUsername 
} = useUsernameValidation();

// 실시간 검증 처리
useEffect(() => {
  // 디바운스를 통한 API 호출 최적화
  const timer = setTimeout(() => {
    if (value && value.length >= 2) {
      checkUsername(value);
    }
  }, 500);
  
  return () => clearTimeout(timer);
}, [value, checkUsername]);

// 입력 변경 핸들러
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const newValue = e.target.value;
  
  // 한글, 영문, 숫자, 언더스코어, 하이픈만 허용
  const filteredValue = newValue.replace(/[^a-zA-Z0-9가-힣_-]/g, '');
  
  // 20자 제한
  if (filteredValue.length <= 20) {
    onChange(filteredValue);
  }
};
```

**핵심 기능**:
- 실시간 중복 검사
- 문자 필터링 (한글/영문/숫자/특수문자)
- 디바운스를 통한 API 호출 최적화
- 사용자 피드백 (가능/불가능/검사중)

#### 3.2 플렉시블 닉네임 매칭 (`server/username-matcher.ts`)

```typescript
// 유연한 닉네임 매칭 시스템
export async function findUserByFlexibleUsername(
  storage: DatabaseStorage, 
  inputUsername: string
): Promise<any> {
  // 먼저 정확한 매칭 시도
  let user = await storage.getUserByUsername(inputUsername);
  if (user) {
    return user;
  }

  // 정확한 매칭이 없으면 자동생성 닉네임 패턴 검색
  const allUsers = await storage.getAllUsers();
  
  // 패턴: inputUsername_[숫자들]
  const pattern = new RegExp(`^${inputUsername}_\\d+$`);
  
  const matchingUsers = allUsers.filter(u => pattern.test(u.username));
  
  if (matchingUsers.length === 1) {
    // 정확히 하나의 매칭이 발견되면 반환
    return matchingUsers[0];
  } else if (matchingUsers.length > 1) {
    // 여러 개의 매칭이 있으면 가장 최근 것 반환 (높은 ID)
    return matchingUsers.sort((a, b) => b.id - a.id)[0];
  }

  // 매칭 없음
  return null;
}
```

**알고리즘**:
1. 입력된 닉네임으로 정확한 매칭 검색
2. 실패 시 `닉네임_숫자` 패턴으로 검색
3. 여러 매칭 시 가장 최근 계정 선택
4. 매칭 없으면 null 반환

### 4. 설정 페이지 (`client/src/pages/settings.tsx`)

```typescript
// 프로필 데이터 상태 관리
const [profileData, setProfileData] = useState({
  name: user?.name || '',
  email: user?.email || '',
  bio: (user as any)?.bio || '',
  profileImageUrl: (user as any)?.profileImageUrl || '',
  customUrl: (user as any)?.customUrl || '',
  contentType: 'links',
  // 피트니스 전문가 정보
  birthDate: (user as any)?.birthDate || '',
  fitnessAwards: (user as any)?.fitnessAwards || '',
  fitnessCertifications: (user as any)?.fitnessCertifications || '',
  currentGym: (user as any)?.currentGym || '',
  gymAddress: (user as any)?.gymAddress || '',
  fitnessIntro: (user as any)?.fitnessIntro || '',
});

// 프로필 저장 로직
const handleSaveProfile = async () => {
  try {
    // 사용자 정보 업데이트
    const userUpdateData = {
      name: profileData.name,
      email: profileData.email,
      bio: profileData.bio,
      profileImageUrl: profileData.profileImageUrl,
      customUrl: profileData.customUrl,
      // 피트니스 정보 포함
      birthDate: profileData.birthDate,
      fitnessAwards: profileData.fitnessAwards,
      fitnessCertifications: profileData.fitnessCertifications,
      currentGym: profileData.currentGym,
      gymAddress: profileData.gymAddress,
      fitnessIntro: profileData.fitnessIntro,
    };
    
    const userResult = await updateUserMutation.mutateAsync(userUpdateData);
    
    // 설정 정보 업데이트
    const settingsUpdateData = {
      customUrl: profileData.customUrl,
      contentType: profileData.contentType,
      shortUrlType: profileData.shortUrlType,
    };
    
    const settingsResult = await updateSettingsMutation.mutateAsync(settingsUpdateData);
    
    // 관련된 모든 쿼리 캐시 무효화
    queryClient.invalidateQueries({ queryKey: [`/api/user/${user?.id}`] });
    queryClient.invalidateQueries({ queryKey: [`/api/settings/${user?.id}`] });
    
    toast({
      title: "프로필 저장 완료",
      description: "모든 설정이 성공적으로 저장되었습니다.",
    });
    
  } catch (error) {
    toast({
      title: "저장 실패",
      description: "프로필 저장 중 오류가 발생했습니다.",
      variant: "destructive",
    });
  }
};
```

**통합된 기능**:
- 탭 기반 설정 인터페이스 (프로필/피트니스)
- 닉네임 설정 프로필 카드 통합
- 이미지 업로드 및 크롭
- URL 설정 및 미리보기
- 진입 타입 선택 (이미지/동영상/링크)

---

## 백엔드 구조 (Server)

### 1. 라우트 관리 (`server/routes.ts`)

```typescript
// 인증 라우트
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = loginSchema.parse(req.body);
    
    // 플렉시블 닉네임 매칭 사용
    let user = await findUserByFlexibleUsername(storage, username);
    
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 세션 생성 (간소화)
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        company: user.company,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(400).json({ message: "로그인 요청이 올바르지 않습니다" });
  }
});

// 닉네임 업데이트 라우트
app.patch("/api/user/:id/username", async (req, res) => {
  try {
    const { id } = req.params;
    const { username } = req.body;

    // 닉네임 유효성 검사
    const validation = await validateUsername(username);
    if (!validation.isValid) {
      return res.status(400).json({ 
        message: validation.message 
      });
    }

    // 기존 사용자 확인
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser && existingUser.id !== parseInt(id)) {
      return res.status(400).json({ 
        message: "이미 사용 중인 닉네임입니다" 
      });
    }

    // 닉네임 업데이트
    const updatedUser = await storage.updateUser(parseInt(id), { username });
    
    if (!updatedUser) {
      return res.status(404).json({ 
        message: "사용자를 찾을 수 없습니다" 
      });
    }

    res.json({
      success: true,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        name: updatedUser.name
      }
    });
  } catch (error) {
    res.status(500).json({ 
      message: "닉네임 변경 중 오류가 발생했습니다" 
    });
  }
});
```

**주요 엔드포인트**:
- `POST /api/auth/login` - 플렉시블 닉네임 로그인
- `POST /api/auth/signup` - 회원가입
- `PATCH /api/user/:id/username` - 닉네임 변경
- `GET /api/username/check/:username` - 닉네임 중복 검사
- `GET /api/public/:identifier` - 공개 프로필 조회

### 2. 데이터베이스 저장소 (`server/storage.ts`)

```typescript
// 사용자 관리 인터페이스
export interface IStorage {
  // 사용자 조회 메서드들
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByCustomUrl(customUrl: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  // 사용자 생성/업데이트
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  
  // 링크 관리
  getLinks(userId: number): Promise<Link[]>;
  createLink(link: InsertLink): Promise<Link>;
  updateLink(id: number, updates: Partial<Link>): Promise<Link | undefined>;
  deleteLink(id: number): Promise<boolean>;
  
  // 미디어 관리
  getMedia(userId: number): Promise<Media[]>;
  getMediaByType(userId: number, mediaType: string): Promise<Media[]>;
  createMedia(media: InsertMedia): Promise<Media>;
  updateMedia(id: number, updates: Partial<Media>): Promise<Media | undefined>;
  deleteMedia(id: number): Promise<boolean>;
}

// 데이터베이스 구현체
export class DatabaseStorage implements IStorage {
  // 사용자 조회 - ID로
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  // 사용자 조회 - 닉네임으로
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  // 사용자 조회 - 커스텀 URL로
  async getUserByCustomUrl(customUrl: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.customUrl, customUrl));
    return user || undefined;
  }

  // 모든 사용자 조회 (플렉시블 매칭용)
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // 사용자 생성
  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  // 사용자 정보 업데이트
  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
  }
}
```

**데이터베이스 특징**:
- Drizzle ORM 사용
- PostgreSQL 기반
- 관계형 데이터 모델링
- 트랜잭션 지원

### 3. Kakao OAuth 인증 (`server/kakao-auth.ts`)

```typescript
// Kakao OAuth 설정
export function setupKakaoAuth(app: Express) {
  // OAuth 로그인 시작 엔드포인트
  app.get('/oauth/kakao', (req, res) => {
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?` +
      `client_id=${process.env.KAKAO_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=profile_nickname,account_email`;
    
    res.redirect(kakaoAuthUrl);
  });

  // OAuth 콜백 처리
  app.get('/oauth/kakao/callback', async (req, res) => {
    try {
      const { code } = req.query;
      
      if (!code) {
        throw new Error('인증 코드가 없습니다');
      }

      // 액세스 토큰 요청
      const tokenResponse = await axios.post('https://kauth.kakao.com/oauth/token', {
        grant_type: 'authorization_code',
        client_id: process.env.KAKAO_CLIENT_ID,
        client_secret: process.env.KAKAO_CLIENT_SECRET,
        redirect_uri: redirectUri,
        code: code as string,
      });

      const { access_token } = tokenResponse.data;

      // 사용자 정보 요청
      const userResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      const kakaoUser = userResponse.data;
      const email = kakaoUser.kakao_account?.email;
      const nickname = kakaoUser.properties?.nickname;

      // 기존 사용자 확인 또는 새 사용자 생성
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        // 자동 닉네임 생성 (중복 방지)
        const baseUsername = nickname || 'user';
        const uniqueUsername = await generateUniqueUsername(baseUsername);
        
        user = await storage.createUser({
          username: uniqueUsername,
          email: email,
          name: nickname || '사용자',
          password: randomBytes(32).toString('hex'), // 임시 패스워드
          role: 'user',
          company: '',
        });
      }

      // 프론트엔드로 리다이렉션 (사용자 정보 포함)
      res.redirect(`/dashboard?user=${encodeURIComponent(JSON.stringify({
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name
      }))}`);

    } catch (error) {
      console.error('Kakao OAuth 오류:', error);
      res.redirect('/login?error=oauth_failed');
    }
  });
}
```

**OAuth 플로우**:
1. 사용자가 Kakao 로그인 버튼 클릭
2. Kakao 인증 페이지로 리다이렉션
3. 사용자 동의 후 콜백 URL로 인증 코드 전달
4. 서버에서 액세스 토큰 요청
5. 사용자 정보 조회
6. 계정 연동 또는 신규 생성
7. 대시보드로 리다이렉션

---

## 공통 스키마 (`shared/schema.ts`)

```typescript
// 사용자 테이블 스키마
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).unique().notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  company: varchar("company", { length: 100 }).default(""),
  role: varchar("role", { length: 50 }).default("user"),
  phone: varchar("phone", { length: 20 }),
  
  // 프로필 정보
  bio: text("bio"),
  profileImageUrl: varchar("profile_image_url", { length: 500 }),
  customUrl: varchar("custom_url", { length: 50 }).unique(),
  
  // 피트니스 전문가 정보
  birthDate: varchar("birth_date", { length: 20 }),
  fitnessAwards: text("fitness_awards"),
  fitnessCertifications: text("fitness_certifications"),
  currentGym: varchar("current_gym", { length: 100 }),
  gymAddress: varchar("gym_address", { length: 200 }),
  fitnessIntro: text("fitness_intro"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 링크 테이블 스키마
export const links = pgTable("links", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  originalUrl: varchar("original_url", { length: 1000 }).notNull(),
  shortCode: varchar("short_code", { length: 20 }).unique().notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  clickCount: integer("click_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 미디어 테이블 스키마
export const media = pgTable("media", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }),
  mimeType: varchar("mime_type", { length: 100 }),
  fileSize: integer("file_size"),
  mediaType: varchar("media_type", { length: 20 }).notNull(), // 'image' 또는 'video'
  mediaUrl: varchar("media_url", { length: 500 }),
  title: varchar("title", { length: 200 }),
  description: text("description"),
  uploadPath: varchar("upload_path", { length: 500 }),
  isPublic: boolean("is_public").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 사용자 설정 테이블
export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  notifications: boolean("notifications").default(true),
  marketingEmails: boolean("marketing_emails").default(false),
  customUrl: varchar("custom_url", { length: 50 }),
  contentType: varchar("content_type", { length: 20 }).default("links"), // 'image', 'video', 'links'
  shortUrlType: varchar("short_url_type", { length: 20 }).default("default"), // 'default', 'custom'
  linkTitle: varchar("link_title", { length: 200 }),
  linkDescription: text("link_description"),
  linkUrl: varchar("link_url", { length: 1000 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 타입 추론
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Link = typeof links.$inferSelect;
export type InsertLink = typeof links.$inferInsert;
export type Media = typeof media.$inferSelect;
export type InsertMedia = typeof media.$inferInsert;
export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = typeof userSettings.$inferInsert;
```

**스키마 특징**:
- PostgreSQL 기반 관계형 데이터베이스
- Drizzle ORM으로 타입 안전성 보장
- 피트니스 전문가를 위한 특화 필드
- 확장 가능한 구조

---

## 유틸리티 함수들

### 1. 닉네임 유틸리티 (`server/username-utils.ts`)

```typescript
// 닉네임 유효성 검사
export async function validateUsername(username: string): Promise<{
  isValid: boolean;
  message: string;
}> {
  // 길이 검사 (2-20자)
  if (username.length < 2) {
    return {
      isValid: false,
      message: "닉네임은 2자 이상이어야 합니다"
    };
  }
  
  if (username.length > 20) {
    return {
      isValid: false,
      message: "닉네임은 20자 이하여야 합니다"
    };
  }
  
  // 허용된 문자만 포함하는지 검사 (한글, 영문, 숫자, 언더스코어, 하이픈)
  const allowedPattern = /^[a-zA-Z0-9가-힣_-]+$/;
  if (!allowedPattern.test(username)) {
    return {
      isValid: false,
      message: "닉네임은 한글, 영문, 숫자, 언더스코어(_), 하이픈(-)만 사용할 수 있습니다"
    };
  }
  
  // 금지된 닉네임 검사
  const forbiddenUsernames = [
    'admin', 'root', 'user', 'test', 'api', 'www', 'mail', 'ftp',
    'localhost', 'null', 'undefined', 'login', 'signup', 'dashboard',
    'settings', 'profile', 'help', 'support', 'about', 'contact'
  ];
  
  if (forbiddenUsernames.includes(username.toLowerCase())) {
    return {
      isValid: false,
      message: "사용할 수 없는 닉네임입니다"
    };
  }
  
  return {
    isValid: true,
    message: "사용 가능한 닉네임입니다"
  };
}

// 고유한 닉네임 생성 (OAuth 사용자용)
export async function generateUniqueUsername(baseName: string): Promise<string> {
  // 기본 이름 정리 (특수문자 제거, 길이 제한)
  const cleanBaseName = baseName
    .replace(/[^a-zA-Z0-9가-힣]/g, '')
    .substring(0, 15);
  
  let attemptCount = 0;
  let username = cleanBaseName;
  
  // 중복 검사 및 고유 번호 추가
  while (await storage.getUserByUsername(username)) {
    attemptCount++;
    const randomSuffix = Math.floor(Math.random() * 10000000000).toString();
    username = `${cleanBaseName}_${randomSuffix}`;
    
    // 무한 루프 방지
    if (attemptCount > 100) {
      const timestamp = Date.now().toString();
      username = `user_${timestamp}`;
      break;
    }
  }
  
  return username;
}
```

### 2. 분석 유틸리티 (`client/src/lib/analytics.ts`)

```typescript
// Google Analytics 초기화
export const initGA = () => {
  // 로컬호스트에서는 로컬 분석 시스템 사용
  if (window.location.hostname === 'localhost') {
    console.log('Initializing localhost analytics tracking system');
    
    // 로컬 분석 데이터 스토리지 초기화
    if (!localStorage.getItem('localhost_analytics')) {
      localStorage.setItem('localhost_analytics', JSON.stringify({
        sessions: [],
        pageViews: [],
        events: [],
        startTime: Date.now()
      }));
    }
    
    console.log('Local analytics system ready for localhost development');
    return;
  }
  
  // 프로덕션에서는 실제 GA 초기화
  // TODO: Google Analytics 설정
};

// 페이지 뷰 추적
export const trackPageView = (url: string, title?: string) => {
  if (window.location.hostname === 'localhost') {
    const analyticsData = JSON.parse(localStorage.getItem('localhost_analytics') || '{}');
    const pageViewData = {
      url,
      title: title || document.title,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      referrer: document.referrer
    };
    
    analyticsData.pageViews = analyticsData.pageViews || [];
    analyticsData.pageViews.push(pageViewData);
    localStorage.setItem('localhost_analytics', JSON.stringify(analyticsData));
    
    console.log('Localhost Page View:', {
      url,
      trackingUrl: url + (url.includes('?') ? '&' : '?') + `user_id=${getCurrentUserId()}`,
      eventData: pageViewData
    });
    
    return;
  }
  
  // 프로덕션 GA 추적
  // TODO: Google Analytics 페이지 뷰 전송
};

// 이벤트 추적
export const trackEvent = (eventName: string, parameters?: any) => {
  if (window.location.hostname === 'localhost') {
    const eventData = {
      eventName,
      parameters,
      timestamp: Date.now(),
      url: window.location.href
    };
    
    const analyticsData = JSON.parse(localStorage.getItem('localhost_analytics') || '{}');
    analyticsData.events = analyticsData.events || [];
    analyticsData.events.push(eventData);
    localStorage.setItem('localhost_analytics', JSON.stringify(analyticsData));
    
    console.log('Analytics Event:', [eventName, parameters]);
    return;
  }
  
  // 프로덕션 GA 이벤트 전송
  // TODO: Google Analytics 이벤트 전송
};
```

---

## 주요 훅 (Hooks)

### 1. 인증 훅 (`client/src/hooks/use-auth.ts`)

```typescript
interface AuthContextType {
  user: User | null;
  login: (username: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  isLoading: boolean;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth는 AuthProvider 내에서 사용되어야 합니다');
  }
  return context;
}

// 인증 공급자 컴포넌트
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 로그인 함수
  const login = async (username: string, password: string, rememberMe: boolean = false) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('로그인에 실패했습니다');
      }

      const data = await response.json();
      setUser(data.user);

      // 로그인 상태 유지 옵션
      if (rememberMe) {
        localStorage.setItem('rememberedUser', JSON.stringify(data.user));
      }

    } catch (error) {
      throw error;
    }
  };

  // 로그아웃 함수
  const logout = () => {
    setUser(null);
    localStorage.removeItem('rememberedUser');
    // 로그인 페이지로 리다이렉션은 컴포넌트에서 처리
  };

  // 앱 시작 시 저장된 로그인 상태 복원
  useEffect(() => {
    const rememberedUser = localStorage.getItem('rememberedUser');
    if (rememberedUser) {
      try {
        const userData = JSON.parse(rememberedUser);
        setUser(userData);
      } catch (error) {
        console.error('저장된 사용자 정보를 불러오는데 실패했습니다:', error);
        localStorage.removeItem('rememberedUser');
      }
    }
    setIsLoading(false);
  }, []);

  const value = {
    user,
    login,
    logout,
    setUser,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
```

### 2. 닉네임 검증 훅 (`client/src/hooks/use-username-validation.ts`)

```typescript
export function useUsernameValidation() {
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [message, setMessage] = useState('');

  const checkUsername = useCallback(async (username: string) => {
    if (!username || username.length < 2) {
      setIsValid(null);
      setMessage('');
      return;
    }

    setIsChecking(true);
    
    try {
      const response = await fetch(`/api/username/check/${encodeURIComponent(username)}`);
      const data = await response.json();
      
      setIsValid(data.isValid);
      setMessage(data.message);
    } catch (error) {
      setIsValid(false);
      setMessage('닉네임 확인 중 오류가 발생했습니다');
    } finally {
      setIsChecking(false);
    }
  }, []);

  return {
    isValid,
    isChecking,
    message,
    checkUsername,
  };
}
```

---

## CSS 스타일링 (`client/src/index.css`)

```css
/* 기본 색상 테마 (어스 톤) */
:root {
  --background: 35 16% 96%; /* #F5F5DC - 베이지 배경 */
  --foreground: 15 35% 18%; /* #4E342E - 다크 브라운 텍스트 */
  --muted: 30 20% 92%; /* #EFE5DC - 웜 그레이 카드 */
  --muted-foreground: 20 15% 55%; /* #A1887F - 뮤트 브라운 보조 텍스트 */
  --card: 30 20% 92%; /* #EFE5DC - 라이트 브라운/웜 그레이 카드 */
  --border: 20 15% 80%; /* #D7CCC8 - 라이트 브라운 테두리 */
  --primary: 15 35% 18%; /* #4E342E - 다크 브라운 프라이머리 */
  --accent: 15 25% 45%; /* #8D6E63 - 클레이 액센트 색상 */
}

/* 브라우저 비밀번호 제안 완전 차단 */
input[type="password"] {
  -webkit-text-security: disc !important;
}

input[type="password"]::-webkit-textfield-decoration-container {
  visibility: hidden !important;
}

input[type="password"]::-webkit-password-toggle {
  display: none !important;
}

input[type="password"]::-webkit-credentials-auto-fill-button {
  visibility: hidden !important;
  display: none !important;
  pointer-events: none !important;
  height: 0 !important;
  width: 0 !important;
  margin: 0 !important;
}

/* 브라우저 자동완성 제안 숨김 */
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
input:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 30px white inset !important;
  -webkit-text-fill-color: black !important;
  transition: background-color 5000s ease-in-out 0s;
}

/* 패스워드 매니저 팝업 방지 */
form[data-form-type="other"] {
  -webkit-user-modify: read-write-plaintext-only;
}

/* 모바일 웹앱 최적화 */
html {
  height: 100%;
  /* 모바일에서만 pull-to-refresh 비활성화 */
  overscroll-behavior-y: none;
}

body {
  margin: 0;
  font-family: 'Inter', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  /* 모바일 웹앱 동작 */
  overscroll-behavior-y: none;
  -webkit-overflow-scrolling: touch;
}

/* 모바일 컨테이너 */
.mobile-container {
  max-width: 428px;
  margin: 0 auto;
  min-height: 100vh;
  background-color: hsl(var(--background));
  position: relative;
}

/* 한국어 폰트 클래스 */
.korean-text {
  font-family: 'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
  font-weight: 400;
  line-height: 1.6;
}

/* 글래스모피즘 효과 */
.glassmorphism {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
}

/* 토스트 슬라이드 애니메이션 */
@keyframes slideInFromRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOutToRight {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}
```

이 문서는 AmuseFit 프로젝트의 주요 코드 구조와 한국어 주석을 포함한 완전한 코드 가이드입니다. 모든 주요 컴포넌트, 훅, 유틸리티 함수들이 상세히 문서화되어 있어 개발자가 쉽게 이해하고 유지보수할 수 있도록 구성되었습니다.