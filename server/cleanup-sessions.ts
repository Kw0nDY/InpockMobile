import { storage } from './storage';

// 비활성 세션 정리 작업
export function startSessionCleanup() {
  // 5분마다 비활성 세션 정리
  setInterval(async () => {
    try {
      await storage.cleanupInactiveSessions();
      console.log('Session cleanup completed');
    } catch (error) {
      console.error('Session cleanup error:', error);
    }
  }, 5 * 60 * 1000); // 5분

  console.log('Session cleanup task started');
}