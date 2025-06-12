import { useState, useRef } from "react";
import { Plus, Upload, Trash2, ArrowUp, ArrowDown, Play, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface VideoUpload {
  id: number;
  title: string | null;
  description: string | null;
  filePath: string;
  displayOrder: number;
  createdAt: string;
}

export default function VideosPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get videos ordered by displayOrder
  const { data: videos = [], isLoading } = useQuery({
    queryKey: [`/api/media/${user?.id}/video`],
    enabled: !!user?.id,
  });

  const uploadVideoMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to upload video');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/media/${user?.id}/video`] });
      resetForm();
      toast({
        title: "동영상 업로드 완료",
        description: "새로운 동영상이 성공적으로 업로드되었습니다.",
      });
    },
    onError: () => {
      toast({
        title: "동영상 업로드 실패",
        description: "동영상 업로드 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const deleteVideoMutation = useMutation({
    mutationFn: async (videoId: number) => {
      const response = await fetch(`/api/media/${videoId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete video');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/media/${user?.id}/video`] });
      toast({
        title: "동영상 삭제 완료",
        description: "동영상이 성공적으로 삭제되었습니다.",
      });
    },
  });

  const reorderVideosMutation = useMutation({
    mutationFn: async (orderedIds: number[]) => {
      const response = await fetch('/api/media/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          mediaType: 'video',
          orderedIds
        })
      });
      if (!response.ok) throw new Error('Failed to reorder videos');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/media/${user?.id}/video`] });
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
    const videoFiles = files.filter(file => file.type.startsWith('video/'));
    
    if (videoFiles.length === 0) {
      toast({
        title: "잘못된 파일 형식",
        description: "동영상 파일만 업로드할 수 있습니다.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFiles(videoFiles);
    
    // Create preview URLs
    const urls = videoFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);
  };

  const handleUpload = async () => {
    if (!user?.id) {
      toast({
        title: "로그인이 필요합니다",
        description: "동영상을 업로드하려면 로그인해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (selectedFiles.length === 0) {
      toast({
        title: "파일을 선택해주세요",
        description: "업로드할 동영상을 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    // Upload each file
    for (const file of selectedFiles) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', user.id.toString());
      formData.append('type', 'video');
      formData.append('title', title || file.name);
      formData.append('description', description || '');

      await uploadVideoMutation.mutateAsync(formData);
    }
  };

  const moveVideo = (fromIndex: number, toIndex: number) => {
    const videoList = Array.from(videos as any[]);
    if (toIndex < 0 || toIndex >= videoList.length) return;

    const [movedItem] = videoList.splice(fromIndex, 1);
    videoList.splice(toIndex, 0, movedItem);

    const orderedIds = videoList.map((item: any) => item.id);
    reorderVideosMutation.mutate(orderedIds);
  };

  const getVideoUrl = (video: any) => {
    return video.filePath || video.mediaUrl || '';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="aspect-video bg-muted rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Fixed Header */}
      <div className="p-4 border-b border-border bg-card flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-foreground">동영상 관리</h1>
          <p className="text-sm text-muted-foreground">
            사용할 동영상을 업로드하고 우선순위를 설정하세요
          </p>
        </div>
      </div>

      {/* Scrollable Video Gallery */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          {(videos as any[]).length === 0 ? (
            <div className="text-center py-12">
              <Video className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">동영상이 없습니다</h3>
              <p className="text-muted-foreground mb-4">
                첫 번째 동영상을 업로드하여 갤러리를 시작하세요
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
            {(videos as any[]).map((video: any, index: number) => (
              <Card key={video.id} className="overflow-hidden">
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
                      onClick={() => moveVideo(index, index - 1)}
                      disabled={index === 0}
                    >
                      <ArrowUp className="w-3 h-3 text-white" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-6 w-6 p-0 bg-black/50 hover:bg-black/70"
                      onClick={() => moveVideo(index, index + 1)}
                      disabled={index === (videos as any[]).length - 1}
                    >
                      <ArrowDown className="w-3 h-3 text-white" />
                    </Button>
                  </div>

                  {/* Video */}
                  <div className="aspect-video relative">
                    <video
                      src={getVideoUrl(video)}
                      className="w-full h-full object-cover rounded-t"
                      controls
                      preload="metadata"
                    />
                    
                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center">
                        <Play className="w-6 h-6 text-white ml-1" />
                      </div>
                    </div>
                    
                    {/* Delete Button */}
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute bottom-2 right-2 h-8 w-8 p-0"
                      onClick={() => deleteVideoMutation.mutate(video.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Video Info */}
                  {(video.title || video.description) && (
                    <div className="p-3 bg-card">
                      {video.title && (
                        <h4 className="font-medium text-foreground text-sm truncate">
                          {video.title}
                        </h4>
                      )}
                      {video.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {video.description}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            </div>
          )}
        </div>
      </div>

      {/* Fixed Add Button at Bottom */}
      <div className="p-4 pb-24 bg-background border-t border-border flex-shrink-0">
        <Button 
          onClick={() => setIsModalOpen(true)} 
          size="lg" 
          className="w-full bg-[#4E342E] hover:bg-[#3E2723] text-white font-bold py-4 text-lg rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl transform hover:scale-[1.02]"
        >
          <Plus className="w-6 h-6 mr-3" />
          동영상 추가하기
        </Button>
      </div>

      {/* Upload Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>동영상 업로드</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {/* File Input */}
            <div
              className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                클릭하여 동영상을 선택하세요
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                MP4, MOV, AVI 파일 지원
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Preview */}
            {previewUrls.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">미리보기</h4>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="aspect-video relative">
                      <video
                        src={url}
                        className="w-full h-full object-cover rounded"
                        controls
                        preload="metadata"
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
                placeholder="동영상 제목을 입력하세요"
                className="mt-1"
              />
            </div>

            {/* Description Input */}
            <div>
              <label className="text-sm font-medium">설명 (선택사항)</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="동영상 설명을 입력하세요"
                className="mt-1"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 flex-shrink-0 border-t border-border">
            <Button variant="outline" onClick={resetForm} className="flex-1">
              취소
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={selectedFiles.length === 0 || uploadVideoMutation.isPending}
              className="flex-1"
            >
              {uploadVideoMutation.isPending ? "업로드 중..." : "업로드"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}