# 카카오 로그인 후 회원가입 완료 플로우

## 개요
카카오 로그인 후 필수 정보가 누락된 경우 추가 회원가입 단계를 통해 완성하는 시스템

## 플로우 구성

### 1. 카카오 로그인 시작
- 사용자가 로그인 페이지에서 카카오 로그인 버튼 클릭
- `/api/auth/kakao` 엔드포인트로 OAuth 인증 시작

### 2. 카카오 인증 완료 후 콜백 처리
#### 서버측 처리 (`/oauth/kakao/callback`)
1. 카카오에서 전달받은 인증 코드로 사용자 정보 획득
2. 기존 사용자 확인:
   - 존재하는 경우: 기존 사용자 정보 업데이트
   - 신규 사용자: 불완전한 정보로 계정 생성
     ```javascript
     {
       username: '', // 빈 값 - 추가 입력 필요
       email: 'kakao_email@domain.com',
       name: 'kakao_nickname',
       phone: '', // 빈 값 - 추가 입력 필요
       provider: 'kakao',
       providerId: 'kakao_user_id'
     }
     ```

3. 필수 정보 완성도 체크:
   - `username`, `phone`, `name` 모두 존재하는지 확인
   - 결과에 따라 적절한 페이지로 리다이렉트

#### 클라이언트측 처리 (`/oauth/kakao/callback`)
1. URL 파라미터에서 인증 코드 추출
2. 서버 API 호출하여 사용자 정보 및 등록 완성도 확인
3. 응답에 따른 페이지 이동:
   - 완성된 경우: `/dashboard`
   - 미완성인 경우: `/complete-registration`

### 3. 회원가입 완료 페이지 (`/complete-registration`)
#### 필수 입력 항목
- **닉네임**: 3-20자, 중복 검사 포함
- **이름**: 2-50자, 실명 입력
- **전화번호**: 10-15자, 형식 검증

#### 기능
- 실시간 유효성 검사
- 닉네임 중복 확인 API 연동
- 카카오에서 가져온 정보 표시 (수정 불가)
- 완료 후 대시보드로 자동 이동

### 4. 기존 사용자 보호 로직
#### 대시보드 접근 시 (`/dashboard`)
```javascript
useEffect(() => {
  if (user && !checkRegistrationComplete()) {
    setLocation('/complete-registration');
  }
}, [user, checkRegistrationComplete, setLocation]);
```

#### 다른 보호된 페이지 접근 시
- 설정, 링크 관리, 이미지 등 모든 주요 기능 페이지
- 필수 정보 미완성 시 자동으로 완료 페이지로 리다이렉트

## API 엔드포인트

### 닉네임 중복 확인
```
POST /api/auth/check-username
Body: { username: "desired_username" }
Response: { available: boolean, message: string }
```

### 등록 완성도 확인
```
GET /api/auth/check-registration/:userId
Response: {
  isComplete: boolean,
  missingFields: string[],
  user: UserData
}
```

### 사용자 정보 업데이트
```
PATCH /api/user/:userId
Body: { username, phone, name }
Response: { user: UpdatedUserData }
```

## 보안 및 검증

### 입력값 검증
- Zod 스키마를 통한 클라이언트/서버 양측 검증
- 실시간 피드백으로 사용자 경험 향상

### 세션 관리
- 카카오 로그인 후 서버 세션에 사용자 정보 저장
- 클라이언트 AuthContext에서 전역 상태 관리

### 에러 처리
- OAuth 에러 시 로그인 페이지로 리다이렉트
- 네트워크 오류 시 적절한 에러 메시지 표시
- 토스트 알림으로 사용자 피드백 제공

## 사용자 경험

### 신규 사용자
1. 카카오 로그인 → 2. 추가 정보 입력 → 3. 대시보드 접속

### 기존 완성 사용자
1. 카카오 로그인 → 2. 바로 대시보드 접속

### 기존 미완성 사용자
1. 어떤 페이지 접근 시도 → 2. 자동으로 완료 페이지 이동 → 3. 정보 입력 후 원래 목적지로 이동

이 플로우를 통해 카카오 로그인 사용자도 서비스에 필요한 모든 정보를 완성하여 원활한 서비스 이용이 가능합니다.