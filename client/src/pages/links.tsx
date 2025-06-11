import { useState } from "react";
import { Plus, X, Camera } from "lucide-react";
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

  const { data: links, isLoading } = useQuery({
    queryKey: [`/api/links/${user?.id}`],
    enabled: !!user?.id,
  });

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

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Content Section */}
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="w-6"></div>
          <h1 className="text-lg font-semibold text-gray-900">링크 블록</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5 text-gray-500" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Thumbnail Section */}
          <div className="space-y-2">
            <div className="w-full h-32 bg-gray-100 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-gray-300">
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-200 rounded-lg mx-auto mb-2"></div>
                <p className="text-xs text-gray-500">
                  자동으로 검색해주세요
                </p>
              </div>
            </div>
          </div>

          {/* Style Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">스타일 *</label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setSelectedStyle('compact')}
                className={`p-3 rounded-lg border-2 text-center transition-all ${
                  selectedStyle === 'compact'
                    ? 'border-blue-500 bg-blue-50'
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
                    ? 'border-blue-500 bg-blue-50'
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
                    ? 'border-blue-500 bg-blue-50'
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
                    ? 'border-blue-500 bg-blue-50'
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
              <label className="text-sm font-medium text-gray-700">연결될 주소 *</label>
              <Input
                type="url"
                placeholder=""
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">타이틀 *</label>
              <Input
                type="text"
                placeholder=""
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">이미지 *</label>
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
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-medium disabled:bg-gray-300"
            >
              {createLinkMutation.isPending ? "생성 중..." : "추가 완료"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
