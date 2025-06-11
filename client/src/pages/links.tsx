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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [selectedStyle, setSelectedStyle] = useState<LinkStyle>('compact');
  const [showImageUpload, setShowImageUpload] = useState(false);

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
      setIsModalOpen(false);
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

  const styleOptions = [
    { id: 'compact' as LinkStyle, name: '컴팩트', icon: '📋' },
    { id: 'card' as LinkStyle, name: '카드', icon: '🎴' },
    { id: 'list' as LinkStyle, name: '리스트', icon: '📝' },
    { id: 'minimal' as LinkStyle, name: '미니멀', icon: '✨' }
  ];

  return (
    <>
      {/* Main Page */}
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Floating Add Button */}
        <div className="fixed bottom-24 right-4 z-50">
          <Button
            onClick={() => setIsModalOpen(true)}
            className="w-14 h-14 rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-lg"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </div>

        {/* Links List */}
        <div className="p-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-white rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : links && Array.isArray(links) && links.length > 0 ? (
            <div className="space-y-3">
              {links.map((link: any) => (
                <Card key={link.id} className="bg-white shadow-sm">
                  <CardContent className="p-4">
                    <h3 className="font-medium text-gray-900 mb-1">{link.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{link.originalUrl}</p>
                    <p className="text-xs text-blue-600">amusefit.co.kr/link/{link.shortCode}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-gray-500 mb-2">아직 생성된 링크가 없습니다</p>
              <p className="text-sm text-gray-400">+ 버튼을 눌러 새 링크를 추가해보세요</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">링크 블록</h2>
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
            <div className="p-4 space-y-6">
              {/* Thumbnail Section */}
              <div className="space-y-2">
                <div className="w-full h-32 bg-gray-100 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-gray-300">
                  {showImageUpload ? (
                    <div className="text-center">
                      <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">이미지를 선택하세요</p>
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
                <label className="text-sm font-medium text-gray-700">스타일 *</label>
                <div className="grid grid-cols-4 gap-2">
                  {styleOptions.map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setSelectedStyle(style.id)}
                      className={`p-3 rounded-lg border-2 text-center transition-all ${
                        selectedStyle === style.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-lg mb-1">{style.icon}</div>
                      <div className="text-xs text-gray-600">{style.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleCreateLink} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">연결될 주소 *</label>
                  <Input
                    type="url"
                    placeholder="https://"
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
      )}
    </>
  );
}
