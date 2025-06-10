import { useState } from "react";
import { Plus, Camera, Copy, Share2, Edit2, QrCode, Palette, TrendingUp, Sparkles, Target, Globe, BarChart3, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    const linkUrl = `localhost:5000/l/${shortCode}`;
    navigator.clipboard.writeText(linkUrl);
    toast({
      title: "링크 복사됨",
      description: "클립보드에 링크가 복사되었습니다.",
    });
  };

  const handleShareLink = (shortCode: string) => {
    const linkUrl = `localhost:5000/l/${shortCode}`;
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

        {/* Link Blocks Section */}
        <div className="mb-6">
          <h3 className="font-medium mb-4 korean-text text-lg">링크 도구</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Brand Kit Block */}
            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center mr-3">
                      <Palette className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 korean-text">브랜드 키트 만들기</h4>
                      <Badge variant="secondary" className="mt-1 text-xs bg-purple-100 text-purple-700">
                        NEW
                      </Badge>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
                <p className="text-sm text-gray-600 korean-text mb-4">
                  나만의 브랜드 리소스를 직접 제작하고 활용하세요.
                </p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg"
                  onClick={() => window.open('#', '_blank')}
                >
                  시작하기
                </Button>
              </CardContent>
            </Card>

            {/* SNS Links Block */}
            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mr-3">
                      <Share2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 korean-text">SNS 링크 연결하기</h4>
                      <Badge variant="secondary" className="mt-1 text-xs bg-orange-100 text-orange-700">
                        인기
                      </Badge>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
                <p className="text-sm text-gray-600 korean-text mb-4">
                  나를 표현하는 SNS를 연결해보세요.
                </p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg"
                  onClick={() => window.open('#', '_blank')}
                >
                  연결하기
                </Button>
              </CardContent>
            </Card>

            {/* Analytics Block */}
            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center mr-3">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 korean-text">링크 통계 보기</h4>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
                <p className="text-sm text-gray-600 korean-text mb-4">
                  누가 얼마나 클릭했는지 통계를 확인할 수 있어요.
                </p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full bg-green-50 text-green-700 hover:bg-green-100 rounded-lg"
                  onClick={() => window.open('/analytics', '_self')}
                >
                  통계 보기
                </Button>
              </CardContent>
            </Card>

            {/* Premium Features Block */}
            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer group border-2 border-gradient-to-r from-yellow-200 to-orange-200">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-orange-200 rounded-xl flex items-center justify-center mr-3">
                      <Sparkles className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 korean-text">프리미엄 기능</h4>
                      <Badge variant="default" className="mt-1 text-xs bg-gradient-to-r from-yellow-400 to-orange-400 text-white">
                        HOT
                      </Badge>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
                <p className="text-sm text-gray-600 korean-text mb-4">
                  고급 분석, 커스텀 도메인, 무제한 링크를 사용하세요.
                </p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full bg-gradient-to-r from-yellow-50 to-orange-50 text-orange-700 hover:from-yellow-100 hover:to-orange-100 rounded-lg"
                  onClick={() => window.open('#', '_blank')}
                >
                  업그레이드
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

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
                      <p className="text-xs text-gray-500">localhost:5000/l/{link.shortCode}</p>
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
