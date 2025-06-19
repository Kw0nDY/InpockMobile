import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, ExternalLink, Copy, Trash2, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";

const THUMBNAIL = "thumbnail";
const SIMPLE = "simple";
const CARD = "card";
const BACKGROUND = "background";

export default function LinksPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [selectedStyle, setSelectedStyle] = useState(THUMBNAIL);
  const [urlMetadata, setUrlMetadata] = useState<any>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);

  // Fetch links
  const { data: links, isLoading } = useQuery({
    queryKey: [`/api/links/${user?.id}`],
    enabled: !!user?.id,
  });

  // Fetch user stats
  const { data: userStats } = useQuery({
    queryKey: [`/api/user/${user?.id}/link-stats`],
    enabled: !!user?.id,
  });

  // Add link mutation
  const addLinkMutation = useMutation({
    mutationFn: async (linkData: any) => {
      return apiRequest(`/api/links/${user?.id}`, {
        method: "POST",
        body: JSON.stringify(linkData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/links/${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/user/${user?.id}/link-stats`] });
      resetForm();
      setShowAddForm(false);
      toast({
        title: "성공",
        description: "링크가 추가되었습니다.",
      });
    },
    onError: () => {
      toast({
        title: "오류",
        description: "링크 추가에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  // URL metadata fetching
  const debouncedFetchMetadata = useCallback(
    debounce(async (url: string) => {
      if (!url || !isValidUrl(url)) return;
      
      setIsLoadingMetadata(true);
      try {
        const metadata = await apiRequest(`/api/fetch-metadata?url=${encodeURIComponent(url)}`);
        setUrlMetadata(metadata);
      } catch (error) {
        console.error("Failed to fetch metadata:", error);
      } finally {
        setIsLoadingMetadata(false);
      }
    }, 500),
    []
  );

  useEffect(() => {
    if (url) {
      debouncedFetchMetadata(url);
    } else {
      setUrlMetadata(null);
    }
  }, [url, debouncedFetchMetadata]);

  const resetForm = () => {
    setTitle("");
    setUrl("");
    setDescription("");
    setSelectedStyle(THUMBNAIL);
    setUrlMetadata(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) {
      toast({
        title: "입력 오류",
        description: "제목과 URL을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    const linkData = {
      title: title.trim(),
      originalUrl: url.trim(),
      description: description.trim(),
      style: selectedStyle,
    };

    addLinkMutation.mutate(linkData);
  };

  if (showAddForm) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F5F5DC' }}>
        {/* 상단 닫기 버튼 */}
        <div className="flex justify-end p-4">
          <button 
            onClick={() => {
              setShowAddForm(false);
              resetForm();
            }}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:shadow-md transition-all duration-200"
            style={{ backgroundColor: '#EFE5DC' }}
          >
            <X className="w-5 h-5" style={{ color: '#4E342E' }} />
          </button>
        </div>

        <div className="max-w-md mx-auto px-4 pb-6">
          {/* 타이틀 */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold" style={{ color: '#4E342E' }}>링크 추가</h1>
          </div>

          {/* 대표 이미지 업로드 영역 */}
          <div className="mb-6">
            <div 
              className="w-full h-48 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-200 hover:shadow-lg"
              style={{ 
                borderColor: '#8D6E63', 
                backgroundColor: '#EFE5DC' 
              }}
            >
              {urlMetadata?.image ? (
                <img 
                  src={urlMetadata.image} 
                  alt="미리보기" 
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                <div className="text-center">
                  <Camera className="w-12 h-12 mx-auto mb-2" style={{ color: '#8D6E63' }} />
                  <p className="text-sm font-medium" style={{ color: '#8D6E63' }}>이미지 첨부</p>
                  <p className="text-xs mt-1" style={{ color: '#A1887F' }}>URL에서 자동으로 가져오거나 직접 업로드</p>
                </div>
              )}
            </div>
          </div>

          {/* 링크 카테고리 선택 */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-3" style={{ color: '#4E342E' }}>
              페이지 유형
            </label>
            <div className="space-y-2">
              <div 
                className="flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all duration-200"
                style={{ 
                  backgroundColor: 'rgba(239, 229, 220, 0.8)',
                  borderColor: '#4E342E'
                }}
              >
                <span className="font-medium" style={{ color: '#4E342E' }}>링크</span>
                <div 
                  className="px-2 py-1 rounded-full text-xs font-medium"
                  style={{ 
                    backgroundColor: 'rgba(215, 204, 200, 0.8)',
                    color: '#4E342E'
                  }}
                >
                  선택됨
                </div>
              </div>
            </div>
          </div>

          {/* 입력 폼 */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#4E342E' }}>
                링크 제목 *
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="링크 제목을 입력하세요"
                required
                className="h-12 text-base rounded-xl border-2 focus:ring-0 transition-colors"
                style={{ 
                  borderColor: '#8D6E63',
                  backgroundColor: '#EFE5DC',
                  color: '#4E342E'
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#4E342E' }}>
                URL *
              </label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                type="url"
                required
                className="h-12 text-base rounded-xl border-2 focus:ring-0 transition-colors"
                style={{ 
                  borderColor: '#8D6E63',
                  backgroundColor: '#EFE5DC',
                  color: '#4E342E'
                }}
              />
              {isLoadingMetadata && (
                <div className="mt-3 flex items-center text-sm" style={{ color: '#8D6E63' }}>
                  <div 
                    className="animate-spin rounded-full h-4 w-4 border-b-2 mr-2"
                    style={{ borderColor: '#8D6E63' }}
                  ></div>
                  URL 정보를 가져오는 중...
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#4E342E' }}>
                설명
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="링크에 대한 설명을 입력하세요"
                rows={3}
                className="text-base rounded-xl border-2 focus:ring-0 transition-colors resize-none"
                style={{ 
                  borderColor: '#8D6E63',
                  backgroundColor: '#EFE5DC',
                  color: '#4E342E'
                }}
              />
            </div>

            {/* 미리보기 썸네일 */}
            {(title || url || description || urlMetadata) && (
              <div>
                <label className="block text-sm font-semibold mb-3" style={{ color: '#4E342E' }}>
                  카드 미리보기
                </label>
                <div 
                  className="rounded-2xl p-4 border-2"
                  style={{ 
                    backgroundColor: '#EFE5DC',
                    borderColor: '#8D6E63'
                  }}
                >
                  {/* 선택된 스타일에 따른 미리보기 */}
                  {selectedStyle === THUMBNAIL && (
                    <div 
                      className="rounded-xl border shadow-sm overflow-hidden"
                      style={{ 
                        backgroundColor: '#F5F5DC',
                        borderColor: '#A1887F'
                      }}
                    >
                      {urlMetadata?.image && (
                        <div className="w-full h-32 overflow-hidden">
                          <img 
                            src={urlMetadata.image} 
                            alt="미리보기" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-3">
                        <h3 className="text-sm font-semibold mb-1 line-clamp-2" style={{ color: '#4E342E' }}>
                          {title || "링크 제목"}
                        </h3>
                        {description && (
                          <p className="text-xs mb-2 line-clamp-2" style={{ color: '#A1887F' }}>
                            {description}
                          </p>
                        )}
                        <div className="text-xs font-medium truncate" style={{ color: '#8D6E63' }}>
                          amusefit.co.kr/l/example
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedStyle === SIMPLE && (
                    <div 
                      className="rounded-xl border shadow-sm p-3"
                      style={{ 
                        backgroundColor: '#F5F5DC',
                        borderColor: '#A1887F'
                      }}
                    >
                      <h3 className="text-sm font-semibold mb-1 line-clamp-2" style={{ color: '#4E342E' }}>
                        {title || "링크 제목"}
                      </h3>
                      {description && (
                        <p className="text-xs mb-2 line-clamp-2" style={{ color: '#A1887F' }}>
                          {description}
                        </p>
                      )}
                      <div className="text-xs font-medium truncate" style={{ color: '#8D6E63' }}>
                        amusefit.co.kr/l/example
                      </div>
                    </div>
                  )}

                  {selectedStyle === CARD && (
                    <div 
                      className="rounded-xl border shadow-sm p-3"
                      style={{ 
                        backgroundColor: '#F5F5DC',
                        borderColor: '#A1887F'
                      }}
                    >
                      <h3 className="text-sm font-semibold mb-1 line-clamp-2" style={{ color: '#4E342E' }}>
                        {title || "링크 제목"}
                      </h3>
                      {description && (
                        <p className="text-xs mb-2 line-clamp-2" style={{ color: '#A1887F' }}>
                          {description}
                        </p>
                      )}
                      <div className="text-xs font-medium truncate" style={{ color: '#8D6E63' }}>
                        amusefit.co.kr/l/example
                      </div>
                    </div>
                  )}

                  {selectedStyle === BACKGROUND && (
                    <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-xl shadow-lg p-3">
                      <h3 className="text-sm font-bold text-white mb-1 line-clamp-2">
                        {title || "링크 제목"}
                      </h3>
                      {description && (
                        <p className="text-xs text-white/80 mb-2 line-clamp-2">
                          {description}
                        </p>
                      )}
                      <div className="inline-block bg-white/10 backdrop-blur-sm rounded-lg px-2 py-1">
                        <div className="text-xs text-white/90 font-medium truncate">
                          amusefit.co.kr/l/example
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 카드 스타일 선택 */}
            <div>
              <label className="block text-sm font-semibold mb-3" style={{ color: '#4E342E' }}>
                카드 스타일
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className={`p-3 border-2 rounded-xl text-left transition-all duration-200 ${
                    selectedStyle === THUMBNAIL ? 'shadow-md scale-105' : 'hover:shadow-sm'
                  }`}
                  style={{
                    borderColor: selectedStyle === THUMBNAIL ? '#4E342E' : '#8D6E63',
                    backgroundColor: selectedStyle === THUMBNAIL ? '#EFE5DC' : '#F5F5DC'
                  }}
                  onClick={() => setSelectedStyle(THUMBNAIL)}
                >
                  <div className="text-sm font-semibold" style={{ color: '#4E342E' }}>썸네일</div>
                  <div className="text-xs mt-1" style={{ color: '#A1887F' }}>이미지와 텍스트</div>
                </button>
                <button
                  type="button"
                  className={`p-3 border-2 rounded-xl text-left transition-all duration-200 ${
                    selectedStyle === SIMPLE ? 'shadow-md scale-105' : 'hover:shadow-sm'
                  }`}
                  style={{
                    borderColor: selectedStyle === SIMPLE ? '#4E342E' : '#8D6E63',
                    backgroundColor: selectedStyle === SIMPLE ? '#EFE5DC' : '#F5F5DC'
                  }}
                  onClick={() => setSelectedStyle(SIMPLE)}
                >
                  <div className="text-sm font-semibold" style={{ color: '#4E342E' }}>심플</div>
                  <div className="text-xs mt-1" style={{ color: '#A1887F' }}>텍스트만</div>
                </button>
                <button
                  type="button"
                  className={`p-3 border-2 rounded-xl text-left transition-all duration-200 ${
                    selectedStyle === CARD ? 'shadow-md scale-105' : 'hover:shadow-sm'
                  }`}
                  style={{
                    borderColor: selectedStyle === CARD ? '#4E342E' : '#8D6E63',
                    backgroundColor: selectedStyle === CARD ? '#EFE5DC' : '#F5F5DC'
                  }}
                  onClick={() => setSelectedStyle(CARD)}
                >
                  <div className="text-sm font-semibold" style={{ color: '#4E342E' }}>카드</div>
                  <div className="text-xs mt-1" style={{ color: '#A1887F' }}>카드 형태</div>
                </button>
                <button
                  type="button"
                  className={`p-3 border-2 rounded-xl text-left transition-all duration-200 ${
                    selectedStyle === BACKGROUND ? 'shadow-md scale-105' : 'hover:shadow-sm'
                  }`}
                  style={{
                    borderColor: selectedStyle === BACKGROUND ? '#4E342E' : '#8D6E63',
                    backgroundColor: selectedStyle === BACKGROUND ? '#EFE5DC' : '#F5F5DC'
                  }}
                  onClick={() => setSelectedStyle(BACKGROUND)}
                >
                  <div className="text-sm font-semibold" style={{ color: '#4E342E' }}>배경</div>
                  <div className="text-xs mt-1" style={{ color: '#A1887F' }}>그라데이션 배경</div>
                </button>
              </div>
            </div>

            {/* 저장 버튼 */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full h-14 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                style={{
                  backgroundColor: '#4E342E',
                  color: '#F5F5DC'
                }}
                disabled={addLinkMutation.isPending || !title.trim() || !url.trim()}
              >
                {addLinkMutation.isPending ? (
                  <div className="flex items-center justify-center">
                    <div 
                      className="animate-spin rounded-full h-5 w-5 border-b-2 mr-2"
                      style={{ borderColor: '#F5F5DC' }}
                    ></div>
                    추가 중...
                  </div>
                ) : (
                  "링크 저장"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* 하단 네비게이션 바 공간 */}
        <div className="h-20"></div>
      </div>
    );
  }

  // 메인 링크 페이지
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'transparent' }}>
      <div className="max-w-md mx-auto min-h-screen">
        {/* Header */}
        <div className="p-4 border-b flex-shrink-0" style={{ borderColor: 'rgba(141, 110, 99, 0.3)', backgroundColor: 'rgba(239, 229, 220, 0.4)', backdropFilter: 'blur(10px)' }}>
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#4E342E' }}>링크 관리</h1>
            <p className="text-sm" style={{ color: '#A1887F' }}>
              링크를 추가하고 방문 통계를 확인하세요
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 pb-28">
          {/* Visit Stats */}
          <div className="rounded-2xl p-4 shadow-sm" style={{ backgroundColor: 'rgba(239, 229, 220, 0.6)', backdropFilter: 'blur(10px)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold" style={{ color: '#4E342E' }}>링크</h2>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-600 font-medium">Live</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold mb-1" style={{ color: '#4E342E' }}>
                  {(userStats as any)?.totalVisits || 0}
                </div>
                <div className="text-xs" style={{ color: '#A1887F' }}>총방문자</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold mb-1" style={{ color: '#4E342E' }}>
                  {(userStats as any)?.dailyVisits || 0}
                </div>
                <div className="text-xs" style={{ color: '#A1887F' }}>일방문자</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold mb-1" style={{ color: '#4E342E' }}>
                  {(userStats as any)?.monthlyVisits || 0}
                </div>
                <div className="text-xs" style={{ color: '#A1887F' }}>월방문자</div>
              </div>
            </div>
          </div>

          {/* Add Link Button */}
          <button 
            onClick={() => setShowAddForm(true)}
            className="w-full h-14 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
            style={{ backgroundColor: '#4E342E', color: '#F5F5DC' }}
          >
            <Plus className="w-6 h-6 inline mr-2" />
            새 링크 추가
          </button>

          {/* Links List */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-xl p-3 animate-pulse" style={{ backgroundColor: 'rgba(239, 229, 220, 0.4)', backdropFilter: 'blur(8px)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded" style={{ backgroundColor: 'rgba(215, 204, 200, 0.6)' }}></div>
                      <div className="flex-1">
                        <div className="h-4 rounded w-3/4 mb-2" style={{ backgroundColor: 'rgba(215, 204, 200, 0.6)' }}></div>
                        <div className="h-3 rounded w-1/2" style={{ backgroundColor: 'rgba(215, 204, 200, 0.6)' }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : links && links.length > 0 ? (
              <div className="space-y-3">
                {links.map((link: any) => (
                  <div 
                    key={link.id} 
                    className="rounded-2xl p-4 border-2 shadow-sm hover:shadow-md transition-all duration-200"
                    style={{ 
                      backgroundColor: 'rgba(239, 229, 220, 0.6)',
                      backdropFilter: 'blur(10px)',
                      borderColor: 'rgba(141, 110, 99, 0.3)'
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1" style={{ color: '#4E342E' }}>
                          {link.title}
                        </h3>
                        <div className="text-sm mb-2" style={{ color: '#8D6E63' }}>
                          /{link.shortCode}
                        </div>
                      </div>
                      
                      {/* 방문수 뱃지와 복사 아이콘 */}
                      <div className="flex items-center gap-2">
                        <div 
                          className="px-3 py-1 rounded-full text-xs font-medium"
                          style={{ 
                            backgroundColor: 'rgba(215, 204, 200, 0.8)',
                            color: '#4E342E'
                          }}
                        >
                          0회 방문
                        </div>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/l/${link.shortCode}`);
                            toast({ title: "링크가 복사되었습니다!" });
                          }}
                          className="p-2 rounded-lg hover:shadow-md transition-all duration-200"
                          style={{ backgroundColor: 'rgba(215, 204, 200, 0.7)', backdropFilter: 'blur(8px)' }}
                        >
                          <ExternalLink className="w-4 h-4" style={{ color: '#4E342E' }} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* 전체 분석 보기 버튼 */}
                <div 
                  className="rounded-2xl p-4 border-2 shadow-sm hover:shadow-md transition-all duration-200 text-center cursor-pointer mt-4"
                  style={{ 
                    backgroundColor: 'rgba(239, 229, 220, 0.4)',
                    backdropFilter: 'blur(10px)',
                    borderColor: 'rgba(141, 110, 99, 0.3)'
                  }}
                  onClick={() => {
                    window.location.href = '/analytics';
                  }}
                >
                  <div className="flex items-center justify-center gap-2" style={{ color: '#4E342E' }}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className="font-medium">전체 분석 보기</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <ExternalLink className="w-16 h-16 mx-auto mb-4" style={{ color: '#8D6E63' }} />
                <p className="text-lg font-medium mb-2" style={{ color: '#4E342E' }}>
                  아직 링크가 없습니다
                </p>
                <p className="text-sm" style={{ color: '#A1887F' }}>
                  첫 번째 링크를 추가해보세요!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Navigation Space */}
        <div className="h-20"></div>
      </div>
    </div>
  );
}

// Utility functions
function debounce(func: Function, wait: number) {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function isValidUrl(string: string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}