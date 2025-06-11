import { useState } from "react";
import { Plus, X, Eye, TrendingUp, ExternalLink } from "lucide-react";
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
      <div className="min-h-screen bg-[#F0EDE8] pb-20">
        <div className="max-w-md mx-auto bg-[#F0EDE8] min-h-screen">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sticky top-0 bg-[#F0EDE8] z-10">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAddForm(false)}
              className="p-1 hover:bg-[#E8E2DC] rounded"
            >
              <X className="w-5 h-5 text-[#6B5B73]" />
            </Button>
            <h1 className="text-lg font-semibold text-[#6B5B73]">URL 추가하기</h1>
            <div className="w-6"></div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-6">
            {/* Thumbnail Section */}
            <div className="space-y-2">
              <div className="w-full h-32 bg-[#E8E2DC] rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-[#B5A5A0]">
                <div className="text-center">
                  <div className="w-12 h-12 bg-[#D0C4B8] rounded-lg mx-auto mb-2"></div>
                  <p className="text-xs text-[#8B7D7B]">
                    자동으로 검색해주세요
                  </p>
                </div>
              </div>
            </div>

            {/* Style Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-[#6B5B73]">스타일 *</label>
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedStyle('compact')}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    selectedStyle === 'compact'
                      ? 'border-[#A0825C] bg-[#E8E2DC]'
                      : 'border-[#D0C4B8] hover:border-[#B5A5A0]'
                  }`}
                >
                  <div className="w-8 h-6 bg-[#B5A5A0] rounded mx-auto mb-1"></div>
                  <div className="text-xs text-[#8B7D7B]">컴팩트</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setSelectedStyle('card')}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    selectedStyle === 'card'
                      ? 'border-[#A0825C] bg-[#E8E2DC]'
                      : 'border-[#D0C4B8] hover:border-[#B5A5A0]'
                  }`}
                >
                  <div className="w-8 h-6 bg-[#B5A5A0] rounded mx-auto mb-1 relative">
                    <div className="w-2 h-2 bg-[#9A8A87] rounded-full absolute top-1 left-1"></div>
                  </div>
                  <div className="text-xs text-[#8B7D7B]">카드</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setSelectedStyle('list')}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    selectedStyle === 'list'
                      ? 'border-[#A0825C] bg-[#E8E2DC]'
                      : 'border-[#D0C4B8] hover:border-[#B5A5A0]'
                  }`}
                >
                  <div className="w-8 h-6 bg-[#B5A5A0] rounded mx-auto mb-1 relative">
                    <div className="w-1 h-1 bg-[#9A8A87] rounded-full absolute top-1 left-2"></div>
                    <div className="w-1 h-1 bg-[#9A8A87] rounded-full absolute top-2.5 left-2"></div>
                    <div className="w-1 h-1 bg-[#9A8A87] rounded-full absolute top-4 left-2"></div>
                  </div>
                  <div className="text-xs text-[#8B7D7B]">리스트</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setSelectedStyle('minimal')}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    selectedStyle === 'minimal'
                      ? 'border-[#A0825C] bg-[#E8E2DC]'
                      : 'border-[#D0C4B8] hover:border-[#B5A5A0]'
                  }`}
                >
                  <div className="w-8 h-6 bg-[#B5A5A0] rounded mx-auto mb-1 relative">
                    <div className="w-2 h-1 bg-[#9A8A87] rounded absolute top-2 left-3"></div>
                  </div>
                  <div className="text-xs text-[#8B7D7B]">미니멀</div>
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateLink} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#6B5B73]">연결될 주소 *</label>
                <Input
                  type="url"
                  placeholder=""
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full p-3 border border-[#D0C4B8] rounded-xl focus:border-[#A0825C] focus:ring-1 focus:ring-[#A0825C] bg-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#6B5B73]">타이틀 *</label>
                <Input
                  type="text"
                  placeholder=""
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 border border-[#D0C4B8] rounded-xl focus:border-[#A0825C] focus:ring-1 focus:ring-[#A0825C] bg-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#6B5B73]">이미지 *</label>
                <div className="flex items-center justify-center w-full h-24 border-2 border-dashed border-[#B5A5A0] rounded-xl cursor-pointer hover:border-[#A0825C] transition-colors bg-[#E8E2DC]">
                  <div className="text-center">
                    <Plus className="w-8 h-8 text-[#8B7D7B] mx-auto mb-1" />
                    <p className="text-xs text-[#8B7D7B]">
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
                className="w-full bg-[#A0825C] hover:bg-[#8B7355] text-white py-3 rounded-xl font-medium disabled:bg-[#B5A5A0]"
              >
                {createLinkMutation.isPending ? "생성 중..." : "추가 완료"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // 메인 링크 페이지 - 첨부 사진과 동일한 디자인
  return (
    <div className="min-h-screen bg-[#F0EDE8] pb-20">
      <div className="max-w-md mx-auto bg-[#F0EDE8] min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sticky top-0 bg-[#F0EDE8] z-10">
          <div className="w-6"></div>
          <h1 className="text-lg font-semibold text-[#6B5B73]">링크</h1>
          <div className="w-6"></div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Real-time Visit Tracking */}
          <Card className="border-none shadow-sm bg-[#E8E2DC] rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-[#6B5B73] flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  실시간 방문 추적
                </h2>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600 font-medium">Live</span>
                </div>
              </div>

              {/* Visit Stats */}
              <div className="grid grid-cols-3 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#6B5B73] mb-1">
                    0
                  </div>
                  <div className="text-xs text-[#8B7D7B]">총 방문</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#6B5B73] mb-1">
                    0
                  </div>
                  <div className="text-xs text-[#8B7D7B]">순 방문자</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#6B5B73] mb-1">
                    0
                  </div>
                  <div className="text-xs text-[#8B7D7B]">카스텀 URL</div>
                </div>
              </div>

              {/* 빠른 추적 URL 섹션 */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-[#6B5B73]">빠른 추적 URL</h3>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-green-600 font-medium">실시간</span>
                  </div>
                </div>
                <div className="text-center py-8">
                  <div className="text-sm text-[#8B7D7B] mb-2">추적 기능이 켜진 URL 없음</div>
                  <div className="text-xs text-[#A59B99]">URL을 추가하여 방문 추적을 시작하세요</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* URL 추가하기 Button */}
          <Button
            onClick={() => setShowAddForm(true)}
            className="w-full bg-transparent hover:bg-[#E8E2DC] text-[#6B5B73] py-4 rounded-xl font-medium flex items-center justify-center gap-2 border-2 border-dashed border-[#B5A5A0]"
          >
            <Plus className="w-5 h-5" />
            URL 추가하기
          </Button>
        </div>
      </div>
    </div>
  );
}