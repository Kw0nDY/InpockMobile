import { useState } from "react";
import { Plus, Copy, ExternalLink, Trash2, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";

export default function LinksPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  const { data: links, isLoading } = useQuery({
    queryKey: [`/api/links/${user?.id}`],
    enabled: !!user?.id,
  });

  const createLinkMutation = useMutation({
    mutationFn: async (data: { title: string; originalUrl: string; userId: number; shortCode: string }) => {
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
      const response = await fetch(`/api/links/${linkId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete link');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/links/${user?.id}`] });
      toast({
        title: "링크 삭제 완료",
        description: "링크가 성공적으로 삭제되었습니다.",
      });
    }
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
      shortCode
    });
  };

  const handleCopyLink = (shortCode: string) => {
    const linkUrl = `amusefit.co.kr/link/${shortCode}`;
    navigator.clipboard.writeText(linkUrl);
    toast({
      title: "링크 복사됨",
      description: "클립보드에 링크가 복사되었습니다.",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => setLocation('/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">링크</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Add New Link Card */}
        <Card className="bg-white shadow-sm">
          <CardContent className="p-6">
            <form onSubmit={handleCreateLink} className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="제목"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <Input
                  type="url"
                  placeholder="URL"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              {title && url && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-600 font-medium">생성될 단축 URL:</p>
                  <p className="font-mono text-sm text-blue-800 break-all">
                    amusefit.co.kr/link/{generateShortCode(title)}
                  </p>
                </div>
              )}
              <Button
                type="submit"
                disabled={createLinkMutation.isPending || !title || !url}
                className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90 disabled:bg-gray-300"
              >
                <Plus className="w-4 h-4 mr-2" />
                {createLinkMutation.isPending ? "생성 중..." : "링크 추가"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Links List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-24 bg-white rounded-lg border"></div>
                </div>
              ))}
            </div>
          ) : links && Array.isArray(links) && links.length > 0 ? (
            links.map((link: any) => (
              <Card key={link.id} className="bg-white shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">{link.title}</h3>
                      <p className="text-sm text-gray-600 mb-2 break-all">{link.originalUrl}</p>
                      <div className="p-2 bg-gray-50 rounded border">
                        <p className="font-mono text-sm text-primary break-all">
                          amusefit.co.kr/link/{link.shortCode}
                        </p>
                      </div>
                      {link.clicks > 0 && (
                        <p className="text-xs text-gray-500 mt-2">클릭 수: {link.clicks}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyLink(link.shortCode)}
                        className="p-2 hover:bg-gray-100"
                      >
                        <Copy className="w-4 h-4 text-gray-600" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(link.originalUrl, '_blank')}
                        className="p-2 hover:bg-gray-100"
                      >
                        <ExternalLink className="w-4 h-4 text-gray-600" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteLinkMutation.mutate(link.id)}
                        disabled={deleteLinkMutation.isPending}
                        className="p-2 hover:bg-red-50 text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-2">아직 생성된 링크가 없습니다</p>
              <p className="text-sm text-gray-400">위에서 새 링크를 추가해보세요</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
