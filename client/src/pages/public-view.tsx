import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ExternalLink, User, Image, Video, Link, Copy, Check } from "lucide-react";
import { trackPageView } from "../lib/analytics";

export default function PublicViewPage() {
  const params = useParams();
  // Handle both /users/:username and /:customUrl patterns
  const identifier = params.username || params.customUrl;
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Fetch user data by custom URL
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: [`/api/public/${identifier}`],
    enabled: !!identifier,
  });

  // Fetch user's links if user exists
  const { data: linksData, isLoading: linksLoading } = useQuery({
    queryKey: [`/api/public/${identifier}/links`],
    enabled: !!identifier && !!userData,
  });

  // Fetch user's settings
  const { data: settingsData } = useQuery({
    queryKey: [`/api/public/${identifier}/settings`],
    enabled: !!identifier && !!userData,
  });

  useEffect(() => {
    if (identifier) {
      const path = params.username ? `/users/${identifier}` : `/${identifier}`;
      trackPageView(path, path);
    }
  }, [identifier, params.username]);

  const copyToClipboard = async (url: string, shortCode: string) => {
    try {
      // Use the current domain for the short URL
      const currentDomain = window.location.origin;
      const shortUrl = `${currentDomain}/${shortCode}`;
      await navigator.clipboard.writeText(shortUrl);
      setCopiedLink(shortCode);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-[#F5F3F0] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B4513] mx-auto mb-4"></div>
          <p className="text-[#8B4513]">페이지를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-[#F5F3F0] flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-700 mb-2">페이지를 찾을 수 없습니다</h1>
          <p className="text-gray-500">요청하신 페이지가 존재하지 않습니다.</p>
        </div>
      </div>
    );
  }

  const user = userData as any;
  const links = linksData as any[] || [];
  const settings = settingsData as any;

  // Determine content type from settings (default to links)
  const contentType = settings?.contentType || 'links';

  const renderContent = () => {
    switch (contentType) {
      case 'links':
        return (
          <div className="space-y-4">
            {links.length > 0 ? (
              <div className="space-y-3">
                {links.map((link: any) => (
                  <div key={link.id} className="w-full h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 overflow-hidden">
                    <div className="p-2 w-full h-full">
                      {/* Thumbnail Style */}
                      {link.style === 'thumbnail' && (
                        <div className="flex items-center gap-3 h-full p-2 bg-card rounded-lg border border-border group relative">
                          <div 
                            className="flex items-center gap-3 flex-1 cursor-pointer"
                            onClick={() => {
                              window.open(link.originalUrl, '_blank');
                              fetch(`/api/links/${link.id}/click`, { method: 'POST' });
                            }}
                          >
                            {(link.customImageUrl || link.imageUrl) ? (
                              <img 
                                src={link.customImageUrl || link.imageUrl} 
                                alt={link.title}
                                className="w-12 h-12 rounded object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-muted rounded"></div>
                            )}
                            <div className="text-left flex-1 min-w-0">
                              <div className="text-sm font-medium text-foreground truncate">{link.title}</div>
                              {link.description && (
                                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{link.description}</div>
                              )}
                              <div className="text-xs text-gray-500 mt-1">
                                단축 URL: {window.location.host}/{link.shortCode}
                              </div>
                              <div className="text-xs text-blue-600 mt-1">
                                내 방문: {link.ownerVisits || 0} · 외부 방문: {link.externalVisits || 0}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(link.originalUrl, link.shortCode);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-muted rounded"
                          >
                            {copiedLink === link.shortCode ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4 text-gray-600" />
                            )}
                          </button>
                        </div>
                      )}
                      
                      {/* Simple Style */}
                      {link.style === 'simple' && (
                        <div className="bg-card rounded-lg border border-border p-3 h-full flex flex-col justify-center group relative">
                          <div 
                            className="flex-1 cursor-pointer"
                            onClick={() => {
                              window.open(link.originalUrl, '_blank');
                              fetch(`/api/links/${link.id}/click`, { method: 'POST' });
                            }}
                          >
                            <div className="text-sm font-medium text-foreground truncate mb-1">{link.title}</div>
                            {link.description && (
                              <div className="text-xs text-muted-foreground mb-2 line-clamp-2">{link.description}</div>
                            )}
                            <div className="text-xs text-gray-500 mb-1">
                              단축 URL: {window.location.host}/{link.shortCode}
                            </div>
                            <div className="text-xs text-blue-600 mb-2">
                              내 방문: {link.ownerVisits || 0} · 외부 방문: {link.externalVisits || 0}
                            </div>
                            <div className="w-full h-2 bg-muted rounded"></div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(link.originalUrl, link.shortCode);
                            }}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                          >
                            {copiedLink === link.shortCode ? (
                              <Check className="w-3 h-3 text-green-600" />
                            ) : (
                              <Copy className="w-3 h-3 text-gray-600" />
                            )}
                          </button>
                        </div>
                      )}
                      
                      {/* Card Style */}
                      {link.style === 'card' && (
                        <div className="bg-accent rounded-lg h-full flex flex-col justify-center p-3 relative group">
                          <div
                            className="absolute inset-0 cursor-pointer"
                            onClick={() => {
                              window.open(link.originalUrl, '_blank');
                              fetch(`/api/links/${link.id}/click`, { method: 'POST' });
                            }}
                          />
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
                              <div className="text-xs opacity-90 mt-1 line-clamp-2">{link.description}</div>
                            )}
                            <div className="text-xs text-gray-300 mt-1">
                              단축 URL: {window.location.host}/{link.shortCode}
                            </div>
                            <div className="text-xs text-blue-200 mt-1">
                              내 방문: {link.ownerVisits || 0} · 외부 방문: {link.externalVisits || 0}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(link.originalUrl, link.shortCode);
                            }}
                            className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-black bg-opacity-50 hover:bg-opacity-70 rounded"
                          >
                            {copiedLink === link.shortCode ? (
                              <Check className="w-3 h-3 text-green-400" />
                            ) : (
                              <Copy className="w-3 h-3 text-white" />
                            )}
                          </button>
                        </div>
                      )}

                      {/* Background Style */}
                      {link.style === 'background' && (
                        <div 
                          className="h-full flex flex-col justify-center p-3 relative rounded-lg overflow-hidden group" 
                          style={{
                            backgroundImage: (link.customImageUrl || link.imageUrl) 
                              ? `url(${link.customImageUrl || link.imageUrl})` 
                              : 'repeating-linear-gradient(45deg, #f5f5f5, #f5f5f5 10px, #e0e0e0 10px, #e0e0e0 20px)',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat'
                          }}
                        >
                          <div
                            className="absolute inset-0 cursor-pointer"
                            onClick={() => {
                              window.open(link.originalUrl, '_blank');
                              fetch(`/api/links/${link.id}/click`, { method: 'POST' });
                            }}
                          />
                          {/* Dark overlay for text readability */}
                          <div className="absolute inset-0 bg-black bg-opacity-40 rounded-lg"></div>
                          
                          <div className="relative z-10 text-white">
                            <div className="text-sm font-medium truncate mb-2 drop-shadow-lg">{link.title}</div>
                            {link.description && (
                              <div className="text-xs text-gray-200 mb-2 line-clamp-2 drop-shadow-lg">{link.description}</div>
                            )}
                            <div className="text-xs text-gray-300 drop-shadow-lg">
                              단축 URL: {window.location.host}/{link.shortCode}
                            </div>
                            <div className="text-xs text-blue-200 drop-shadow-lg">
                              내 방문: {link.ownerVisits || 0} · 외부 방문: {link.externalVisits || 0}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(link.originalUrl, link.shortCode);
                            }}
                            className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-black bg-opacity-50 hover:bg-opacity-70 rounded"
                          >
                            {copiedLink === link.shortCode ? (
                              <Check className="w-3 h-3 text-green-400" />
                            ) : (
                              <Copy className="w-3 h-3 text-white" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Link className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">링크 없음</p>
                <p className="text-gray-400 text-sm mt-2">아직 등록된 링크가 없습니다.</p>
              </div>
            )}
          </div>
        );
      
      case 'image':
        return (
          <div className="text-center py-12">
            <Image className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center" />
            <p className="text-gray-500 text-lg">이미지 기능</p>
            <p className="text-gray-400 text-sm mt-2">준비 중입니다.</p>
          </div>
        );
      
      case 'video':
        return (
          <div className="text-center py-12">
            <Video className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center" />
            <p className="text-gray-500 text-lg">비디오 기능</p>
            <p className="text-gray-400 text-sm mt-2">준비 중입니다.</p>
          </div>
        );
      
      default:
        return (
          <div className="text-center py-12">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">콘텐츠 없음</p>
            <p className="text-gray-400 text-sm mt-2">표시할 콘텐츠가 없습니다.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto bg-background min-h-screen">
        {/* Header */}
        <div className="p-4 border-b border-border bg-card">
          <div className="flex items-center space-x-3">
            {user.profileImageUrl ? (
              <img 
                src={user.profileImageUrl} 
                alt={user.name || user.username}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <User className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-primary">
                {user.name || user.username}
              </h1>
              {user.bio && (
                <p className="text-sm text-muted-foreground mt-1">{user.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}