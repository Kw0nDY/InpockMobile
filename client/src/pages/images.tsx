import { useState, useRef, useEffect } from "react";
import { Plus, Upload, Trash2, Camera, ChevronLeft, ChevronRight, Edit3, Settings, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface ImageUpload {
  id: number;
  title: string | null;
  description: string | null;
  filePath: string;
  displayOrder: number;
  createdAt: string;
}

export default function ImagesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isManageMode, setIsManageMode] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get images ordered by displayOrder
  const { data: images = [], isLoading } = useQuery({
    queryKey: [`/api/media/${user?.id}/image`],
    enabled: !!user?.id,
  });

  const uploadImageMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to upload image');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/media/${user?.id}/image`] });
      resetForm();
      toast({
        title: "이미지 업로드 완료",
        description: "새로운 이미지가 성공적으로 업로드되었습니다.",
      });
    },
    onError: () => {
      toast({
        title: "이미지 업로드 실패",
        description: "이미지 업로드 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: number) => {
      const response = await fetch(`/api/media/${imageId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete image');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/media/${user?.id}/image`] });
      toast({
        title: "이미지 삭제 완료",
        description: "이미지가 성공적으로 삭제되었습니다.",
      });
    },
  });

  const reorderImagesMutation = useMutation({
    mutationFn: async (orderedIds: number[]) => {
      const response = await fetch('/api/media/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          mediaType: 'image',
          orderedIds
        })
      });
      if (!response.ok) throw new Error('Failed to reorder images');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/media/${user?.id}/image`] });
    },
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSelectedFiles([]);
    setPreviewUrls([]);
    setIsModalOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      toast({
        title: "잘못된 파일 형식",
        description: "이미지 파일만 업로드할 수 있습니다.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFiles(imageFiles);
    
    // Create preview URLs
    const urls = imageFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "파일을 선택해주세요",
        description: "업로드할 이미지를 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Upload each file
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', user?.id?.toString() || '');
        formData.append('type', 'image');
        formData.append('title', title || file.name.replace(/\.[^/.]+$/, ""));
        formData.append('description', description || '');

        await uploadImageMutation.mutateAsync(formData);
      }
      
      toast({
        title: "모든 이미지 업로드 완료",
        description: `${selectedFiles.length}개의 이미지가 성공적으로 업로드되었습니다.`,
      });
    } catch (error) {
      toast({
        title: "업로드 중 오류 발생",
        description: "일부 이미지 업로드에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const imageList = Array.from(images as any[]);
    if (toIndex < 0 || toIndex >= imageList.length) return;

    const [movedItem] = imageList.splice(fromIndex, 1);
    imageList.splice(toIndex, 0, movedItem);

    const orderedIds = imageList.map((item: any) => item.id);
    reorderImagesMutation.mutate(orderedIds);
  };

  const getImageUrl = (image: any) => {
    return image.filePath || image.mediaUrl || '/placeholder-image.jpg';
  };

  const nextImage = () => {
    if ((images as any[]).length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % (images as any[]).length);
    }
  };

  const prevImage = () => {
    if ((images as any[]).length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + (images as any[]).length) % (images as any[]).length);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isManageMode && (images as any[]).length > 0) {
        if (event.key === 'ArrowLeft') {
          prevImage();
        } else if (event.key === 'ArrowRight') {
          nextImage();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isManageMode, images]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#4E342E]">
        <div className="text-center text-white">
          <Camera className="w-16 h-16 mx-auto mb-4 animate-pulse" />
          <p className="text-lg">갤러리를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // No images state
  if ((images as any[]).length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#4E342E] to-[#3E2723] text-white relative">
        <Camera className="w-24 h-24 mb-6 text-white/70" />
        <h2 className="text-3xl font-bold mb-3">아트 갤러리</h2>
        <p className="text-lg text-white/80 mb-8 text-center max-w-md">
          첫 번째 작품을 업로드하여 당신만의 디지털 갤러리를 시작하세요
        </p>
        
        <Button 
          onClick={() => setIsModalOpen(true)} 
          size="lg" 
          className="bg-white text-[#4E342E] hover:bg-white/90 font-bold py-4 px-8 text-lg rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl transform hover:scale-105"
        >
          <Plus className="w-6 h-6 mr-3" />
          첫 작품 업로드
        </Button>

        {/* Settings button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 text-white/70 hover:text-white hover:bg-white/10"
          onClick={() => setIsManageMode(true)}
        >
          <Settings className="w-6 h-6" />
        </Button>
      </div>
    );
  }

  // Management mode
  if (isManageMode) {
    return (
      <div className="h-screen flex flex-col bg-background">
        {/* Header */}
        <div className="p-4 border-b border-border bg-card flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">갤러리 관리</h1>
            <p className="text-sm text-muted-foreground">
              이미지 순서 변경 및 관리
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setIsManageMode(false)}
          >
            갤러리 보기
          </Button>
        </div>

        {/* Scrollable Image Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-4">
            {(images as any[]).map((image: any, index: number) => (
              <Card key={image.id} className="overflow-hidden">
                <CardContent className="p-0 relative">
                  {/* Priority Badge */}
                  <div className="absolute top-2 left-2 z-10 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium">
                    #{index + 1}
                  </div>

                  {/* Reorder Controls */}
                  <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-6 w-6 p-0 bg-black/50 hover:bg-black/70"
                      onClick={() => moveImage(index, index - 1)}
                      disabled={index === 0}
                    >
                      <ArrowUp className="w-3 h-3 text-white" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-6 w-6 p-0 bg-black/50 hover:bg-black/70"
                      onClick={() => moveImage(index, index + 1)}
                      disabled={index === (images as any[]).length - 1}
                    >
                      <ArrowDown className="w-3 h-3 text-white" />
                    </Button>
                  </div>

                  {/* Image */}
                  <div className="aspect-square relative">
                    <img
                      src={getImageUrl(image)}
                      alt={image.title || `이미지 ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder-image.jpg';
                      }}
                    />
                    
                    {/* Delete Button */}
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute bottom-2 right-2 h-8 w-8 p-0"
                      onClick={() => deleteImageMutation.mutate(image.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Image Info */}
                  {(image.title || image.description) && (
                    <div className="p-3 bg-card">
                      {image.title && (
                        <h4 className="font-medium text-foreground text-sm truncate">
                          {image.title}
                        </h4>
                      )}
                      {image.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {image.description}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Add Button */}
        <div className="p-4 pb-24 bg-background border-t border-border">
          <Button 
            onClick={() => setIsModalOpen(true)} 
            size="lg" 
            className="w-full bg-[#4E342E] hover:bg-[#3E2723] text-white font-bold py-4 text-lg rounded-xl"
          >
            <Plus className="w-6 h-6 mr-3" />
            이미지 추가하기
          </Button>
        </div>
      </div>
    );
  }

  // Full-screen gallery view
  const currentImage = (images as any[])[currentImageIndex];
  
  return (
    <div>
      <div className="h-screen relative overflow-hidden bg-black">
        {/* Full-screen background image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-500 ease-in-out"
          style={{
            backgroundImage: `url(${getImageUrl(currentImage)})`,
          }}
        >
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-black/40"></div>
        </div>

        {/* Content overlay */}
        <div className="relative z-10 h-full flex flex-col justify-between p-6 text-white">
          
          {/* Top bar */}
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-medium">
                {currentImageIndex + 1} / {(images as any[]).length}
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              className="text-white/70 hover:text-white hover:bg-white/10 backdrop-blur-sm"
              onClick={() => setIsManageMode(true)}
            >
              <Settings className="w-6 h-6" />
            </Button>
          </div>

          {/* Center content */}
          <div className="flex-1 flex items-end pb-20">
            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight drop-shadow-lg">
                {currentImage?.title || "갤러리 작품"}
              </h1>
              
              {currentImage?.description && (
                <p className="text-lg md:text-xl text-white/90 leading-relaxed drop-shadow-md">
                  {currentImage.description}
                </p>
              )}
            </div>
          </div>

          {/* Bottom navigation */}
          <div className="flex justify-center items-center gap-6">
            
            {/* Previous button */}
            <Button
              variant="ghost"
              size="icon"
              className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all duration-200 disabled:opacity-30"
              onClick={prevImage}
              disabled={(images as any[]).length <= 1}
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>

            {/* Image indicators */}
            <div className="flex gap-2">
              {(images as any[]).map((_, index) => (
                <button
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all duration-200 ${
                    index === currentImageIndex 
                      ? 'bg-white' 
                      : 'bg-white/30 hover:bg-white/50'
                  }`}
                  onClick={() => setCurrentImageIndex(index)}
                />
              ))}
            </div>

            {/* Next button */}
            <Button
              variant="ghost"
              size="icon"
              className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all duration-200 disabled:opacity-30"
              onClick={nextImage}
              disabled={(images as any[]).length <= 1}
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>

          {/* Add image floating button */}
          <Button
            onClick={() => setIsModalOpen(true)}
            size="icon"
            className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-[#4E342E] hover:bg-[#3E2723] text-white shadow-2xl transition-all duration-200 hover:scale-110"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Upload Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>이미지 업로드</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 flex-1 overflow-y-auto">
            {/* File Input */}
            <div
              className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                클릭하여 이미지를 선택하세요
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG, GIF 파일 지원 • 여러 파일 선택 가능
              </p>
              {selectedFiles.length > 0 && (
                <p className="text-xs text-primary mt-2 font-medium">
                  {selectedFiles.length}개 파일 선택됨
                </p>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Preview */}
            {previewUrls.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">미리보기 ({previewUrls.length}개)</h4>
                <div className="max-h-40 overflow-y-auto border rounded-lg p-2">
                  <div className="grid grid-cols-2 gap-2">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="aspect-square relative">
                        <img
                          src={url}
                          alt={`미리보기 ${index + 1}`}
                          className="w-full h-full object-cover rounded"
                        />
                        <div className="absolute top-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Title Input */}
            <div>
              <label className="text-sm font-medium">제목 (선택사항)</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="이미지 제목을 입력하세요"
                className="mt-1"
              />
            </div>

            {/* Description Input */}
            <div>
              <label className="text-sm font-medium">설명 (선택사항)</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="이미지 설명을 입력하세요"
                className="mt-1"
              />
            </div>

          </div>
          
          {/* Action Buttons - Fixed at bottom */}
          <div className="flex gap-2 pt-4 border-t border-border bg-background">
            <Button variant="outline" onClick={resetForm} className="flex-1">
              취소
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={selectedFiles.length === 0 || uploadImageMutation.isPending}
              className="flex-1"
            >
              {uploadImageMutation.isPending ? "업로드 중..." : 
               selectedFiles.length > 1 ? `${selectedFiles.length}개 업로드` : "업로드"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}