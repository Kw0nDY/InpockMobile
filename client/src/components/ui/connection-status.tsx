import { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowStatus(true);
      // 3초 후 숨기기
      setTimeout(() => setShowStatus(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowStatus(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 페이지 로드 시 오프라인 상태면 표시
    if (!navigator.onLine) {
      setShowStatus(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showStatus) return null;

  return (
    <div className={`
      fixed top-4 left-1/2 transform -translate-x-1/2 z-50
      px-4 py-2 rounded-lg shadow-lg text-white text-sm font-medium
      flex items-center space-x-2 transition-all duration-300
      ${isOnline 
        ? 'bg-green-600' 
        : 'bg-red-600'
      }
    `}>
      {isOnline ? (
        <>
          <Wifi className="w-4 h-4" />
          <span>인터넷 연결됨</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4" />
          <span>인터넷 연결 끊김</span>
        </>
      )}
    </div>
  );
}

export function useConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline };
}

export default ConnectionStatus;