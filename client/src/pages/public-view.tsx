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
  const [currentContentType, setCurrentContentType] = useState<string | null>(null);

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

  // Helper function to extract video embed URL
  const getVideoEmbedUrl = (url: string) => {
    // YouTube
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const youtubeMatch = url.match(youtubeRegex);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }

    // Vimeo
    const vimeoRegex = /(?:vimeo\.com\/)([0-9]+)/;
    const vimeoMatch = url.match(vimeoRegex);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    return null;
  };

  // Filter video links from links data
  const videoLinks = links.filter((link: any) => {
    return getVideoEmbedUrl(link.originalUrl) !== null;
  });

  // Combine uploaded videos and video links
  const allVideos = [
    ...videos.map((video: any) => ({ ...video, type: 'upload' })),
    ...videoLinks.map((link: any) => ({ ...link, type: 'link', embedUrl: getVideoEmbedUrl(link.originalUrl) }))
  ];

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
      <div className="min-h-screen bg-[#F5F5DC] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4E342E]"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F5DC] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#4E342E] mb-2">사용자를 찾을 수 없습니다</h1>
          <p className="text-[#8D6E63]">요청하신 프로필이 존재하지 않습니다.</p>
        </div>
      </div>
    );
  }

  const contentType = currentContentType || settings?.contentType || 'links';

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
                      <div className="border border-[#8D6E63]/20 rounded-lg p-3 bg-white/70">
                        <div 
                          className="flex items-center gap-3 p-2 bg-white/90 rounded-lg border border-[#EFE5DC] relative cursor-pointer hover:bg-[#EFE5DC] transition-colors"
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
                            <div className="w-12 h-12 bg-[#EFE5DC] rounded flex-shrink-0"></div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-[#4E342E] truncate hover:text-[#8D6E63]">
                              {link.title}
                            </div>
                            {link.description && (
                              <div className="text-xs text-[#8D6E63] mt-1 line-clamp-1">{link.description}</div>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <div 
                                className="text-xs text-[#A1887F] cursor-pointer hover:underline flex-1"
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
                                className="h-5 w-5 p-0 text-[#8D6E63] hover:text-[#4E342E]"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="text-xs text-[#A1887F] mt-1 flex gap-3">
                              <span>내 방문: {link.ownerVisits || 0}</span>
                              <span>외부 방문: {link.externalVisits || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Card Style */}
                    {link.style === 'card' && (
                      <div className="border border-[#8D6E63]/20 rounded-lg p-3 bg-white/70">
                        <div 
                          className="bg-[#EFE5DC] rounded-lg h-32 flex flex-col justify-center p-3 relative cursor-pointer hover:bg-[#D7CCC8] transition-colors" 
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
                          <div className="relative z-10 bg-[#4E342E]/80 text-white p-2 rounded">
                            <div className="text-sm font-medium truncate">{link.title}</div>
                            <div 
                              className="text-xs text-[#EFE5DC] mt-1 cursor-pointer hover:underline"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(`/l/${link.shortCode}`, '_blank');
                              }}
                            >
                              amusefit.co.kr/l/{link.shortCode} | 클릭: {link.clicks || 0}
                            </div>
                            <div className="text-xs text-[#A1887F] mt-1 flex gap-3">
                              <span>내 방문: {link.ownerVisits || 0}</span>
                              <span>외부 방문: {link.externalVisits || 0}</span>
                            </div>
                          </div>
                          <div className="absolute bottom-2 right-2 w-6 h-6 bg-[#4E342E]/80 rounded-full flex items-center justify-center">
                            <div className="w-3 h-3 border-2 border-white rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Simple Style */}
                    {link.style === 'simple' && (
                      <div className="border border-[#8D6E63]/20 rounded-lg p-3 bg-white/70">
                        <div 
                          className="bg-white/90 rounded-lg border border-[#EFE5DC] p-3 relative cursor-pointer hover:bg-[#EFE5DC] transition-colors" 
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
                          <div className="text-sm font-medium text-[#4E342E] truncate mb-2 hover:text-[#8D6E63]">{link.title}</div>
                          {link.description && (
                            <div className="text-xs text-[#8D6E63] mb-2 line-clamp-2">{link.description}</div>
                          )}
                          <div 
                            className="text-xs text-[#A1887F] mb-2 cursor-pointer hover:underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`/l/${link.shortCode}`, '_blank');
                            }}
                          >
                            단축링크: amusefit.co.kr/l/{link.shortCode} | 클릭수: {link.clicks || 0}
                          </div>
                          <div className="text-xs text-[#A1887F] mb-2 flex gap-3">
                            <span>내 방문: {link.ownerVisits || 0}</span>
                            <span>외부 방문: {link.externalVisits || 0}</span>
                          </div>
                          <div className="w-full h-2 bg-[#EFE5DC] rounded"></div>
                        </div>
                      </div>
                    )}

                    {/* Background Style */}
                    {link.style === 'background' && (
                      <div className="border border-[#8D6E63]/20 rounded-lg p-3 bg-white/70">
                        <div 
                          className="h-32 flex flex-col justify-center p-3 relative rounded-lg cursor-pointer hover:opacity-90 transition-opacity overflow-hidden" 
                          style={{
                            backgroundImage: (link.customImageUrl || link.imageUrl) 
                              ? `url(${link.customImageUrl || link.imageUrl})` 
                              : 'repeating-linear-gradient(45deg, #EFE5DC, #EFE5DC 10px, #D7CCC8 10px, #D7CCC8 20px)',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat'
                          }}
                          onClick={() => {
                            window.open(link.originalUrl, '_blank');
                            fetch(`/api/links/${link.id}/click`, { method: 'POST' });
                          }}
                        >
                          <div className="absolute inset-0 bg-[#4E342E]/40 rounded-lg"></div>
                          
                          <div className="relative z-10 text-white">
                            <div className="text-sm font-medium truncate mb-2 drop-shadow-lg">{link.title}</div>
                            <div 
                              className="text-xs text-[#EFE5DC] mb-2 cursor-pointer hover:underline drop-shadow-lg"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(`/l/${link.shortCode}`, '_blank');
                              }}
                            >
                              단축링크: amusefit.co.kr/l/{link.shortCode} | 클릭수: {link.clicks || 0}
                            </div>
                            <div className="text-xs text-[#A1887F] mb-2 flex gap-3 drop-shadow-lg">
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
                <LinkIcon className="w-16 h-16 text-[#EFE5DC] mx-auto mb-4" />
                <p className="text-[#8D6E63] text-lg">링크 없음</p>
                <p className="text-[#A1887F] text-sm mt-2">아직 등록된 링크가 없습니다.</p>
              </div>
            )}
          </div>
        );
      case 'image':
        return (
          <div className="space-y-4">
            {Array.isArray(images) && images.length > 0 ? (
              <div className="space-y-4">
                {images.map((image: any, index: number) => (
                  <div key={image.id} className="relative">
                    <div className="bg-gradient-to-r from-[#8D6E63] to-[#A1887F] p-1 rounded-xl shadow-lg">
                      <div className="relative aspect-[16/10] bg-white rounded-lg overflow-hidden">
                        <img
                          src={image.filePath || image.mediaUrl || '/placeholder-image.jpg'}
                          alt={image.title || `이미지 ${index + 1}`}
                          className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                          onClick={() => {
                            window.location.href = `/users/${user.username}/images`;
                          }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder-image.jpg';
                          }}
                        />
                        {image.title && (
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white text-sm p-3">
                            {image.title}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-[#8D6E63] text-lg">이미지 없음</p>
                <p className="text-[#A1887F] text-sm mt-2">아직 등록된 이미지가 없습니다.</p>
              </div>
            )}
          </div>
        );
      case 'video':
        return (
          <div className="space-y-4">
            {Array.isArray(allVideos) && allVideos.length > 0 ? (
              <div className="space-y-4">
                {allVideos.map((video: any, index: number) => (
                  <div key={video.id || `link-${index}`} className="relative">
                    <div className="bg-gradient-to-r from-[#8D6E63] to-[#A1887F] p-1 rounded-xl shadow-lg">
                      <div className="relative aspect-[16/10] bg-black rounded-lg overflow-hidden">
                        {video.type === 'link' && video.embedUrl ? (
                          <iframe
                            src={video.embedUrl}
                            className="w-full h-full"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title={video.title || 'Video'}
                          />
                        ) : (
                          <video
                            src={video.filePath || video.mediaUrl}
                            className="w-full h-full object-cover"
                            poster={video.thumbnailUrl}
                            controls
                            preload="metadata"
                          />
                        )}
                        {video.title && video.type === 'upload' && (
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white text-sm p-3">
                            {video.title}
                          </div>
                        )}
                      </div>
                    </div>
                    {video.type === 'link' && video.title && (
                      <div className="mt-2 px-1">
                        <h3 className="text-sm font-medium text-[#4E342E]">{video.title}</h3>
                        {video.description && (
                          <p className="text-xs text-[#8D6E63] mt-1 line-clamp-2">{video.description}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-[#8D6E63] text-lg">동영상 없음</p>
                <p className="text-[#A1887F] text-sm mt-2">업로드된 동영상이나 링크가 없습니다.</p>
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
      className="h-screen flex flex-col"
      style={{
        background: settings?.backgroundTheme || 'linear-gradient(135deg, #F5F5DC 0%, #EFE5DC 50%, #F5F5DC 100%)'
      }}
    >
      <div className="max-w-md mx-auto w-full flex flex-col h-full">
        {/* Fixed Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-[#8D6E63]/20 px-6 py-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            {settings?.showProfileImage && user.profileImage ? (
              <img 
                src={user.profileImage} 
                alt={user.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-[#8D6E63] to-[#A1887F] rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-lg font-bold text-[#4E342E]">{user.name}</h1>
              <p className="text-sm text-[#8D6E63]">@{user.username}</p>
            </div>
          </div>
          {settings?.showBio && user.bio && (
            <p className="text-sm text-[#8D6E63] mt-3">{user.bio}</p>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 pb-20">
            {renderContent()}
          </div>
        </div>

        {/* Footer with Content Type Icons */}
        <div className="fixed bottom-0 left-0 right-0">
          <div className="max-w-md mx-auto bg-[#F5F5DC]/95 backdrop-blur-sm border-t border-[#8D6E63]/30 px-6 py-3">
            <div className="flex justify-center items-center gap-6">
              {/* Images Icon */}
              <button 
                className={`flex flex-col items-center gap-1 transition-all duration-200 ${
                  contentType === 'image' 
                    ? 'text-[#4E342E]' 
                    : 'text-[#8D6E63] hover:text-[#4E342E] cursor-pointer hover:scale-105'
                }`}
                onClick={() => setCurrentContentType('image')}
              >
                <div className={`p-2 rounded-full transition-all duration-200 ${
                  contentType === 'image' 
                    ? 'bg-[#4E342E]/15 shadow-sm' 
                    : 'hover:bg-[#EFE5DC] hover:shadow-sm'
                }`}>
                  <Image className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium">이미지</span>
                {images.length > 0 && (
                  <div className="w-1 h-1 bg-current rounded-full"></div>
                )}
              </button>

              {/* Videos Icon */}
              <button 
                className={`flex flex-col items-center gap-1 transition-all duration-200 ${
                  contentType === 'video' 
                    ? 'text-[#4E342E]' 
                    : 'text-[#8D6E63] hover:text-[#4E342E] cursor-pointer hover:scale-105'
                }`}
                onClick={() => setCurrentContentType('video')}
              >
                <div className={`p-2 rounded-full transition-all duration-200 ${
                  contentType === 'video' 
                    ? 'bg-[#4E342E]/15 shadow-sm' 
                    : 'hover:bg-[#EFE5DC] hover:shadow-sm'
                }`}>
                  <Video className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium">동영상</span>
                {allVideos.length > 0 && (
                  <div className="w-1 h-1 bg-current rounded-full"></div>
                )}
              </button>

              {/* Links Icon */}
              <button 
                className={`flex flex-col items-center gap-1 transition-all duration-200 ${
                  contentType === 'links' 
                    ? 'text-[#4E342E]' 
                    : 'text-[#8D6E63] hover:text-[#4E342E] cursor-pointer hover:scale-105'
                }`}
                onClick={() => setCurrentContentType('links')}
              >
                <div className={`p-2 rounded-full transition-all duration-200 ${
                  contentType === 'links' 
                    ? 'bg-[#4E342E]/15 shadow-sm' 
                    : 'hover:bg-[#EFE5DC] hover:shadow-sm'
                }`}>
                  <LinkIcon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium">링크</span>
                {links.length > 0 && (
                  <div className="w-1 h-1 bg-current rounded-full"></div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}