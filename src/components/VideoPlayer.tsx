
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
              vastTag: `https://s.magsrv.com/v1/vast.php?idzone=5660526&sw=800&sh=450&cb=${Date.now()}`,
              timer: 5,
              skipOffset: 5
            }
          ],
          adCTAText: 'Visit Advertiser',
          adCTATextPosition: 'bottom right',
          showProgressbarMarkers: false,
          vastTimeout: 15000,
          maxAllowedVastTagRedirects: 5,
          skipButtonCaption: 'Skip Ad in {seconds}s',
          skipButtonClickCaption: 'Skip Ad',
          adText: 'Advertisement',
          adTextPosition: 'top left'
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

      let adCompleted = false;

      const handlePlay = async () => {
        console.log('Video play triggered');

        // Only track views after ad is completed or if no ads
        if (adCompleted || !fluidPlayerLoaded) {
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
        }
      };

      videoElement.addEventListener('loadstart', handleLoadStart);
      videoElement.addEventListener('canplay', handleCanPlay);
      videoElement.addEventListener('error', handleError);
      videoElement.addEventListener('play', handlePlay);

      // FluidPlayer ad events
      videoElement.addEventListener('vast_ad_started', (e) => {
        console.log('VAST Ad started:', e);
        adCompleted = false;
        
        // Track ad impression
        if (!window.AdProvider) {
          window.AdProvider = [];
        }
        window.AdProvider.push({
          "serve": {
            "zoneid": "5660526",
            "type": "ad_impression"
          }
        });
      });

      videoElement.addEventListener('vast_ad_complete', () => {
        console.log('VAST Ad completed successfully');
        adCompleted = true;
        
        // Track ad completion
        if (!window.AdProvider) {
          window.AdProvider = [];
        }
        window.AdProvider.push({
          "serve": {
            "zoneid": "5660526",
            "type": "ad_complete"
          }
        });
      });

      videoElement.addEventListener('vast_ad_error', (e) => {
        console.error('VAST Ad error:', e);
        adCompleted = true; // Allow video to play even if ad fails
        
        // Track ad error
        if (!window.AdProvider) {
          window.AdProvider = [];
        }
        window.AdProvider.push({
          "serve": {
            "zoneid": "5660526",
            "type": "ad_error"
          }
        });
      });

      videoElement.addEventListener('vast_ad_skipped', () => {
        console.log('VAST Ad skipped');
        adCompleted = true;
        
        // Track ad skip
        if (!window.AdProvider) {
          window.AdProvider = [];
        }
        window.AdProvider.push({
          "serve": {
            "zoneid": "5660526",
            "type": "ad_skip"
          }
        });
      });

      // Additional safety events
      videoElement.addEventListener('vast_content_resume_requested', () => {
        console.log('Content resume requested - ad phase complete');
        adCompleted = true;
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
        autoPlay={false} // Explicitly prevent autoplay
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default VideoPlayer;
