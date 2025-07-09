import React, { useRef, useEffect } from 'react';
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [videoError, setVideoError] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [adShown, setAdShown] = React.useState(false);
  const [showingAd, setShowingAd] = React.useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    const handleLoadedData = () => {
      setIsLoading(false);
      setVideoError(false);
      onCanPlay?.();
    };

    const handleError = () => {
      setVideoError(true);
      setIsLoading(false);
      onError?.();
    };

    const handlePlay = async () => {
      if (!adShown && video) {
        setShowingAd(true);
        
        // Show ad overlay for 5 seconds before playing video
        try {
          video.pause();
          
          // Create ad overlay
          const adOverlay = document.createElement('div');
          adOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(45deg, #8b5cf6, #a855f7);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 18px;
            font-weight: bold;
            z-index: 1000;
            cursor: pointer;
          `;
          
          const adContent = document.createElement('div');
          adContent.style.cssText = `
            text-align: center;
            padding: 20px;
          `;
          
          let countdown = 5;
          adContent.innerHTML = `
            <div style="margin-bottom: 15px;">Advertisement</div>
            <div style="font-size: 14px; opacity: 0.8;">Video starts in ${countdown} seconds</div>
            <div style="margin-top: 15px; font-size: 12px; opacity: 0.6;">Click to visit advertiser</div>
          `;
          
          adOverlay.appendChild(adContent);
          
          // Add click handler for ad
          adOverlay.addEventListener('click', () => {
            window.open('https://s.magsrv.com/v1/vast.php?idzone=5660526', '_blank');
          });
          
          if (containerRef.current) {
            containerRef.current.appendChild(adOverlay);
          }
          
          // Countdown timer
          const countdownInterval = setInterval(() => {
            countdown--;
            adContent.innerHTML = `
              <div style="margin-bottom: 15px;">Advertisement</div>
              <div style="font-size: 14px; opacity: 0.8;">Video starts in ${countdown} seconds</div>
              <div style="margin-top: 15px; font-size: 12px; opacity: 0.6;">Click to visit advertiser</div>
            `;
            
            if (countdown <= 0) {
              clearInterval(countdownInterval);
              if (containerRef.current && adOverlay.parentNode) {
                containerRef.current.removeChild(adOverlay);
              }
              setAdShown(true);
              setShowingAd(false);
              video.play();
            }
          }, 1000);
          
        } catch (error) {
          console.error('Error showing ad:', error);
          setAdShown(true);
          setShowingAd(false);
          video.play();
        }
      }
    };

    video.src = src;
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('error', handleError);
    video.addEventListener('play', handlePlay);

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('error', handleError);
      video.removeEventListener('play', handlePlay);
    };
  }, [src, onError, onCanPlay, adShown]);

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error('Video error:', e);
    setVideoError(true);
    setIsLoading(false);
    onError?.();
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
    <div ref={containerRef} className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white z-10">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 mx-auto border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm">Loading video...</p>
          </div>
        </div>
      )}
      {showingAd && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white z-20">
          <div className="text-center space-y-2">
            <p className="text-sm">Showing advertisement...</p>
          </div>
        </div>
      )}
      <video
        ref={videoRef}
        className="w-full h-full"
        poster={poster}
        preload="metadata"
        playsInline
        onError={handleVideoError}
        controls
        style={{ width: '100%', height: '100%' }}
      >
        <source src={src} type="video/mp4" />
        <source src={src} type="video/webm" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default VideoPlayer;