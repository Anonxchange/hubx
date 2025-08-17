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
  const adContainerRef = useRef<HTMLDivElement>(null);
  const [videoError, setVideoError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [viewTracked, setViewTracked] = useState(false);
  const [fluidPlayerLoaded, setFluidPlayerLoaded] = useState(false);
  const [adPlayed, setAdPlayed] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [adCountdown, setAdCountdown] = useState(0);
  const { user } = useAuth();

  // Check if device is mobile
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  // Initialize ad provider
  useEffect(() => {
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
  }, []);

  // Play native ad before video
  const playNativeAd = () => {
    return new Promise<void>((resolve) => {
      console.log('Playing native pre-roll ad...');

      if (adContainerRef.current) {
        // Show countdown ad
        setAdCountdown(5);
        const countdownInterval = setInterval(() => {
          setAdCountdown(prev => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              resolve();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        // Track ad impression
        try {
          window.AdProvider.push({
            "serve": {
              "zoneid": "5660526"
            }
          });

          // Also inject actual ad content
          const adElement = document.createElement('ins');
          adElement.className = 'eas6a97888e10';
          adElement.setAttribute('data-zoneid', '5660526');
          adContainerRef.current.appendChild(adElement);
        } catch (error) {
          console.error('Error loading native ad:', error);
        }
      }
    });
  };

  // Load FluidPlayer with enhanced ad support
  useEffect(() => {
    const loadScripts = () => {
      if (isMobile()) {
        console.log('Mobile device detected, using native ad + controls');
        setFluidPlayerLoaded(false);
        setIsLoading(false);
        return;
      }

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
        console.error('Failed to load FluidPlayer, falling back to native');
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

  // Handle video play with ads
  const handleVideoPlay = async () => {
    if (adPlayed || viewTracked) {
      return; // Video can play normally
    }

    try {
      // Play native ad first
      await playNativeAd();
      setAdPlayed(true);
      setShowVideo(true);

      // Track video view
      if (user?.id && videoId) {
        await trackVideoView(videoId, user.id);
        setViewTracked(true);
      }

      // Track with Exoclick
      window.AdProvider.push({
        "serve": {
          "zoneid": "5660526",
          "type": "video_view"
        }
      });

    } catch (error) {
      console.error('Error in ad flow:', error);
      setAdPlayed(true);
      setShowVideo(true);
    }
  };

  // Initialize FluidPlayer or native controls
  useEffect(() => {
    if (!videoRef.current || !src) return;

    let playerInstance: any = null;
    const videoElement = videoRef.current;

    try {
      if (fluidPlayerLoaded && !isMobile()) {
        console.log('Initializing FluidPlayer...');

        playerInstance = window.fluidPlayer(videoElement, {
          layoutControls: {
            fillToContainer: true,
            primaryColor: '#FF6B35',
            posterImage: poster,
            playButtonShowing: true,
            playPauseAnimation: true,
            mute: { initiallyMuted: false },
            allowDownload: false,
            allowTheatre: true,
            playbackRates: ['x0.5', 'x1', 'x1.25', 'x1.5', 'x2'],
            subtitlesEnabled: false,
            keyboardControl: true,
            layout: 'default',
            autoPlay: false
          },
          vastOptions: {
            adList: [{
              roll: 'preRoll',
              vastTag: 'https://s.magsrv.com/v1/vast.php?idzone=5660526',
              timer: false,
              skipOffset: 5
            }],
            adCTAText: 'Visit Advertiser',
            adCTATextPosition: 'bottom right',
            showProgressbarMarkers: false,
            vastTimeout: 15000,
            maxAllowedVastTagRedirects: 3
          }
        });

        playerRef.current = playerInstance;

        // VAST event handlers
        videoElement.addEventListener('vast_ad_started', () => {
          console.log('VAST ad started');
          setAdPlayed(false);
        });

        videoElement.addEventListener('vast_ad_complete', () => {
          console.log('VAST ad completed');
          setAdPlayed(true);
        });

        videoElement.addEventListener('vast_ad_error', () => {
          console.log('VAST ad error, using fallback');
          handleVideoPlay();
        });

      } else {
        console.log('Using native controls with ad overlay');
        setIsLoading(false);
      }

      // Basic video events
      videoElement.addEventListener('loadstart', () => {
        setIsLoading(true);
        setVideoError(false);
      });

      videoElement.addEventListener('canplay', () => {
        setIsLoading(false);
        setVideoError(false);
        onCanPlay?.();
      });

      videoElement.addEventListener('error', () => {
        setVideoError(true);
        setIsLoading(false);
        onError?.();
      });

      // Intercept play event for ad handling
      videoElement.addEventListener('play', (e) => {
        if (!adPlayed && !isMobile()) {
          e.preventDefault();
          videoElement.pause();
          handleVideoPlay();
        }
      });

      return () => {
        try {
          if (playerInstance && playerInstance.destroy) {
            playerInstance.destroy();
          }
        } catch (error) {
          console.log('Cleanup error:', error);
        }
      };

    } catch (error) {
      console.error('Error initializing player:', error);
      setVideoError(true);
      setIsLoading(false);
    }
  }, [src, poster, fluidPlayerLoaded, user, videoId]);

  // Disable right-click
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
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
    <div className="relative w-full h-full group" onContextMenu={handleContextMenu}>
      {/* Ad overlay for native ad */}
      {!adPlayed && adCountdown > 0 && (
        <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-20">
          <div ref={adContainerRef} className="w-full h-full flex flex-col items-center justify-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
              <p className="text-white text-lg mb-2">Advertisement</p>
              <p className="text-white/80">Video will start in {adCountdown} seconds</p>
              <div className="mt-4 w-full bg-white/20 rounded-full h-2">
                <div 
                  className="bg-white rounded-full h-2 transition-all duration-1000"
                  style={{ width: `${((5 - adCountdown) / 5) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="text-white">Loading...</div>
        </div>
      )}

      {/* Video element */}
      <video
        ref={videoRef}
        className="w-full h-full"
        src={src}
        poster={poster}
        controls={!fluidPlayerLoaded || isMobile() || showVideo}
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