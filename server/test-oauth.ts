// OAuth Test Utility
import { Request, Response } from 'express';

export function setupOAuthTest(app: any) {
  // Test endpoint to simulate the complete OAuth flow
  app.get('/test/oauth/simulate', async (req: Request, res: Response) => {
    const testCode = 'test_authorization_code_12345';
    const testState = 'test_state_67890';
    
    console.log('=== OAuth Flow Simulation ===');
    console.log('1. Simulating Kakao callback with test code');
    
    // Test the callback endpoint
    const callbackUrl = `http://localhost:5000/oauth/kakao/callback?code=${testCode}&state=${testState}`;
    console.log('2. Testing callback URL:', callbackUrl);
    
    try {
      const callbackResponse = await fetch(callbackUrl);
      console.log('3. Callback response status:', callbackResponse.status);
      console.log('4. Callback response headers:', Object.fromEntries(callbackResponse.headers.entries()));
      
      if (callbackResponse.redirected) {
        console.log('5. Redirected to:', callbackResponse.url);
      }
      
      // Test token exchange endpoint
      console.log('6. Testing token exchange endpoint');
      const tokenResponse = await fetch('http://localhost:5000/api/auth/kakao/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: testCode }),
      });
      
      console.log('7. Token exchange status:', tokenResponse.status);
      const tokenResult = await tokenResponse.text();
      console.log('8. Token exchange response:', tokenResult);
      
      res.json({
        success: true,
        callbackStatus: callbackResponse.status,
        tokenExchangeStatus: tokenResponse.status,
        tokenExchangeResponse: tokenResult,
        message: 'OAuth flow test completed'
      });
      
    } catch (error: any) {
      console.error('OAuth test error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'OAuth flow test failed'
      });
    }
  });
  
  // Test environment variables
  app.get('/test/oauth/config', (req: Request, res: Response) => {
    const config = {
      hasClientId: !!process.env.KAKAO_CLIENT_ID,
      hasClientSecret: !!process.env.KAKAO_CLIENT_SECRET,
      clientIdLength: process.env.KAKAO_CLIENT_ID?.length || 0,
      secretLength: process.env.KAKAO_CLIENT_SECRET?.length || 0,
    };
    
    console.log('OAuth Configuration Check:', config);
    res.json(config);
  });
}