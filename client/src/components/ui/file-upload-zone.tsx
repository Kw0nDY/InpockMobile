import { useState, useRef } from "react";
import { Upload, Image, Video, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import UploadProgress from "./upload-progress";

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number; // MB 단위
  allowedTypes?: string[];
  multiple?: boolean;
  className?: string;
}

export function FileUploadZone({
  onFileSelect,
  accept = "image/*,video/*",
  maxSize = 50,
  allowedTypes = ["image/jpeg", "image/png", "image/gif", "video/mp4", "video/mov"],
  multiple = false,
  className = ""
}: FileUploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // 파일 크기 검사
    if (file.size > maxSize * 1024 * 1024) {
      return { valid: false, error: `파일 크기는 ${maxSize}MB를 초과할 수 없습니다.` };
    }

    // 파일 타입 검사
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: "지원하지 않는 파일 형식입니다." };
    }

    return { valid: true };
  };

  const handleFileSelect = async (file: File) => {
    const validation = validateFile(file);
    
    if (!validation.valid) {
      setErrorMessage(validation.error || "파일이 유효하지 않습니다.");
      setUploadStatus('error');
      return;
    }

    setSelectedFile(file);
    setUploadStatus('uploading');
    setUploadProgress(0);
    setErrorMessage("");

    try {
      // 프로그레스 시뮬레이션
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 20;
        });
      }, 200);

      // 실제 파일 업로드
      await onFileSelect(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadStatus('success');
      
      // 3초 후 상태 초기화
      setTimeout(() => {
        setUploadStatus('idle');
        setSelectedFile(null);
        setUploadProgress(0);
      }, 3000);

    } catch (error) {
      setUploadStatus('error');
      setErrorMessage(error instanceof Error ? error.message : "업로드에 실패했습니다.");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const resetUpload = () => {
    setUploadStatus('idle');
    setSelectedFile(null);
    setUploadProgress(0);
    setErrorMessage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="w-8 h-8 text-blue-500" />;
    } else if (file.type.startsWith('video/')) {
      return <Video className="w-8 h-8 text-purple-500" />;
    }
    return <Upload className="w-8 h-8 text-gray-400" />;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer
          ${dragOver 
            ? 'border-blue-400 bg-blue-50' 
            : uploadStatus === 'error'
              ? 'border-red-300 bg-red-50'
              : 'border-gray-300 hover:border-gray-400'
          }
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInputChange}
          className="hidden"
        />
        
        <div className="space-y-4">
          <Upload className={`w-12 h-12 mx-auto ${dragOver ? 'text-blue-500' : 'text-gray-400'}`} />
          
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-900">
              파일을 드래그하거나 클릭하여 업로드
            </p>
            <p className="text-sm text-gray-500">
              {allowedTypes.includes("image/jpeg") && "이미지"} 
              {allowedTypes.includes("video/mp4") && allowedTypes.includes("image/jpeg") && ", "}
              {allowedTypes.includes("video/mp4") && "동영상"} 
              파일 (최대 {maxSize}MB)
            </p>
          </div>
          
          <Button type="button" variant="outline" size="sm">
            파일 선택
          </Button>
        </div>
      </div>

      {/* 업로드 진행 상태 */}
      {uploadStatus !== 'idle' && (
        <UploadProgress
          progress={uploadProgress}
          status={uploadStatus}
          fileName={selectedFile?.name}
          errorMessage={errorMessage}
        />
      )}

      {/* 파일 크기 및 형식 안내 */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• 지원 형식: JPG, PNG, GIF, MP4, MOV</p>
        <p>• 최대 크기: {maxSize}MB</p>
        <p>• 이미지는 자동으로 최적화됩니다</p>
      </div>
    </div>
  );
}

export default FileUploadZone;