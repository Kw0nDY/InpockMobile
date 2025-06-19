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
    refetchInterval: 5000,
  });

  const { data: userStats } = useQuery({
    queryKey: [`/api/user/${user?.id}/link-stats`],
    enabled: !!user?.id,
  });

  const useIndividualLinkStats = (linkId: number) => {
    return useQuery({
      queryKey: [`/api/links/${linkId}/stats`],
      enabled: !!linkId,
      refetchInterval: 5000,
    });
  };

  const LinkStatsDisplay = ({ linkId }: { linkId: number }) => {
    const { data: stats } = useIndividualLinkStats(linkId);
    return (
      <span className="text-xs text-gray-500">
        {stats?.totalVisits || 0} 조회
      </span>
    );
  };

  const links = Array.isArray(linksData) ? linksData : [];

  const addLinkMutation = useMutation({
    mutationFn: async (linkData: any) => {
      return apiRequest(`/api/links`, {
        method: 'POST',
        body: JSON.stringify(linkData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/links/${user?.id}`] });
      setShowAddForm(false);
      resetForm();
      toast({ title: "링크가 성공적으로 추가되었습니다!" });
    },
    onError: (error: Error) => {
      toast({
        title: "링크 추가 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteLinkMutation = useMutation({
    mutationFn: async (linkId: number) => {
      return apiRequest(`/api/links/${linkId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/links/${user?.id}`] });
      toast({ title: "링크가 삭제되었습니다!" });
    },
    onError: (error: Error) => {
      toast({
        title: "링크 삭제 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setTitle("");
    setUrl("");
    setDescription("");
    setSelectedStyle(THUMBNAIL);
    setSelectedImage(null);
    setImageFile(null);
    setCustomImageUrl("");
    setShowImageCrop(false);
    setCrop({ unit: '%', width: 90, aspect: 16 / 9 });
    setCompletedCrop(null);
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
      customImageUrl: customImageUrl || undefined,
    };

    addLinkMutation.mutate(linkData);
  };

  if (showAddForm) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold">링크 추가</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowAddForm(false);
                resetForm();
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">제목 *</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="링크 제목을 입력하세요"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">URL *</label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                type="url"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">설명</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="링크에 대한 설명을 입력하세요"
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button
                type="submit"
                className="flex-1"
                disabled={addLinkMutation.isPending}
              >
                {addLinkMutation.isPending ? "추가 중..." : "링크 추가"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  resetForm();
                }}
              >
                취소
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Fixed Header */}
      <div className="p-4 border-b border-border bg-card flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-foreground">링크 관리</h1>
          <p className="text-sm text-muted-foreground">
            링크를 추가하고 방문 통계를 확인하세요
          </p>
        </div>
      </div>

      {/* Real-time Visit Tracking Stats */}
      <div className="flex-shrink-0 p-4 bg-card">
        <Card className="bg-card shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-card-foreground korean-text">
                링크 통계
              </h2>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-600 font-medium">Live</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
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
          </CardContent>
        </Card>
      </div>

      {/* Scrollable Link Cards */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-32 bg-muted rounded mb-3"></div>
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : links && links.length > 0 ? (
            <div className="space-y-4">
              {links.map((link: any) => (
                <Card key={link.id} className="overflow-hidden shadow-lg border-0 bg-white">
                  <CardContent className="p-0">
                    <div className="relative cursor-pointer group">
                      {/* Image section for thumbnail style */}
                      {link.style === 'thumbnail' && (link.customImageUrl || link.imageUrl) && (
                        <div className="relative">
                          <img 
                            src={link.customImageUrl || link.imageUrl} 
                            alt={link.title}
                            className="w-full h-40 object-cover"
                          />
                        </div>
                      )}
                      
                      {/* Default image for thumbnail without custom image */}
                      {link.style === 'thumbnail' && !(link.customImageUrl || link.imageUrl) && (
                        <div className="w-full h-40 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                          <ExternalLink className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                      
                      {/* Action buttons */}
                      <div className="absolute top-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button 
                          className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(`${window.location.origin}/l/${link.shortCode}`);
                            toast({ title: "단축링크가 복사되었습니다!" });
                          }}
                        >
                          <Copy className="w-4 h-4 text-gray-600" />
                        </button>
                        <button 
                          className="bg-red-500/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-red-500 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteLinkMutation.mutate(link.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-white" />
                        </button>
                      </div>
                      
                      {/* Content section */}
                      <div 
                        className="p-5 cursor-pointer"
                        onClick={() => window.open(link.originalUrl, '_blank')}
                      >
                        <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2 leading-tight">
                          {link.title}
                        </h3>
                        {link.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                            {link.description}
                          </p>
                        )}
                        
                        {/* Short link */}
                        <div 
                          className="text-xs text-blue-600 font-medium mb-3 truncate cursor-pointer hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`/l/${link.shortCode}`, '_blank');
                          }}
                        >
                          amusefit.co.kr/l/{link.shortCode}
                        </div>
                        
                        {/* Stats */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <TrendingUp className="w-3 h-3" />
                              <span>{link.clicks || 0}</span>
                            </div>
                            <LinkStatsDisplay linkId={link.id} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ExternalLink className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">링크가 없습니다</h3>
              <p className="text-muted-foreground mb-4">
                첫 번째 링크를 추가하여 시작하세요
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Add Button */}
      <div className="flex-shrink-0 p-4 border-t border-border bg-card">
        <Button
          onClick={() => setShowAddForm(true)}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-lg font-medium flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          새 링크 추가
        </Button>
      </div>
    </div>
  );
}