import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Heart, X, Share2, MessageCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { queryClient } from "@/lib/queryClient";

export default function PublicImageView() {
  const params = useParams<{ username?: string; customUrl?: string }>();
  const username = params.username || params.customUrl || '';
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [, setLocation] = useLocation();

  // Get user data
  const { data: userData } = useQuery({
    queryKey: [`/api/public/${username}`],
  });

  // Get user's images ordered by priority
  const { data: images = [], isLoading } = useQuery({
    queryKey: [`/api/media/${(userData as any)?.id}/image`],
    enabled: !!(userData as any)?.id,
  });

  const minSwipeDistance = 50;

  // Auto-refresh every 30 seconds for real-time updates
  useEffect(() => {
    if (!username || !(userData as any)?.id) return;
    
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: [`/api/media/${(userData as any)?.id}/image`] });
    }, 30000);

    return () => clearInterval(interval);
  }, [username, (userData as any)?.id]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [`/api/public/${username}`] }),
        queryClient.invalidateQueries({ queryKey: [`/api/media/${(userData as any)?.id}/image`] })
      ]);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentIndex < (images as any[]).length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
    if (isRightSwipe && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const nextImage = useCallback(() => {
    setCurrentIndex(prev => 
      prev < (images as any[]).length - 1 ? prev + 1 : prev
    );
  }, [images]);

  const prevImage = useCallback(() => {
    setCurrentIndex(prev => prev > 0 ? prev - 1 : prev);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'Escape') setLocation('/');
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [nextImage, prevImage, setLocation]);

  const getImageUrl = (image: any) => {
    return image.filePath || image.mediaUrl || '/placeholder-image.jpg';
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${userData?.name || username}의 이미지`,
          url: window.location.href
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5DC] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4E342E]"></div>
      </div>
    );
  }

  if (!images || (images as any[]).length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5F5DC] to-[#EFE5DC] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-24 h-24 bg-[#D7CCC8] rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📸</span>
          </div>
          <h2 className="text-xl font-semibold text-[#4E342E] mb-2">
            아직 이미지가 없습니다
          </h2>
          <p className="text-[#8D6E63]">
            {(userData as any)?.name || username}님이 곧 멋진 이미지를 업로드할 예정입니다
          </p>
        </div>
      </div>
    );
  }

  const currentImage = (images as any[])[currentIndex];

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Main Image Container */}
      <div 
        className="h-screen w-full relative flex items-center justify-center"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Background Image with Blur */}
        <div 
          className="absolute inset-0 bg-cover bg-center filter blur-sm scale-110"
          style={{
            backgroundImage: `url(${getImageUrl(currentImage)})`,
          }}
        />
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Main Image */}
        <div className="relative z-10 w-full h-full flex items-center justify-center p-4">
          <img
            src={getImageUrl(currentImage)}
            alt={currentImage?.title || `이미지 ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder-image.jpg';
            }}
          />
        </div>

        {/* Navigation Arrows */}
        {currentIndex > 0 && (
          <Button
            variant="ghost"
            size="lg"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 p-0 bg-[#4E342E]/20 hover:bg-[#4E342E]/40 text-white"
            onClick={prevImage}
          >
            <ChevronLeft className="w-8 h-8" />
          </Button>
        )}

        {currentIndex < (images as any[]).length - 1 && (
          <Button
            variant="ghost"
            size="lg"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 p-0 bg-[#4E342E]/20 hover:bg-[#4E342E]/40 text-white"
            onClick={nextImage}
          >
            <ChevronRight className="w-8 h-8" />
          </Button>
        )}
      </div>

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-30 p-4 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {(userData as any)?.profileImageUrl ? (
              <img
                src={(userData as any).profileImageUrl}
                alt={(userData as any).name}
                className="w-10 h-10 rounded-full border-2 border-white"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-white font-medium">
                  {((userData as any)?.name || username)[0]?.toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-white font-semibold">
                {(userData as any)?.name || username}
              </h1>
              {currentImage?.title && (
                <p className="text-white/80 text-sm">
                  {currentImage.title}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
              onClick={() => setLocation('/')}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-30 p-4 bg-gradient-to-t from-black/50 to-transparent">
        {/* Image Counter */}
        <div className="flex justify-center mb-4">
          <div className="flex space-x-1">
            {(images as any[]).map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex 
                    ? 'bg-white' 
                    : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center space-x-6">
          <Button
            variant="ghost"
            size="lg"
            className="h-14 w-14 p-0 bg-[#4E342E]/20 hover:bg-[#4E342E]/30 text-white rounded-full"
            onClick={handleShare}
          >
            <Share2 className="w-6 h-6" />
          </Button>

          <Button
            variant="ghost"
            size="lg"
            className="h-16 w-16 p-0 bg-gradient-to-r from-[#8D6E63] to-[#4E342E] hover:from-[#A1887F] hover:to-[#8D6E63] text-white rounded-full"
          >
            <Heart className="w-8 h-8" />
          </Button>

          <Button
            variant="ghost"
            size="lg"
            className="h-14 w-14 p-0 bg-[#4E342E]/20 hover:bg-[#4E342E]/30 text-white rounded-full"
          >
            <MessageCircle className="w-6 h-6" />
          </Button>
        </div>

        {/* Image Description */}
        {currentImage?.description && (
          <div className="mt-4 text-center">
            <p className="text-white/90 text-sm max-w-md mx-auto">
              {currentImage.description}
            </p>
          </div>
        )}

        {/* Swipe Instruction */}
        <div className="mt-4 text-center">
          <p className="text-white/60 text-xs">
            좌우로 스와이프하여 이미지를 탐색하세요
          </p>
        </div>
      </div>
    </div>
  );
}