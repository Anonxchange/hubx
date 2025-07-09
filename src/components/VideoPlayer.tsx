import React, { useRef, useEffect } from 'react';
import { VideoIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

declare global {
  interface Window {
    fluidPlayer: any;
  }
}

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
  const [isLoading, setIsLoading] = React.useState(true);
  const playerInstanceRef = useRef<any>(null);

  useEffect(() => {
    const loadFluidPlayer = async () => {
      try {
        // Load Fluid Player script if not already loaded
        if (!window.fluidPlayer) {
          const script = document.createElement('script');
          script.src = 'https://cdn.fluidplayer.com/v3/current/fluidplayer.min.js';
          script.async = true;
          
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        // Wait a bit for the script to be ready
        await new Promise(resolve => setTimeout(resolve, 200));

        if (videoRef.current && window.fluidPlayer && src) {
          // Destroy previous instance if exists
          if (playerInstanceRef.current && typeof playerInstanceRef.current.destroy === 'function') {
            try {
              playerInstanceRef.current.destroy();
            } catch (e) {
              console.log('Error destroying previous player:', e);
            }
          }

          // Set video source
          videoRef.current.src = src;

          // Initialize Fluid Player
          playerInstanceRef.current = window.fluidPlayer(videoRef.current, {
            vastOptions: {
              adList: [
                {
                  roll: 'preRoll',
                  vastTag: 'https://s.magsrv.com/v1/vast.php?idzone=5660526'
                }
              ],
              adCTAText: false,
              adCTATextPosition: 'top right'
            },
            layoutControls: {
              fillToContainer: true,
              autoPlay: false,
              mute: false,
              allowDownload: false,
              allowTheatre: true,
              keyboardControl: true,
              layout: 'default',
              playerInitCallback: () => {
                console.log('Fluid Player initialized successfully');
                setIsLoading(false);
                setVideoError(false);
                onCanPlay?.();
              }
            }
          });

        }
      } catch (error) {
        console.error('Error loading Fluid Player:', error);
        setVideoError(true);
        setIsLoading(false);
        onError?.();
      }
    };

    if (src) {
      loadFluidPlayer();
    }

    return () => {
      if (playerInstanceRef.current && typeof playerInstanceRef.current.destroy === 'function') {
        try {
          playerInstanceRef.current.destroy();
        } catch (e) {
          console.log('Error destroying player on cleanup:', e);
        }
      }
    };
  }, [src, onError, onCanPlay]);

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error('Video error:', e);
    setVideoError(true);
    setIsLoading(false);
    onError?.();
  };

  const handleVideoCanPlay = () => {
    setIsLoading(false);
    setVideoError(false);
    onCanPlay?.();
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
            <p className="text-sm">Loading video with ads...</p>
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
        onCanPlay={handleVideoCanPlay}
        controls
      >
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default VideoPlayer;