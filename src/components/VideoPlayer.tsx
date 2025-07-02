import React, { useEffect, useRef } from 'react';
import { VideoIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  onError?: () => void;
  onCanPlay?: () => void;
}

declare global {
  interface Window {
    fluidPlayer: any;
  }
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  src, 
  poster, 
  onError, 
  onCanPlay 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);
  const [videoError, setVideoError] = React.useState(false);

  useEffect(() => {
    const loadFluidPlayer = () => {
      if (videoRef.current && window.fluidPlayer && !playerRef.current) {
        try {
          playerRef.current = window.fluidPlayer(videoRef.current, {
            layoutControls: {
              fillToContainer: true,
              primaryColor: 'hsl(var(--primary))',
              posterImage: poster || 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=800&h=450&fit=crop'
            },
            vastOptions: {
              adList: [
                {
                  roll: 'preRoll',
                  vastTag: 'https://s.magsrv.com/v1/vast.php?idzone=5660526',
                  adText: 'Advertisement'
                }
              ],
              adCTAText: 'Visit Now',
              adCTATextPosition: 'top left'
            },
            modules: {
              configureHls: {
                debug: false,
                p2pConfig: {
                  logLevel: 'none'
                }
              }
            }
          });
        } catch (error) {
          console.error('Failed to initialize Fluid Player:', error);
          setVideoError(true);
        }
      }
    };

    // Load Fluid Player script if not already loaded
    if (!window.fluidPlayer) {
      const script = document.createElement('script');
      script.src = 'https://cdn.fluidplayer.com/v3/current/fluidplayer.min.js';
      script.onload = loadFluidPlayer;
      script.onerror = () => {
        console.error('Failed to load Fluid Player');
        setVideoError(true);
      };
      document.head.appendChild(script);
    } else {
      loadFluidPlayer();
    }

    return () => {
      if (playerRef.current && playerRef.current.destroy) {
        try {
          playerRef.current.destroy();
          playerRef.current = null;
        } catch (error) {
          console.error('Error destroying player:', error);
        }
      }
    };
  }, [src, poster]);

  const handleVideoError = () => {
    setVideoError(true);
    onError?.();
  };

  const handleVideoCanPlay = () => {
    setVideoError(false);
    onCanPlay?.();
  };

  if (videoError) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white bg-gray-900 aspect-video">
        <div className="text-center space-y-4">
          <VideoIcon className="w-16 h-16 mx-auto opacity-50" />
          <div>
            <p className="text-lg font-medium">Video Error</p>
            <p className="text-sm opacity-75">Unable to load video. Please try refreshing the page.</p>
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
    <video
      ref={videoRef}
      className="w-full h-full"
      controls
      poster={poster || 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=800&h=450&fit=crop'}
      preload="metadata"
      playsInline
      onError={handleVideoError}
      onCanPlay={handleVideoCanPlay}
    >
      <source src={src} type="video/mp4" />
      <source src={src} type="video/webm" />
      <source src={src} type="video/ogg" />
      Your browser does not support the video tag.
    </video>
  );
};

export default VideoPlayer;