import { useState, useEffect } from 'react';
import { X, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OnboardingStep {
  id: string;
  target: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

interface OnboardingTooltipProps {
  steps: OnboardingStep[];
  onComplete: () => void;
  show: boolean;
}

export function OnboardingTooltip({ steps, onComplete, show }: OnboardingTooltipProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!show || currentStep >= steps.length) return;

    const step = steps[currentStep];
    const element = document.querySelector(step.target) as HTMLElement;
    
    if (element) {
      setTargetElement(element);
      // 요소를 화면에 보이도록 스크롤
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // 요소 강조
      element.style.position = 'relative';
      element.style.zIndex = '1000';
      element.style.outline = '2px solid #3B82F6';
      element.style.outlineOffset = '4px';
      element.style.borderRadius = '8px';
    }

    return () => {
      if (element) {
        element.style.position = '';
        element.style.zIndex = '';
        element.style.outline = '';
        element.style.outlineOffset = '';
        element.style.borderRadius = '';
      }
    };
  }, [currentStep, steps, show]);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const skipTour = () => {
    onComplete();
  };

  if (!show || currentStep >= steps.length || !targetElement) {
    return null;
  }

  const step = steps[currentStep];
  const rect = targetElement.getBoundingClientRect();
  
  const getTooltipPosition = () => {
    const tooltipWidth = 280;
    const tooltipHeight = 120;
    
    switch (step.position) {
      case 'top':
        return {
          top: rect.top - tooltipHeight - 10,
          left: rect.left + (rect.width - tooltipWidth) / 2,
        };
      case 'bottom':
        return {
          top: rect.bottom + 10,
          left: rect.left + (rect.width - tooltipWidth) / 2,
        };
      case 'left':
        return {
          top: rect.top + (rect.height - tooltipHeight) / 2,
          left: rect.left - tooltipWidth - 10,
        };
      case 'right':
        return {
          top: rect.top + (rect.height - tooltipHeight) / 2,
          left: rect.right + 10,
        };
      default:
        return {
          top: rect.bottom + 10,
          left: rect.left + (rect.width - tooltipWidth) / 2,
        };
    }
  };

  const position = getTooltipPosition();

  return (
    <>
      {/* 오버레이 */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" />
      
      {/* 툴팁 */}
      <div
        className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4 max-w-xs"
        style={{
          top: Math.max(10, Math.min(position.top, window.innerHeight - 140)),
          left: Math.max(10, Math.min(position.left, window.innerWidth - 290)),
        }}
      >
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-gray-900 text-sm">{step.title}</h3>
          <button onClick={skipTour} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <p className="text-gray-600 text-sm mb-4 leading-relaxed">
          {step.description}
        </p>
        
        <div className="flex justify-between items-center">
          <div className="flex space-x-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentStep ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={skipTour}
              className="text-xs"
            >
              건너뛰기
            </Button>
            <Button
              size="sm"
              onClick={nextStep}
              className="text-xs"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  <Check className="w-3 h-3 mr-1" />
                  완료
                </>
              ) : (
                <>
                  다음
                  <ArrowRight className="w-3 h-3 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export default OnboardingTooltip;