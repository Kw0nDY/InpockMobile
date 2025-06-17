import { useState, useRef, useCallback } from "react";
import { Plus, X, Eye, TrendingUp, ExternalLink, Trash2, Copy, Upload, Camera, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

type LinkStyle = 'thumbnail' | 'simple' | 'card' | 'background';

const THUMBNAIL: LinkStyle = 'thumbnail';
const SIMPLE: LinkStyle = 'simple';
const CARD: LinkStyle = 'card';
const BACKGROUND: LinkStyle = 'background';

export default function LinksPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [selectedStyle, setSelectedStyle] = useState<LinkStyle>(THUMBNAIL);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [showImageCrop, setShowImageCrop] = useState(false);
  const [crop, setCrop] = useState<any>({ unit: '%', width: 90, aspect: 16 / 9 });
  const [completedCrop, setCompletedCrop] = useState<any>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: linksData, isLoading } = useQuery({
    queryKey: [`/api/links/${user?.id}`],
    enabled: !!user?.id,
    refetchInterval: 5000, // Auto-refresh every 5 seconds to show updated click counts
  });

  // Hook to get individual link statistics
  const useIndividualLinkStats = (linkId: number) => {
    return useQuery({
      queryKey: [`/api/links/${linkId}/stats`],
      enabled: !!linkId,
      refetchInterval: 5000, // Auto-refresh individual link stats
    });
  };

  // Component to display individual link stats
  const LinkStatsDisplay = ({ linkId }: { linkId: number }) => {
    const { data: stats } = useIndividualLinkStats(linkId);
    return (
      <div className="text-xs text-gray-500 mt-1 flex gap-3">
        <span>내 방문: {(stats as any)?.ownerVisits || 0}</span>
        <span>외부 방문: {(stats as any)?.externalVisits || 0}</span>
      </div>
    );
  };

  // Get overall user statistics for the top summary
  const { data: userStats } = useQuery({
    queryKey: [`/api/user/${user?.id}/link-stats`],
    enabled: !!user?.id,
    refetchInterval: 5000,
  });

  const links = Array.isArray(linksData) ? linksData : [];

  const createLinkMutation = useMutation({
    mutationFn: async (data: { 
      title: string; 
      originalUrl: string; 
      userId: number; 
      shortCode: string; 
      style?: string;
      description?: string;
      imageUrl?: string;
      customImageUrl?: string;
      cropData?: string;
    }) => {
      // Validate data size and compress if needed
      let processedData = { ...data };
      
      // If image data is too large, reduce quality
      if (data.imageUrl && data.imageUrl.startsWith('data:image/')) {
        const sizeInMB = data.imageUrl.length / (1024 * 1024);
        if (sizeInMB > 10) {
          // Data too large, remove image to prevent server error
          processedData.imageUrl = undefined;
          console.warn('Image too large, removing from submission');
        }
      }
      
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(processedData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`링크 생성 실패: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/links/${user?.id}`] });
      setTitle("");
      setUrl("");
      setDescription("");
      setSelectedStyle(THUMBNAIL);
      setSelectedImage(null);
      setImageFile(null);
      setCustomImageUrl("");
      setCompletedCrop(undefined);
      setShowAddForm(false);
      toast({
        title: "링크 생성 완료",
        description: "새로운 링크가 성공적으로 생성되었습니다.",
      });
    },
    onError: (error: any) => {
      console.error('Link creation error:', error);
      toast({
        title: "링크 생성 실패",
        description: error.message || "링크 생성 중 오류가 발생했습니다. 이미지 크기를 줄여보세요.",
        variant: "destructive",
      });
    },
  });

  const deleteLinkMutation = useMutation({
    mutationFn: async (linkId: number) => {
      const response = await fetch(`/api/links/${linkId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete link");
      }
      // DELETE requests often return 204 No Content, so we don't need to parse JSON
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/links/${user?.id}`] });
      // Also refetch the data immediately to ensure UI updates
      queryClient.refetchQueries({ queryKey: [`/api/links/${user?.id}`] });
      toast({
        title: "링크 삭제됨",
        description: "링크가 성공적으로 삭제되었습니다.",
      });
    },
    onError: (error) => {
      console.error("Delete link error:", error);
      toast({
        title: "삭제 실패", 
        description: "링크 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const generateShortCode = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 20) + '-' + Math.random().toString(36).substring(2, 6);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setSelectedImage(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        toast({
          title: "잘못된 파일 형식",
          description: "이미지 파일만 업로드할 수 있습니다.",
          variant: "destructive",
        });
      }
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImageFile(null);
  };

  // URL metadata fetching
  const fetchUrlMetadata = useCallback(async (url: string) => {
    if (!url || !url.startsWith('http')) return;
    
    setIsLoadingMetadata(true);
    try {
      const response = await fetch('/api/url-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      
      if (response.ok) {
        const metadata = await response.json();
        if (metadata.title && !title) setTitle(metadata.title);
        if (metadata.description && !description) setDescription(metadata.description);
        if (metadata.image && !selectedImage) {
          setSelectedImage(metadata.image);
          setCustomImageUrl(metadata.image);
        }
      }
    } catch (error) {
      console.error('Failed to fetch metadata:', error);
    } finally {
      setIsLoadingMetadata(false);
    }
  }, [title, description, selectedImage]);

  const handleCreateLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !url || !user?.id) return;

    const shortCode = generateShortCode(title);
    const linkData = {
      title,
      originalUrl: url,
      userId: user.id,
      shortCode,
      style: selectedStyle,
      description: description || undefined,
      imageUrl: selectedImage || undefined,
      customImageUrl: customImageUrl || undefined,
      cropData: completedCrop ? JSON.stringify(completedCrop) : undefined
    };
    
    console.log('Creating link with data:', linkData);
    createLinkMutation.mutate(linkData);
  };

  // URL 추가 폼 화면
  if (showAddForm) {
    return (
      <div className="min-h-screen bg-[#F5F3F0] pb-20">
        <div className="max-w-md mx-auto bg-white min-h-screen">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAddForm(false)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5 text-gray-500" />
            </Button>
            <h1 className="text-lg font-semibold text-[#8B4513]">URL 추가하기</h1>
            <div className="w-6"></div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-6">
            {/* Thumbnail Section - Preview */}
            <div className="space-y-2">
              <div className="w-full h-32 bg-gray-100 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-gray-300 overflow-hidden">
                {title || url || selectedImage ? (
                  <div className="text-center p-2 w-full h-full">
                    {selectedStyle === THUMBNAIL && (
                      <div className="flex items-center gap-3 h-full p-2 bg-white rounded-lg border">
                        {selectedImage ? (
                          <img src={selectedImage} alt="Preview" className="w-12 h-12 rounded object-cover" />
                        ) : (
                          <div className="w-12 h-12 bg-gray-300 rounded"></div>
                        )}
                        <div className="text-left flex-1">
                          <div className="text-sm font-medium text-gray-800 truncate">{title || "타이틀을 입력해주세요"}</div>
                        </div>
                      </div>
                    )}
                    {selectedStyle === SIMPLE && (
                      <div className="bg-white rounded-lg border p-3 h-full flex flex-col justify-center">
                        <div className="text-sm font-medium text-gray-800 truncate mb-1">{title || "타이틀을 입력해주세요"}</div>
                        <div className="w-full h-2 bg-gray-300 rounded"></div>
                      </div>
                    )}
                    {selectedStyle === CARD && (
                      <div className="bg-gray-400 rounded-lg h-full flex flex-col justify-center p-3 relative">
                        {selectedImage && (
                          <img src={selectedImage} alt="Preview" className="absolute inset-0 w-full h-full object-cover rounded-lg" />
                        )}
                        <div className="relative z-10 bg-black bg-opacity-50 text-white p-2 rounded">
                          <div className="text-sm font-medium truncate">{title || "타이틀을 입력해주세요"}</div>
                        </div>
                        <div className="absolute bottom-2 right-2 w-6 h-6 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                          <div className="w-3 h-3 border-2 border-white rounded-full"></div>
                        </div>
                      </div>
                    )}
                    {selectedStyle === BACKGROUND && (
                      <div className="h-full flex flex-col justify-center p-3 relative rounded-lg" style={{background: 'repeating-linear-gradient(45deg, #f5f5f5, #f5f5f5 10px, #e0e0e0 10px, #e0e0e0 20px)'}}>
                        <div className="text-sm font-medium text-gray-800 truncate mb-2">{title || "타이틀을 입력해주세요"}</div>
                        <div className="w-full h-2 bg-gray-400 rounded mb-1"></div>
                        <div className="w-3/4 h-2 bg-gray-400 rounded"></div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg mx-auto mb-2"></div>
                    <p className="text-xs text-gray-500">
                      자동으로 검색해주세요
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Style Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-[#8B4513]">스타일 *</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedStyle(THUMBNAIL)}
                  className={`p-4 rounded-lg border-2 text-center transition-all ${
                    selectedStyle === THUMBNAIL
                      ? 'border-[#A0825C] bg-[#F5F3F0]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="w-full h-8 bg-white rounded border mb-2 flex items-center px-2">
                    <div className="w-6 h-6 bg-[#8B4513] rounded mr-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="h-2 bg-gray-300 rounded mb-1"></div>
                      <div className="h-1.5 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                  <div className="text-xs font-medium text-gray-700">썸네일</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setSelectedStyle(SIMPLE)}
                  className={`p-4 rounded-lg border-2 text-center transition-all ${
                    selectedStyle === SIMPLE
                      ? 'border-[#A0825C] bg-[#F5F3F0]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="w-full h-8 bg-white rounded border mb-2 flex flex-col justify-center px-2">
                    <div className="h-2.5 bg-gray-400 rounded mb-1"></div>
                    <div className="h-1 bg-gray-200 rounded"></div>
                  </div>
                  <div className="text-xs font-medium text-gray-700">심플</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setSelectedStyle(CARD)}
                  className={`p-4 rounded-lg border-2 text-center transition-all ${
                    selectedStyle === CARD
                      ? 'border-[#A0825C] bg-[#F5F3F0]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="w-full h-8 bg-[#8B4513] rounded mb-2 relative overflow-hidden">
                    <div className="absolute bottom-1 left-1 right-1 bg-black/50 text-white text-[6px] leading-none p-0.5 rounded">
                      <div className="w-full h-1 bg-white/80 rounded mb-0.5"></div>
                      <div className="w-2/3 h-0.5 bg-white/60 rounded"></div>
                    </div>
                  </div>
                  <div className="text-xs font-medium text-gray-700">카드</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setSelectedStyle(BACKGROUND)}
                  className={`p-4 rounded-lg border-2 text-center transition-all ${
                    selectedStyle === BACKGROUND
                      ? 'border-[#A0825C] bg-[#F5F3F0]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="w-full h-8 rounded mb-2 relative overflow-hidden" style={{
                    background: 'linear-gradient(135deg, #8B4513 0%, #A0825C 100%)'
                  }}>
                    <div className="absolute inset-0 flex flex-col justify-center items-center text-white text-[6px] leading-none">
                      <div className="w-4/5 h-1 bg-white/90 rounded mb-0.5"></div>
                      <div className="w-3/5 h-0.5 bg-white/70 rounded"></div>
                    </div>
                  </div>
                  <div className="text-xs font-medium text-gray-700">배경</div>
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateLink} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#8B4513]">연결될 주소 *</label>
                <div className="relative">
                  <Input
                    type="url"
                    placeholder="https://example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onBlur={() => fetchUrlMetadata(url)}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:border-[#A0825C] focus:ring-1 focus:ring-[#A0825C]"
                    required
                  />
                  {isLoadingMetadata && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#8B4513]"></div>
                    </div>
                  )}
                </div>
                {url && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fetchUrlMetadata(url)}
                    disabled={isLoadingMetadata}
                    className="text-xs"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    미리보기 가져오기
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#8B4513]">타이틀 *</label>
                <Input
                  type="text"
                  placeholder="링크 타이틀을 입력하세요"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:border-[#A0825C] focus:ring-1 focus:ring-[#A0825C]"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#8B4513]">설명</label>
                <Textarea
                  placeholder="링크에 대한 간단한 설명을 입력하세요"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:border-[#A0825C] focus:ring-1 focus:ring-[#A0825C] resize-none"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[#8B4513]">이미지</label>
                  {selectedImage && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowImageCrop(true)}
                      className="text-xs"
                    >
                      <Camera className="w-3 h-3 mr-1" />
                      편집
                    </Button>
                  )}
                </div>
                
                {selectedImage ? (
                  <div className="space-y-2">
                    <div className="relative w-full h-32 border-2 border-gray-300 rounded-lg overflow-hidden">
                      <img 
                        src={selectedImage} 
                        alt="Selected" 
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {/* Custom Image URL Input */}
                    <div className="space-y-1">
                      <label className="text-xs text-gray-600">또는 이미지 URL 직접 입력</label>
                      <Input
                        type="url"
                        placeholder="https://example.com/image.jpg"
                        value={customImageUrl}
                        onChange={(e) => {
                          setCustomImageUrl(e.target.value);
                          if (e.target.value) {
                            setSelectedImage(e.target.value);
                          }
                        }}
                        className="text-xs"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <div className="text-center">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-xs text-gray-500">
                          이미지를 업로드하거나
                          <br />
                          URL 입력으로 자동 검색
                        </p>
                      </div>
                    </label>
                    
                    {/* Custom Image URL Input */}
                    <div className="space-y-1">
                      <label className="text-xs text-gray-600">이미지 URL</label>
                      <Input
                        type="url"
                        placeholder="https://example.com/image.jpg"
                        value={customImageUrl}
                        onChange={(e) => {
                          setCustomImageUrl(e.target.value);
                          if (e.target.value) {
                            setSelectedImage(e.target.value);
                          }
                        }}
                        className="text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={createLinkMutation.isPending || !title || !url}
                className="w-full bg-[#A0825C] hover:bg-[#8B4513] text-white py-3 rounded-lg font-medium disabled:bg-gray-300"
              >
                {createLinkMutation.isPending ? "생성 중..." : "추가 완료"}
              </Button>
            </form>

            {/* Image Crop Modal */}
            {showImageCrop && selectedImage && (
              <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-hidden">
                  <div className="p-4 border-b">
                    <h3 className="text-lg font-medium">이미지 편집</h3>
                  </div>
                  
                  <div className="p-4">
                    <div className="mb-4">
                      <ReactCrop
                        crop={crop}
                        onChange={(c) => setCrop(c)}
                        onComplete={(c) => setCompletedCrop(c)}
                        aspect={16 / 9}
                        className="max-h-64"
                      >
                        <img
                          ref={imgRef}
                          src={selectedImage}
                          alt="Crop preview"
                          className="max-w-full h-auto"
                        />
                      </ReactCrop>
                    </div>
                    
                    <div className="flex gap-2 justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowImageCrop(false)}
                      >
                        취소
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          if (completedCrop) {
                            // Store crop data
                            const cropData = JSON.stringify(completedCrop);
                            console.log('Crop applied:', cropData);
                          }
                          setShowImageCrop(false);
                        }}
                        className="bg-[#A0825C] hover:bg-[#8B4513]"
                      >
                        적용
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 메인 링크 페이지 - 홈, 이미지, 동영상 페이지와 동일한 레이아웃
  return (
    <div className="min-h-screen bg-[#F5F3F0] pb-20">
      <div className="max-w-md mx-auto bg-[#F5F3F0] min-h-screen">
        {/* Fixed Header */}
        <div className="p-4 border-b border-border bg-card flex-shrink-0">
          <div>
            <h1 className="text-xl font-bold text-foreground">링크 관리</h1>
            <p className="text-sm text-muted-foreground">
              링크를 추가하고 방문 통계를 확인하세요
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 pb-28">
          {/* Real-time Visit Tracking - 홈화면과 동일한 디자인 */}
          <Card className="bg-card shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-card-foreground korean-text">
                  링크
                </h2>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600 font-medium">Live</span>
                </div>
              </div>

              {/* Visit Stats - 총방문자, 일방문자, 월방문자 */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary mb-1">
                    {(userStats as any)?.totalVisits || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">총방문자</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary mb-1">
                    {(userStats as any)?.dailyVisits || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">일방문자</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary mb-1">
                    {(userStats as any)?.monthlyVisits || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">월방문자</div>
                </div>
              </div>

              {/* Refresh Stats Button */}
              <div className="mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    queryClient.invalidateQueries({ queryKey: [`/api/links/${user?.id}`] });
                    queryClient.invalidateQueries({ queryKey: [`/api/user/${user?.id}/link-stats`] });
                    toast({ title: "통계가 새로고침되었습니다!" });
                  }}
                  className="text-xs"
                >
                  통계 새로고침
                </Button>
              </div>

              {/* 빠른 추적 URL 섹션 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-foreground">빠른 추적 URL</h3>
                </div>
                
                {/* Display Links with Their Styles */}
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="bg-white rounded-lg border p-3 animate-pulse">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-200 rounded"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : links && links.length > 0 ? (
                  <div className="space-y-3">
                    {links.map((link: any) => (
                      <div key={link.id} className="border border-[#8D6E63]/20 rounded-lg p-3 bg-white/70">
                        {/* Thumbnail Style */}
                        {link.style === 'thumbnail' && (
                          <div 
                            className="flex items-center gap-3 p-2 bg-white rounded-lg border relative cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => window.open(link.originalUrl, '_blank')}
                          >
                            {(link.customImageUrl || link.imageUrl) ? (
                              <img 
                                src={link.customImageUrl || link.imageUrl} 
                                alt={link.title}
                                className="w-12 h-12 rounded object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-300 rounded flex-shrink-0"></div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-800 truncate hover:text-[#A0825C]">
                                {link.title}
                              </div>
                              {link.description && (
                                <div className="text-xs text-gray-600 mt-1 line-clamp-1">{link.description}</div>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                <div 
                                  className="text-xs text-blue-600 cursor-pointer hover:underline flex-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(`/l/${link.shortCode}`, '_blank');
                                  }}
                                >
                                  클릭수: {link.clicks || 0} | 단축링크: amusefit.co.kr/l/{link.shortCode}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(`${window.location.origin}/l/${link.shortCode}`);
                                    toast({ title: "단축링크가 복사되었습니다!" });
                                  }}
                                  className="h-5 w-5 p-0 text-gray-400 hover:text-blue-600"
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                              <LinkStatsDisplay linkId={link.id} />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteLinkMutation.mutate(link.id);
                              }}
                              className="absolute top-1 right-1 h-6 w-6 p-0 bg-white border border-gray-200 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full shadow-sm"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                        
                        {/* Simple Style */}
                        {link.style === 'simple' && (
                          <div 
                            className="bg-white rounded-lg border p-3 relative cursor-pointer hover:bg-gray-50 transition-colors" 
                            onClick={() => window.open(link.originalUrl, '_blank')}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteLinkMutation.mutate(link.id);
                              }}
                              className="absolute top-1 right-1 h-6 w-6 p-0 bg-white border border-gray-200 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full shadow-sm"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                            {(link.customImageUrl || link.imageUrl) && (
                              <img 
                                src={link.customImageUrl || link.imageUrl} 
                                alt={link.title}
                                className="w-full h-20 object-cover rounded mb-2"
                              />
                            )}
                            <div className="text-sm font-medium text-gray-800 truncate mb-2 hover:text-[#A0825C]">{link.title}</div>
                            {link.description && (
                              <div className="text-xs text-gray-600 mb-2 line-clamp-2">{link.description}</div>
                            )}
                            <div 
                              className="text-xs text-blue-600 mb-2 cursor-pointer hover:underline"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(`/l/${link.shortCode}`, '_blank');
                              }}
                            >
                              단축링크: amusefit.co.kr/l/{link.shortCode} | 클릭수: {link.clicks || 0}
                            </div>
                            <LinkStatsDisplay linkId={link.id} />
                            <div className="w-full h-2 bg-gray-300 rounded"></div>
                          </div>
                        )}
                        
                        {/* Card Style */}
                        {link.style === 'card' && (
                          <div 
                            className="bg-gray-400 rounded-lg h-32 flex flex-col justify-center p-3 relative cursor-pointer hover:bg-gray-500 transition-colors" 
                            onClick={() => window.open(link.originalUrl, '_blank')}
                          >
                            {(link.customImageUrl || link.imageUrl) && (
                              <img 
                                src={link.customImageUrl || link.imageUrl} 
                                alt={link.title}
                                className="absolute inset-0 w-full h-full object-cover rounded-lg"
                              />
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteLinkMutation.mutate(link.id);
                              }}
                              className="absolute top-1 right-1 h-6 w-6 p-0 bg-white border border-gray-200 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full shadow-sm z-20"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                            <div className="relative z-10 bg-black bg-opacity-50 text-white p-2 rounded">
                              <div className="text-sm font-medium truncate">{link.title}</div>
                              <div 
                                className="text-xs text-blue-200 mt-1 cursor-pointer hover:underline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(`/l/${link.shortCode}`, '_blank');
                                }}
                              >
                                amusefit.co.kr/l/{link.shortCode} | 클릭: {link.clicks || 0}
                              </div>
                              <div className="text-xs text-gray-300 mt-1">
                                <LinkStatsDisplay linkId={link.id} />
                              </div>
                            </div>
                            <div className="absolute bottom-2 right-2 w-6 h-6 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                              <div className="w-3 h-3 border-2 border-white rounded-full"></div>
                            </div>
                          </div>
                        )}
                        
                        {/* Background Style */}
                        {link.style === 'background' && (
                          <div 
                            className="h-32 flex flex-col justify-center p-3 relative rounded-lg cursor-pointer hover:opacity-90 transition-opacity overflow-hidden" 
                            style={{
                              backgroundImage: (link.customImageUrl || link.imageUrl) 
                                ? `url(${link.customImageUrl || link.imageUrl})` 
                                : 'repeating-linear-gradient(45deg, #f5f5f5, #f5f5f5 10px, #e0e0e0 10px, #e0e0e0 20px)',
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              backgroundRepeat: 'no-repeat'
                            }}
                            onClick={() => window.open(link.originalUrl, '_blank')}
                          >
                            {/* Dark overlay for text readability */}
                            <div className="absolute inset-0 bg-black bg-opacity-40 rounded-lg"></div>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteLinkMutation.mutate(link.id);
                              }}
                              className="absolute top-1 right-1 h-6 w-6 p-0 bg-white border border-gray-200 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full shadow-sm z-20"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                            
                            <div className="relative z-10 text-white">
                              <div className="text-sm font-medium truncate mb-2 drop-shadow-lg">{link.title}</div>
                              <div 
                                className="text-xs text-blue-200 mb-2 cursor-pointer hover:underline drop-shadow-lg"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(`/l/${link.shortCode}`, '_blank');
                                }}
                              >
                                단축링크: amusefit.co.kr/l/{link.shortCode} | 클릭수: {link.clicks || 0}
                              </div>
                              <div className="text-xs text-gray-200 mb-2 drop-shadow-lg">
                                <LinkStatsDisplay linkId={link.id} />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="text-sm text-gray-500 mb-2">추적 기능이 켜진 URL 없음</div>
                    <div className="text-xs text-gray-400 mb-4">URL을 추가하여 방문 추적을 시작하세요</div>
                  </div>
                )}
                
                {/* URL 추가하기 Button or Confirmation */}
                {!showConfirmDialog ? (
                  <Button
                    onClick={() => setShowConfirmDialog(true)}
                    className="w-full bg-white/70 hover:bg-white/90 text-[#4E342E] py-3 rounded-lg font-medium flex items-center justify-center gap-2 border-2 border-dashed border-[#8D6E63]"
                  >
                    <Plus className="w-5 h-5" />
                    URL 추가하기
                  </Button>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => {
                        setShowConfirmDialog(false);
                        setShowAddForm(true);
                      }}
                      className="bg-[#4E342E] hover:bg-[#8D6E63] text-white py-3 rounded-lg font-medium"
                    >
                      추가
                    </Button>
                    <Button
                      onClick={() => setShowConfirmDialog(false)}
                      className="bg-white/70 hover:bg-white/90 text-[#4E342E] py-3 rounded-lg font-medium border border-[#8D6E63]"
                    >
                      취소
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>


      </div>
    </div>
  );
}