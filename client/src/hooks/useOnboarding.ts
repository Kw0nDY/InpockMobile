import { useState, useEffect } from 'react';

const ONBOARDING_STORAGE_KEY = 'amusefit_onboarding_completed';

export interface OnboardingStep {
  id: string;
  target: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

export const DASHBOARD_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    target: '[data-onboarding="profile-card"]',
    title: '환영합니다!',
    description: '이곳에서 프로필 정보와 방문자 수를 확인할 수 있습니다.',
    position: 'bottom'
  },
  {
    id: 'upload',
    target: '[data-onboarding="upload-button"]',
    title: '콘텐츠 업로드',
    description: '운동 동영상, 사진, 링크를 업로드하여 포트폴리오를 만들어보세요.',
    position: 'bottom'
  },
  {
    id: 'stats',
    target: '[data-onboarding="stats-section"]',
    title: '통계 확인',
    description: '방문자 수와 링크 클릭 수 등 상세한 통계를 확인할 수 있습니다.',
    position: 'top'
  },
  {
    id: 'navigation',
    target: '[data-onboarding="bottom-nav"]',
    title: '메뉴 탐색',
    description: '하단 메뉴를 통해 이미지, 동영상, 링크, 설정을 관리할 수 있습니다.',
    position: 'top'
  }
];

export const SETTINGS_STEPS: OnboardingStep[] = [
  {
    id: 'profile-settings',
    target: '[data-onboarding="profile-section"]',
    title: '프로필 설정',
    description: '사진, 소개글, 연락처 등 기본 정보를 설정할 수 있습니다.',
    position: 'bottom'
  },
  {
    id: 'display-settings',
    target: '[data-onboarding="display-section"]',
    title: '화면 설정',
    description: '테마, 레이아웃 등 공개 프로필 화면을 커스터마이징할 수 있습니다.',
    position: 'bottom'
  },
  {
    id: 'url-settings',
    target: '[data-onboarding="url-section"]',
    title: 'URL 설정',
    description: '개인 전용 URL을 설정하여 더 쉽게 공유할 수 있습니다.',
    position: 'bottom'
  }
];

export function useOnboarding() {
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (completed) {
      setCompletedSteps(JSON.parse(completed));
    }
  }, []);

  const isStepCompleted = (stepId: string) => {
    return completedSteps.includes(stepId);
  };

  const markStepCompleted = (stepId: string) => {
    const newCompleted = [...completedSteps, stepId];
    setCompletedSteps(newCompleted);
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(newCompleted));
  };

  const markAllCompleted = (stepIds: string[]) => {
    const newCompleted = [...new Set([...completedSteps, ...stepIds])];
    setCompletedSteps(newCompleted);
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(newCompleted));
  };

  const shouldShowOnboarding = (steps: OnboardingStep[]) => {
    return !steps.every(step => completedSteps.includes(step.id));
  };

  const resetOnboarding = () => {
    setCompletedSteps([]);
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  };

  const startOnboarding = () => {
    setShowOnboarding(true);
  };

  const completeOnboarding = (steps: OnboardingStep[]) => {
    markAllCompleted(steps.map(step => step.id));
    setShowOnboarding(false);
  };

  return {
    completedSteps,
    showOnboarding,
    isStepCompleted,
    markStepCompleted,
    markAllCompleted,
    shouldShowOnboarding,
    resetOnboarding,
    startOnboarding,
    completeOnboarding,
    setShowOnboarding
  };
}

export default useOnboarding;