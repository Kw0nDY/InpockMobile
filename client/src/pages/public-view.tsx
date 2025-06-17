import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { User, Link as LinkIcon, Copy, Check, Image, Video, Home, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";

interface UserProfile {
  id: number;
  username: string;
  name: string;
  bio?: string;
  profileImage?: string;
  profileImageUrl?: string;
  visitCount?: number;
  // Fitness-related fields
  birthDate?: string;
  fitnessAwards?: string;
  fitnessCertifications?: string;
  currentGym?: string;
  gymAddress?: string;
  fitnessIntro?: string;
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showProfileDetails, setShowProfileDetails] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragCurrentY, setDragCurrentY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isMouseDragging, setIsMouseDragging] = useState(false);
  
  // Tinder-style image navigation
  const [imageTransition, setImageTransition] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const [previousImageIndex, setPreviousImageIndex] = useState(0);
  const [autoSlideEnabled, setAutoSlideEnabled] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Profile panel animation state
  const [isProfileClosing, setIsProfileClosing] = useState(false);


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

  // Image navigation functions
  const nextImage = () => {
    if (images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = () => {
    if (images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  const getImageUrl = (image: any) => {
    return image.filePath || image.mediaUrl || '/placeholder-image.jpg';
  };

  const contentType = currentContentType || settings?.contentType || 'links';

  // Auto-refresh every 30 seconds for real-time updates
  useEffect(() => {
    if (!identifier) return;
    
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: [`/api/public/${identifier}/links`] });
      queryClient.invalidateQueries({ queryKey: [`/api/media/${user?.id}/image`] });
      queryClient.invalidateQueries({ queryKey: [`/api/media/${user?.id}/video`] });
    }, 30000);

    return () => clearInterval(interval);
  }, [identifier, user?.id]);

  // Keyboard navigation for images
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (currentContentType === 'image' && images.length > 0) {
        if (event.key === 'ArrowLeft') {
          prevImage();
        } else if (event.key === 'ArrowRight') {
          nextImage();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentContentType, images.length]);



  const handleTouchStart = (e: React.TouchEvent) => {
    setDragStartY(e.touches[0].clientY);
    setDragCurrentY(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setDragCurrentY(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const dragDistance = dragCurrentY - dragStartY;
    // If dragged down more than 30px, close the modal
    if (dragDistance > 30) {
      closeProfilePanel();
    }
    
    setIsDragging(false);
    setDragStartY(0);
    setDragCurrentY(0);
  };

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setDragStartY(e.clientY);
    setDragCurrentY(e.clientY);
    setIsMouseDragging(true);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDragging || !isDragging) return;
    setDragCurrentY(e.clientY);
  };

  const handleMouseUp = () => {
    if (!isMouseDragging || !isDragging) return;
    
    const dragDistance = dragCurrentY - dragStartY;
    // If dragged down more than 30px, close the modal
    if (dragDistance > 30) {
      closeProfilePanel();
    }
    
    setIsMouseDragging(false);
    setIsDragging(false);
    setDragStartY(0);
    setDragCurrentY(0);
  };

  // Global mouse events for drag outside component
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isMouseDragging || !isDragging) return;
      setDragCurrentY(e.clientY);
    };

    const handleGlobalMouseUp = () => {
      if (!isMouseDragging || !isDragging) return;
      
      const dragDistance = dragCurrentY - dragStartY;
      if (dragDistance > 30) {
        closeProfilePanel();
      }
      
      setIsMouseDragging(false);
      setIsDragging(false);
      setDragStartY(0);
      setDragCurrentY(0);
    };

    if (isMouseDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isMouseDragging, isDragging, dragCurrentY, dragStartY]);

  // Auto-slide functionality for images
  useEffect(() => {
    if (!autoSlideEnabled || !Array.isArray(images) || images.length <= 1 || contentType !== 'image' || imageTransition || showProfileDetails) {
      return;
    }

    const interval = setInterval(() => {
      if (!imageTransition && !showProfileDetails) {
        handleRightTap(true); // Pass true to indicate this is from auto-slide
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [autoSlideEnabled, images, contentType, imageTransition, currentImageIndex, showProfileDetails]);

  // Toast notification helper
  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 2000);
  };

  // Toggle auto-slide function
  const toggleAutoSlide = () => {
    const newState = !autoSlideEnabled;
    setAutoSlideEnabled(newState);
    showToastMessage(newState ? '자동 넘김 활성화' : '자동 넘김 비활성화');
  };

  // Event handler wrappers for manual navigation
  const handleLeftTapManual = () => handleLeftTap(false);
  const handleRightTapManual = () => handleRightTap(false);

  // Helper function to close profile panel with animation
  const closeProfilePanel = () => {
    setIsProfileClosing(true);
    setTimeout(() => {
      setShowProfileDetails(false);
      setIsProfileClosing(false);
    }, 300);
  };

  // Tinder-style navigation functions
  const handleLeftTap = (fromAutoSlide = false) => {
    if (images.length > 1 && !imageTransition) {
      if (!fromAutoSlide) {
        // Only disable auto-slide when user manually navigates
        setAutoSlideEnabled(false);
      }
      
      const nextIndex = (currentImageIndex - 1 + images.length) % images.length;
      
      // Store current as previous for animation
      setPreviousImageIndex(currentImageIndex);
      setSlideDirection('left');
      setImageTransition(true);
      
      // Update to next index after brief delay for smooth transition
      setTimeout(() => {
        setCurrentImageIndex(nextIndex);
      }, 50);
      
      // Clear animation state after animation completes
      setTimeout(() => {
        setImageTransition(false);
        setSlideDirection(null);
      }, 300);
    }
  };

  const handleRightTap = (fromAutoSlide = false) => {
    if (images.length > 1 && !imageTransition) {
      if (!fromAutoSlide) {
        // Only disable auto-slide when user manually navigates
        setAutoSlideEnabled(false);
      }
      
      const nextIndex = (currentImageIndex + 1) % images.length;
      
      // Store current as previous for animation
      setPreviousImageIndex(currentImageIndex);
      setSlideDirection('right');
      setImageTransition(true);
      
      // Update to next index after brief delay for smooth transition
      setTimeout(() => {
        setCurrentImageIndex(nextIndex);
      }, 50);
      
      // Clear animation state after animation completes
      setTimeout(() => {
        setImageTransition(false);
        setSlideDirection(null);
      }, 300);
    }
  };



  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [`/api/public/${identifier}`] }),
        queryClient.invalidateQueries({ queryKey: [`/api/public/${identifier}/settings`] }),
        queryClient.invalidateQueries({ queryKey: [`/api/public/${identifier}/links`] }),
        queryClient.invalidateQueries({ queryKey: [`/api/media/${user?.id}/image`] }),
        queryClient.invalidateQueries({ queryKey: [`/api/media/${user?.id}/video`] }),
        queryClient.invalidateQueries({ queryKey: [`/api/user/${user?.id}`] })
      ]);
      
      // Force refetch to get latest data
      await Promise.all([
        queryClient.refetchQueries({ queryKey: [`/api/public/${identifier}`] }),
        queryClient.refetchQueries({ queryKey: [`/api/public/${identifier}/settings`] }),
        queryClient.refetchQueries({ queryKey: [`/api/user/${user?.id}`] })
      ]);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

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
                      <div className="bg-card shadow-sm rounded-lg border border-border">
                        <div 
                          className="flex items-center gap-3 p-4 relative cursor-pointer hover:bg-muted transition-colors"
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
                            <div className="w-12 h-12 bg-muted rounded flex-shrink-0"></div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-foreground truncate hover:text-primary">
                              {link.title}
                            </div>
                            {link.description && (
                              <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{link.description}</div>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <div 
                                className="text-xs text-muted-foreground cursor-pointer hover:underline flex-1"
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
                                className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 flex gap-3">
                              <span>내 방문: {link.ownerVisits || 0}</span>
                              <span>외부 방문: {link.externalVisits || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Card Style */}
                    {link.style === 'card' && (
                      <div className="bg-card shadow-sm rounded-lg border border-border">
                        <div 
                          className="bg-muted rounded-lg h-32 flex flex-col justify-center p-3 relative cursor-pointer hover:bg-muted/80 transition-colors" 
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
                          <div className="relative z-10 bg-black/80 text-white p-2 rounded">
                            <div className="text-sm font-medium truncate">{link.title}</div>
                            <div 
                              className="text-xs text-gray-200 mt-1 cursor-pointer hover:underline"
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
                          <div className="absolute bottom-2 right-2 w-6 h-6 bg-black/80 rounded-full flex items-center justify-center">
                            <div className="w-3 h-3 border-2 border-white rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Simple Style */}
                    {link.style === 'simple' && (
                      <div className="bg-card shadow-sm rounded-lg border border-border">
                        <div 
                          className="p-4 relative cursor-pointer hover:bg-muted transition-colors" 
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
                          <div className="text-sm font-medium text-foreground truncate mb-2 hover:text-primary">{link.title}</div>
                          {link.description && (
                            <div className="text-xs text-muted-foreground mb-2 line-clamp-2">{link.description}</div>
                          )}
                          <div 
                            className="text-xs text-muted-foreground mb-2 cursor-pointer hover:underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`/l/${link.shortCode}`, '_blank');
                            }}
                          >
                            단축링크: amusefit.co.kr/l/{link.shortCode} | 클릭수: {link.clicks || 0}
                          </div>
                          <div className="text-xs text-muted-foreground mb-2 flex gap-3">
                            <span>내 방문: {link.ownerVisits || 0}</span>
                            <span>외부 방문: {link.externalVisits || 0}</span>
                          </div>
                          <div className="w-full h-2 bg-muted rounded"></div>
                        </div>
                      </div>
                    )}

                    {/* Background Style */}
                    {link.style === 'background' && (
                      <div className="bg-card shadow-sm rounded-lg border border-border">
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
                          <div className="absolute inset-0 bg-black/40 rounded-lg"></div>
                          
                          <div className="relative z-10 text-white">
                            <div className="text-sm font-medium truncate mb-2 drop-shadow-lg">{link.title}</div>
                            <div 
                              className="text-xs text-gray-200 mb-2 cursor-pointer hover:underline drop-shadow-lg"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(`/l/${link.shortCode}`, '_blank');
                              }}
                            >
                              단축링크: amusefit.co.kr/l/{link.shortCode} | 클릭수: {link.clicks || 0}
                            </div>
                            <div className="text-xs text-gray-300 mb-2 flex gap-3 drop-shadow-lg">
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
                <LinkIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-foreground text-lg">링크 없음</p>
                <p className="text-muted-foreground text-sm mt-2">아직 등록된 링크가 없습니다.</p>
              </div>
            )}
          </div>
        );
      case 'image':
        if (!Array.isArray(images) || images.length === 0) {
          return (
            <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#4E342E] to-[#3E2723] text-white">
              <Image className="w-24 h-24 mb-6 text-white/70" />
              <h2 className="text-3xl font-bold mb-3">갤러리</h2>
              <p className="text-lg text-white/80 text-center max-w-md">
                아직 등록된 이미지가 없습니다
              </p>
            </div>
          );
        }

        const currentImage = images[currentImageIndex];
        
        return (
          <div className="h-screen relative overflow-hidden bg-black flex items-center justify-center">
            {/* Centered image that fits screen */}
            <img 
              src={getImageUrl(currentImage)}
              alt={currentImage?.title || "갤러리 이미지"}
              className="max-w-full max-h-full object-contain transition-all duration-500 ease-in-out"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder-image.jpg';
              }}
            />
            
            {/* Dark overlay for better text readability */}
            <div className="absolute inset-0 bg-black/40 pointer-events-none"></div>

            {/* Content overlay */}
            <div className="relative z-10 h-full flex flex-col justify-between p-6 text-white">
              
              {/* Top bar */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-medium">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                </div>
              </div>

              {/* Center content */}
              <div className="flex-1 flex items-end pb-20">
                <div className="max-w-2xl">
                  <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight drop-shadow-lg">
                    {currentImage?.title || "갤러리 작품"}
                  </h1>
                  
                  {currentImage?.description && (
                    <p className="text-lg md:text-xl text-white/90 leading-relaxed drop-shadow-md">
                      {currentImage.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Bottom navigation */}
              <div className="flex justify-center items-center gap-6">
                
                {/* Previous button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all duration-200 disabled:opacity-30"
                  onClick={prevImage}
                  disabled={images.length <= 1}
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>

                {/* Image indicators */}
                <div className="flex gap-2">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      className={`w-3 h-3 rounded-full transition-all duration-200 ${
                        index === currentImageIndex 
                          ? 'bg-white' 
                          : 'bg-white/30 hover:bg-white/50'
                      }`}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>

                {/* Next button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all duration-200 disabled:opacity-30"
                  onClick={nextImage}
                  disabled={images.length <= 1}
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </div>
            </div>
          </div>
        );
      case 'video':
        return (
          <div className="space-y-4">
            {Array.isArray(allVideos) && allVideos.length > 0 ? (
              <div className="space-y-4">
                {allVideos.map((video: any, index: number) => (
                  <div key={video.id || `link-${index}`} className="relative">
                    <div className="bg-card shadow-sm rounded-lg border border-border overflow-hidden">
                      <div className="relative aspect-[16/10] bg-muted">
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
                        <h3 className="text-sm font-medium text-foreground">{video.title}</h3>
                        {video.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{video.description}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-foreground text-lg">동영상 없음</p>
                <p className="text-muted-foreground text-sm mt-2">업로드된 동영상이나 링크가 없습니다.</p>
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
    <div className="min-h-screen bg-black overflow-hidden fixed inset-0">
      {/* iPhone-style Toast Notification */}
      <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ease-out ${
        showToast ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}>
        <div className="bg-black/80 backdrop-blur-md text-white px-4 py-2 rounded-full shadow-lg border border-white/20">
          <span className="text-sm font-medium korean-text">{toastMessage}</span>
        </div>
      </div>

      <div className="max-w-md mx-auto h-screen relative bg-black overflow-hidden">
        {/* Content based on selected tab */}
        {contentType === 'image' ? (
          /* Full screen image view with profile overlay */
          <>
            {Array.isArray(images) && images.length > 0 ? (
              <div className="absolute inset-0 pb-16 overflow-hidden">
                <div className="relative w-full h-full">
                  {/* Background image - shows the destination image */}
                  <div className="absolute inset-0 w-full h-full">
                    <img 
                      src={getImageUrl(images[currentImageIndex])}
                      alt="배경 이미지"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder-image.jpg';
                      }}
                    />
                  </div>
                  
                  {/* Current image card (slides out like Tinder) */}
                  <div 
                    className="absolute inset-0 w-full h-full z-10"
                    style={{
                      transform: imageTransition && slideDirection === 'left' ? 'translateX(-100%) rotate(-15deg)' :
                                 imageTransition && slideDirection === 'right' ? 'translateX(100%) rotate(15deg)' :
                                 'translateX(0) rotate(0deg)',
                      opacity: imageTransition ? 0 : 1,
                      transition: imageTransition ? 'transform 250ms ease-out, opacity 250ms ease-out' : 'none',
                      transformOrigin: 'center bottom'
                    }}
                  >
                    <img 
                      src={getImageUrl(images[imageTransition ? previousImageIndex : currentImageIndex])}
                      alt="현재 이미지"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder-image.jpg';
                      }}
                    />
                  </div>
                </div>
                
                {/* Gradient overlay for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/70"></div>
                
                {/* Left and Right tap zones for navigation */}
                {images.length > 1 && (
                  <>
                    {/* Left tap zone */}
                    <div 
                      className="absolute left-0 top-0 w-1/3 h-full z-10 cursor-pointer"
                      onClick={handleLeftTapManual}
                      onTouchEnd={handleLeftTapManual}
                    />
                    {/* Right tap zone */}
                    <div 
                      className="absolute right-0 top-0 w-1/3 h-full z-10 cursor-pointer"
                      onClick={handleRightTapManual}
                      onTouchEnd={handleRightTapManual}
                    />
                  </>
                )}
                
                {/* Image indicators */}
                {images.length > 1 && (
                  <div className="absolute top-4 right-4 flex space-x-1 z-20">
                    {images.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          index === currentImageIndex
                            ? 'bg-white'
                            : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                )}

                {/* Auto-slide toggle button */}
                {images.length > 1 && !showProfileDetails && (
                  <button 
                    className="absolute top-4 left-4 z-20 transition-all duration-200 hover:scale-110 active:scale-95"
                    onClick={toggleAutoSlide}
                  >
                    <div className="bg-black/50 backdrop-blur-sm rounded-full p-1.5 flex items-center justify-center transition-all duration-200 border border-white/30">
                      <div className={`w-3 h-3 rounded-full flex items-center justify-center transition-all duration-200 ${
                        autoSlideEnabled ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        {autoSlideEnabled && (
                          <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
                        )}
                      </div>
                    </div>
                  </button>
                )}

              </div>
            ) : (
              <div 
                className="absolute inset-0 pb-20 flex items-center justify-center"
                style={{
                  background: settings?.backgroundTheme || 'linear-gradient(135deg, #F5F5DC 0%, #EFE5DC 50%, #F5F5DC 100%)'
                }}
              >
                <div className="p-6 max-w-sm text-center">
                  <p className="text-[#4E342E] text-lg">이미지가 없습니다</p>
                </div>
              </div>
            )}

            {/* Navigation buttons overlay - left bottom position */}
            {images.length > 1 && (
              <div className="absolute bottom-24 left-4 z-10">
                <div className="flex items-center space-x-4">
                  {/* Left navigation button */}
                  <button
                    onClick={handleLeftTapManual}
                    className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/70 shadow-lg transition-all duration-200 hover:bg-white/30 active:scale-95"
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {/* Right navigation button */}
                  <button
                    onClick={handleRightTapManual}
                    className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/70 shadow-lg transition-all duration-200 hover:bg-white/30 active:scale-95"
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Profile overlay - positioned above navigation buttons */}
            <div className="absolute bottom-20 left-0 right-0 z-10 p-4">
              <div className="flex justify-center">
                <div 
                  className="flex items-end space-x-3 cursor-pointer"
                  onClick={() => setShowProfileDetails(!showProfileDetails)}
                >
                  {/* Profile Image */}
                  {(settings?.showProfileImage !== false) && (user.profileImageUrl || user.profileImage) ? (
                    <img 
                      src={user.profileImageUrl || user.profileImage} 
                      alt={user.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white/70 shadow-lg flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/70 shadow-lg flex-shrink-0">
                      <span className="text-white font-medium text-lg">
                        {user.name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || "사"}
                      </span>
                    </div>
                  )}
                  
                  {/* Name and Username - Horizontal Layout */}
                  <div className="flex-1 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <h1 className="text-2xl font-bold text-white korean-text" style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)' }}>
                        {user.name}
                      </h1>
                      <span className="text-white/60 text-sm">•</span>
                    </div>
                    <p className="text-white/80 text-sm korean-text mt-1" style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)' }}>
                      @{user.username}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Details Panel - Fade Up */}
            {showProfileDetails && (
              <div 
                className="fixed inset-0 z-20 flex items-end"
                onClick={() => setShowProfileDetails(false)}
                style={{
                  animation: 'fadeIn 0.5s ease-out'
                }}
              >
                <div 
                  className="w-full max-w-md mx-auto bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4 pb-16 transform overscroll-none"
                  onClick={(e) => e.stopPropagation()}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  style={{
                    transform: isProfileClosing ? 'translateY(100%)' :
                              isDragging && dragCurrentY > dragStartY ? 
                              `translateY(${Math.max(0, dragCurrentY - dragStartY)}px)` : 
                              'translateY(0)',
                    opacity: isProfileClosing ? 0 :
                            isDragging && dragCurrentY > dragStartY ? 
                            Math.max(0.3, 1 - (dragCurrentY - dragStartY) / 200) : 1,
                    transition: isProfileClosing ? 'all 0.3s ease-out' :
                               isDragging ? 'none' : 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    animation: !isProfileClosing && !isDragging ? 'slideUpSlow 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards' : 'none'
                  }}
                >
                  <div className="max-w-md mx-auto text-white px-4">
                    {/* Drag handle */}
                    <div className="flex justify-center mb-4 py-2">
                      <div className="w-12 h-1.5 bg-white/60 rounded-full shadow-sm"></div>
                    </div>
                    
                    {/* Profile Header */}
                    <div className="flex items-center space-x-4 mb-6">
                      {(settings?.showProfileImage !== false) && (user.profileImageUrl || user.profileImage) ? (
                        <img 
                          src={user.profileImageUrl || user.profileImage} 
                          alt={user.name}
                          className="w-16 h-16 rounded-full object-cover border-2 border-white/70 shadow-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/70 shadow-lg">
                          <span className="text-white font-medium text-xl">
                            {user.name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || "사"}
                          </span>
                        </div>
                      )}
                      
                      <div>
                        <h2 className="text-2xl font-bold korean-text">{user.name}</h2>
                        <p className="text-white/80 korean-text">@{user.username}</p>
                      </div>
                    </div>



                    {/* Fitness Introduction */}
                    {user.fitnessIntro && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-2 korean-text">전문 소개</h3>
                        <p className="text-white/90 leading-relaxed korean-text">{user.fitnessIntro}</p>
                      </div>
                    )}

                    {/* Personal Information */}
                    <div className="mb-6 space-y-4">
                      <h3 className="text-lg font-semibold korean-text">개인 정보</h3>
                      {user.birthDate && (
                        <div className="flex justify-between items-center py-2 border-b border-white/20">
                          <span className="text-white/70 korean-text">생년월일</span>
                          <span className="text-white korean-text">{user.birthDate}</span>
                        </div>
                      )}
                      {user.currentGym && (
                        <div className="flex justify-between items-center py-2 border-b border-white/20">
                          <span className="text-white/70 korean-text">근무 헬스장</span>
                          <span className="text-white korean-text">{user.currentGym}</span>
                        </div>
                      )}

                    </div>

                    {/* Certifications */}
                    {user.fitnessCertifications && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3 korean-text">자격증</h3>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                          <p className="text-white/90 leading-relaxed korean-text">{user.fitnessCertifications}</p>
                        </div>
                      </div>
                    )}

                    {/* Awards */}
                    {user.fitnessAwards && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3 korean-text">수상 내역</h3>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                          <p className="text-white/90 leading-relaxed korean-text">{user.fitnessAwards}</p>
                        </div>
                      </div>
                    )}





                    <div className="text-center">
                      <p className="text-white/60 text-sm korean-text">위의 핸들을 드래그하거나 아무 곳이나 터치하세요</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Regular view for videos and links */
          <>
            <div 
              className="absolute inset-0 pb-20"
              style={{
                background: settings?.backgroundTheme || 'linear-gradient(135deg, #F5F5DC 0%, #EFE5DC 50%, #F5F5DC 100%)'
              }}
            >
              <div className="h-full overflow-y-auto bg-background pt-4">
                <div className="px-4 pb-24 max-w-md mx-auto">
                  {/* Bio Section */}
                  {settings?.showBio && user.bio && (
                    <div className="mb-6">
                      <div className="bg-card shadow-sm rounded-lg border border-border p-4">
                        <p className="text-sm text-foreground leading-relaxed korean-text">{user.bio}</p>
                      </div>
                    </div>
                  )}
                  {renderContent()}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Footer with all content types */}
        <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 z-50" style={{ boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)' }}>
          <div className="flex items-center justify-around py-2">
            {/* Images Icon */}
            <button 
              className={`flex flex-col items-center py-2 px-3 transition-colors ${
                contentType === 'image' 
                  ? 'text-primary' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              onClick={() => setCurrentContentType('image')}
            >
              <Image className="w-6 h-6 mb-1" />
              <span className="text-xs korean-text">이미지</span>
            </button>

            {/* Videos Icon */}
            <button 
              className={`flex flex-col items-center py-2 px-3 transition-colors ${
                contentType === 'video' 
                  ? 'text-primary' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              onClick={() => setCurrentContentType('video')}
            >
              <Video className="w-6 h-6 mb-1" />
              <span className="text-xs korean-text">동영상</span>
            </button>

            {/* Links Icon */}
            <button 
              className={`flex flex-col items-center py-2 px-3 transition-colors ${
                contentType === 'links' 
                  ? 'text-primary' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              onClick={() => setCurrentContentType('links')}
            >
              <LinkIcon className="w-6 h-6 mb-1" />
              <span className="text-xs korean-text">링크</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}