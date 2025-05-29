import { ArrowLeft, LucideIcon } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  rightIcon?: LucideIcon;
  rightAction?: {
    text: string;
    onClick: () => void;
  };
}

export default function Header({ 
  title, 
  showBackButton = false, 
  rightIcon: RightIcon,
  rightAction 
}: HeaderProps) {
  const [, setLocation] = useLocation();

  const handleBack = () => {
    setLocation("/dashboard");
  };

  return (
    <header className="flex items-center justify-between p-4 bg-white border-b border-gray-100">
      {showBackButton ? (
        <button onClick={handleBack} className="p-2">
          <ArrowLeft className="w-6 h-6 text-dark" />
        </button>
      ) : (
        <div className="w-10" />
      )}
      
      <h1 className="text-lg font-medium korean-text">{title}</h1>
      
      {rightAction ? (
        <Button
          onClick={rightAction.onClick}
          variant="ghost"
          className="text-primary font-medium p-2"
        >
          {rightAction.text}
        </Button>
      ) : RightIcon ? (
        <button className="p-2">
          <RightIcon className="w-6 h-6 text-gray-600" />
        </button>
      ) : (
        <div className="w-10" />
      )}
    </header>
  );
}
