# Kakao OAuth Redirect URI Configuration Guide

## Current Error Analysis
- Error: KOE006 - Authorization code requested with unregistered Redirect URI
- Current URI being used: `http://localhost:5000/oauth/kakao/callback`
- Status: Not registered in Kakao Developers Console

## Step-by-Step Registration Process

### 1. Access Kakao Developers Console
1. Go to https://developers.kakao.com/
2. Login with your Kakao account
3. Select your application (REST API Key: 487828b279a7823b296a2492cf318248)

### 2. Configure Web Platform
1. Navigate to: **앱 설정** → **플랫폼**
2. Click **플랫폼 추가** → **Web**
3. Enter site domain: `http://localhost:5000`
4. Save the configuration

### 3. Register Redirect URI
1. Navigate to: **제품 설정** → **카카오 로그인**
2. Ensure **카카오 로그인 활성화** is ON
3. In the **Redirect URI** section:
   - Click **등록** (Register)
   - Enter exactly: `http://localhost:5000/oauth/kakao/callback`
   - Click **저장** (Save)

### 4. Configure Consent Items
1. In the same **카카오 로그인** section
2. Go to **동의항목** (Consent Items)
3. Enable required items:
   - **프로필 정보 (닉네임)** - Set to 필수 동의 (Required)
   - **카카오계정 (이메일)** - Set to 선택 동의 (Optional)

## Critical Configuration Requirements

### Exact URI Matching
- Protocol: `http://` (not https for localhost)
- Domain: `localhost` (not 127.0.0.1)
- Port: `:5000` (explicit port required)
- Path: `/oauth/kakao/callback` (exact case sensitive)

### Common Mistakes to Avoid
- Using `https://` instead of `http://` for localhost
- Missing port number `:5000`
- Using `127.0.0.1` instead of `localhost`
- Typos in the callback path
- Adding trailing slash `/oauth/kakao/callback/`

## Verification Steps

After configuration:
1. Check that the Web platform shows: `http://localhost:5000`
2. Verify Redirect URI list includes: `http://localhost:5000/oauth/kakao/callback`
3. Confirm 카카오 로그인 is activated
4. Test the OAuth flow immediately

## Expected Behavior After Fix
- Authorization request should succeed without KOE006 error
- After Kakao login consent, user will be redirected to your callback URL
- The callback page should process the authorization code
- User should be automatically logged in or registered

## Troubleshooting
If issues persist:
1. Clear browser cache
2. Try incognito/private browsing
3. Wait 5-10 minutes for Kakao configuration to propagate
4. Double-check all URIs for exact character matches