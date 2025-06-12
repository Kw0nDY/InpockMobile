import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { User, Link as LinkIcon, Copy, Check } from "lucide-react";

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
  contentType: 'links' | 'media' | 'both';
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

  if (userLoading || settingsLoading || linksLoading) {
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
                    <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-[#B08A6B]/20 p-4 hover:bg-white/95 transition-all duration-200 shadow-sm">
                      <div 
                        className="flex items-center gap-4 cursor-pointer"
                        onClick={() => {
                          window.open(link.originalUrl, '_blank');
                          fetch(`/api/links/${link.id}/click`, { method: 'POST' });
                        }}
                      >
                        {(link.customImageUrl || link.imageUrl) ? (
                          <img 
                            src={link.customImageUrl || link.imageUrl} 
                            alt={link.title}
                            className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gradient-to-br from-[#B08A6B]/20 to-[#8B6F47]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                            <LinkIcon className="w-6 h-6 text-[#8B6F47]" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-gray-800 truncate mb-1">{link.title}</h3>
                          {link.description && (
                            <p className="text-sm text-gray-600 line-clamp-2 mb-2">{link.description}</p>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-[#8B6F47] font-medium">
                              {window.location.host}/{link.shortCode}
                            </div>
                            <div className="text-sm text-blue-600 font-medium">
                              방문 {(link.ownerVisits || 0) + (link.externalVisits || 0)}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(link.originalUrl, link.shortCode);
                          }}
                          className="p-2 hover:bg-[#B08A6B]/15 rounded-lg transition-colors flex-shrink-0"
                        >
                          {copiedLink === link.shortCode ? (
                            <Check className="w-5 h-5 text-green-600" />
                          ) : (
                            <Copy className="w-5 h-5 text-[#8B6F47]" />
                          )}
                        </button>
                      </div>
                    </div>
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
        <div className="p-4">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}