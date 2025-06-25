import { useEffect, useState } from 'react';

interface MobileKeyboardFixProps {
  children: React.ReactNode;
  offset?: number;
}

export function MobileKeyboardFix({ children, offset = 0 }: MobileKeyboardFixProps) {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

  useEffect(() => {
    const handleResize = () => {
      const currentHeight = window.innerHeight;
      const heightDiff = viewportHeight - currentHeight;
      
      // 키보드가 열렸다고 판단하는 기준 (150px 이상 높이 감소)
      if (heightDiff > 150) {
        setIsKeyboardOpen(true);
      } else {
        setIsKeyboardOpen(false);
        setViewportHeight(currentHeight);
      }
    };

    // iOS Safari에서 키보드 처리
    const handleVisualViewportChange = () => {
      if ('visualViewport' in window) {
        const visualViewport = window.visualViewport as any;
        const heightDiff = window.innerHeight - visualViewport.height;
        
        if (heightDiff > 150) {
          setIsKeyboardOpen(true);
        } else {
          setIsKeyboardOpen(false);
        }
      }
    };

    // Visual Viewport API 지원 브라우저 (iOS Safari)
    if ('visualViewport' in window) {
      const visualViewport = window.visualViewport as any;
      visualViewport.addEventListener('resize', handleVisualViewportChange);
      
      return () => {
        visualViewport.removeEventListener('resize', handleVisualViewportChange);
      };
    } else {
      // 일반 resize 이벤트 (Android)
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [viewportHeight]);

  return (
    <div 
      className={`transition-all duration-300 ${isKeyboardOpen ? 'translate-y-0' : ''}`}
      style={{
        paddingBottom: isKeyboardOpen ? `${offset}px` : '0px',
        minHeight: isKeyboardOpen ? 'auto' : '100vh'
      }}
    >
      {children}
    </div>
  );
}

// 입력 필드 자동 스크롤 훅
export function useInputFocus() {
  const scrollToInput = (element: HTMLElement) => {
    setTimeout(() => {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }, 300); // 키보드 애니메이션 후 스크롤
  };

  return { scrollToInput };
}

export default MobileKeyboardFix;