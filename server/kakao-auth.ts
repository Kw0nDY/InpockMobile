import type { Express, Request, Response } from "express";
import { storage } from "./storage";

interface KakaoTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

interface KakaoUserInfo {
  id: number;
  connected_at: string;
  properties: {
    nickname: string;
    profile_image: string;
    thumbnail_image: string;
  };
  kakao_account: {
    profile_nickname_needs_agreement: boolean;
    profile_image_needs_agreement: boolean;
    profile: {
      nickname: string;
      thumbnail_image_url: string;
      profile_image_url: string;
      is_default_image: boolean;
    };
    has_email: boolean;
    email_needs_agreement: boolean;
    is_email_valid: boolean;
    is_email_verified: boolean;
    email: string;
  };
}

const KAKAO_CLIENT_ID = process.env.KAKAO_CLIENT_ID;
const KAKAO_CLIENT_SECRET = process.env.KAKAO_CLIENT_SECRET;
// Use 127.0.0.1 instead of localhost to avoid browser IPv6/DNS issues
// Match exact Kakao console configuration
const REDIRECT_URI = 'http://127.0.0.1:5000/oauth/kakao/callback';

export function setupKakaoAuth(app: Express) {
  // Kakao OAuth login initiation
  app.get('/api/auth/kakao', (req: Request, res: Response) => {
    const { state } = req.query;
    
    // Check if required environment variables are present
    if (!KAKAO_CLIENT_ID) {
      console.error('KAKAO_CLIENT_ID is not configured');
      return res.status(500).json({ error: 'Kakao OAuth not configured' });
    }
    
    // Generate random state for security
    const randomState = Math.random().toString(36).substring(2, 15);
    
    // Build authorization URL with required parameters
    const params = new URLSearchParams({
      client_id: KAKAO_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      state: state as string || randomState
    });
    
    const kakaoAuthURL = `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
    console.log('Redirecting to Kakao OAuth URL:', kakaoAuthURL);
    console.log('Using CLIENT_ID:', KAKAO_CLIENT_ID?.substring(0, 8) + '...');
    console.log('Using REDIRECT_URI:', REDIRECT_URI);
    
    // Add CORS headers to handle OAuth redirects
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    res.redirect(kakaoAuthURL);
  });

  // Primary OAuth callback handler - Process token exchange immediately
  app.get('/oauth/kakao/callback', async (req: Request, res: Response) => {
    const { code, error, error_description, state } = req.query;
    
    console.log('OAuth callback received:', { 
      hasCode: !!code, 
      error, 
      errorDescription: error_description,
      state,
      fullQuery: req.query,
      url: req.url,
      timestamp: new Date().toISOString()
    });
    
    // Handle OAuth errors
    if (error) {
      console.error('Kakao OAuth error:', { error, error_description });
      const errorMessage = error_description || error;
      return res.redirect(`/?oauth_error=${encodeURIComponent(errorMessage as string)}`);
    }
    
    // Handle missing authorization code
    if (!code) {
      console.error('Missing authorization code in callback');
      return res.redirect('/?oauth_error=missing_code');
    }

    // Process token exchange immediately to prevent code expiration
    try {
      console.log('Processing OAuth callback immediately to prevent code expiration...');
      
      // Exchange code for access token immediately - MUST use same redirect_uri as authorization
      const tokenParams = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: KAKAO_CLIENT_ID!,
        redirect_uri: REDIRECT_URI, // Must match authorization request exactly
        code: code as string,
      });
      
      // Only include client_secret if it's configured (카카오는 선택사항)
      if (KAKAO_CLIENT_SECRET) {
        tokenParams.append('client_secret', KAKAO_CLIENT_SECRET);
      }

      const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: tokenParams,
      });

      const tokenResponseText = await tokenResponse.text();
      console.log('Token exchange status:', tokenResponse.status);
      console.log('Token response body:', tokenResponseText);
      
      if (!tokenResponse.ok) {
        console.error('Token exchange failed:', tokenResponseText);
        try {
          const errorData = JSON.parse(tokenResponseText);
          const errorMsg = `토큰 교환 실패: ${errorData.error_description || errorData.error}`;
          return res.redirect(`/?oauth_error=${encodeURIComponent(errorMsg)}`);
        } catch (e) {
          return res.redirect(`/?oauth_error=${encodeURIComponent('토큰 교환 중 오류가 발생했습니다')}`);
        }
      }

      const tokenData: KakaoTokenResponse = JSON.parse(tokenResponseText);
      console.log('Token exchange successful, fetching user data...');

      // Get user info from Kakao
      const userResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      const userResponseText = await userResponse.text();
      console.log('User info response status:', userResponse.status);
      console.log('User info response body:', userResponseText);
      
      if (!userResponse.ok) {
        console.error('User info fetch failed:', userResponseText);
        return res.redirect('/?oauth_error=' + encodeURIComponent('사용자 정보를 가져올 수 없습니다'));
      }

      const userData: KakaoUserInfo = JSON.parse(userResponseText);
      console.log('User data received for Kakao ID:', userData.id);

      // Create or update user in database
      const email = userData.kakao_account?.email || `kakao_${userData.id}@kakao.user`;
      const nickname = userData.properties?.nickname || userData.kakao_account?.profile?.nickname || 'Kakao User';
      const profileImage = userData.kakao_account?.profile?.profile_image_url || userData.properties?.profile_image;

      const existingUser = await storage.getUserByEmail(email);
      let user;
      let isNewUser = false;

      if (existingUser) {
        user = await storage.updateUser(existingUser.id, {
          profileImageUrl: profileImage,
          providerId: userData.id.toString(),
          provider: 'kakao',
        });
      } else {
        isNewUser = true;
        user = await storage.createUser({
          username: `kakao_${userData.id}`,
          email: email,
          name: nickname,
          password: '',
          role: 'user',
          provider: 'kakao',
          providerId: userData.id.toString(),
          profileImageUrl: profileImage,
        });
      }

      console.log(`OAuth success: ${isNewUser ? 'Created new user' : 'Updated existing user'} for Kakao ID ${userData.id}`);
      
      // Redirect to dashboard with success indication
      const successParams = new URLSearchParams({
        oauth_success: 'true',
        is_new_user: isNewUser.toString(),
        user_id: user!.id.toString()
      });
      
      res.redirect(`/?${successParams.toString()}`);

    } catch (error: any) {
      console.error('OAuth callback processing error:', error);
      return res.redirect(`/?oauth_error=${encodeURIComponent('authentication_failed')}`);
    }
  });

  // Frontend token exchange endpoint
  app.post('/api/auth/kakao/token', async (req: Request, res: Response) => {
    try {
      const { code } = req.body;
      
      console.log('Token exchange request:', { hasCode: !!code });
      
      if (!code) {
        return res.status(400).json({ 
          success: false, 
          message: 'Authorization code is required' 
        });
      }

      if (!KAKAO_CLIENT_ID || !KAKAO_CLIENT_SECRET) {
        console.error('Missing Kakao credentials');
        return res.status(500).json({ 
          success: false, 
          message: 'Kakao OAuth configuration incomplete' 
        });
      }

      console.log('Exchanging authorization code for access token...');
      console.log('Using client ID:', KAKAO_CLIENT_ID?.substring(0, 8) + '...');
      console.log('Using redirect URI:', REDIRECT_URI);

      // Exchange code for access token with exact Kakao API requirements
      const tokenParams = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: KAKAO_CLIENT_ID,
        client_secret: KAKAO_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        code: code,
      });

      console.log('Token request parameters:', {
        grant_type: 'authorization_code',
        client_id: KAKAO_CLIENT_ID?.substring(0, 8) + '...',
        redirect_uri: REDIRECT_URI,
        code: code?.substring(0, 20) + '...'
      });

      const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: tokenParams,
      });

      const tokenResponseText = await tokenResponse.text();
      console.log('Token response status:', tokenResponse.status);
      console.log('Token response headers:', Object.fromEntries(tokenResponse.headers.entries()));
      
      if (!tokenResponse.ok) {
        console.error('Token exchange failed - full response:', tokenResponseText);
        
        // Parse Kakao error for better debugging
        try {
          const errorData = JSON.parse(tokenResponseText);
          const errorMsg = `Kakao OAuth Error ${errorData.error_code}: ${errorData.error_description || errorData.error}`;
          throw new Error(errorMsg);
        } catch (parseError) {
          throw new Error(`Token exchange failed: ${tokenResponse.status} - ${tokenResponseText}`);
        }
      }

      const tokenData: KakaoTokenResponse = JSON.parse(tokenResponseText);

      console.log('Fetching user information from Kakao...');

      // Get user info from Kakao
      const userResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      const userResponseText = await userResponse.text();
      console.log('User response status:', userResponse.status);
      console.log('User response body:', userResponseText);

      if (!userResponse.ok) {
        throw new Error(`Failed to fetch user info: ${userResponse.status} - ${userResponseText}`);
      }

      const userData: KakaoUserInfo = JSON.parse(userResponseText);
      console.log('Kakao user data received:', {
        id: userData.id,
        hasEmail: !!userData.kakao_account?.email,
        hasNickname: !!userData.properties?.nickname,
        hasProfile: !!userData.kakao_account?.profile
      });

      // Extract user information safely
      const email = userData.kakao_account?.email || `kakao_${userData.id}@kakao.user`;
      const nickname = userData.properties?.nickname || userData.kakao_account?.profile?.nickname || 'Kakao User';
      const profileImage = userData.kakao_account?.profile?.profile_image_url || userData.properties?.profile_image;

      // Check if user exists
      const existingUser = await storage.getUserByEmail(email);
      let user;
      let isNewUser = false;

      if (existingUser) {
        console.log('Updating existing user:', existingUser.id);
        // Update existing user's profile information
        user = await storage.updateUser(existingUser.id, {
          profileImageUrl: profileImage,
          providerId: userData.id.toString(),
          provider: 'kakao',
        });
      } else {
        console.log('Creating new user for Kakao ID:', userData.id);
        // Create new user
        isNewUser = true;
        user = await storage.createUser({
          username: `kakao_${userData.id}`,
          email: email,
          name: nickname,
          password: '', // OAuth users don't need passwords
          role: 'user',
          provider: 'kakao',
          providerId: userData.id.toString(),
          profileImageUrl: profileImage,
        });
      }

      res.json({ 
        success: true, 
        user: user,
        isNewUser: isNewUser,
        message: isNewUser ? 'Account created successfully' : 'Login successful'
      });

    } catch (error: any) {
      console.error('Kakao token exchange error:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Authentication failed' 
      });
    }
  });

  // Legacy callback route (keeping for compatibility)
  app.get('/api/auth/kakao/callback', async (req: Request, res: Response) => {
    const { code } = req.query;

    if (!code) {
      return res.redirect('/login?error=kakao_auth_failed');
    }

    try {
      // Exchange code for access token
      const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: KAKAO_CLIENT_ID!,
          client_secret: KAKAO_CLIENT_SECRET!,
          redirect_uri: REDIRECT_URI,
          code: code as string,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to get access token');
      }

      const tokenData: KakaoTokenResponse = await tokenResponse.json();

      // Get user info from Kakao
      const userResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error('Failed to get user info');
      }

      const userData: KakaoUserInfo = await userResponse.json();

      // Check if user exists or create new user
      let user = await storage.getUserByEmail(userData.kakao_account.email);

      if (!user) {
        // Create new user from Kakao data
        user = await storage.createUser({
          username: `kakao_${userData.id}`,
          email: userData.kakao_account.email,
          password: '', // No password for OAuth users
          name: userData.kakao_account.profile.nickname || userData.properties.nickname,
          company: '',
          role: 'user',
          profileImageUrl: userData.kakao_account.profile.profile_image_url,
          provider: 'kakao',
          providerId: userData.id.toString(),
        });
      } else {
        // Update existing user with Kakao info
        user = await storage.updateUser(user.id, {
          profileImageUrl: userData.kakao_account.profile.profile_image_url,
          providerId: userData.id.toString(),
        });
      }

      // Set user session with proper typing
      const session = req.session as any;
      session.user = {
        id: user!.id,
        username: user!.username,
        email: user!.email,
        name: user!.name,
        role: user!.role,
        profileImageUrl: user!.profileImageUrl,
      };

      console.log('카카오 로그인 성공:', { userId: user!.id, email: user!.email });
      
      // Redirect to home page after successful login
      res.redirect('/?login_success=true');

    } catch (error) {
      console.error('Kakao auth error:', error);
      res.redirect('/login?error=kakao_auth_failed');
    }
  });

  // Kakao logout
  app.post('/api/auth/kakao/logout', async (req: Request, res: Response) => {
    const session = req.session as any;
    session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });
}