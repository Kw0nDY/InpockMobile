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
const REDIRECT_URI = process.env.NODE_ENV === 'production' 
  ? 'https://your-domain.replit.app/api/auth/kakao/callback'
  : 'http://localhost:5000/api/auth/kakao/callback';

export function setupKakaoAuth(app: Express) {
  // Kakao OAuth login initiation
  app.get('/api/auth/kakao', (req: Request, res: Response) => {
    const kakaoAuthURL = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=profile_nickname,account_email`;
    res.redirect(kakaoAuthURL);
  });

  // Kakao OAuth callback
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

      // Set user session
      (req.session as any).user = {
        id: user!.id,
        username: user!.username,
        email: user!.email,
        name: user!.name,
        role: user!.role,
        profileImageUrl: user!.profileImageUrl,
      };

      // Redirect to dashboard
      res.redirect('/dashboard');

    } catch (error) {
      console.error('Kakao auth error:', error);
      res.redirect('/login?error=kakao_auth_failed');
    }
  });

  // Kakao logout
  app.post('/api/auth/kakao/logout', async (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });
}