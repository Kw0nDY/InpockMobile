import { useState } from "react";
import { Plus, Camera, Copy, Share2, Edit2, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Header from "@/components/layout/header";

export default function LinksPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  const { data: links, isLoading } = useQuery({
    queryKey: [`/api/links/${user?.id}`],
    enabled: !!user?.id,
  });

  const createLinkMutation = useMutation({
    mutationFn: async (data: { title: string; originalUrl: string; userId: number }) => {
      const response = await apiRequest("POST", "/api/links", data);
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

  const handleCreateLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !url || !user?.id) return;

    createLinkMutation.mutate({
      title,
      originalUrl: url,
      userId: user.id,
    });
  };

  const handleCopyLink = (shortCode: string) => {
    const linkUrl = `inpock.co/${shortCode}`;
    navigator.clipboard.writeText(linkUrl);
    toast({
      title: "링크 복사됨",
      description: "클립보드에 링크가 복사되었습니다.",
    });
  };

  const handleShareLink = (shortCode: string) => {
    const linkUrl = `inpock.co/${shortCode}`;
    if (navigator.share) {
      navigator.share({
        title: "INPOCK 링크 공유",
        url: linkUrl,
      });
    } else {
      handleCopyLink(shortCode);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="링크 관리" rightIcon={Plus} />

      <div className="p-4">
        {/* Link Creation Section */}
        <Card className="bg-white shadow-sm mb-6">
          <CardContent className="p-4">
            <h3 className="font-medium mb-3 korean-text">새 링크 만들기</h3>
            <form onSubmit={handleCreateLink} className="space-y-3">
              <Input
                type="text"
                placeholder="링크 제목을 입력하세요"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg input-focus"
              />
              <Input
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg input-focus"
              />
              <div className="flex space-x-2">
                <Button
                  type="submit"
                  disabled={createLinkMutation.isPending || !title || !url}
                  className="flex-1 bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90"
                >
                  {createLinkMutation.isPending ? "생성 중..." : "링크 생성"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="px-4 py-3 border border-gray-200 rounded-lg"
                >
                  <Camera className="w-5 h-5 text-gray-600" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* QR Code Display */}
        <Card className="bg-white shadow-sm mb-6">
          <CardContent className="p-4 text-center">
            <h3 className="font-medium mb-3 korean-text">QR 코드</h3>
            <div className="w-32 h-32 bg-gray-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
              <QrCode className="w-20 h-20 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 mb-3 korean-text">스캔하여 공유하세요</p>
            <Button
              variant="secondary"
              className="bg-gray-50 text-dark px-4 py-2 rounded-lg text-sm hover:bg-gray-100"
            >
              다운로드
            </Button>
          </CardContent>
        </Card>

        {/* My Links */}
        <Card className="bg-white shadow-sm">
          <CardContent className="p-4">
            <h3 className="font-medium mb-3 korean-text">내 링크</h3>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-20 bg-gray-100 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : links && links.length > 0 ? (
              <div className="space-y-3">
                {links.map((link: any) => (
                  <div key={link.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm korean-text">{link.title}</p>
                      <p className="text-xs text-gray-500">inpock.co/{link.shortCode}</p>
                      <p className="text-xs text-primary">클릭 수: {link.clicks}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleCopyLink(link.shortCode)}
                        className="p-2 hover:bg-gray-200 rounded"
                      >
                        <Copy className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleShareLink(link.shortCode)}
                        className="p-2 hover:bg-gray-200 rounded"
                      >
                        <Share2 className="w-4 h-4 text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-gray-200 rounded">
                        <Edit2 className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 korean-text">아직 생성된 링크가 없습니다</p>
                <p className="text-sm text-gray-400 korean-text">위에서 새 링크를 만들어보세요</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
