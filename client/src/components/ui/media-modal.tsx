import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface ImageModalProps {
  src: string;
  alt: string;
  children: React.ReactNode;
}

export function ImageModal({ src, alt, children }: ImageModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-full p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>{alt}</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <img
            src={src}
            alt={alt}
            className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface VideoModalProps {
  src: string;
  children: React.ReactNode;
}

export function VideoModal({ src, children }: VideoModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const handlePlayPause = (videoElement: HTMLVideoElement) => {
    if (isPlaying) {
      videoElement.pause();
    } else {
      videoElement.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleMuteToggle = (videoElement: HTMLVideoElement) => {
    videoElement.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-full p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Video Player</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <video
            src={src}
            className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            controls
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onVolumeChange={(e) => setIsMuted((e.target as HTMLVideoElement).muted)}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface LinkPreviewProps {
  url: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function LinkPreview({ url, title, description, children }: LinkPreviewProps) {
  const handleLinkClick = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      onClick={handleLinkClick}
      className="cursor-pointer transition-transform hover:scale-105 hover:shadow-lg"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleLinkClick();
        }
      }}
    >
      {children}
    </div>
  );
}