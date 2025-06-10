import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import AnalyticsDashboard from '@/components/analytics/analytics-dashboard';
import { trackPageView } from '@/lib/analytics';
import { useAuth } from '@/hooks/use-auth';

export default function AnalyticsPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    // Track this page view with user context
    trackPageView('/analytics', `/analytics?user=${user?.id}`);
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between p-4 border-b border-border">
        <button 
          className="p-2" 
          onClick={() => setLocation('/dashboard')}
        >
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="text-lg font-medium text-foreground">Analytics Dashboard</h1>
        <div className="w-10"></div>
      </header>

      <div className="px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2 text-foreground korean-text">
            실시간 URL 추적 분석
          </h2>
          <p className="text-muted-foreground text-sm korean-text">
            사용자 정의 URL의 방문 횟수를 실시간으로 모니터링하고 분석하세요
          </p>
        </div>

        <AnalyticsDashboard />
      </div>
    </div>
  );
}