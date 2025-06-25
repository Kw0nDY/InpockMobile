import { Upload, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface UploadProgressProps {
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  fileName?: string;
  errorMessage?: string;
  className?: string;
}

export function UploadProgress({ 
  progress, 
  status, 
  fileName, 
  errorMessage,
  className = "" 
}: UploadProgressProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-600" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Upload className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'uploading':
        return `업로드 중... ${Math.round(progress)}%`;
      case 'success':
        return '업로드 완료';
      case 'error':
        return errorMessage || '업로드 실패';
      default:
        return '파일을 선택하세요';
    }
  };

  const getProgressColor = () => {
    switch (status) {
      case 'success':
        return 'bg-green-600';
      case 'error':
        return 'bg-red-600';
      default:
        return 'bg-blue-600';
    }
  };

  if (status === 'idle') return null;

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className="text-sm font-medium text-gray-900">
            {fileName || '파일'}
          </span>
        </div>
        <span className="text-xs text-gray-500">
          {getStatusText()}
        </span>
      </div>
      
      {status === 'uploading' && (
        <Progress 
          value={progress} 
          className="h-2"
          indicatorClassName={getProgressColor()}
        />
      )}
      
      {status === 'error' && errorMessage && (
        <p className="text-xs text-red-600 mt-1">{errorMessage}</p>
      )}
    </div>
  );
}

export default UploadProgress;