import { useState, useRef } from "react";
import { Plus, X, Upload, Trash2, Download, Share2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function ImagesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: images, isLoading } = useQuery({
    queryKey: [`/api/media/${user?.id}`],
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
      queryClient.invalidateQueries({ queryKey: [`/api/media/${user?.id}`] });
      setTitle("");
      setDescription("");
      setSelectedFile(null);
      setPreviewUrl("");
      setIsModalOpen(false);
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
      queryClient.invalidateQueries({ queryKey: [`/api/media/${user?.id}`] });
      toast({
        title: "이미지 삭제 완료",
        description: "이미지가 성공적으로 삭제되었습니다.",
      });
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        toast({
          title: "파일 형식 오류",
          description: "이미지 파일만 업로드할 수 있습니다.",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !user?.id) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('userId', user.id.toString());
    formData.append('type', 'image');
    if (title) formData.append('title', title);
    if (description) formData.append('description', description);

    uploadImageMutation.mutate(formData);
  };

  const handleCopyUrl = (imageUrl: string) => {
    navigator.clipboard.writeText(imageUrl);
    toast({
      title: "URL 복사됨",
      description: "이미지 URL이 클립보드에 복사되었습니다.",
    });
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Images Section */}
        <div className="p-4 relative min-h-[calc(100vh-5rem)]">
          {/* Add Button inside section */}
          <div className="absolute bottom-4 right-4 z-10">
            <Button
              onClick={() => setIsModalOpen(true)}
              className="w-12 h-12 rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-lg"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : images && Array.isArray(images) && images.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {images
                .filter((media: any) => media.mediaType === 'image')
                .map((image: any) => {
                  const imageUrl = image.mediaUrl || image.filePath;
                  const imageTitle = image.title || image.fileName || '이미지';
                  
                  return (
                    <Card key={image.id} className="bg-white shadow-sm overflow-hidden">
                      <div className="aspect-square relative">
                        <img
                          src={imageUrl}
                          alt={imageTitle}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                        <div className="hidden w-full h-full flex items-center justify-center bg-gray-100 absolute inset-0">
                          <div className="text-center">
                            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                            <p className="text-xs text-gray-500">이미지를 불러올 수 없습니다</p>
                          </div>
                        </div>
                        <div className="absolute top-2 right-2 flex space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopyUrl(imageUrl)}
                            className="p-1 bg-black/50 hover:bg-black/70 text-white rounded"
                          >
                            <Share2 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteImageMutation.mutate(image.id)}
                            disabled={deleteImageMutation.isPending}
                            className="p-1 bg-black/50 hover:bg-red-600 text-white rounded"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      {(image.title || image.description) && (
                        <CardContent className="p-3">
                          {image.title && (
                            <h3 className="font-medium text-sm text-gray-900 mb-1">{image.title}</h3>
                          )}
                          {image.description && (
                            <p className="text-xs text-gray-600">{image.description}</p>
                          )}
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-2">아직 업로드된 이미지가 없습니다</p>
              <p className="text-sm text-gray-400">+ 버튼을 눌러 새 이미지를 추가해보세요</p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">이미지 업로드</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-4">
              <form onSubmit={handleUpload} className="space-y-4">
                {/* File Upload */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">이미지 선택 *</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                  >
                    {previewUrl ? (
                      <div className="relative w-full h-full">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                          <p className="text-white text-sm">클릭하여 변경</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">이미지를 선택하세요</p>
                        <p className="text-xs text-gray-400">JPG, PNG, GIF 지원</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">제목 (선택사항)</label>
                  <Input
                    type="text"
                    placeholder="이미지 제목을 입력하세요"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">설명 (선택사항)</label>
                  <Input
                    type="text"
                    placeholder="이미지 설명을 입력하세요"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={uploadImageMutation.isPending || !selectedFile}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-medium disabled:bg-gray-300"
                >
                  {uploadImageMutation.isPending ? "업로드 중..." : "업로드 완료"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}