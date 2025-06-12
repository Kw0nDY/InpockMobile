import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { ExternalLink, User, Image, Video, Link } from "lucide-react";
import { trackPageView } from "../lib/analytics";

export default function PublicViewPage() {
  const params = useParams();
  // Handle both /users/:username and /:customUrl patterns
  const identifier = params.username || params.customUrl;

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
                        <div 
                          className="flex items-center gap-3 h-full p-2 bg-white rounded-lg border cursor-pointer hover:shadow-sm transition-shadow"
                          onClick={() => {
                            window.open(link.originalUrl, '_blank');
                            // Track click
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
                      
                      {/* Simple Style */}
                      {link.style === 'simple' && (
                        <div 
                          className="bg-white rounded-lg border p-3 h-full flex flex-col justify-center cursor-pointer hover:bg-gray-50 transition-colors" 
                          onClick={() => {
                            window.open(link.originalUrl, '_blank');
                            // Track click
                            fetch(`/api/links/${link.id}/click`, { method: 'POST' });
                          }}
                        >
                          <div className="text-sm font-medium text-gray-800 truncate mb-1">{link.title}</div>
                          {link.description && (
                            <div className="text-xs text-gray-600 mb-2 line-clamp-1">{link.description}</div>
                          )}
                          <div className="w-full h-2 bg-gray-300 rounded"></div>
                        </div>
                      )}
                      
                      {/* Card Style */}
                      {link.style === 'card' && (
                        <div 
                          className="bg-gray-400 rounded-lg h-full flex flex-col justify-center p-3 relative cursor-pointer hover:bg-gray-500 transition-colors" 
                          onClick={() => {
                            window.open(link.originalUrl, '_blank');
                            // Track click
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
                            {link.description && (
                              <div className="text-xs opacity-90 mt-1 line-clamp-1">{link.description}</div>
                            )}
                          </div>
                          <div className="absolute bottom-2 right-2 w-6 h-6 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                            <div className="w-3 h-3 border-2 border-white rounded-full"></div>
                          </div>
                        </div>
                      )}

                      {/* Background Style */}
                      {link.style === 'background' && (
                        <div 
                          className="h-full flex flex-col justify-center p-3 relative rounded-lg cursor-pointer hover:opacity-90 transition-opacity" 
                          style={{background: 'repeating-linear-gradient(45deg, #f5f5f5, #f5f5f5 10px, #e0e0e0 10px, #e0e0e0 20px)'}}
                          onClick={() => {
                            window.open(link.originalUrl, '_blank');
                            // Track click
                            fetch(`/api/links/${link.id}/click`, { method: 'POST' });
                          }}
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
    <div className="min-h-screen bg-[#F5F3F0]">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center space-x-3">
            {user.profileImageUrl ? (
              <img 
                src={user.profileImageUrl} 
                alt={user.name || user.username}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                <User className="w-6 h-6 text-gray-500" />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-[#8B4513]">
                {user.name || user.username}
              </h1>
              {user.bio && (
                <p className="text-sm text-gray-600 mt-1">{user.bio}</p>
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