import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { User, Link as LinkIcon, Copy, Check, Image, Video, Home } from "lucide-react";

interface UserProfile {
  id: number;
  username: string;
  name: string;
  bio?: string;
  profileImage?: string;
  links: Array<{
    id: number;
    title: string;
    originalUrl: string;
    shortCode: string;
    style: 'thumbnail' | 'simple' | 'card' | 'background';
    description?: string;
    imageUrl?: string;
    customImageUrl?: string;
    ownerVisits?: number;
    externalVisits?: number;
  }>;
}

interface UserSettings {
  contentType: 'links' | 'image' | 'video' | 'media' | 'both';
  customUrl: string;
  showProfileImage: boolean;
  showBio: boolean;
  showVisitCount: boolean;
  backgroundTheme: string;
}

export default function PublicViewPage() {
  const params = useParams<{ username?: string; customUrl?: string }>();
  const identifier = params.username || params.customUrl || '';
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const { data: user, isLoading: userLoading } = useQuery<UserProfile>({
    queryKey: [`/api/public/${identifier}`],
    enabled: !!identifier,
  });

  const { data: settings, isLoading: settingsLoading } = useQuery<UserSettings>({
    queryKey: [`/api/public/${identifier}/settings`],
    enabled: !!identifier,
  });

  const { data: links = [], isLoading: linksLoading } = useQuery<any[]>({
    queryKey: [`/api/public/${identifier}/links`],
    enabled: !!identifier,
  });

  const { data: images = [], isLoading: imagesLoading } = useQuery<any[]>({
    queryKey: [`/api/media/${user?.id}/image`],
    enabled: !!user?.id,
  });

  const { data: videos = [], isLoading: videosLoading } = useQuery<any[]>({
    queryKey: [`/api/media/${user?.id}/video`],
    enabled: !!user?.id,
  });

  const copyToClipboard = async (originalUrl: string, shortCode: string) => {
    const shortUrl = `${window.location.host}/${shortCode}`;
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopiedLink(shortCode);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (userLoading || settingsLoading || linksLoading || imagesLoading || videosLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f0e6d6] via-[#f4ead5] to-[#f8f0e5] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B6F47]"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f0e6d6] via-[#f4ead5] to-[#f8f0e5] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">사용자를 찾을 수 없습니다</h1>
          <p className="text-gray-600">요청하신 프로필이 존재하지 않습니다.</p>
        </div>
      </div>
    );
  }

  const contentType = settings?.contentType || 'links';

  const renderContent = () => {
    switch (contentType) {
      case 'links':
        return (
          <div className="space-y-4">
            {Array.isArray(links) && links.length > 0 ? (
              <div className="space-y-4">
                {links.map((link: any) => (
                  <div key={link.id} className="w-full">
                    {/* Thumbnail Style */}
                    {link.style === 'thumbnail' && (
                      <div className="border border-gray-200 rounded-lg p-3 bg-white">
                        <div 
                          className="flex items-center gap-3 p-2 bg-white rounded-lg border relative cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => {
                            window.open(link.originalUrl, '_blank');
                            fetch(`/api/links/${link.id}/click`, { method: 'POST' });
                          }}
                        >
                          {(link.customImageUrl || link.imageUrl) ? (
                            <img 
                              src={link.customImageUrl || link.imageUrl} 
                              alt={link.title}
                              className="w-12 h-12 rounded object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-300 rounded flex-shrink-0"></div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-800 truncate hover:text-[#A0825C]">
                              {link.title}
                            </div>
                            {link.description && (
                              <div className="text-xs text-gray-600 mt-1 line-clamp-1">{link.description}</div>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <div 
                                className="text-xs text-blue-600 cursor-pointer hover:underline flex-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(`/l/${link.shortCode}`, '_blank');
                                }}
                              >
                                클릭수: {link.clicks || 0} | 단축링크: amusefit.co.kr/l/{link.shortCode}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(`${window.location.origin}/l/${link.shortCode}`, link.shortCode);
                                }}
                                className="h-5 w-5 p-0 text-gray-400 hover:text-blue-600"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="text-xs text-gray-500 mt-1 flex gap-3">
                              <span>내 방문: {link.ownerVisits || 0}</span>
                              <span>외부 방문: {link.externalVisits || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Card Style */}
                    {link.style === 'card' && (
                      <div className="border border-gray-200 rounded-lg p-3 bg-white">
                        <div 
                          className="bg-gray-400 rounded-lg h-32 flex flex-col justify-center p-3 relative cursor-pointer hover:bg-gray-500 transition-colors" 
                          onClick={() => {
                            window.open(link.originalUrl, '_blank');
                            fetch(`/api/links/${link.id}/click`, { method: 'POST' });
                          }}
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
                            <div 
                              className="text-xs text-blue-200 mt-1 cursor-pointer hover:underline"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(`/l/${link.shortCode}`, '_blank');
                              }}
                            >
                              amusefit.co.kr/l/{link.shortCode} | 클릭: {link.clicks || 0}
                            </div>
                            <div className="text-xs text-gray-300 mt-1 flex gap-3">
                              <span>내 방문: {link.ownerVisits || 0}</span>
                              <span>외부 방문: {link.externalVisits || 0}</span>
                            </div>
                          </div>
                          <div className="absolute bottom-2 right-2 w-6 h-6 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                            <div className="w-3 h-3 border-2 border-white rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Simple Style */}
                    {link.style === 'simple' && (
                      <div className="border border-gray-200 rounded-lg p-3 bg-white">
                        <div 
                          className="bg-white rounded-lg border p-3 relative cursor-pointer hover:bg-gray-50 transition-colors" 
                          onClick={() => {
                            window.open(link.originalUrl, '_blank');
                            fetch(`/api/links/${link.id}/click`, { method: 'POST' });
                          }}
                        >
                          {(link.customImageUrl || link.imageUrl) && (
                            <img 
                              src={link.customImageUrl || link.imageUrl} 
                              alt={link.title}
                              className="w-full h-20 object-cover rounded mb-2"
                            />
                          )}
                          <div className="text-sm font-medium text-gray-800 truncate mb-2 hover:text-[#A0825C]">{link.title}</div>
                          {link.description && (
                            <div className="text-xs text-gray-600 mb-2 line-clamp-2">{link.description}</div>
                          )}
                          <div 
                            className="text-xs text-blue-600 mb-2 cursor-pointer hover:underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`/l/${link.shortCode}`, '_blank');
                            }}
                          >
                            단축링크: amusefit.co.kr/l/{link.shortCode} | 클릭수: {link.clicks || 0}
                          </div>
                          <div className="text-xs text-gray-500 mb-2 flex gap-3">
                            <span>내 방문: {link.ownerVisits || 0}</span>
                            <span>외부 방문: {link.externalVisits || 0}</span>
                          </div>
                          <div className="w-full h-2 bg-gray-300 rounded"></div>
                        </div>
                      </div>
                    )}

                    {/* Background Style */}
                    {link.style === 'background' && (
                      <div className="border border-gray-200 rounded-lg p-3 bg-white">
                        <div 
                          className="h-32 flex flex-col justify-center p-3 relative rounded-lg cursor-pointer hover:opacity-90 transition-opacity overflow-hidden" 
                          style={{
                            backgroundImage: (link.customImageUrl || link.imageUrl) 
                              ? `url(${link.customImageUrl || link.imageUrl})` 
                              : 'repeating-linear-gradient(45deg, #f5f5f5, #f5f5f5 10px, #e0e0e0 10px, #e0e0e0 20px)',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat'
                          }}
                          onClick={() => {
                            window.open(link.originalUrl, '_blank');
                            fetch(`/api/links/${link.id}/click`, { method: 'POST' });
                          }}
                        >
                          <div className="absolute inset-0 bg-black bg-opacity-40 rounded-lg"></div>
                          
                          <div className="relative z-10 text-white">
                            <div className="text-sm font-medium truncate mb-2 drop-shadow-lg">{link.title}</div>
                            <div 
                              className="text-xs text-blue-200 mb-2 cursor-pointer hover:underline drop-shadow-lg"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(`/l/${link.shortCode}`, '_blank');
                              }}
                            >
                              단축링크: amusefit.co.kr/l/{link.shortCode} | 클릭수: {link.clicks || 0}
                            </div>
                            <div className="text-xs text-gray-200 mb-2 flex gap-3 drop-shadow-lg">
                              <span>내 방문: {link.ownerVisits || 0}</span>
                              <span>외부 방문: {link.externalVisits || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <LinkIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">링크 없음</p>
                <p className="text-gray-400 text-sm mt-2">아직 등록된 링크가 없습니다.</p>
              </div>
            )}
          </div>
        );
      case 'image':
        return (
          <div className="space-y-4">
            {Array.isArray(images) && images.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {images.map((image: any, index: number) => (
                  <div key={image.id} className="relative aspect-square">
                    <img
                      src={image.filePath || image.mediaUrl || '/placeholder-image.jpg'}
                      alt={image.title || `이미지 ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => {
                        window.location.href = `/users/${user.username}/images`;
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder-image.jpg';
                      }}
                    />
                    {image.title && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2 rounded-b-lg">
                        {image.title}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">이미지 없음</p>
                <p className="text-gray-400 text-sm mt-2">아직 등록된 이미지가 없습니다.</p>
              </div>
            )}
          </div>
        );
      case 'video':
        return (
          <div className="space-y-4">
            {Array.isArray(videos) && videos.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {videos.map((video: any, index: number) => (
                  <div key={video.id} className="relative aspect-video bg-black rounded-lg overflow-hidden">
                    <video
                      src={video.filePath || video.mediaUrl}
                      className="w-full h-full object-cover"
                      poster={video.thumbnailUrl}
                      controls
                      preload="metadata"
                    />
                    {video.title && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2">
                        {video.title}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">동영상 없음</p>
                <p className="text-gray-400 text-sm mt-2">아직 등록된 동영상이 없습니다.</p>
              </div>
            )}
          </div>
        );
      case 'media':
        return (
          <div className="text-center py-12">
            <p className="text-gray-500">미디어 콘텐츠</p>
          </div>
        );
      default:
        return (
          <div className="text-center py-12">
            <p className="text-gray-500">콘텐츠 없음</p>
          </div>
        );
    }
  };

  return (
    <div 
      className="min-h-screen"
      style={{
        background: settings?.backgroundTheme || 'linear-gradient(135deg, #f0e6d6 0%, #f4ead5 50%, #f8f0e5 100%)'
      }}
    >
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-[#B08A6B]/20 px-6 py-4">
          <div className="flex items-center gap-3">
            {settings?.showProfileImage && user.profileImage ? (
              <img 
                src={user.profileImage} 
                alt={user.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-[#B08A6B] to-[#8B6F47] rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-800">{user.name}</h1>
              <p className="text-sm text-gray-600">@{user.username}</p>
            </div>
          </div>
          {settings?.showBio && user.bio && (
            <p className="text-sm text-gray-700 mt-3">{user.bio}</p>
          )}
        </div>

        {/* Content */}
        <div className="p-4 pb-16">
          {renderContent()}
        </div>

        {/* Footer with Content Type Icons */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-[#B08A6B]/20">
          <div className="max-w-md mx-auto px-6 py-3">
            <div className="flex justify-center items-center gap-4">
              {/* Images Icon */}
              <div className={`flex flex-col items-center gap-0.5 transition-colors ${
                contentType === 'image' 
                  ? 'text-[#8B6F47]' 
                  : images.length > 0 
                    ? 'text-gray-600 hover:text-[#8B6F47] cursor-pointer' 
                    : 'text-gray-300'
              }`}>
                <div className={`p-1.5 rounded-full ${
                  contentType === 'image' 
                    ? 'bg-[#8B6F47]/10' 
                    : images.length > 0 
                      ? 'hover:bg-gray-100' 
                      : ''
                }`}>
                  <Image className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-medium">이미지</span>
                {images.length > 0 && (
                  <div className="w-0.5 h-0.5 bg-current rounded-full"></div>
                )}
              </div>

              {/* Videos Icon */}
              <div className={`flex flex-col items-center gap-0.5 transition-colors ${
                contentType === 'video' 
                  ? 'text-[#8B6F47]' 
                  : videos.length > 0 
                    ? 'text-gray-600 hover:text-[#8B6F47] cursor-pointer' 
                    : 'text-gray-300'
              }`}>
                <div className={`p-1.5 rounded-full ${
                  contentType === 'video' 
                    ? 'bg-[#8B6F47]/10' 
                    : videos.length > 0 
                      ? 'hover:bg-gray-100' 
                      : ''
                }`}>
                  <Video className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-medium">동영상</span>
                {videos.length > 0 && (
                  <div className="w-0.5 h-0.5 bg-current rounded-full"></div>
                )}
              </div>

              {/* Links Icon */}
              <div className={`flex flex-col items-center gap-0.5 transition-colors ${
                contentType === 'links' 
                  ? 'text-[#8B6F47]' 
                  : links.length > 0 
                    ? 'text-gray-600 hover:text-[#8B6F47] cursor-pointer' 
                    : 'text-gray-300'
              }`}>
                <div className={`p-1.5 rounded-full ${
                  contentType === 'links' 
                    ? 'bg-[#8B6F47]/10' 
                    : links.length > 0 
                      ? 'hover:bg-gray-100' 
                      : ''
                }`}>
                  <LinkIcon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-medium">링크</span>
                {links.length > 0 && (
                  <div className="w-0.5 h-0.5 bg-current rounded-full"></div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}