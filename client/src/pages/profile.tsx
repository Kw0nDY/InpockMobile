import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { ExternalLink, Copy, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { trackPageView } from "@/lib/analytics";

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { toast } = useToast();

  // Fetch user data by username or custom URL
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: [`/api/profile/${username}`],
    enabled: !!username,
  });

  // Fetch user's links
  const { data: linksData, isLoading: linksLoading } = useQuery({
    queryKey: [`/api/profile/${username}/links`],
    enabled: !!username && !!(userData as any)?.id,
  });

  // Fetch user's settings
  const { data: settingsData } = useQuery({
    queryKey: [`/api/profile/${username}/settings`],
    enabled: !!username && !!(userData as any)?.id,
  });

  useEffect(() => {
    if (username) {
      trackPageView(`/users/${username}`, `/users/${username}`);
    }
  }, [username]);

  const user = userData as any;
  const links = Array.isArray(linksData) ? linksData : [];
  const settings = settingsData as any;

  if (userLoading || linksLoading) {
    return (
      <div className="min-h-screen bg-[#F5F3F0] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#8B4513] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#8B4513]">프로필을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F3F0] flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-700 mb-2">사용자를 찾을 수 없습니다</h1>
          <p className="text-gray-500">요청하신 프로필이 존재하지 않습니다.</p>
        </div>
      </div>
    );
  }

  // Determine content type from settings (default to links)
  const contentType = settings?.contentType || 'links';

  const renderContent = () => {
    switch (contentType) {
      case 'links':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[#8B4513] mb-4">링크</h2>
            {links.length > 0 ? (
              <div className="space-y-3">
                {links.map((link: any) => (
                  <div key={link.id}>
                    {/* Thumbnail Style - Match link form exactly */}
                    {link.style === 'thumbnail' && (
                      <div 
                        className="flex items-center gap-3 bg-white rounded-lg border p-3 cursor-pointer hover:shadow-sm transition-shadow"
                        onClick={() => window.open(link.originalUrl, '_blank')}
                      >
                        {(link.customImageUrl || link.imageUrl) ? (
                          <img 
                            src={link.customImageUrl || link.imageUrl} 
                            alt={link.title}
                            className="w-12 h-12 rounded object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-300 rounded"></div>
                        )}
                        <div className="text-left flex-1">
                          <div className="text-sm font-medium text-gray-800 truncate">{link.title}</div>
                          {link.description && (
                            <div className="text-xs text-gray-600 mt-1 line-clamp-1">{link.description}</div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Simple Style - Match link form exactly */}
                    {link.style === 'simple' && (
                      <div 
                        className="bg-white rounded-lg border p-3 cursor-pointer hover:bg-gray-50 transition-colors flex flex-col justify-center" 
                        onClick={() => window.open(link.originalUrl, '_blank')}
                      >
                        <div className="text-sm font-medium text-gray-800 truncate mb-1">{link.title}</div>
                        {link.description && (
                          <div className="text-xs text-gray-600 mb-2 line-clamp-1">{link.description}</div>
                        )}
                        <div className="w-full h-2 bg-gray-300 rounded"></div>
                      </div>
                    )}
                    
                    {/* Card Style - Match link form exactly */}
                    {link.style === 'card' && (
                      <div 
                        className="bg-gray-400 rounded-lg h-32 flex flex-col justify-center p-3 relative cursor-pointer hover:bg-gray-500 transition-colors" 
                        onClick={() => window.open(link.originalUrl, '_blank')}
                      >
                        {(link.customImageUrl || link.imageUrl) && (
                          <img 
                            src={link.customImageUrl || link.imageUrl} 
                            alt={link.title}
                            className="absolute inset-0 w-full h-full object-cover rounded-lg"
                          />
                        )}
                        <div className="relative z-10 bg-black bg-opacity-50 text-white p-2 rounded">
                          <div className="text-sm font-medium truncate">{link.title}</div>
                          {link.description && (
                            <div className="text-xs opacity-90 mt-1 line-clamp-1">{link.description}</div>
                          )}
                        </div>
                        <div className="absolute bottom-2 right-2 w-6 h-6 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                          <div className="w-3 h-3 border-2 border-white rounded-full"></div>
                        </div>
                      </div>
                    )}

                    {/* Background Style - Match link form exactly */}
                    {link.style === 'background' && (
                      <div 
                        className="h-24 flex flex-col justify-center p-3 relative rounded-lg cursor-pointer hover:opacity-90 transition-opacity" 
                        style={{background: 'repeating-linear-gradient(45deg, #f5f5f5, #f5f5f5 10px, #e0e0e0 10px, #e0e0e0 20px)'}}
                        onClick={() => window.open(link.originalUrl, '_blank')}
                      >
                        <div className="text-sm font-medium text-gray-800 truncate mb-2">{link.title}</div>
                        {link.description && (
                          <div className="text-xs text-gray-600 mb-2 line-clamp-1">{link.description}</div>
                        )}
                        <div className="w-full h-2 bg-gray-400 rounded mb-1"></div>
                        <div className="w-3/4 h-2 bg-gray-400 rounded"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ExternalLink className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">링크 없음</p>
                <p className="text-gray-400 text-sm mt-2">아직 등록된 링크가 없습니다.</p>
              </div>
            )}
          </div>
        );
      
      case 'image':
        return (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <span className="text-gray-400 text-xs">IMG</span>
            </div>
            <p className="text-gray-500 text-lg">이미지 기능</p>
            <p className="text-gray-400 text-sm mt-2">준비 중입니다.</p>
          </div>
        );
      
      case 'video':
        return (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <span className="text-gray-400 text-xs">VIDEO</span>
            </div>
            <p className="text-gray-500 text-lg">비디오 기능</p>
            <p className="text-gray-400 text-sm mt-2">준비 중입니다.</p>
          </div>
        );
      
      default:
        return (
          <div className="text-center py-12">
            <p className="text-gray-500">콘텐츠를 불러올 수 없습니다.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F3F0]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4">
            {user.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt={user.name || user.username}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#A0825C] flex items-center justify-center">
                <span className="text-white text-xl font-semibold">
                  {(user.name || user.username || 'U')[0].toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-xl font-bold text-[#8B4513]">
                {user.name || user.username}
              </h1>
              {user.bio && (
                <p className="text-gray-600 mt-1">{user.bio}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-gray-500">
                  amusefit.co.kr/users/{settings?.customUrl || user.username}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const url = `${window.location.origin}/users/${settings?.customUrl || user.username}`;
                    navigator.clipboard.writeText(url);
                    toast({ title: "URL이 복사되었습니다!" });
                  }}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {renderContent()}
      </main>
    </div>
  );
}