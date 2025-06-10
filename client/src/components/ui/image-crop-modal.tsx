import { useState, useRef, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onCropComplete: (croppedImageBlob: Blob) => void;
}

export function ImageCropModal({ isOpen, onClose, imageUrl, onCropComplete }: ImageCropModalProps) {
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 80,
    height: 80,
    x: 10,
    y: 10
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    
    // 정사각형 크롭 설정 (프로필 이미지용)
    const size = Math.min(width, height) * 0.8;
    const x = (width - size) / 2;
    const y = (height - size) / 2;
    
    setCrop({
      unit: 'px',
      width: size,
      height: size,
      x,
      y
    });
  }, []);

  const getCroppedImage = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!completedCrop || !imgRef.current || !canvasRef.current) {
        resolve(null);
        return;
      }

      const image = imgRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(null);
        return;
      }

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      // 캔버스 크기를 크롭 영역에 맞게 설정
      canvas.width = completedCrop.width;
      canvas.height = completedCrop.height;

      ctx.imageSmoothingQuality = 'high';

      ctx.drawImage(
        image,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        completedCrop.width,
        completedCrop.height
      );

      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.9);
    });
  }, [completedCrop]);

  const handleSave = async () => {
    try {
      const croppedBlob = await getCroppedImage();
      if (croppedBlob) {
        onCropComplete(croppedBlob);
        onClose();
        toast({
          title: "이미지 자르기 완료",
          description: "프로필 이미지가 성공적으로 자르기되었습니다.",
        });
      } else {
        toast({
          title: "자르기 실패",
          description: "이미지 자르기에 실패했습니다. 다시 시도해주세요.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Crop error:', error);
      toast({
        title: "자르기 실패",
        description: "이미지 자르기 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>프로필 이미지 자르기</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="max-h-96 overflow-auto flex justify-center">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={1} // 정사각형 비율 강제
              minWidth={50}
              minHeight={50}
            >
              <img
                ref={imgRef}
                src={imageUrl}
                alt="자르기할 이미지"
                onLoad={onImageLoad}
                className="max-w-full h-auto"
              />
            </ReactCrop>
          </div>
          
          <p className="text-sm text-gray-600 text-center">
            드래그하여 원하는 영역을 선택하세요. 정사각형으로 자르기됩니다.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={!completedCrop}>
            자르기 완료
          </Button>
        </DialogFooter>

        {/* 숨겨진 캔버스 (이미지 자르기용) */}
        <canvas
          ref={canvasRef}
          style={{ display: 'none' }}
        />
      </DialogContent>
    </Dialog>
  );
}