import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Image, Video, Link, User, Settings, ExternalLink } from "lucide-react";

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const [currentContentType, setCurrentContentType] = useState<'image' | 'video' | 'link'>('image');

  // Fetch user data
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['/api/auth/user'],
    retry: false,
  });

  // Fetch content data
  const { data: images, isLoading: imagesLoading } = useQuery({
    queryKey: ['/api/media', 'image'],
    enabled: !!userData,
  });

  const { data: videos, isLoading: videosLoading } = useQuery({
    queryKey: ['/api/media', 'video'],
    enabled: !!userData,
  });

  const { data: linksData, isLoading: linksLoading } = useQuery({
    queryKey: ['/api/links'],
    enabled: !!userData,
  });

  const { data: settingsData } = useQuery({
    queryKey: ['/api/settings'],
    enabled: !!userData,
  });

  if (userLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">로그인이 필요합니다</h2>
              <p className="text-muted-foreground mb-4">
                대시보드에 접근하려면 로그인해야 합니다.
              </p>
              <Button onClick={() => setLocation('/login')} className="w-full">
                로그인하기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 korean-text">대시보드</h1>
                <p className="text-gray-600 mt-1 korean-text">
                  안녕하세요, {(userData as any)?.firstName || (userData as any)?.email}님!
                </p>
              </div>
              <Button
                onClick={() => setLocation('/settings')}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Settings className="w-4 h-4" />
                설정
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="korean-text">콘텐츠 관리</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Content Type Selector */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium korean-text">콘텐츠 유형 선택</h3>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {[
                    { type: 'image' as const, icon: Image, label: '이미지' },
                    { type: 'video' as const, icon: Video, label: '동영상' },
                    { type: 'link' as const, icon: Link, label: '링크' }
                  ].map(({ type, icon: Icon, label }) => (
                    <div
                      key={type}
                      onClick={() => setCurrentContentType(type)}
                      className={`flex-shrink-0 p-3 rounded-lg cursor-pointer transition-all ${
                        currentContentType === type
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'border-border bg-muted hover:bg-muted/80'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-1">
                        <Icon className={`w-5 h-5 ${
                          currentContentType === type
                            ? 'text-primary-foreground'
                            : 'text-muted-foreground'
                        }`} />
                        <span className={`text-xs korean-text ${
                          currentContentType === type
                            ? 'text-primary-foreground font-medium'
                            : 'text-muted-foreground'
                        }`}>
                          {label}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile Preview */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-gray-600 korean-text">이용자 화면 미리보기</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(`/${(userData as any)?.username}`, '_blank')}
                    className="text-xs korean-text"
                  >
                    전체 화면으로 보기
                  </Button>
                </div>
                
                {/* Mobile Frame */}
                <div className="mx-auto max-w-xs">
                  <div className="relative bg-black rounded-3xl p-2 shadow-2xl">
                    <div className="bg-gray-900 rounded-2xl overflow-hidden">
                      {/* Status bar */}
                      <div className="bg-black h-8 flex items-center justify-center">
                        <div className="w-16 h-4 bg-gray-800 rounded-full"></div>
                      </div>
                      
                      {/* Content area */}
                      <div className="h-96 relative overflow-hidden"
                           style={{
                             background: (settingsData as any)?.backgroundTheme || 
                                       "linear-gradient(135deg, #F5F5DC 0%, #EFE5DC 50%, #F5F5DC 100%)"
                           }}>
                        
                        {/* Content based on type */}
                        {currentContentType === 'image' && (
                          Array.isArray(images) && images.length > 0 ? (
                            <div className="h-full flex items-center justify-center">
                              <img 
                                src={(images[0] as any).filePath || (images[0] as any).mediaUrl}
                                alt={(images[0] as any).title || '이미지'} 
                                className="max-w-full max-h-full object-contain"
                              />
                              {images.length > 1 && (
                                <div className="absolute top-4 right-4 flex space-x-1">
                                  {images.slice(0, 3).map((_, index) => (
                                    <div
                                      key={index}
                                      className={`w-2 h-2 rounded-full ${
                                        index === 0 ? "bg-white" : "bg-white/50"
                                      }`}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="h-full flex items-center justify-center text-white/70">
                              <div className="text-center">
                                <Image className="w-12 h-12 mx-auto mb-2" />
                                <p className="text-xs korean-text">이미지 없음</p>
                              </div>
                            </div>
                          )
                        )}

                        {currentContentType === 'video' && (
                          Array.isArray(videos) && videos.length > 0 ? (
                            <div className="h-full flex items-center justify-center">
                              <video 
                                src={(videos[0] as any).filePath || (videos[0] as any).mediaUrl}
                                className="max-w-full max-h-full object-contain"
                                controls={false}
                                muted
                                loop
                              />
                            </div>
                          ) : (
                            <div className="h-full flex items-center justify-center text-white/70">
                              <div className="text-center">
                                <Video className="w-12 h-12 mx-auto mb-2" />
                                <p className="text-xs korean-text">동영상 없음</p>
                              </div>
                            </div>
                          )
                        )}

                        {currentContentType === 'link' && (
                          Array.isArray(linksData) && linksData.length > 0 ? (
                            <div className="h-full p-4 overflow-y-auto">
                              <div className="space-y-3">
                                {linksData.slice(0, 3).map((link: any, index: number) => (
                                  <div key={index} className="bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-sm">
                                    <h3 className="font-medium text-sm text-gray-800 mb-1 truncate">
                                      {link.title || "링크"}
                                    </h3>
                                    <p className="text-xs text-gray-600 truncate">
                                      {link.originalUrl || link.shortUrl}
                                    </p>
                                  </div>
                                ))}
                                {linksData.length > 3 && (
                                  <div className="text-center">
                                    <p className="text-xs text-white/70">+{linksData.length - 3} 더보기</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="h-full flex items-center justify-center text-white/70">
                              <div className="text-center">
                                <Link className="w-12 h-12 mx-auto mb-2" />
                                <p className="text-xs korean-text">링크 없음</p>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                      
                      {/* Bottom navigation */}
                      <div className="bg-white/10 backdrop-blur-sm h-16 flex items-center justify-center">
                        <div className="flex space-x-8">
                          {[
                            { type: 'link', icon: Link, label: '링크' },
                            { type: 'image', icon: Image, label: '이미지' },
                            { type: 'video', icon: Video, label: '동영상' }
                          ].map(({ type, icon: Icon, label }) => (
                            <div key={type} className="flex flex-col items-center">
                              <Icon className={`w-4 h-4 ${
                                currentContentType === type ? 'text-white' : 'text-white/50'
                              }`} />
                              <span className={`text-xs mt-1 ${
                                currentContentType === type ? 'text-white' : 'text-white/50'
                              }`}>
                                {label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg border p-4 text-center">
                  <div className="text-2xl font-bold text-primary mb-1">
                    {Array.isArray(images) ? images.length : 0}
                  </div>
                  <div className="text-sm text-gray-600 korean-text">이미지</div>
                </div>
                <div className="bg-white rounded-lg border p-4 text-center">
                  <div className="text-2xl font-bold text-primary mb-1">
                    {Array.isArray(videos) ? videos.length : 0}
                  </div>
                  <div className="text-sm text-gray-600 korean-text">동영상</div>
                </div>
                <div className="bg-white rounded-lg border p-4 text-center">
                  <div className="text-2xl font-bold text-primary mb-1">
                    {Array.isArray(linksData) ? linksData.length : 0}
                  </div>
                  <div className="text-sm text-gray-600 korean-text">링크</div>
                </div>
              </div>

              {/* Settings Button */}
              <Button
                onClick={() => setLocation('/settings')}
                variant="outline"
                className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                프로필 설정 수정
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}