import { useState } from "react";
import { Plus, X, Eye, TrendingUp, ExternalLink, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

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
  const [selectedStyle, setSelectedStyle] = useState<LinkStyle>(THUMBNAIL);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const { data: linksData, isLoading } = useQuery({
    queryKey: [`/api/links/${user?.id}`],
    enabled: !!user?.id,
  });

  const links = Array.isArray(linksData) ? linksData : [];

  const createLinkMutation = useMutation({
    mutationFn: async (data: { title: string; originalUrl: string; userId: number; shortCode: string; style?: string }) => {
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create link');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/links/${user?.id}`] });
      setTitle("");
      setUrl("");
      setSelectedStyle('thumbnail');
      setSelectedImage(null);
      setImageFile(null);
      setShowAddForm(false);
      toast({
        title: "링크 생성 완료",
        description: "새로운 링크가 성공적으로 생성되었습니다.",
      });
    },
    onError: () => {
      toast({
        title: "링크 생성 실패",
        description: "링크 생성 중 오류가 발생했습니다.",
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

  const handleCreateLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !url || !user?.id) return;

    const shortCode = generateShortCode(title);
    createLinkMutation.mutate({
      title,
      originalUrl: url,
      userId: user.id,
      shortCode,
      style: selectedStyle
    });
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
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedStyle(THUMBNAIL)}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    selectedStyle === THUMBNAIL
                      ? 'border-[#A0825C] bg-[#F5F3F0]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="w-full h-6 bg-gray-200 rounded mx-auto mb-1 flex items-center px-1">
                    <div className="w-4 h-4 bg-gray-400 rounded mr-1"></div>
                    <div className="flex-1 h-1.5 bg-gray-400 rounded"></div>
                  </div>
                  <div className="text-xs text-gray-600">썸네일</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setSelectedStyle(SIMPLE)}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    selectedStyle === SIMPLE
                      ? 'border-[#A0825C] bg-[#F5F3F0]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="w-full h-6 bg-gray-200 rounded mx-auto mb-1 flex flex-col justify-center px-1">
                    <div className="w-full h-1.5 bg-gray-400 rounded mb-0.5"></div>
                    <div className="w-2/3 h-1 bg-gray-300 rounded"></div>
                  </div>
                  <div className="text-xs text-gray-600">심플</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setSelectedStyle(CARD)}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    selectedStyle === CARD
                      ? 'border-[#A0825C] bg-[#F5F3F0]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="w-full h-6 bg-gray-400 rounded mx-auto mb-1 relative">
                    <div className="absolute bottom-0.5 right-0.5 w-2 h-2 bg-white rounded-full flex items-center justify-center">
                      <div className="w-1 h-1 border border-gray-400 rounded-full"></div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">카드</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setSelectedStyle(BACKGROUND)}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    selectedStyle === BACKGROUND
                      ? 'border-[#A0825C] bg-[#F5F3F0]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="w-full h-6 rounded mx-auto mb-1" style={{background: 'repeating-linear-gradient(45deg, #f0f0f0, #f0f0f0 3px, #d0d0d0 3px, #d0d0d0 6px)'}}>
                    <div className="p-0.5">
                      <div className="w-full h-1 bg-gray-400 rounded mb-0.5"></div>
                      <div className="w-2/3 h-0.5 bg-gray-400 rounded"></div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">배경</div>
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateLink} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#8B4513]">연결될 주소 *</label>
                <Input
                  type="url"
                  placeholder=""
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:border-[#A0825C] focus:ring-1 focus:ring-[#A0825C]"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#8B4513]">타이틀 *</label>
                <Input
                  type="text"
                  placeholder=""
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:border-[#A0825C] focus:ring-1 focus:ring-[#A0825C]"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#8B4513]">이미지</label>
                {selectedImage ? (
                  <div className="relative w-full h-24 border-2 border-gray-300 rounded-lg overflow-hidden">
                    <img 
                      src={selectedImage} 
                      alt="Selected" 
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <div className="text-center">
                      <Plus className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                      <p className="text-xs text-gray-500">
                        이미지를 직접 첨부하거나
                        <br />
                        자동을 검색해서 첨부하세요
                      </p>
                    </div>
                  </label>
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
          </div>
        </div>
      </div>
    );
  }

  // 메인 링크 페이지 - 첨부 사진과 동일한 레이아웃
  return (
    <div className="min-h-screen bg-[#F5F3F0] pb-20">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="w-6"></div>
          <h1 className="text-lg font-semibold text-[#8B4513]">링크</h1>
          <div className="w-6"></div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Real-time Visit Tracking - 홈화면과 동일한 디자인 */}
          <Card className="bg-[#F5F3F0] border-none shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-[#8B4513] flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  실시간 방문 추적
                </h2>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600 font-medium">Live</span>
                </div>
              </div>

              {/* Visit Stats - 홈화면과 동일한 스타일 */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#8B4513] mb-1">
                    0
                  </div>
                  <div className="text-xs text-gray-500">총방문</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#8B4513] mb-1">
                    0
                  </div>
                  <div className="text-xs text-gray-500">순방문자</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#8B4513] mb-1">
                    0
                  </div>
                  <div className="text-xs text-gray-500">카운팅 URL</div>
                </div>
              </div>

              {/* 빠른 추적 URL 섹션 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-[#8B4513]">빠른 추적 URL</h3>
                </div>
                
                {/* Display Links with Their Styles */}
                {links && links.length > 0 ? (
                  <div className="space-y-3">
                    {links.map((link: any) => (
                      <div key={link.id} className="border border-gray-200 rounded-lg p-3 bg-white">
                        {/* Thumbnail Style */}
                        {link.style === 'thumbnail' && (
                          <div className="flex items-center gap-3 p-2 bg-white rounded-lg border relative">
                            <div className="w-12 h-12 bg-gray-300 rounded flex-shrink-0"></div>
                            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => window.open(link.originalUrl, '_blank')}>
                              <div className="text-sm font-medium text-gray-800 truncate hover:text-[#A0825C]">{link.title}</div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteLinkMutation.mutate(link.id);
                              }}
                              className="absolute top-1 right-1 h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                        
                        {/* Simple Style */}
                        {link.style === 'simple' && (
                          <div className="bg-white rounded-lg border p-3 relative cursor-pointer" onClick={() => window.open(link.originalUrl, '_blank')}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteLinkMutation.mutate(link.id);
                              }}
                              className="absolute top-1 right-1 h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                            <div className="text-sm font-medium text-gray-800 truncate mb-2 hover:text-[#A0825C]">{link.title}</div>
                            <div className="w-full h-2 bg-gray-300 rounded"></div>
                          </div>
                        )}
                        
                        {/* Card Style */}
                        {link.style === 'card' && (
                          <div className="bg-gray-400 rounded-lg h-32 flex flex-col justify-center p-3 relative cursor-pointer" onClick={() => window.open(link.originalUrl, '_blank')}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteLinkMutation.mutate(link.id);
                              }}
                              className="absolute top-1 right-1 h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                            <div className="relative z-10 bg-black bg-opacity-50 text-white p-2 rounded">
                              <div className="text-sm font-medium truncate">{link.title}</div>
                            </div>
                            <div className="absolute bottom-2 right-2 w-6 h-6 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                              <div className="w-3 h-3 border-2 border-white rounded-full"></div>
                            </div>
                          </div>
                        )}
                        
                        {/* Background Style */}
                        {link.style === 'background' && (
                          <div 
                            className="h-32 flex flex-col justify-center p-3 relative rounded-lg cursor-pointer" 
                            style={{background: 'repeating-linear-gradient(45deg, #f5f5f5, #f5f5f5 10px, #e0e0e0 10px, #e0e0e0 20px)'}}
                            onClick={() => window.open(link.originalUrl, '_blank')}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteLinkMutation.mutate(link.id);
                              }}
                              className="absolute top-1 right-1 h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                            <div className="text-sm font-medium text-gray-800 truncate mb-2 hover:text-[#A0825C]">{link.title}</div>
                            <div className="w-full h-2 bg-gray-400 rounded mb-1"></div>
                            <div className="w-3/4 h-2 bg-gray-400 rounded"></div>
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
                    className="w-full bg-white hover:bg-gray-50 text-[#A0825C] py-3 rounded-lg font-medium flex items-center justify-center gap-2 border-2 border-dashed border-[#A0825C]"
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
                      className="bg-[#A0825C] hover:bg-[#8B4513] text-white py-3 rounded-lg font-medium"
                    >
                      추가
                    </Button>
                    <Button
                      onClick={() => setShowConfirmDialog(false)}
                      className="bg-white hover:bg-gray-50 text-[#A0825C] py-3 rounded-lg font-medium border border-[#A0825C]"
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