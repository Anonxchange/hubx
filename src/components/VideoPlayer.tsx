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
  const scriptLoadedRef = useRef(false);
  const [videoError, setVideoError] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const initializePlayer = () => {
      if (!videoRef.current || !window.fluidPlayer || playerRef.current) {
        return;
      }

      try {
        console.log('Initializing Fluid Player with VAST ads');
        
        // Remove any existing controls and attributes that might interfere
        videoRef.current.removeAttribute('controls');
        videoRef.current.setAttribute('crossorigin', 'anonymous');
        
        playerRef.current = window.fluidPlayer(videoRef.current, {
          layoutControls: {
            fillToContainer: true,
            primaryColor: 'hsl(270 80% 60%)',
            posterImage: poster || 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=800&h=450&fit=crop',
            allowDownload: false,
            allowTheatre: true,
            playbackRates: ['x0.5', 'x1', 'x1.25', 'x1.5', 'x2'],
            subtitlesEnabled: false,
            keyboardControl: true,
            loop: false,
            mute: false,
            autoplay: false
          },
          vastOptions: {
            adList: [
              {
                roll: 'preRoll',
                vastTag: 'https://s.magsrv.com/v1/vast.php?idzone=5660526',
                adText: 'Advertisement',
                adClickable: true
              }
            ],
            adCTAText: 'Visit Now',
            adCTATextPosition: 'top left',
            skipButtonCaption: 'Skip ad in [seconds]',
            skipButtonClickCaption: 'Skip ad <span class="skip_button_icon"></span>',
            adTextPosition: 'top left',
            vastTimeout: 15000,
            showPlayButton: true,
            maxAllowedVastTagRedirects: 5,
            vastAdvanced: {
              vastLoadedCallback: () => {
                console.log('VAST ad loaded successfully');
                setIsLoading(false);
              },
              noVastVideoCallback: () => {
                console.log('No VAST ad available, proceeding with video');
                setIsLoading(false);
              },
              vastVideoSkippedCallback: () => {
                console.log('VAST ad skipped');
              },
              vastVideoEndedCallback: () => {
                console.log('VAST ad ended');
              },
              vastVideoErrorCallback: (error: any) => {
                console.log('VAST ad error, continuing with video:', error);
                setIsLoading(false);
              }
            }
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

        // Enhanced player event listeners
        if (videoRef.current) {
          videoRef.current.addEventListener('loadstart', () => {
            console.log('Video loadstart event');
            setVideoError(false);
          });
          
          videoRef.current.addEventListener('loadedmetadata', () => {
            console.log('Video metadata loaded');
          });
          
          videoRef.current.addEventListener('canplay', () => {
            console.log('Video can play');
            setVideoError(false);
            onCanPlay?.();
          });
          
          videoRef.current.addEventListener('error', (e) => {
            console.error('Video error:', e);
            setVideoError(true);
            setIsLoading(false);
            onError?.();
          });

          videoRef.current.addEventListener('waiting', () => {
            console.log('Video waiting for data');
          });

          videoRef.current.addEventListener('playing', () => {
            console.log('Video started playing');
            setIsLoading(false);
          });
        }

        console.log('Fluid Player initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Fluid Player:', error);
        setVideoError(true);
        setIsLoading(false);
        onError?.();
      }
    };

    const loadFluidPlayer = () => {
      if (scriptLoadedRef.current) {
        initializePlayer();
        return;
      }

      if (!window.fluidPlayer) {
        const script = document.createElement('script');
        script.src = 'https://cdn.fluidplayer.com/v3/current/fluidplayer.min.js';
        script.async = true;
        script.onload = () => {
          scriptLoadedRef.current = true;
          console.log('Fluid Player script loaded');
          // Small delay to ensure script is fully ready
          timeoutId = setTimeout(initializePlayer, 100);
        };
        script.onerror = () => {
          console.error('Failed to load Fluid Player script');
          setVideoError(true);
          setIsLoading(false);
          onError?.();
        };
        document.head.appendChild(script);
      } else {
        scriptLoadedRef.current = true;
        initializePlayer();
      }
    };

    // Start loading process
    loadFluidPlayer();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
          playerRef.current = null;
        } catch (error) {
          console.error('Error destroying player:', error);
        }
      }
    };
  }, [src, poster, onError, onCanPlay]);

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
        <div className="absolute inset-0 flex items-center justify-center bg-card text-card-foreground z-10">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-muted-foreground">Loading video...</p>
          </div>
        </div>
      )}
      <video
        ref={videoRef}
        className="w-full h-full"
        poster={poster || 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=800&h=450&fit=crop'}
        preload="metadata"
        playsInline
        crossOrigin="anonymous"
        onError={handleVideoError}
        onCanPlay={handleVideoCanPlay}
      >
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default VideoPlayer;