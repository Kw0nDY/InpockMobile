import { useState, useRef } from "react";
import { Plus, Upload, Trash2, GripVertical, Camera, ArrowUp, ArrowDown } from "lucide-react";
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

    // Upload each file
    for (const file of selectedFiles) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', user?.id?.toString() || '');
      formData.append('type', 'image');
      formData.append('title', title || file.name);
      formData.append('description', description || '');

      await uploadImageMutation.mutateAsync(formData);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="aspect-square bg-muted rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card">
        <div>
          <h1 className="text-xl font-bold text-foreground">이미지 관리</h1>
          <p className="text-sm text-muted-foreground">
            사용할 이미지를 업로드하고 우선순위를 설정하세요
          </p>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="p-4">
        {(images as any[]).length === 0 ? (
          <div className="text-center py-12">
            <Camera className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">이미지가 없습니다</h3>
            <p className="text-muted-foreground mb-4">
              첫 번째 이미지를 업로드하여 갤러리를 시작하세요
            </p>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              이미지 추가하기
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
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
            
            {/* Add More Images Button */}
            <div className="text-center pt-4">
              <Button onClick={() => setIsModalOpen(true)} size="lg" className="w-full max-w-sm">
                <Plus className="w-5 h-5 mr-2" />
                이미지 추가하기
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>이미지 업로드</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
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
                PNG, JPG, GIF 파일 지원
              </p>
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
                <h4 className="text-sm font-medium">미리보기</h4>
                <div className="grid grid-cols-2 gap-2">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="aspect-square relative">
                      <img
                        src={url}
                        alt={`미리보기 ${index + 1}`}
                        className="w-full h-full object-cover rounded"
                      />
                    </div>
                  ))}
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

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={resetForm} className="flex-1">
                취소
              </Button>
              <Button 
                onClick={handleUpload} 
                disabled={selectedFiles.length === 0 || uploadImageMutation.isPending}
                className="flex-1"
              >
                {uploadImageMutation.isPending ? "업로드 중..." : "업로드"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}