
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
    ExoLoader: any;
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

  // Check if device is mobile
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  // Load FluidPlayer and Exoclick scripts
  useEffect(() => {
    const loadScripts = () => {
      // Initialize AdProvider array
      if (!window.AdProvider) {
        window.AdProvider = [];
      }

      // Load Exoclick script first
      const exoclickScript = document.createElement('script');
      exoclickScript.src = 'https://a.magsrv.com/ad-provider.js';
      exoclickScript.async = true;
      exoclickScript.onload = () => {
        console.log('Exoclick ad provider loaded successfully');
      };
      exoclickScript.onerror = () => {
        console.error('Failed to load Exoclick ad provider');
      };
      document.head.appendChild(exoclickScript);

      // On mobile devices, use native controls for better performance
      if (isMobile()) {
        console.log('Mobile device detected, using native video controls');
        setFluidPlayerLoaded(false);
        return;
      }

      if (window.fluidPlayer) {
        setFluidPlayerLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.fluidplayer.com/v3/current/fluidplayer.min.js';
      script.onload = () => setFluidPlayerLoaded(true);
      script.onerror = () => {
        console.error('Failed to load FluidPlayer, falling back to native controls');
        setFluidPlayerLoaded(false);
      };
      document.head.appendChild(script);

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.fluidplayer.com/v3/current/fluidplayer.min.css';
      document.head.appendChild(link);
    };

    loadScripts();
  }, []);

  // Disable right-click to prevent download
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  // Function to track video view with Exoclick
  const trackVideoViewExoclick = () => {
    if (viewTracked) return;

    try {
      // Ensure AdProvider is available
      if (!window.AdProvider) {
        window.AdProvider = [];
      }

      // Track impression with Exoclick
      console.log('Tracking video view with Exoclick');
      window.AdProvider.push({
        "serve": {
          "zoneid": "5660526"
        }
      });

      // Fire custom tracking pixel
      const trackingPixel = new Image();
      trackingPixel.src = `https://syndication.realsrv.com/splash.php?idzone=5660526&type=impression&timestamp=${Date.now()}`;
      trackingPixel.onload = () => console.log('Tracking pixel loaded');
      trackingPixel.onerror = () => console.error('Tracking pixel failed');

      setViewTracked(true);
      console.log('Video view tracked successfully with Exoclick');
    } catch (error) {
      console.error('Error tracking video view:', error);
    }
  };

  useEffect(() => {
    if (!videoRef.current || !src) return;
    
    // Skip FluidPlayer on mobile devices for better compatibility
    if (isMobile()) {
      setIsLoading(false);
      return;
    }
    
    if (!fluidPlayerLoaded) return;

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
          layout: 'default',
          autoPlay: false // Prevent autoplay to ensure ads can load first
        },
        vastOptions: {
          adList: [
            {
              roll: 'preRoll',
              vastTag: `https://s.magsrv.com/v1/vast.php?idzone=5660526&timestamp=${Date.now()}`,
              timer: false, // Let ad run its full duration
              skipOffset: 5 // Allow skip after 5 seconds
            }
          ],
          adCTAText: 'Visit Now',
          adCTATextPosition: 'top left',
          showProgressbarMarkers: true,
          vastTimeout: 10000, // 10 second timeout for VAST loading
          maxAllowedVastTagRedirects: 3,
          vastAdvanced: {
            vastLoadTimeout: 8000,
            skipButtonCaption: 'Skip Ad',
            skipButtonClickCaption: 'Skip Ad ►'
          }
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

      const handleError = (event: any) => {
        console.error('Video error:', event);
        console.error('Video src:', src);
        console.error('Video error details:', videoElement.error);
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
      videoElement.addEventListener('ad_started', (e) => {
        console.log('Ad started playing:', e);
        
        // Pause the main video to ensure ad plays
        if (!videoElement.paused) {
          videoElement.pause();
        }
        
        // Track ad impression
        if (!window.AdProvider) {
          window.AdProvider = [];
        }
        window.AdProvider.push({
          "serve": {
            "zoneid": "5660526",
            "type": "video_start"
          }
        });
      });

      videoElement.addEventListener('ad_completed', () => {
        console.log('Ad completed, content will start');
        
        // Track ad completion
        if (!window.AdProvider) {
          window.AdProvider = [];
        }
        window.AdProvider.push({
          "serve": {
            "zoneid": "5660526", 
            "type": "video_complete"
          }
        });
      });

      videoElement.addEventListener('ad_error', (e) => {
        console.error('Ad error occurred:', e);
        console.log('Attempting to load backup ad...');
        
        // Try to load a backup ad or continue to video
        setTimeout(() => {
          console.log('Continuing to main video after ad error');
        }, 1000);
      });

      videoElement.addEventListener('ad_skipped', () => {
        console.log('Ad was skipped');
        
        // Track ad skip
        if (!window.AdProvider) {
          window.AdProvider = [];
        }
        window.AdProvider.push({
          "serve": {
            "zoneid": "5660526",
            "type": "video_skip"
          }
        });
      });

      // Prevent video from starting before ad
      videoElement.addEventListener('play', (e) => {
        // Check if this is the main video trying to play before ad
        if (!viewTracked && videoElement.currentTime === 0) {
          console.log('Ensuring ad plays first...');
        }
      });

      // Ad loading events
      videoElement.addEventListener('vast_ad_loaded', () => {
        console.log('VAST ad loaded successfully');
      });

      videoElement.addEventListener('vast_ad_failed', (e) => {
        console.error('VAST ad failed to load:', e);
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
        controls={!fluidPlayerLoaded || isMobile()} // Always use native controls on mobile
        preload="metadata"
        crossOrigin="anonymous"
        playsInline // Prevents fullscreen on iOS
        webkit-playsinline="true" // Legacy iOS support
        muted={false}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default VideoPlayer;
