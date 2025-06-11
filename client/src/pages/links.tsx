import { useState } from "react";
import { Plus, X, Eye, TrendingUp, ExternalLink, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

type LinkStyle = 'compact' | 'card' | 'list' | 'minimal';

export default function LinksPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [selectedStyle, setSelectedStyle] = useState<LinkStyle>('compact');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

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
      setSelectedStyle('compact');
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
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/links/${user?.id}`] });
      toast({
        title: "링크 삭제됨",
        description: "링크가 성공적으로 삭제되었습니다.",
      });
    },
    onError: () => {
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
              <div className="w-full h-32 bg-gray-100 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-gray-300">
                {title || url ? (
                  <div className="text-center p-2 w-full">
                    {selectedStyle === 'compact' && (
                      <div className="text-xs">
                        <div className="font-medium text-gray-700 truncate">{title || "제목"}</div>
                        <div className="text-gray-500 truncate">{url || "URL"}</div>
                      </div>
                    )}
                    {selectedStyle === 'card' && (
                      <div className="bg-white rounded p-2 shadow-sm">
                        <div className="w-8 h-8 bg-gray-300 rounded mx-auto mb-1"></div>
                        <div className="text-xs font-medium text-gray-700 truncate">{title || "제목"}</div>
                      </div>
                    )}
                    {selectedStyle === 'list' && (
                      <div className="text-left w-full">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          <div className="text-xs font-medium text-gray-700 truncate">{title || "제목"}</div>
                        </div>
                      </div>
                    )}
                    {selectedStyle === 'minimal' && (
                      <div className="text-xs font-medium text-gray-700 underline truncate">
                        {title || "제목"}
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
                  onClick={() => setSelectedStyle('compact')}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    selectedStyle === 'compact'
                      ? 'border-[#A0825C] bg-[#F5F3F0]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="w-8 h-6 bg-gray-300 rounded mx-auto mb-1"></div>
                  <div className="text-xs text-gray-600">컴팩트</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setSelectedStyle('card')}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    selectedStyle === 'card'
                      ? 'border-[#A0825C] bg-[#F5F3F0]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="w-8 h-6 bg-gray-300 rounded mx-auto mb-1 relative">
                    <div className="w-2 h-2 bg-gray-400 rounded-full absolute top-1 left-1"></div>
                  </div>
                  <div className="text-xs text-gray-600">카드</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setSelectedStyle('list')}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    selectedStyle === 'list'
                      ? 'border-[#A0825C] bg-[#F5F3F0]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="w-8 h-6 bg-gray-300 rounded mx-auto mb-1 relative">
                    <div className="w-1 h-1 bg-gray-400 rounded-full absolute top-1 left-2"></div>
                    <div className="w-1 h-1 bg-gray-400 rounded-full absolute top-2.5 left-2"></div>
                    <div className="w-1 h-1 bg-gray-400 rounded-full absolute top-4 left-2"></div>
                  </div>
                  <div className="text-xs text-gray-600">리스트</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setSelectedStyle('minimal')}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    selectedStyle === 'minimal'
                      ? 'border-[#A0825C] bg-[#F5F3F0]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="w-8 h-6 bg-gray-300 rounded mx-auto mb-1 relative">
                    <div className="w-2 h-1 bg-gray-400 rounded absolute top-2 left-3"></div>
                  </div>
                  <div className="text-xs text-gray-600">미니멀</div>
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
                <label className="text-sm font-medium text-[#8B4513]">이미지 *</label>
                <div className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
                  <div className="text-center">
                    <Plus className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">
                      이미지를 직접 첨부하거나
                      <br />
                      자동을 검색해서 첨부하세요
                    </p>
                  </div>
                </div>
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
                        {/* Compact Style */}
                        {link.style === 'compact' && (
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => window.open(link.originalUrl, '_blank')}>
                              <div className="text-sm font-medium text-gray-900 truncate hover:text-[#A0825C]">{link.title}</div>
                              <div className="text-xs text-gray-500 truncate">{link.originalUrl}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-xs text-[#A0825C] font-medium">방문: 0</div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteLinkMutation.mutate(link.id);
                                }}
                                className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {/* Card Style */}
                        {link.style === 'card' && (
                          <div className="text-center relative">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteLinkMutation.mutate(link.id);
                              }}
                              className="absolute top-0 right-0 h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                            <div 
                              className="cursor-pointer"
                              onClick={() => window.open(link.originalUrl, '_blank')}
                            >
                              <div className="w-12 h-12 bg-[#F5F3F0] rounded-lg flex items-center justify-center mx-auto mb-2 hover:bg-[#EAE5DE]">
                                <ExternalLink className="w-6 h-6 text-[#A0825C]" />
                              </div>
                              <div className="text-sm font-medium text-gray-900 mb-1 hover:text-[#A0825C]">{link.title}</div>
                              <div className="text-xs text-gray-500 mb-2 truncate">{link.originalUrl}</div>
                              <div className="text-xs text-[#A0825C] font-medium">방문: 0</div>
                            </div>
                          </div>
                        )}
                        
                        {/* List Style */}
                        {link.style === 'list' && (
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-[#A0825C] rounded-full"></div>
                            <div 
                              className="flex-1 min-w-0 cursor-pointer"
                              onClick={() => window.open(link.originalUrl, '_blank')}
                            >
                              <div className="text-sm font-medium text-gray-900 truncate hover:text-[#A0825C]">{link.title}</div>
                              <div className="text-xs text-gray-500 truncate">{link.originalUrl}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-xs text-[#A0825C] font-medium">방문: 0</div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteLinkMutation.mutate(link.id);
                                }}
                                className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {/* Minimal Style */}
                        {link.style === 'minimal' && (
                          <div className="text-center relative">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteLinkMutation.mutate(link.id);
                              }}
                              className="absolute top-0 right-0 h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                            <div 
                              className="text-sm font-medium text-[#A0825C] underline cursor-pointer hover:text-[#8B4513]"
                              onClick={() => window.open(link.originalUrl, '_blank')}
                            >
                              {link.title}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">방문: 0</div>
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