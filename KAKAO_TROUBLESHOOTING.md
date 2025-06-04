# Kakao OAuth KOE101 Error Troubleshooting Guide

## Current Issue Analysis

Based on the debug logs, the system is using CLIENT_ID: 1258686 instead of your provided REST API key (487828b279a7823b296a2492cf318248). This mismatch causes the KOE101 error.

## Root Cause
The environment variables aren't being loaded correctly by the Node.js process, causing it to fall back to a default or cached value.

## Required Kakao Developers Console Configuration

### 1. Platform Settings
```
앱 설정 → 플랫폼 → Web 플랫폼
사이트 도메인: http://localhost:5000
```

### 2. Kakao Login Settings
```
제품 설정 → 카카오 로그인
✓ 카카오 로그인 활성화: ON
✓ OpenID Connect 활성화: ON (if available)
```

### 3. Redirect URI Registration
```
Redirect URI: http://localhost:5000/oauth/kakao/callback
```
**Critical**: Must match exactly - no trailing slash, correct protocol (http not https for localhost)

### 4. Consent Items (동의항목)
```
✓ 프로필 정보 (닉네임) - 필수 동의
✓ 카카오계정 (이메일) - 선택 동의
```

### 5. Client Secret (Optional)
```
제품 설정 → 카카오 로그인 → 보안
✓ Client Secret 코드 생성 (if needed)
```

## Common KOE101 Error Causes

### 1. Invalid Client ID
- Using wrong REST API key
- Typos in client ID
- Using JavaScript key instead of REST API key

### 2. Redirect URI Mismatch
- Not registered in Kakao console
- Protocol mismatch (http vs https)
- Port number mismatch
- Path case sensitivity

### 3. Platform Not Registered
- Missing web platform registration
- Wrong domain configuration

### 4. App Status Issues
- App not approved for production
- Service temporarily suspended

## Verification Steps

1. **Check API Key Format**
   - REST API key should be 32 characters
   - Format: alphanumeric string
   - Your key: 487828b279a7823b296a2492cf318248 ✓

2. **Verify Redirect URI**
   - Must be exactly: http://localhost:5000/oauth/kakao/callback
   - Check for typos in Kakao console

3. **Confirm Platform Registration**
   - Web platform with domain: http://localhost:5000

4. **Test Authorization URL**
   - Should use your actual client ID
   - Currently using: 1258686 (incorrect)
   - Should use: 487828b279a7823b296a2492cf318248

## Next Steps

1. Configure proper environment variables
2. Restart application to load new credentials
3. Test OAuth flow with correct client ID
4. Verify Kakao console settings match requirements

## Debug Information

Current OAuth URL pattern:
```
https://kauth.kakao.com/oauth/authorize?
client_id=487828b279a7823b296a2492cf318248&
redirect_uri=http%3A%2F%2Flocalhost%3A5000%2Foauth%2Fkakao%2Fcallback&
response_type=code&
scope=profile_nickname%2Caccount_email&
state=RANDOM_STATE
```

This should resolve the KOE101 error once the correct client ID is loaded.