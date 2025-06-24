import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  User,
  Link as LinkIcon,
  Copy,
  Check,
  Image,
  Video,
  Home,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  Share,
  X,
} from "lucide-react";
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
  contentType: "links" | "image" | "video" | "media" | "both";
  customUrl: string;
  showProfileImage: boolean;
  showBio: boolean;
  showVisitCount: boolean;
  backgroundTheme: string;
}

export default function PublicViewPage() {
  const params = useParams<{ username?: string; customUrl?: string }>();
  const identifier = params.username || params.customUrl || "";
  
  // Skip public profile lookup for reserved routes
  const reservedRoutes = [
    'login', 'signup', 'signup-step1', 'signup-step2', 'password-recovery', 
    'service-intro', 'dashboard', 'links', 'images', 'videos', 'settings', 
    'chat', 'analytics', 'contacts', 'marketplace', 'manager', 'profile',
    'find-id', 'forgot-password', 'reset-password', 'oauth', 'api', 'auth'
  ];
  
  if (reservedRoutes.includes(identifier)) {
    return <div>Route not found</div>;
  }
  // UI State
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showImageProfileDetails, setShowImageProfileDetails] = useState(false);
  const [showVideoProfileDetails, setShowVideoProfileDetails] = useState(false);
  const [isProfileClosing, setIsProfileClosing] = useState(false);

  // Image Navigation State
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageTransition, setImageTransition] = useState(false);
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(
    null,
  );
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
  const [toastMessage, setToastMessage] = useState("");

  // Content Type State (local override) - initialized to null until settings load
  const [localContentType, setLocalContentType] = useState<
    "links" | "image" | "video" | "media" | "both" | null
  >(null);

  // View Mode State (user view vs business view)
  const [viewMode, setViewMode] = useState<"user" | "business">("user");

  // Video Navigation State
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [videoTransition, setVideoTransition] = useState(false);
  const [videoSwipeOffset, setVideoSwipeOffset] = useState(0);
  const [videoSwipeStart, setVideoSwipeStart] = useState(0);
  const [isVideoSwiping, setIsVideoSwiping] = useState(false);

  // Image Color Extraction State
  const [dominantColors, setDominantColors] = useState<string[]>([]);
  const [backgroundGradient, setBackgroundGradient] =
    useState<string>("bg-black");
  const [profileSectionBg, setProfileSectionBg] =
    useState<string>("rgba(0,0,0,0.9)");
  const [topOverlayColor, setTopOverlayColor] =
    useState<string>("rgba(0,0,0,0.1)");
  const [bottomOverlayColor, setBottomOverlayColor] =
    useState<string>("rgba(0,0,0,0.7)");

  // Extract dominant colors from image
  const extractColorsFromImage = (imageUrl: string) => {
    const img = document.createElement("img") as HTMLImageElement;
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const colorCounts: { [key: string]: number } = {};

      // Sample pixels to get color frequency
      for (let i = 0; i < data.length; i += 160) {
        // Sample every 40th pixel for performance
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const alpha = data[i + 3];

        if (alpha > 128) {
          // Only consider non-transparent pixels
          // Group similar colors
          const roundedR = Math.round(r / 32) * 32;
          const roundedG = Math.round(g / 32) * 32;
          const roundedB = Math.round(b / 32) * 32;
          const colorKey = `${roundedR},${roundedG},${roundedB}`;
          colorCounts[colorKey] = (colorCounts[colorKey] || 0) + 1;
        }
      }

      // Sort colors by frequency and get top colors
      const sortedColors = Object.entries(colorCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([color]) => {
          const [r, g, b] = color.split(",").map(Number);
          return `rgb(${r}, ${g}, ${b})`;
        });

      if (sortedColors.length > 0) {
        setDominantColors(sortedColors);
        // Create gradient background with better color mixing and transparency
        if (sortedColors.length > 1) {
          // Convert RGB to RGBA for transparency control
          const color1 = sortedColors[0]
            .replace("rgb(", "rgba(")
            .replace(")", ", 0.25)");
          const color2 = sortedColors[1]
            .replace("rgb(", "rgba(")
            .replace(")", ", 0.35)");
          const color3 = sortedColors[0]
            .replace("rgb(", "rgba(")
            .replace(")", ", 0.15)");
          const gradient = `linear-gradient(135deg, ${color1} 0%, ${color2} 50%, ${color3} 100%)`;
          setBackgroundGradient(gradient);

          // Set overlay colors for gradients
          setTopOverlayColor(
            sortedColors[0].replace("rgb(", "rgba(").replace(")", ", 0.1)"),
          );
          setBottomOverlayColor(
            sortedColors[0].replace("rgb(", "rgba(").replace(")", ", 0.7)"),
          );

          // Set profile section background with stronger opacity
          const profileColor1 = sortedColors[0]
            .replace("rgb(", "rgba(")
            .replace(")", ", 0.85)");
          const profileColor2 = sortedColors[1]
            .replace("rgb(", "rgba(")
            .replace(")", ", 0.75)");
          const profileGradient = `linear-gradient(135deg, ${profileColor1} 0%, ${profileColor2} 100%)`;
          setProfileSectionBg(profileGradient);
        } else {
          const color1 = sortedColors[0]
            .replace("rgb(", "rgba(")
            .replace(")", ", 0.3)");
          const gradient = `linear-gradient(135deg, ${color1} 0%, rgba(0,0,0,0.9) 100%)`;
          setBackgroundGradient(gradient);

          // Set overlay colors
          setTopOverlayColor(
            sortedColors[0].replace("rgb(", "rgba(").replace(")", ", 0.1)"),
          );
          setBottomOverlayColor(
            sortedColors[0].replace("rgb(", "rgba(").replace(")", ", 0.7)"),
          );

          // Set profile section background
          const profileColor = sortedColors[0]
            .replace("rgb(", "rgba(")
            .replace(")", ", 0.9)");
          setProfileSectionBg(
            `linear-gradient(135deg, ${profileColor} 0%, rgba(0,0,0,0.85) 100%)`,
          );
        }
      }
    };
    img.src = imageUrl;
  };

  const { data: user, isLoading: userLoading } = useQuery<UserProfile>({
    queryKey: [`/api/public/${identifier}`],
    enabled: !!identifier,
    staleTime: 0, // Force refresh
    gcTime: 0, // Don't cache
  });

  const { data: settings, isLoading: settingsLoading } = useQuery<UserSettings>(
    {
      queryKey: [`/api/public/${identifier}/settings`],
      enabled: !!identifier,
    },
  );

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
    const youtubeRegex =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
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
    ...videos.map((video: any) => ({ ...video, type: "upload" })),
    ...videoLinks.map((link: any) => ({
      ...link,
      type: "link",
      embedUrl: getVideoEmbedUrl(link.originalUrl),
    })),
  ];

  // Utility functions
  const getImageUrl = (image: any) => {
    return image.filePath || image.mediaUrl || "/placeholder-image.jpg";
  };

  // Smart content type selection - always respect user's choice, show empty state if needed
  const getEffectiveContentType = () => {
    // Use user's preferred content type if localContentType is not set and settings are loaded
    const preferredType = localContentType || settings?.contentType;
    
    // Always return the preferred content type, even if it's empty
    // This allows users to see their chosen content type and add content
    if (preferredType) return preferredType;
    
    // Only fallback when no preference is set
    const hasLinks = links && links.length > 0;
    const hasImages = images && images.length > 0;
    const hasVideos = allVideos && allVideos.length > 0;
    
    if (hasLinks) return "links";
    if (hasImages) return "image";
    if (hasVideos) return "video";
    
    // Default to links if nothing is available
    return "links";
  };

  const contentType = getEffectiveContentType();

  // Initialize localContentType with user's preferred content type when settings load
  useEffect(() => {
    if (settings?.contentType && localContentType === null) {
      console.log("Initializing localContentType with settings:", settings.contentType);
      setLocalContentType(settings.contentType);
    }
  }, [settings?.contentType, localContentType]);

  // Check if current content type has any data
  const hasCurrentContent = () => {
    if (contentType === "links") return links && links.length > 0;
    if (contentType === "image") return images && images.length > 0;
    if (contentType === "video") return allVideos && allVideos.length > 0;
    return false;
  };

  // Debug current state
  useEffect(() => {
    console.log("Content type state:", {
      localContentType,
      settingsContentType: settings?.contentType,
      effectiveContentType: contentType,
      hasLinks: links?.length > 0,
      hasImages: images?.length > 0,
      hasVideos: allVideos?.length > 0,
      hasCurrentContent: hasCurrentContent()
    });
  }, [localContentType, settings?.contentType, contentType, links, images, allVideos]);

  // Auto-refresh every 30 seconds for real-time updates
  useEffect(() => {
    if (!identifier) return;

    const interval = setInterval(() => {
      queryClient.invalidateQueries({
        queryKey: [`/api/public/${identifier}/links`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/media/${user?.id}/image`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/media/${user?.id}/video`],
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [identifier, user?.id]);

  // Reset image index when content type changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [contentType]);

  // Extract colors when current image changes
  useEffect(() => {
    if (contentType === "image" && images && images.length > 0) {
      const currentImage = images[currentImageIndex];
      if (currentImage) {
        extractColorsFromImage(getImageUrl(currentImage));
      }
    } else {
      // Reset to black background for non-image content
      setBackgroundGradient("bg-black");
      setProfileSectionBg("rgba(0,0,0,0.9)");
      setTopOverlayColor("rgba(0,0,0,0.1)");
      setBottomOverlayColor("rgba(0,0,0,0.7)");
    }
  }, [currentImageIndex, images, contentType]);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setDragStartY(touch.clientY);
    setDragCurrentY(touch.clientY);
    setIsDragging(true);

    // Also handle swipe for image navigation
    if (contentType === "image" && images.length > 1) {
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
    if (isSwipping && contentType === "image" && images.length > 1) {
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
    if (isSwipping && contentType === "image" && images.length > 1) {
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
    if (contentType === "image" && images.length > 1) {
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
    if (isSwipping && contentType === "image" && images.length > 1) {
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
    if (isSwipping && contentType === "image" && images.length > 1) {
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
      if (isSwipping && contentType === "image" && images.length > 1) {
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
      if (isSwipping && contentType === "image" && images.length > 1) {
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
      document.addEventListener("mousemove", handleGlobalMouseMove);
      document.addEventListener("mouseup", handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [
    isMouseDragging,
    isDragging,
    dragCurrentY,
    dragStartY,
    isSwipping,
    swipeCurrentX,
    swipeStartX,
    contentType,
    images.length,
  ]);

  // Auto-slide functionality for images
  useEffect(() => {
    if (
      !autoSlideEnabled ||
      !Array.isArray(images) ||
      images.length <= 1 ||
      contentType !== "image" ||
      imageTransition ||
      showImageProfileDetails
    ) {
      return;
    }

    const interval = setInterval(() => {
      if (!imageTransition && !showImageProfileDetails) {
        handleRightTap(true); // Pass true to indicate this is from auto-slide
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [
    autoSlideEnabled,
    images,
    contentType,
    imageTransition,
    currentImageIndex,
    showImageProfileDetails,
  ]);

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
    showToastMessage(newState ? "자동 넘김 활성화" : "자동 넘김 비활성화");
  };

  // Event handler wrappers for manual navigation
  const handleLeftTapManual = () => handleLeftTap(false);
  const handleRightTapManual = () => handleRightTap(false);

  // Helper function to close profile panel with animation
  const closeProfilePanel = () => {
    setIsProfileClosing(true);
    setTimeout(() => {
      setShowImageProfileDetails(false);
      setShowVideoProfileDetails(false);
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
      setSlideDirection("left");
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
      setSlideDirection("right");
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
        queryClient.invalidateQueries({
          queryKey: [`/api/public/${identifier}`],
        }),
        queryClient.invalidateQueries({
          queryKey: [`/api/public/${identifier}/settings`],
        }),
        queryClient.invalidateQueries({
          queryKey: [`/api/public/${identifier}/links`],
        }),
        queryClient.invalidateQueries({
          queryKey: [`/api/media/${user?.id}/image`],
        }),
        queryClient.invalidateQueries({
          queryKey: [`/api/media/${user?.id}/video`],
        }),
        queryClient.invalidateQueries({ queryKey: [`/api/user/${user?.id}`] }),
      ]);

      // Force refetch to get latest data
      await Promise.all([
        queryClient.refetchQueries({ queryKey: [`/api/public/${identifier}`] }),
        queryClient.refetchQueries({
          queryKey: [`/api/public/${identifier}/settings`],
        }),
        queryClient.refetchQueries({ queryKey: [`/api/user/${user?.id}`] }),
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
      console.error("Failed to copy:", err);
    }
  };

  if (
    userLoading ||
    settingsLoading ||
    linksLoading ||
    imagesLoading ||
    videosLoading
  ) {
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
          <h1 className="text-2xl font-bold text-[#4E342E] mb-2">
            사용자를 찾을 수 없습니다
          </h1>
          <p className="text-[#8D6E63]">요청하신 프로필이 존재하지 않습니다.</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (contentType) {
      case "links":
        return (
          <div className="space-y-4">
            {Array.isArray(links) && links.length > 0 ? (
              <div className="space-y-4">
                {links.map((link: any) => (
                  <div key={link.id} className="w-full">
                    {/* Thumbnail Style - 개선된 디자인 */}
                    {link.style === "thumbnail" && (
                      <div className="bg-white shadow-md rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                        <div
                          className="relative cursor-pointer group"
                          onClick={() => {
                            window.open(link.originalUrl, "_blank");
                            fetch(`/api/links/${link.id}/click`, {
                              method: "POST",
                            });
                          }}
                        >
                          {/* 이미지 섹션 */}
                          <div className="relative">
                            {link.customImageUrl || link.imageUrl ? (
                              <img
                                src={link.customImageUrl || link.imageUrl}
                                alt={link.title}
                                className="w-full h-40 object-cover"
                              />
                            ) : (
                              <div className="w-full h-40 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                                <LinkIcon className="w-12 h-12 text-gray-400" />
                              </div>
                            )}
                            {/* 액션 버튼 */}
                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <button 
                                className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(link.originalUrl, link.shortCode);
                                }}
                              >
                                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                            </div>
                          </div>
                          
                          {/* 텍스트 정보 섹션 */}
                          <div className="p-5">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2 leading-tight">
                              {link.title}
                            </h3>
                            {link.description && (
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                                {link.description}
                              </p>
                            )}
                            {/* URL 표시 */}
                            <div className="text-xs text-blue-600 font-medium mb-3 truncate">
                              {new URL(link.originalUrl).hostname}
                            </div>
                            
                            {/* 통계 정보 */}
                            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <div className="flex items-center space-x-1">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                                  </svg>
                                  <span>{link.visitCount || 0}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M6.672 1.911a1 1 0 10-1.932.518l.259.966a1 1 0 001.932-.518l-.26-.966zM2.429 4.74a1 1 0 10-.517 1.932l.966.259a1 1 0 00.517-1.932l-.966-.26zm8.814-.569a1 1 0 00-1.415-1.414l-.707.707a1 1 0 101.415 1.415l.707-.708zm-7.071 7.072l.707-.707A1 1 0 003.465 9.12l-.708.707a1 1 0 001.415 1.415zm3.2-5.171a1 1 0 00-1.3 1.3l4 10a1 1 0 001.823.075l1.38-2.759 3.018 3.02a1 1 0 001.414-1.415l-3.019-3.02 2.76-1.379a1 1 0 00-.076-1.822l-10-4z" clipRule="evenodd"/>
                                  </svg>
                                  <span>{link.clickCount || 0}</span>
                                </div>
                              </div>
                              {copiedLink === link.shortCode && (
                                <span className="text-xs text-green-600 font-medium">복사됨!</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Card Style - 개선된 디자인 */}
                    {link.style === "card" && (
                      <div className="bg-white shadow-md rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                        <div
                          className="relative cursor-pointer group h-48"
                          onClick={() => {
                            window.open(link.originalUrl, "_blank");
                            fetch(`/api/links/${link.id}/click`, {
                              method: "POST",
                            });
                          }}
                        >
                          {/* 배경 이미지 */}
                          <div className="absolute inset-0">
                            {(link.customImageUrl || link.imageUrl) ? (
                              <img
                                src={link.customImageUrl || link.imageUrl}
                                alt={link.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center">
                                <LinkIcon className="w-16 h-16 text-gray-400" />
                              </div>
                            )}
                          </div>
                          
                          {/* 그라데이션 오버레이 */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                          
                          {/* 액션 버튼 */}
                          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button 
                              className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(link.originalUrl, link.shortCode);
                              }}
                            >
                              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                          
                          {/* 텍스트 정보 - 하단에 배치 */}
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <div className="bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                              <h3 className="text-base font-semibold text-gray-800 mb-1 line-clamp-1">
                                {link.title}
                              </h3>
                              {link.description && (
                                <p className="text-xs text-gray-600 mb-2 line-clamp-1">
                                  {link.description}
                                </p>
                              )}
                              
                              {/* 통계 및 URL */}
                              <div className="flex items-center justify-between">
                                <div className="text-xs text-blue-600 font-medium truncate flex-1 mr-3">
                                  {new URL(link.originalUrl).hostname}
                                </div>
                                <div className="flex items-center space-x-3 text-xs text-gray-500">
                                  <div className="flex items-center space-x-1">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                                    </svg>
                                    <span>{link.visitCount || 0}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M6.672 1.911a1 1 0 10-1.932.518l.259.966a1 1 0 001.932-.518l-.26-.966zM2.429 4.74a1 1 0 10-.517 1.932l.966.259a1 1 0 00.517-1.932l-.966-.26zm8.814-.569a1 1 0 00-1.415-1.414l-.707.707a1 1 0 101.415 1.415l.707-.708zm-7.071 7.072l.707-.707A1 1 0 003.465 9.12l-.708.707a1 1 0 001.415 1.415zm3.2-5.171a1 1 0 00-1.3 1.3l4 10a1 1 0 001.823.075l1.38-2.759 3.018 3.02a1 1 0 001.414-1.415l-3.019-3.02 2.76-1.379a1 1 0 00-.076-1.822l-10-4z" clipRule="evenodd"/>
                                    </svg>
                                    <span>{link.clickCount || 0}</span>
                                  </div>
                                </div>
                              </div>
                              
                              {copiedLink === link.shortCode && (
                                <div className="mt-2 text-xs text-green-600 font-medium">복사됨!</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Simple Style - 개선된 디자인 */}
                    {link.style === "simple" && (
                      <div className="bg-white shadow-md rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                        <div
                          className="relative cursor-pointer group"
                          onClick={() => {
                            window.open(link.originalUrl, "_blank");
                            fetch(`/api/links/${link.id}/click`, {
                              method: "POST",
                            });
                          }}
                        >
                          {/* 이미지 섹션 */}
                          {(link.customImageUrl || link.imageUrl) && (
                            <div className="relative">
                              <img
                                src={link.customImageUrl || link.imageUrl}
                                alt={link.title}
                                className="w-full h-32 object-cover"
                              />
                              {/* 액션 버튼 */}
                              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <button 
                                  className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(link.originalUrl, link.shortCode);
                                  }}
                                >
                                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          )}
                          
                          {/* 텍스트 정보 섹션 */}
                          <div className="p-5">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2 leading-tight">
                              {link.title}
                            </h3>
                            {link.description && (
                              <p className="text-sm text-gray-600 mb-3 line-clamp-3 leading-relaxed">
                                {link.description}
                              </p>
                            )}
                            
                            {/* URL 표시 */}
                            <div className="text-xs text-blue-600 font-medium mb-3 truncate">
                              {new URL(link.originalUrl).hostname}
                            </div>
                            
                            {/* 통계 정보 */}
                            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <div className="flex items-center space-x-1">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                                  </svg>
                                  <span>{link.visitCount || 0}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M6.672 1.911a1 1 0 10-1.932.518l.259.966a1 1 0 001.932-.518l-.26-.966zM2.429 4.74a1 1 0 10-.517 1.932l.966.259a1 1 0 00.517-1.932l-.966-.26zm8.814-.569a1 1 0 00-1.415-1.414l-.707.707a1 1 0 101.415 1.415l.707-.708zm-7.071 7.072l.707-.707A1 1 0 003.465 9.12l-.708.707a1 1 0 001.415 1.415zm3.2-5.171a1 1 0 00-1.3 1.3l4 10a1 1 0 001.823.075l1.38-2.759 3.018 3.02a1 1 0 001.414-1.415l-3.019-3.02 2.76-1.379a1 1 0 00-.076-1.822l-10-4z" clipRule="evenodd"/>
                                  </svg>
                                  <span>{link.clickCount || 0}</span>
                                </div>
                              </div>
                              {copiedLink === link.shortCode && (
                                <span className="text-xs text-green-600 font-medium">복사됨!</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Background Style - 개선된 디자인 */}
                    {link.style === "background" && (
                      <div className="bg-white shadow-md rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                        <div
                          className="relative h-40 cursor-pointer group overflow-hidden"
                          style={{
                            backgroundImage:
                              link.customImageUrl || link.imageUrl
                                ? `url(${link.customImageUrl || link.imageUrl})`
                                : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            backgroundRepeat: "no-repeat",
                          }}
                          onClick={() => {
                            window.open(link.originalUrl, "_blank");
                            fetch(`/api/links/${link.id}/click`, {
                              method: "POST",
                            });
                          }}
                        >
                          {/* 그라데이션 오버레이 */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10"></div>
                          
                          {/* 액션 버튼 */}
                          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button 
                              className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(link.originalUrl, link.shortCode);
                              }}
                            >
                              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                          
                          {/* 텍스트 정보 - 하단에 배치 */}
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <h3 className="text-white font-bold text-lg mb-2 drop-shadow-lg line-clamp-2 leading-tight">
                              {link.title}
                            </h3>
                            {link.description && (
                              <p className="text-white/90 text-sm mb-3 drop-shadow line-clamp-2 leading-relaxed">
                                {link.description}
                              </p>
                            )}
                            
                            {/* URL 및 통계 */}
                            <div className="flex items-center justify-between">
                              <div className="text-xs text-white/80 font-medium truncate flex-1 mr-3">
                                {new URL(link.originalUrl).hostname}
                              </div>
                              <div className="flex items-center space-x-3 text-xs text-white/70">
                                <div className="flex items-center space-x-1">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                                  </svg>
                                  <span>{link.visitCount || 0}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M6.672 1.911a1 1 0 10-1.932.518l.259.966a1 1 0 001.932-.518l-.26-.966zM2.429 4.74a1 1 0 10-.517 1.932l.966.259a1 1 0 00.517-1.932l-.966-.26zm8.814-.569a1 1 0 00-1.415-1.414l-.707.707a1 1 0 101.415 1.415l.707-.708zm-7.071 7.072l.707-.707A1 1 0 003.465 9.12l-.708.707a1 1 0 001.415 1.415zm3.2-5.171a1 1 0 00-1.3 1.3l4 10a1 1 0 001.823.075l1.38-2.759 3.018 3.02a1 1 0 001.414-1.415l-3.019-3.02 2.76-1.379a1 1 0 00-.076-1.822l-10-4z" clipRule="evenodd"/>
                                  </svg>
                                  <span>{link.clickCount || 0}</span>
                                </div>
                              </div>
                            </div>
                            
                            {copiedLink === link.shortCode && (
                              <div className="mt-2 text-xs text-green-400 font-medium drop-shadow">복사됨!</div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center pt-20 pb-32">
                <div className="text-center">
                  <LinkIcon className="w-24 h-24 text-gray-400 mx-auto mb-6" />
                  <h2 className="text-3xl font-bold mb-3 text-gray-600">링크</h2>
                  <p className="text-lg text-gray-500 text-center max-w-md">
                    아직 등록된 링크가 없습니다
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    곧 새로운 콘텐츠가 추가될 예정입니다
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      case "image":
        if (!Array.isArray(images) || images.length === 0) {
          return (
            <div className="h-full flex flex-col items-center justify-center text-white pt-20 pb-32">
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
          <div className="h-full relative overflow-hidden bg-black pb-32">
            {/* Full screen image */}
            <img
              src={getImageUrl(currentImage)}
              alt={currentImage?.title || "갤러리 이미지"}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/placeholder-image.jpg";
              }}
            />

            {/* Dark overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30"></div>

            {/* Top overlay - Image counter */}
            <div className="absolute top-4 left-4 right-4 z-30">
              <div className="flex justify-center">
                <div className="flex gap-1">
                  {images.map((_, index) => (
                    <div
                      key={index}
                      className={`w-8 h-1 rounded-full transition-all duration-200 ${
                        index === currentImageIndex ? "bg-white" : "bg-white/30"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom overlay - Profile and description */}
            <div className="absolute bottom-20 left-4 right-4 z-30">
              <div className="space-y-4">
                {/* Profile Info */}
                <div className="flex items-center space-x-3">
                  {settings?.showProfileImage !== false && (
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full border-2 border-white flex items-center justify-center overflow-hidden">
                      {user?.profileImageUrl ? (
                        <img
                          src={user.profileImageUrl}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-semibold text-lg">
                          {user?.name?.charAt(0) || "U"}
                        </span>
                      )}
                    </div>
                  )}
                  <div>
                    <p className="text-white font-semibold text-lg">
                      {user?.name}
                    </p>
                    {settings?.showBio !== false && user?.bio && (
                      <p className="text-white/80 text-sm">{user.bio}</p>
                    )}
                    {settings?.showVisitCount !== false && user?.visitCount && (
                      <p className="text-white/70 text-xs">
                        방문 {user.visitCount}회
                      </p>
                    )}
                  </div>
                </div>

                {/* Image Title & Description */}
                {currentImage?.title && (
                  <h3 className="text-white font-medium text-lg leading-tight">
                    {currentImage.title}
                  </h3>
                )}
                {currentImage?.description && (
                  <p className="text-white/90 text-sm leading-relaxed">
                    {currentImage.description}
                  </p>
                )}
              </div>
            </div>

            {/* Swipe gesture areas */}
            <div className="absolute inset-0 flex">
              {/* Left half - previous image */}
              <div
                className="w-1/2 h-full"
                onTouchStart={(e) => handleSwipeStart(e.touches[0].clientX)}
                onTouchMove={(e) => handleSwipeMove(e.touches[0].clientX)}
                onTouchEnd={handleSwipeEnd}
                onClick={handleLeftTapManual}
              />
              {/* Right half - next image */}
              <div
                className="w-1/2 h-full"
                onTouchStart={(e) => handleSwipeStart(e.touches[0].clientX)}
                onTouchMove={(e) => handleSwipeMove(e.touches[0].clientX)}
                onTouchEnd={handleSwipeEnd}
                onClick={handleRightTapManual}
              />
            </div>
          </div>
        );
      case "video":
        const filteredVideos = Array.isArray(allVideos)
          ? allVideos.filter((video) => !video.title?.includes("노래1"))
          : [];

        if (filteredVideos.length === 0) {
          return (
            <div className="h-full flex flex-col items-center justify-center pt-20 pb-32 bg-black">
              <Video className="w-24 h-24 mb-6 text-white" />
              <h2 className="text-3xl font-bold mb-3 text-white">동영상</h2>
              <p className="text-lg text-white/80 text-center max-w-md">
                아직 등록된 동영상이 없습니다
              </p>
            </div>
          );
        }

        const currentVideo =
          filteredVideos[currentVideoIndex] || filteredVideos[0];

        return (
          <>
            {/* Full screen video view - same structure as image view */}
            <div className="absolute inset-0 pb-16 overflow-hidden bg-black">
              <div className="relative w-full h-full flex items-center justify-center bg-black">
                {/* Video Player Container - 9:16 aspect ratio */}
                <div className="relative w-full max-w-md bg-black" style={{ aspectRatio: '9/16' }}>
                  {currentVideo.type === "link" && currentVideo.embedUrl ? (
                    <iframe
                      src={currentVideo.embedUrl}
                      className="w-full h-full object-cover rounded-lg"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={currentVideo.title || "Video"}
                    />
                  ) : (
                    <video
                      key={currentVideo.id}
                      src={currentVideo.filePath || currentVideo.mediaUrl}
                      className="w-full h-full object-cover rounded-lg"
                      poster={currentVideo.thumbnailUrl}
                      controls={false}
                      playsInline
                      autoPlay
                      muted
                      loop
                      preload="metadata"
                      style={{ pointerEvents: 'none' }}
                      onError={(e) => {
                        console.error("Video loading error:", e);
                      }}
                    />
                  )}
                </div>

                {/* Gradient overlay for better text readability */}
                <div
                  className="absolute inset-0 transition-all duration-700 ease-in-out"
                  style={{
                    background: `linear-gradient(to bottom, ${topOverlayColor} 0%, transparent 40%, ${bottomOverlayColor} 100%)`,
                  }}
                ></div>
              </div>
            </div>
          </>
        );
      case "media":
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

  // Apply background theme based on settings
  const getBackgroundStyle = () => {
    const theme = settings?.backgroundTheme || "beige";
    switch (theme) {
      case "white":
        return "bg-white";
      case "dark":
        return "bg-gray-900";
      case "gradient":
        return "bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500";
      case "beige":
      default:
        return "bg-amber-50";
    }
  };

  return (
    <div className="min-h-screen overflow-hidden fixed inset-0">
      {/* Background layer only for content area, not footer */}
      <div 
        className="absolute inset-0 pb-16 transition-all duration-700 ease-in-out"
        style={{
          background:
            contentType === "video"
              ? "#000000"
              : contentType === "image"
                ? backgroundGradient === "bg-black"
                  ? "#000000"
                  : backgroundGradient
                : getBackgroundStyle(),
        }}
      />
      {/* iPhone-style Toast Notification */}
      <div
        className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ease-out ${
          showToast
            ? "translate-y-0 opacity-100"
            : "-translate-y-full opacity-0"
        }`}
      >
        <div className="bg-black/80 backdrop-blur-md text-white px-4 py-2 rounded-full shadow-lg border border-white/20">
          <span className="text-sm font-medium korean-text">
            {toastMessage}
          </span>
        </div>
      </div>

      <div className="max-w-md mx-auto h-screen relative overflow-hidden">
        {/* Content based on selected tab */}
        {contentType === "image" ? (
          /* Full screen image view with profile overlay */
          <>
            {Array.isArray(images) && images.length > 0 ? (
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ paddingBottom: "160px" }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              >
                <div className="relative w-full h-full flex items-center justify-center">
                  {/* Background layer - shows next image during swipe */}
                  <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                    <img
                      src={getImageUrl(
                        images[
                          isSwipping
                            ? swipeOffset > 0
                              ? (currentImageIndex + 1) % images.length
                              : (currentImageIndex - 1 + images.length) %
                                images.length
                            : imageTransition && slideDirection === "left"
                              ? (currentImageIndex - 1 + images.length) %
                                images.length
                              : imageTransition && slideDirection === "right"
                                ? (currentImageIndex + 1) % images.length
                                : currentImageIndex
                        ],
                      )}
                      alt="배경 이미지"
                      className="w-full max-h-full object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/placeholder-image.jpg";
                      }}
                    />
                  </div>

                  {/* Current image card (Tinder-style swipe) */}
                  <div
                    className="absolute inset-0 w-full h-full z-10 shadow-2xl flex items-center justify-center"
                    style={{
                      transform: isSwipping
                        ? `translateX(${swipeOffset}px) rotate(${swipeOffset * 0.05}deg) scale(${Math.max(0.9, 1 - Math.abs(swipeOffset) / 800)})`
                        : imageTransition && slideDirection === "left"
                          ? "translateX(-100%) rotate(-15deg) scale(0.8)"
                          : imageTransition && slideDirection === "right"
                            ? "translateX(100%) rotate(15deg) scale(0.8)"
                            : "translateX(0) rotate(0deg) scale(1)",
                      opacity: isSwipping
                        ? Math.max(0.4, 1 - Math.abs(swipeOffset) / 150)
                        : imageTransition
                          ? 0
                          : 1,
                      transition: isSwipping
                        ? "none"
                        : imageTransition
                          ? "all 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)"
                          : "none",
                      transformOrigin: "center bottom",
                      borderRadius: isSwipping
                        ? `${Math.abs(swipeOffset) * 0.1}px`
                        : "0px",
                      filter: isSwipping
                        ? `brightness(${Math.max(0.7, 1 - Math.abs(swipeOffset) / 300)})`
                        : "brightness(1)",
                    }}
                  >
                    <img
                      src={getImageUrl(
                        images[
                          imageTransition
                            ? previousImageIndex
                            : currentImageIndex
                        ],
                      )}
                      alt="현재 이미지"
                      className="w-full max-h-full object-contain"
                      style={{
                        borderRadius: isSwipping
                          ? `${Math.abs(swipeOffset) * 0.1}px`
                          : "0px",
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/placeholder-image.jpg";
                      }}
                    />

                    {/* Swipe direction indicator */}
                    {isSwipping && Math.abs(swipeOffset) > 30 && (
                      <div
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        style={{
                          background:
                            swipeOffset > 0
                              ? "linear-gradient(45deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.4))"
                              : "linear-gradient(45deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.4))",
                        }}
                      >
                        <div
                          className={`text-6xl font-bold ${swipeOffset > 0 ? "text-green-500" : "text-red-500"} animate-pulse`}
                        >
                          {swipeOffset > 0 ? "←" : "→"}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Gradient overlay for better text readability */}
                <div
                  className="absolute inset-0 transition-all duration-700 ease-in-out"
                  style={{
                    background: `linear-gradient(to bottom, ${topOverlayColor} 0%, transparent 40%, ${bottomOverlayColor} 100%)`,
                  }}
                ></div>

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
                            ? "bg-white"
                            : "bg-white/50"
                        }`}
                      />
                    ))}
                  </div>
                )}

                {/* Auto-slide toggle button */}
                {images.length > 1 && !showImageProfileDetails && (
                  <button
                    className="absolute top-4 left-4 z-20 transition-all duration-200 hover:scale-110 active:scale-95"
                    onClick={toggleAutoSlide}
                  >
                    <div className="bg-black/50 backdrop-blur-sm rounded-full p-1.5 flex items-center justify-center transition-all duration-200 border border-white/30">
                      <div
                        className={`w-3 h-3 rounded-full flex items-center justify-center transition-all duration-200 ${
                          autoSlideEnabled ? "bg-green-500" : "bg-red-500"
                        }`}
                      >
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
                  background:
                    backgroundGradient === "bg-black"
                      ? settings?.backgroundTheme ||
                        "linear-gradient(135deg, #F5F5DC 0%, #EFE5DC 50%, #F5F5DC 100%)"
                      : backgroundGradient,
                }}
              >
                <div className="p-6 max-w-sm text-center">
                  <p className="text-[#4E342E] text-lg">이미지가 없습니다</p>
                </div>
              </div>
            )}

            {/* Bottom overlay with dark semi-transparent background */}
            <div
              className="absolute bottom-0 left-0 right-0 h-60 z-5 transition-all duration-700 ease-in-out"
              style={{
                background: `linear-gradient(to top, ${bottomOverlayColor.replace("0.7)", "0.6)")} 0%, ${topOverlayColor.replace("0.1)", "0.3)")} 50%, transparent 100%)`,
              }}
            ></div>

            {/* Navigation buttons overlay - left bottom position */}
            {images.length > 1 && (
              <div className="absolute bottom-24 left-4 z-10">
                <div className="flex items-center space-x-4">
                  {/* Left navigation button */}
                  <button
                    onClick={handleLeftTapManual}
                    className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/70 shadow-lg transition-all duration-200 hover:bg-white/30 active:scale-95"
                  >
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>

                  {/* Right navigation button */}
                  <button
                    onClick={handleRightTapManual}
                    className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/70 shadow-lg transition-all duration-200 hover:bg-white/30 active:scale-95"
                  >
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Profile overlay removed - will only show in bottom section */}

            {/* Profile Details Panel - Image View */}
            {showImageProfileDetails && contentType === "image" && hasCurrentContent() && (
              <div
                className="fixed inset-0 z-[100] flex items-end"
                onClick={() => setShowImageProfileDetails(false)}
                style={{
                  animation: "fadeIn 0.5s ease-out",
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                  backdropFilter: "blur(4px)",
                }}
              >
                <div
                  className="w-full max-w-md mx-auto p-4 pb-16 transform overscroll-none"
                  onClick={(e) => e.stopPropagation()}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  style={{
                    background: `linear-gradient(to top, ${backgroundGradient === "bg-black" ? "rgba(0,0,0,0.9)" : backgroundGradient}, transparent)`,
                    transform: isProfileClosing
                      ? "translateY(100%)"
                      : isDragging && dragCurrentY > dragStartY
                        ? `translateY(${Math.max(0, dragCurrentY - dragStartY)}px)`
                        : "translateY(0)",
                    opacity: isProfileClosing
                      ? 0
                      : isDragging && dragCurrentY > dragStartY
                        ? Math.max(0.3, 1 - (dragCurrentY - dragStartY) / 200)
                        : 1,
                    transition: isProfileClosing
                      ? "all 0.3s ease-out"
                      : isDragging
                        ? "none"
                        : "all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                    cursor: isDragging ? "grabbing" : "grab",
                    animation:
                      !isProfileClosing && !isDragging
                        ? "slideUpSlow 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards"
                        : "none",
                  }}
                >
                  <div className="max-w-md mx-auto text-white px-4">
                    {/* Drag handle */}
                    <div className="flex justify-center mb-4 py-2">
                      <div className="w-12 h-1.5 bg-white/60 rounded-full shadow-sm"></div>
                    </div>

                    {/* Profile Header */}
                    <div className="flex items-center space-x-4 mb-6">
                      {settings?.showProfileImage !== false &&
                      (user?.profileImageUrl || user?.profileImage) ? (
                        <img
                          src={user.profileImageUrl || user.profileImage}
                          alt={user.name}
                          className="w-16 h-16 rounded-full object-cover border-2 border-white/70 shadow-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/70 shadow-lg">
                          <span className="text-white font-medium text-xl">
                            {user?.name?.[0]?.toUpperCase() ||
                              user?.username?.[0]?.toUpperCase() ||
                              "사"}
                          </span>
                        </div>
                      )}

                      <div>
                        <h2 className="text-2xl font-bold korean-text">
                          {user?.name}
                        </h2>
                        <p className="text-white/80 korean-text">
                          @{user?.username}
                        </p>
                      </div>
                    </div>

                    {/* Bio Introduction */}
                    {user?.bio && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-2 korean-text">
                          자기소개
                        </h3>
                        <p className="text-white/90 leading-relaxed korean-text">
                          {user.bio}
                        </p>
                      </div>
                    )}

                    {/* Personal Information */}
                    <div className="mb-6 space-y-4">
                      <h3 className="text-lg font-semibold korean-text">
                        개인 정보
                      </h3>
                      <div className="flex justify-between items-center py-2 border-b border-white/20">
                        <span className="text-white/70 korean-text">
                          생년월일
                        </span>
                        <span className="text-white korean-text">
                          {user?.birthDate || "정보 없음"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-white/20">
                        <span className="text-white/70 korean-text">
                          근무 헬스장
                        </span>
                        <span className="text-white korean-text">
                          {user?.currentGym || "정보 없음"}
                        </span>
                      </div>

                    </div>

                    {/* Fitness Information */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3 korean-text">
                        피트니스 정보
                      </h3>

                      {/* Certifications */}
                      <div className="mb-4">
                        <h4 className="text-md font-medium mb-2 korean-text text-white/80">
                          자격증
                        </h4>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                          <p className="text-white/90 leading-relaxed korean-text">
                            {user?.fitnessCertifications ||
                              "자격증 정보가 없습니다."}
                          </p>
                        </div>
                      </div>

                      {/* Awards */}
                      <div className="mb-4">
                        <h4 className="text-md font-medium mb-2 korean-text text-white/80">
                          수상 내역
                        </h4>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                          <p className="text-white/90 leading-relaxed korean-text">
                            {user?.fitnessAwards || "수상 내역이 없습니다."}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="text-center">
                      <p className="text-white/60 text-sm korean-text">
                        위의 핸들을 드래그하거나 아무 곳이나 터치하세요
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Details Panel - Video View */}
            {showVideoProfileDetails && contentType === "video" && hasCurrentContent() && (
              <div
                className="fixed inset-0 z-[100] flex items-end"
                onClick={() => setShowVideoProfileDetails(false)}
                style={{
                  animation: "fadeIn 0.5s ease-out",
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                  backdropFilter: "blur(4px)",
                }}
              >
                <div
                  className="w-full max-w-md mx-auto p-4 pb-16 transform overscroll-none"
                  onClick={(e) => e.stopPropagation()}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  style={{
                    background: `linear-gradient(to top, ${backgroundGradient === "bg-black" ? "rgba(0,0,0,0.9)" : backgroundGradient}, transparent)`,
                    transform: isProfileClosing
                      ? "translateY(100%)"
                      : isDragging && dragCurrentY > dragStartY
                        ? `translateY(${Math.max(0, dragCurrentY - dragStartY)}px)`
                        : "translateY(0)",
                    opacity: isProfileClosing
                      ? 0
                      : isDragging && dragCurrentY > dragStartY
                        ? Math.max(0.3, 1 - (dragCurrentY - dragStartY) / 200)
                        : 1,
                    transition: isProfileClosing
                      ? "all 0.3s ease-out"
                      : isDragging
                        ? "none"
                        : "all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                    cursor: isDragging ? "grabbing" : "grab",
                    animation:
                      !isProfileClosing && !isDragging
                        ? "slideUpSlow 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards"
                        : "none",
                  }}
                >
                  <div className="max-w-md mx-auto text-white px-4">
                    {/* Drag handle */}
                    <div className="flex justify-center mb-4 py-2">
                      <div className="w-12 h-1.5 bg-white/60 rounded-full shadow-sm"></div>
                    </div>

                    {/* Profile Header */}
                    <div className="flex items-center space-x-4 mb-6">
                      {settings?.showProfileImage !== false &&
                      (user?.profileImageUrl || user?.profileImage) ? (
                        <img
                          src={user.profileImageUrl || user.profileImage}
                          alt={user.name}
                          className="w-16 h-16 rounded-full object-cover border-2 border-white/70 shadow-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/70 shadow-lg">
                          <span className="text-white font-medium text-xl">
                            {user?.name?.[0]?.toUpperCase() ||
                              user?.username?.[0]?.toUpperCase() ||
                              "사"}
                          </span>
                        </div>
                      )}

                      <div>
                        <h2 className="text-2xl font-bold korean-text">
                          {user?.name}
                        </h2>
                        <p className="text-white/80 korean-text">
                          @{user?.username}
                        </p>
                      </div>
                    </div>

                    {/* Bio Introduction */}
                    {user?.bio && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-2 korean-text">
                          자기소개
                        </h3>
                        <p className="text-white/90 leading-relaxed korean-text">
                          {user.bio}
                        </p>
                      </div>
                    )}

                    {/* Personal Information */}
                    <div className="mb-6 space-y-4">
                      <h3 className="text-lg font-semibold korean-text">
                        개인 정보
                      </h3>
                      <div className="flex justify-between items-center py-2 border-b border-white/20">
                        <span className="text-white/70 korean-text">
                          생년월일
                        </span>
                        <span className="text-white korean-text">
                          {user?.birthDate || "정보 없음"}
                        </span>
                      </div>
                    </div>

                    {/* Close Guide */}
                    <div className="mt-8 text-center">
                      <p className="text-white/60 text-sm korean-text">
                        위의 핸들을 드래그하거나 아무 곳이나 터치하세요
                      </p>
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
                background:
                  settings?.backgroundTheme ||
                  "linear-gradient(135deg, #F5F5DC 0%, #EFE5DC 50%, #F5F5DC 100%)",
              }}
            >
              <div className="h-full overflow-y-auto bg-background pt-4">
                <div className="px-4 pb-24 max-w-md mx-auto">
                  {renderContent()}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Profile Section - Image View */}
        {contentType === "image" && hasCurrentContent() && (
          <div
            className={`fixed bottom-40 left-1/2 transform -translate-x-1/2 w-full max-w-md z-50 transition-all duration-300 ease-in-out ${
              showImageProfileDetails
                ? "opacity-0 translate-y-4 pointer-events-none"
                : "opacity-100 translate-y-0"
            }`}
          >
            <div
              className="mx-4 backdrop-blur-sm rounded-2xl"
              style={{
                background: "rgba(0, 0, 0, 0.2)",
              }}
            >
              <div className="px-4 py-4">
                <div
                  className="flex items-center space-x-3 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    console.log(
                      "Image Profile clicked, current state:",
                      showImageProfileDetails,
                    );
                    setShowImageProfileDetails(!showImageProfileDetails);
                  }}
                >
                  {/* Profile Image */}
                  {settings?.showProfileImage !== false &&
                  (user?.profileImageUrl || user?.profileImage) ? (
                    <img
                      src={user.profileImageUrl || user.profileImage}
                      alt={user.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white/70 shadow-lg"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/70 shadow-lg">
                      <span className="text-white font-medium text-lg">
                        {user?.name?.[0]?.toUpperCase() ||
                          user?.username?.[0]?.toUpperCase() ||
                          "사"}
                      </span>
                    </div>
                  )}

                  {/* Profile Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-white font-semibold text-lg korean-text truncate">
                        {user?.name}
                      </h3>
                    </div>
                    <p className="text-white/80 text-sm korean-text">
                      @{user?.username}
                    </p>
                  </div>

                  {/* Up arrow indicator */}
                  <div className="text-white/70">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 11l5-5m0 0l5 5m-5-5v12"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Section - Video View */}
        {contentType === "video" && hasCurrentContent() && (
          <div
            className={`fixed bottom-24 left-1/2 transform -translate-x-1/2 w-full max-w-md z-[999] transition-all duration-300 ease-in-out ${
              showVideoProfileDetails
                ? "opacity-0 translate-y-4 pointer-events-none"
                : "opacity-100 translate-y-0"
            }`}
            style={{ pointerEvents: 'auto' }}
          >
            <div
              className="mx-4 backdrop-blur-sm rounded-2xl"
              style={{
                background: "rgba(0, 0, 0, 0.2)",
                pointerEvents: 'auto',
                position: 'relative',
                zIndex: 9999
              }}
            >
              <div className="px-4 py-4" style={{ pointerEvents: 'auto' }}>
                <div
                  className="flex items-center space-x-3 cursor-pointer"
                  style={{ pointerEvents: 'auto' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    console.log(
                      "Video Profile clicked, current state:",
                      showVideoProfileDetails,
                      "contentType:",
                      contentType,
                      "Will set to:",
                      !showVideoProfileDetails
                    );
                    setShowVideoProfileDetails(!showVideoProfileDetails);
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    console.log(
                      "Video Profile touched, current state:",
                      showVideoProfileDetails
                    );
                    setShowVideoProfileDetails(!showVideoProfileDetails);
                  }}
                >
                  {/* Profile Image */}
                  {settings?.showProfileImage !== false &&
                  (user?.profileImageUrl || user?.profileImage) ? (
                    <img
                      src={user.profileImageUrl || user.profileImage}
                      alt={user.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white/70 shadow-lg"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/70 shadow-lg">
                      <span className="text-white font-medium text-lg">
                        {user?.name?.[0]?.toUpperCase() ||
                          user?.username?.[0]?.toUpperCase() ||
                          "사"}
                      </span>
                    </div>
                  )}

                  {/* Profile Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-white font-semibold text-lg korean-text truncate">
                        {user?.name}
                      </h3>
                    </div>
                    <p className="text-white/80 text-sm korean-text">
                      @{user?.username}
                    </p>
                  </div>

                  {/* Up arrow indicator */}
                  <div className="text-white/70">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 11l5-5m0 0l5 5m-5-5v12"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Video Profile Details Modal */}
        {showVideoProfileDetails && hasCurrentContent() && (
          <div
            className="fixed inset-0 z-[1000] overflow-hidden"
            onClick={() => setShowVideoProfileDetails(false)}
            style={{
              background: "rgba(0, 0, 0, 0.5)",
              backdropFilter: "blur(10px)",
            }}
          >
            <div
              className="h-full w-full max-w-md mx-auto flex items-end"
              onClick={(e) => e.stopPropagation()}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              <div
                className="w-full max-w-md mx-auto p-4 pb-16 transform overscroll-none"
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: `linear-gradient(to top, ${backgroundGradient === "bg-black" ? "rgba(0,0,0,0.9)" : backgroundGradient}, transparent)`,
                  transform: isProfileClosing
                    ? "translateY(100%)"
                    : isDragging && dragCurrentY > dragStartY
                      ? `translateY(${Math.max(0, dragCurrentY - dragStartY)}px)`
                      : "translateY(0)",
                  opacity: isProfileClosing
                    ? 0
                    : isDragging && dragCurrentY > dragStartY
                      ? Math.max(0.3, 1 - (dragCurrentY - dragStartY) / 200)
                      : 1,
                  transition: isProfileClosing
                    ? "all 0.3s ease-out"
                    : isDragging
                      ? "none"
                      : "all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                  cursor: isDragging ? "grabbing" : "grab",
                  animation:
                    !isProfileClosing && !isDragging
                      ? "slideUpSlow 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards"
                      : "none",
                }}
              >
                <div className="max-w-md mx-auto text-white px-4">
                  {/* Drag handle */}
                  <div className="flex justify-center mb-4 py-2">
                    <div className="w-12 h-1.5 bg-white/60 rounded-full shadow-sm"></div>
                  </div>

                  {/* Profile Header */}
                  <div className="flex items-center space-x-4 mb-6">
                    {settings?.showProfileImage !== false &&
                    (user?.profileImageUrl || user?.profileImage) ? (
                      <img
                        src={user.profileImageUrl || user.profileImage}
                        alt={user.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-white/70 shadow-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/70 shadow-lg">
                        <span className="text-white font-medium text-xl">
                          {user?.name?.[0]?.toUpperCase() ||
                            user?.username?.[0]?.toUpperCase() ||
                            "사"}
                        </span>
                      </div>
                    )}

                    <div>
                      <h2 className="text-2xl font-bold korean-text">
                        {user?.name}
                      </h2>
                      <p className="text-white/80 korean-text">
                        @{user?.username}
                      </p>
                    </div>
                  </div>

                  {/* Bio Introduction */}
                  {user?.bio && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-2 korean-text">
                        자기소개
                      </h3>
                      <p className="text-white/90 leading-relaxed korean-text">
                        {user.bio}
                      </p>
                    </div>
                  )}

                  {/* Personal Information */}
                  <div className="mb-6 space-y-4">
                    <h3 className="text-lg font-semibold korean-text">
                      개인 정보
                    </h3>
                    <div className="flex justify-between items-center py-2 border-b border-white/20">
                      <span className="text-white/70 korean-text">
                        생년월일
                      </span>
                      <span className="text-white korean-text">
                        {user?.birthDate || "정보 없음"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/20">
                      <span className="text-white/70 korean-text">
                        근무 헬스장
                      </span>
                      <span className="text-white korean-text">
                        {user?.currentGym || "정보 없음"}
                      </span>
                    </div>
                  </div>

                  {/* Fitness Information */}
                  <div className="mb-6 space-y-4">
                    <h3 className="text-lg font-semibold korean-text">
                      피트니스 정보
                    </h3>

                    {/* Certifications Box */}
                    <div>
                      <h4 className="text-white/70 mb-2 korean-text">자격증</h4>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                        <p className="text-white/90 korean-text">
                          자격증 정보가 없습니다.
                        </p>
                      </div>
                    </div>

                    {/* Awards Box */}
                    <div>
                      <h4 className="text-white/70 mb-2 korean-text">수상 내역</h4>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                        <p className="text-white/90 korean-text">
                          수상 내역이 없습니다.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Close Guide */}
                  <div className="mt-8 text-center">
                    <p className="text-white/60 text-sm korean-text">
                      위의 핸들을 드래그하거나 아무 곳이나 터치하세요
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer with all content types */}
        <nav
          className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 z-50"
          style={{ 
            boxShadow: "0 -2px 10px rgba(0, 0, 0, 0.1)",
            backgroundColor: "white" 
          }}
        >
          <div className="flex items-center justify-around py-2">
            {/* Images Icon */}
            <button
              className={`flex flex-col items-center py-2 px-3 transition-colors ${
                contentType === "image"
                  ? "text-primary"
                  : "text-gray-400 hover:text-gray-600"
              }`}
              onClick={() => {
                console.log("Image tab clicked, setting contentType to image");
                setLocalContentType("image");
              }}
            >
              <Image className="w-6 h-6 mb-1" />
              <span className="text-xs korean-text">이미지</span>
            </button>

            {/* Videos Icon */}
            <button
              className={`flex flex-col items-center py-2 px-3 transition-colors ${
                contentType === "video"
                  ? "text-primary"
                  : "text-gray-400 hover:text-gray-600"
              }`}
              onClick={() => {
                console.log("Video tab clicked, setting contentType to video");
                setLocalContentType("video");
              }}
            >
              <Video className="w-6 h-6 mb-1" />
              <span className="text-xs korean-text">동영상</span>
            </button>

            {/* Links Icon */}
            <button
              className={`flex flex-col items-center py-2 px-3 transition-colors ${
                contentType === "links"
                  ? "text-primary"
                  : "text-gray-400 hover:text-gray-600"
              }`}
              onClick={() => {
                console.log("Links tab clicked, setting contentType to links");
                setLocalContentType("links");
              }}
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
