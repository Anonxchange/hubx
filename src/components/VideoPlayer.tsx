import React, { useRef } from 'react';
import { VideoIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  onError?: () => void;
  onCanPlay?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  src, 
  poster, 
  onError, 
  onCanPlay 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoError, setVideoError] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error('Video error:', e);
    setVideoError(true);
    setIsLoading(false);
    onError?.();
  };

  const handleVideoCanPlay = () => {
    console.log('Video can play');
    setVideoError(false);
    setIsLoading(false);
    onCanPlay?.();
  };

  const handleLoadStart = () => {
    console.log('Video load started');
    setIsLoading(true);
    setVideoError(false);
  };

  const handleLoadedMetadata = () => {
    console.log('Video metadata loaded');
    setIsLoading(false);
  };

  const handlePlaying = () => {
    console.log('Video started playing');
    setIsLoading(false);
  };

  const handleWaiting = () => {
    console.log('Video waiting for data');
    setIsLoading(true);
  };

  if (videoError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-card text-card-foreground aspect-video">
        <div className="text-center space-y-4">
          <VideoIcon className="w-16 h-16 mx-auto text-muted-foreground" />
          <div>
            <p className="text-lg font-medium">Video Error</p>
            <p className="text-sm text-muted-foreground">Unable to load video. Please try refreshing the page.</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white z-10">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 mx-auto border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm">Loading video...</p>
          </div>
        </div>
      )}
      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        poster={poster}
        preload="metadata"
        playsInline
        onLoadStart={handleLoadStart}
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlay={handleVideoCanPlay}
        onPlaying={handlePlaying}
        onWaiting={handleWaiting}
        onError={handleVideoError}
      >
        <source src={src} type="video/mp4" />
        <source src={src} type="video/webm" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default VideoPlayer;