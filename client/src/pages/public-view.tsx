import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { User, Link as LinkIcon, Copy, Check, Image, Video, Home, RefreshCw, ChevronLeft, ChevronRight, Heart, MessageCircle, Share } from "lucide-react";
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
  // UI State
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showProfileDetails, setShowProfileDetails] = useState(false);
  const [isProfileClosing, setIsProfileClosing] = useState(false);
  
  // Image Navigation State
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageTransition, setImageTransition] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const [previousImageIndex, setPreviousImageIndex] = useState(0);
  const [autoSlideEnabled, setAutoSlideEnabled] = useState(true);
  
  // Interaction State (Drag & Swipe)
  const [dragStartY, setDragStartY] = useState(0);
  const [dragCurrentY, setDragCurrentY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isMouseDragging, setIsMouseDragging] = useState(false);
  const [swipeStartX, setSwipeStartX] = useState(0);
  const [swipeCurrentX, setSwipeCurrentX] = useState(0);
  const [isSwipping, setIsSwipping] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  
  // Toast Notification State
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Content Type State (local override)
  const [localContentType, setLocalContentType] = useState<'links' | 'image' | 'video' | 'media' | 'both'>('image');
  
  // View Mode State (user view vs business view)
  const [viewMode, setViewMode] = useState<'user' | 'business'>('user');


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

  // Utility functions
  const getImageUrl = (image: any) => {
    return image.filePath || image.mediaUrl || '/placeholder-image.jpg';
  };

  const contentType = localContentType;

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

  // Reset image index when content type changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [contentType]);



  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setDragStartY(touch.clientY);
    setDragCurrentY(touch.clientY);
    setIsDragging(true);
    
    // Also handle swipe for image navigation
    if (contentType === 'image' && images.length > 1) {
      setSwipeStartX(touch.clientX);
      setSwipeCurrentX(touch.clientX);
      setIsSwipping(true);
      setSwipeOffset(0);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    
    if (isDragging) {
      setDragCurrentY(touch.clientY);
    }
    
    // Handle swipe movement for image navigation
    if (isSwipping && contentType === 'image' && images.length > 1) {
      const deltaX = touch.clientX - swipeStartX;
      setSwipeCurrentX(touch.clientX);
      setSwipeOffset(deltaX);
    }
  };

  const handleTouchEnd = () => {
    // Handle profile panel drag
    if (isDragging) {
      const dragDistance = dragCurrentY - dragStartY;
      if (dragDistance > 30) {
        closeProfilePanel();
      }
      setIsDragging(false);
      setDragStartY(0);
      setDragCurrentY(0);
    }
    
    // Handle swipe for image navigation
    if (isSwipping && contentType === 'image' && images.length > 1) {
      const deltaX = swipeCurrentX - swipeStartX;
      const threshold = 50;
      
      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          handleRightTap(false);
        } else {
          handleLeftTap(false);
        }
      }
      
      setIsSwipping(false);
      setSwipeStartX(0);
      setSwipeCurrentX(0);
      setSwipeOffset(0);
    }
  };

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setDragStartY(e.clientY);
    setDragCurrentY(e.clientY);
    setIsMouseDragging(true);
    setIsDragging(true);
    
    // Also handle swipe for image navigation
    if (contentType === 'image' && images.length > 1) {
      setSwipeStartX(e.clientX);
      setSwipeCurrentX(e.clientX);
      setIsSwipping(true);
      setSwipeOffset(0);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isMouseDragging && isDragging) {
      setDragCurrentY(e.clientY);
    }
    
    // Handle swipe movement for image navigation
    if (isSwipping && contentType === 'image' && images.length > 1) {
      const deltaX = e.clientX - swipeStartX;
      setSwipeCurrentX(e.clientX);
      setSwipeOffset(deltaX);
    }
  };

  const handleMouseUp = () => {
    // Handle profile panel drag
    if (isMouseDragging && isDragging) {
      const dragDistance = dragCurrentY - dragStartY;
      if (dragDistance > 30) {
        closeProfilePanel();
      }
      setIsMouseDragging(false);
      setIsDragging(false);
      setDragStartY(0);
      setDragCurrentY(0);
    }
    
    // Handle swipe for image navigation
    if (isSwipping && contentType === 'image' && images.length > 1) {
      const deltaX = swipeCurrentX - swipeStartX;
      const threshold = 50;
      
      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          handleRightTap(false);
        } else {
          handleLeftTap(false);
        }
      }
      
      setIsSwipping(false);
      setSwipeStartX(0);
      setSwipeCurrentX(0);
      setSwipeOffset(0);
    }
  };

  // Global mouse events for drag outside component
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isMouseDragging && isDragging) {
        setDragCurrentY(e.clientY);
      }
      
      // Handle swipe movement for image navigation
      if (isSwipping && contentType === 'image' && images.length > 1) {
        const deltaX = e.clientX - swipeStartX;
        setSwipeCurrentX(e.clientX);
        setSwipeOffset(deltaX);
      }
    };

    const handleGlobalMouseUp = () => {
      // Handle profile panel drag
      if (isMouseDragging && isDragging) {
        const dragDistance = dragCurrentY - dragStartY;
        if (dragDistance > 30) {
          closeProfilePanel();
        }
        setIsMouseDragging(false);
        setIsDragging(false);
        setDragStartY(0);
        setDragCurrentY(0);
      }
      
      // Handle swipe for image navigation
      if (isSwipping && contentType === 'image' && images.length > 1) {
        const deltaX = swipeCurrentX - swipeStartX;
        const threshold = 50;
        
        if (Math.abs(deltaX) > threshold) {
          if (deltaX > 0) {
            handleRightTap(false);
          } else {
            handleLeftTap(false);
          }
        }
        
        setIsSwipping(false);
        setSwipeStartX(0);
        setSwipeCurrentX(0);
        setSwipeOffset(0);
      }
    };

    if (isMouseDragging || isSwipping) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isMouseDragging, isDragging, dragCurrentY, dragStartY, isSwipping, swipeCurrentX, swipeStartX, contentType, images.length]);

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

  // Swipe event handlers
  const handleSwipeStart = (clientX: number) => {
    setSwipeStartX(clientX);
    setSwipeCurrentX(clientX);
    setIsSwipping(true);
    setSwipeOffset(0);
  };

  const handleSwipeMove = (clientX: number) => {
    if (!isSwipping) return;
    
    const deltaX = clientX - swipeStartX;
    setSwipeCurrentX(clientX);
    setSwipeOffset(deltaX);
  };

  const handleSwipeEnd = () => {
    if (!isSwipping) return;
    
    const deltaX = swipeCurrentX - swipeStartX;
    const threshold = 50; // Minimum swipe distance
    
    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0) {
        // Swiped right - go to previous image
        handleLeftTap(false);
      } else {
        // Swiped left - go to next image
        handleRightTap(false);
      }
    }
    
    // Reset swipe state
    setIsSwipping(false);
    setSwipeStartX(0);
    setSwipeCurrentX(0);
    setSwipeOffset(0);
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
      
      // Clear animation state and update index after animation completes
      setTimeout(() => {
        setCurrentImageIndex(nextIndex);
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
      
      // Clear animation state and update index after animation completes
      setTimeout(() => {
        setCurrentImageIndex(nextIndex);
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


                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[calc(100vh-80px)] bg-[#F5F5F5] flex flex-col items-center justify-center px-6">
                <div className="w-20 h-20 rounded-full bg-[#B8A393] flex items-center justify-center mb-6">
                  <LinkIcon className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-xl font-bold text-[#4E342E] mb-3 korean-text">링크 없음</h2>
                <p className="text-[#8D6E63] text-center korean-text">
                  아직 등록된 링크가 없습니다.
                </p>
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

              {/* Image indicators */}
              <div className="flex justify-center">
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
              </div>
            </div>
          </div>
        );
      case 'video':
        if (!Array.isArray(allVideos) || allVideos.length === 0) {
          return (
            <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#4E342E] to-[#3E2723] text-white">
              <Video className="w-24 h-24 mb-6 text-white/70" />
              <h2 className="text-3xl font-bold mb-3">동영상</h2>
              <p className="text-lg text-white/80 text-center max-w-md">
                아직 등록된 동영상이 없습니다
              </p>
            </div>
          );
        }

        const filteredVideos = allVideos.filter(video => !video.title?.includes('노래1'));
        const currentVideo = filteredVideos[0];
        
        if (!currentVideo) {
          return (
            <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#4E342E] to-[#3E2723] text-white">
              <Video className="w-24 h-24 mb-6 text-white/70" />
              <h2 className="text-3xl font-bold mb-3">동영상</h2>
              <p className="text-lg text-white/80 text-center max-w-md">
                아직 등록된 동영상이 없습니다
              </p>
            </div>
          );
        }

        return (
          <div className="h-screen relative overflow-hidden bg-black flex flex-col">
            {/* Video player that takes most of the screen */}
            <div className="flex-1 flex items-center justify-center bg-black">
              {currentVideo.type === 'link' && currentVideo.embedUrl ? (
                <iframe
                  src={currentVideo.embedUrl}
                  className="w-full h-full max-w-sm"
                  style={{ aspectRatio: '9/16' }}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={currentVideo.title || 'Video'}
                />
              ) : (
                <video
                  src={currentVideo.filePath || currentVideo.mediaUrl}
                  className="w-full h-full max-w-sm object-cover"
                  style={{ aspectRatio: '9/16' }}
                  poster={currentVideo.thumbnailUrl}
                  controls
                  playsInline
                  preload="metadata"
                  onError={(e) => {
                    console.error('Video loading error:', e);
                    const target = e.target as HTMLVideoElement;
                    target.style.display = 'none';
                  }}
                />
              )}
            </div>

            {/* Bottom section footer - same style as image view */}
            <div className="bg-white/95 backdrop-blur-sm p-4 space-y-4">
              {/* User info section */}
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-[#4E342E] flex items-center justify-center text-white font-bold text-lg">
                  {user?.name?.charAt(0) || '김'}
                </div>
                <div className="flex-1">
                  <div className="text-[#4E342E] text-lg font-bold korean-text">{user?.name || '김철수'}</div>
                  <div className="text-[#8D6E63] text-sm korean-text">@{user?.username || 'demo_user'}</div>
                </div>
              </div>

              {/* Navigation dots */}
              <div className="flex justify-center">
                <div className="flex gap-2">
                  {filteredVideos.map((_, index) => (
                    <div
                      key={index}
                      className={`w-3 h-3 rounded-full ${
                        index === 0 ? 'bg-[#4E342E]' : 'bg-[#D4C4B0]'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Navigation tabs */}
              <div className="flex items-center justify-around">
                <button 
                  onClick={() => setLocalContentType('image')}
                  className="flex flex-col items-center space-y-1 p-3 rounded-lg hover:bg-[#F5F5F5] transition-colors"
                >
                  <Image className="w-6 h-6 text-[#8D6E63]" />
                  <span className="text-xs text-[#8D6E63] korean-text">이미지</span>
                </button>
                
                <button className="flex flex-col items-center space-y-1 p-3 rounded-lg bg-[#F5F5F5]">
                  <Video className="w-6 h-6 text-[#4E342E]" />
                  <span className="text-xs text-[#4E342E] font-medium korean-text">동영상</span>
                </button>
                
                <button 
                  onClick={() => setLocalContentType('links')}
                  className="flex flex-col items-center space-y-1 p-3 rounded-lg hover:bg-[#F5F5F5] transition-colors"
                >
                  <LinkIcon className="w-6 h-6 text-[#8D6E63]" />
                  <span className="text-xs text-[#8D6E63] korean-text">링크</span>
                </button>
              </div>
            </div>
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
              <div 
                className="absolute inset-0 pb-16 overflow-hidden"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              >
                <div className="relative w-full h-full">
                  {/* Background layer - shows next image during swipe */}
                  <div className="absolute inset-0 w-full h-full">
                    <img 
                      src={getImageUrl(images[
                        isSwipping ? 
                          (swipeOffset > 0 ? 
                            (currentImageIndex + 1) % images.length : 
                            (currentImageIndex - 1 + images.length) % images.length) :
                        imageTransition && slideDirection === 'left' ?
                          (currentImageIndex - 1 + images.length) % images.length :
                        imageTransition && slideDirection === 'right' ?
                          (currentImageIndex + 1) % images.length :
                          currentImageIndex
                      ])}
                      alt="배경 이미지"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder-image.jpg';
                      }}
                    />
                  </div>
                  
                  {/* Current image card (Tinder-style swipe) */}
                  <div 
                    className="absolute inset-0 w-full h-full z-10 shadow-2xl"
                    style={{
                      transform: isSwipping ? 
                        `translateX(${swipeOffset}px) rotate(${swipeOffset * 0.05}deg) scale(${Math.max(0.9, 1 - Math.abs(swipeOffset) / 800)})` :
                        imageTransition && slideDirection === 'left' ? 'translateX(-100%) rotate(-15deg) scale(0.8)' :
                        imageTransition && slideDirection === 'right' ? 'translateX(100%) rotate(15deg) scale(0.8)' :
                        'translateX(0) rotate(0deg) scale(1)',
                      opacity: isSwipping ? Math.max(0.4, 1 - Math.abs(swipeOffset) / 150) :
                               imageTransition ? 0 : 1,
                      transition: isSwipping ? 'none' : 
                                  imageTransition ? 'all 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
                      transformOrigin: 'center bottom',
                      borderRadius: isSwipping ? `${Math.abs(swipeOffset) * 0.1}px` : '0px',
                      filter: isSwipping ? `brightness(${Math.max(0.7, 1 - Math.abs(swipeOffset) / 300)})` : 'brightness(1)'
                    }}
                  >
                    <img 
                      src={getImageUrl(images[imageTransition ? previousImageIndex : currentImageIndex])}
                      alt="현재 이미지"
                      className="w-full h-full object-cover"
                      style={{
                        borderRadius: isSwipping ? `${Math.abs(swipeOffset) * 0.1}px` : '0px'
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder-image.jpg';
                      }}
                    />
                    
                    {/* Swipe direction indicator */}
                    {isSwipping && Math.abs(swipeOffset) > 30 && (
                      <div 
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        style={{
                          background: swipeOffset > 0 ? 
                            'linear-gradient(45deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.4))' :
                            'linear-gradient(45deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.4))'
                        }}
                      >
                        <div className={`text-6xl font-bold ${swipeOffset > 0 ? 'text-green-500' : 'text-red-500'} animate-pulse`}>
                          {swipeOffset > 0 ? '←' : '→'}
                        </div>
                      </div>
                    )}
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

            {/* Bottom overlay with dark semi-transparent background */}
            <div className="absolute bottom-0 left-0 right-0 h-60 bg-gradient-to-t from-black/60 via-black/30 to-transparent z-5"></div>

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
            <div className="absolute bottom-40 left-4 z-10">
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
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
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

        {/* Footer with all content types - Hidden in video mode */}
        {contentType !== 'video' && (
          <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 z-50" style={{ boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)' }}>
            <div className="flex items-center justify-around py-2">
              {/* Images Icon */}
              <button 
                className={`flex flex-col items-center py-2 px-3 transition-colors ${
                  contentType === 'image' 
                    ? 'text-primary' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                onClick={() => setLocalContentType('image')}
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
                onClick={() => setLocalContentType('video')}
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
                onClick={() => setLocalContentType('links')}
              >
                <LinkIcon className="w-6 h-6 mb-1" />
                <span className="text-xs korean-text">링크</span>
              </button>
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}