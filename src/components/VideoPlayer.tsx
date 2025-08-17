
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
  const [adPlayed, setAdPlayed] = useState(false);
  const { user } = useAuth();

  // Check if device is mobile
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  // Load scripts
  useEffect(() => {
    const loadScripts = () => {
      // Initialize AdProvider array
      if (!window.AdProvider) {
        window.AdProvider = [];
      }

      // Load Exoclick script
      const exoclickScript = document.createElement('script');
      exoclickScript.src = 'https://a.magsrv.com/ad-provider.js';
      exoclickScript.async = true;
      exoclickScript.onload = () => {
        console.log('Exoclick ad provider loaded');
      };
      document.head.appendChild(exoclickScript);

      // Skip FluidPlayer on mobile
      if (isMobile()) {
        console.log('Mobile device detected, using native controls');
        setFluidPlayerLoaded(false);
        setIsLoading(false);
        return;
      }

      // Load FluidPlayer
      if (window.fluidPlayer) {
        setFluidPlayerLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.fluidplayer.com/v3/current/fluidplayer.min.js';
      script.onload = () => {
        console.log('FluidPlayer loaded successfully');
        setFluidPlayerLoaded(true);
      };
      script.onerror = () => {
        console.error('Failed to load FluidPlayer');
        setFluidPlayerLoaded(false);
        setIsLoading(false);
      };
      document.head.appendChild(script);

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.fluidplayer.com/v3/current/fluidplayer.min.css';
      document.head.appendChild(link);
    };

    loadScripts();
  }, []);

  // Disable right-click
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  // Track video view with Exoclick
  const trackVideoViewExoclick = () => {
    if (viewTracked) return;

    try {
      if (!window.AdProvider) {
        window.AdProvider = [];
      }

      console.log('Tracking video view with Exoclick');
      window.AdProvider.push({
        "serve": {
          "zoneid": "5660526"
        }
      });

      setViewTracked(true);
    } catch (error) {
      console.error('Error tracking video view:', error);
    }
  };

  // Initialize FluidPlayer
  useEffect(() => {
    if (!videoRef.current || !src || !fluidPlayerLoaded || isMobile()) {
      if (isMobile()) {
        setIsLoading(false);
      }
      return;
    }

    let playerInstance: any = null;

    try {
      console.log('Initializing FluidPlayer with ad configuration...');
      
      playerInstance = window.fluidPlayer(videoRef.current, {
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
          autoPlay: false
        },
        vastOptions: {
          adList: [
            {
              roll: 'preRoll',
              vastTag: `https://s.magsrv.com/v1/vast.php?idzone=5660526&sw=800&sh=450&cb=${Date.now()}&r=${Math.random()}`,
              timer: false,
              skipOffset: 5
            }
          ],
          adCTAText: 'Visit Advertiser',
          adCTATextPosition: 'bottom right',
          showProgressbarMarkers: false,
          vastTimeout: 20000,
          maxAllowedVastTagRedirects: 3,
          skipButtonCaption: 'Skip Ad ({seconds})',
          skipButtonClickCaption: 'Skip Ad',
          adText: 'Advertisement',
          adTextPosition: 'top left',
          vastAdvanced: {
            vastLoadTimeout: 15000,
            skipButtonCaption: 'Skip Ad in {seconds}s',
            skipButtonClickCaption: 'Skip Ad ►'
          }
        },
        modules: {
          configureHls: false
        }
      });

      playerRef.current = playerInstance;

      const videoElement = videoRef.current;
      if (!videoElement) return;

      // Basic video events
      const handleLoadStart = () => {
        console.log('Video loading started');
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
        setVideoError(true);
        setIsLoading(false);
        onError?.();
      };

      const handlePlay = async () => {
        console.log('Video play event triggered');
        
        // Only track after ad is complete or if no ads are configured
        if (adPlayed) {
          if (!viewTracked && user?.id && videoId) {
            try {
              await trackVideoView(videoId, user.id);
              setViewTracked(true);
            } catch (error) {
              console.error('Error tracking video view:', error);
            }
          }
          trackVideoViewExoclick();
        }
      };

      // Ad event handlers
      const handleAdStarted = (e: any) => {
        console.log('VAST Ad started:', e);
        setAdPlayed(false);
        
        // Ensure video is paused during ad
        if (!videoElement.paused) {
          videoElement.pause();
        }

        // Track ad start
        if (!window.AdProvider) {
          window.AdProvider = [];
        }
        window.AdProvider.push({
          "serve": {
            "zoneid": "5660526",
            "type": "ad_start"
          }
        });
      };

      const handleAdComplete = () => {
        console.log('VAST Ad completed');
        setAdPlayed(true);
        
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
      };

      const handleAdError = (e: any) => {
        console.error('VAST Ad error:', e);
        setAdPlayed(true); // Allow video to play even if ad fails
        
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
      };

      const handleAdSkipped = () => {
        console.log('VAST Ad skipped');
        setAdPlayed(true);
        
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
      };

      // Add event listeners
      videoElement.addEventListener('loadstart', handleLoadStart);
      videoElement.addEventListener('canplay', handleCanPlay);
      videoElement.addEventListener('error', handleError);
      videoElement.addEventListener('play', handlePlay);

      // FluidPlayer VAST events
      videoElement.addEventListener('vast_ad_started', handleAdStarted);
      videoElement.addEventListener('vast_ad_complete', handleAdComplete);
      videoElement.addEventListener('vast_ad_error', handleAdError);
      videoElement.addEventListener('vast_ad_skipped', handleAdSkipped);

      // Additional VAST events
      videoElement.addEventListener('vast_content_pause_requested', () => {
        console.log('Content pause requested for ad');
      });

      videoElement.addEventListener('vast_content_resume_requested', () => {
        console.log('Content resume requested after ad');
        setAdPlayed(true);
      });

      videoElement.addEventListener('vast_ad_loaded', () => {
        console.log('VAST ad loaded successfully');
      });

      videoElement.addEventListener('vast_ad_failed', (e: any) => {
        console.error('VAST ad failed:', e);
        setAdPlayed(true);
      });

      console.log('FluidPlayer initialized with VAST ads');

      // Cleanup function
      return () => {
        try {
          videoElement.removeEventListener('loadstart', handleLoadStart);
          videoElement.removeEventListener('canplay', handleCanPlay);
          videoElement.removeEventListener('error', handleError);
          videoElement.removeEventListener('play', handlePlay);
          videoElement.removeEventListener('vast_ad_started', handleAdStarted);
          videoElement.removeEventListener('vast_ad_complete', handleAdComplete);
          videoElement.removeEventListener('vast_ad_error', handleAdError);
          videoElement.removeEventListener('vast_ad_skipped', handleAdSkipped);

          if (playerInstance && playerInstance.destroy) {
            playerInstance.destroy();
          }
        } catch (error) {
          console.log('Error during cleanup:', error);
        }
      };
    } catch (error) {
      console.error('Error initializing FluidPlayer:', error);
      setVideoError(true);
      setIsLoading(false);
    }
  }, [src, poster, onError, onCanPlay, user, videoId, fluidPlayerLoaded]);

  // Reset tracking when video changes
  useEffect(() => {
    if (src) {
      setViewTracked(false);
      setAdPlayed(false);
      console.log('New video loaded, tracking reset');
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
        controls={!fluidPlayerLoaded || isMobile()}
        preload="metadata"
        crossOrigin="anonymous"
        playsInline
        webkit-playsinline="true"
        muted={false}
        autoPlay={false}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default VideoPlayer;
