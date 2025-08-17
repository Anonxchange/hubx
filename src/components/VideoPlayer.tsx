
import React, { useRef, useEffect, useState } from 'react';
import { VideoIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { trackVideoView } from '@/services/userStatsService';

// Load FluidPlayer from CDN
declare global {
  interface Window {
    fluidPlayer: any;
    AdProvider: any[];
  }
}

interface VideoPlayerProps {
  src: string;
  poster?: string;
  onError?: () => void;
  onCanPlay?: () => void;
  videoId?: string;
  videoTitle?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  onError,
  onCanPlay,
  videoId,
  videoTitle
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);
  const [videoError, setVideoError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [viewTracked, setViewTracked] = useState(false);
  const [fluidPlayerLoaded, setFluidPlayerLoaded] = useState(false);
  const { user } = useAuth();

  // Load FluidPlayer script
  useEffect(() => {
    const loadFluidPlayer = () => {
      if (window.fluidPlayer) {
        setFluidPlayerLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.fluidplayer.com/v3/current/fluidplayer.min.js';
      script.onload = () => setFluidPlayerLoaded(true);
      script.onerror = () => {
        console.error('Failed to load FluidPlayer');
        setVideoError(true);
      };
      document.head.appendChild(script);

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.fluidplayer.com/v3/current/fluidplayer.min.css';
      document.head.appendChild(link);
    };

    loadFluidPlayer();
  }, []);

  // Disable right-click to prevent download
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  // Function to track video view with Exoclick
  const trackVideoViewExoclick = () => {
    if (viewTracked) return;

    try {
      // Track impression with Exoclick
      if (window.AdProvider && Array.isArray(window.AdProvider)) {
        console.log('Tracking video view with Exoclick');
        window.AdProvider.push({
          "serve": {
            "type": "impression",
            "zoneid": "5660526"
          }
        });
      }

      // Fire custom tracking pixel
      const trackingPixel = new Image();
      trackingPixel.src = `https://s.magsrv.com/v1/track.php?idzone=5660526&type=view&timestamp=${Date.now()}`;

      setViewTracked(true);
      console.log('Video view tracked successfully with Exoclick');
    } catch (error) {
      console.error('Error tracking video view:', error);
    }
  };

  useEffect(() => {
    if (!videoRef.current || !src || !fluidPlayerLoaded) return;

    // Initialize FluidPlayer
    try {
      playerRef.current = window.fluidPlayer(videoRef.current, {
        layoutControls: {
          fillToContainer: true,
          primaryColor: '#FF6B35',
          posterImage: poster,
          playButtonShowing: true,
          playPauseAnimation: true,
          mute: {
            initiallyMuted: false
          },
          allowDownload: false,
          allowTheatre: true,
          playbackRates: ['x0.5', 'x1', 'x1.25', 'x1.5', 'x2'],
          subtitlesEnabled: false,
          keyboardControl: true,
          layout: 'default'
        },
        vastOptions: {
          adList: [
            {
              roll: 'preRoll',
              vastTag: `https://s.magsrv.com/v1/vast.php?idzone=5660526&timestamp=${Date.now()}`,
              timer: 5
            }
          ],
          adCTAText: 'Visit Now',
          adCTATextPosition: 'top left'
        },
        modules: {
          configureHls: false
        }
      });

      // Event listeners
      const videoElement = videoRef.current;

      const handleLoadStart = () => {
        console.log('Video load started');
        setIsLoading(true);
        setVideoError(false);
      };

      const handleCanPlay = () => {
        console.log('Video can play');
        setIsLoading(false);
        setVideoError(false);
        onCanPlay?.();
      };

      const handleError = () => {
        console.error('Video error');
        setVideoError(true);
        setIsLoading(false);
        onError?.();
      };

      const handlePlay = async () => {
        console.log('Video play triggered');

        // Track video view when it starts playing (only for authenticated users)
        if (!viewTracked && user?.id && videoId) {
          try {
            console.log(`Tracking video view for videoId: ${videoId}, userId: ${user.id}`);
            await trackVideoView(videoId, user.id);
            setViewTracked(true);
          } catch (error) {
            console.error('Error tracking video view:', error);
          }
        }

        // Track with Exoclick when video starts playing
        trackVideoViewExoclick();
      };

      videoElement.addEventListener('loadstart', handleLoadStart);
      videoElement.addEventListener('canplay', handleCanPlay);
      videoElement.addEventListener('error', handleError);
      videoElement.addEventListener('play', handlePlay);

      // FluidPlayer specific events
      videoElement.addEventListener('ad_started', () => {
        console.log('Ad started playing');
        
        // Track ad impression
        if (window.AdProvider && Array.isArray(window.AdProvider)) {
          window.AdProvider.push({
            "serve": {
              "type": "video_impression",
              "zoneid": "5660526"
            }
          });
        }
      });

      videoElement.addEventListener('ad_completed', () => {
        console.log('Ad completed, content will start');
      });

      // Cleanup function
      return () => {
        videoElement.removeEventListener('loadstart', handleLoadStart);
        videoElement.removeEventListener('canplay', handleCanPlay);
        videoElement.removeEventListener('error', handleError);
        videoElement.removeEventListener('play', handlePlay);
        
        if (playerRef.current && playerRef.current.destroy) {
          try {
            playerRef.current.destroy();
          } catch (error) {
            console.log('Error destroying player:', error);
          }
        }
        playerRef.current = null;
      };
    } catch (error) {
      console.error('Error initializing FluidPlayer:', error);
      setVideoError(true);
    }
  }, [src, poster, onError, onCanPlay, user, videoId, viewTracked, fluidPlayerLoaded]);

  // Reset view tracking when video source changes
  useEffect(() => {
    if (src) {
      setViewTracked(false);
      console.log('New video loaded, view tracking reset');
    }
  }, [src]);

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
    <div className="relative w-full h-full group" onContextMenu={handleContextMenu}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="text-white">Loading...</div>
        </div>
      )}

      <video
        ref={videoRef}
        className="w-full h-full"
        src={src}
        poster={poster}
        controls={false} // FluidPlayer handles controls
        preload="metadata"
        crossOrigin="anonymous"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default VideoPlayer;
