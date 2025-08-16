import React, { useRef, useEffect, useState } from 'react';
import { VideoIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { trackVideoView } from '@/services/userStatsService';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import 'videojs-contrib-ads';
import 'videojs-ima';

// Declare Video.js types
declare global {
  interface Window {
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
  const { user } = useAuth();

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
    if (!videoRef.current || !src) return;

    // Initialize Video.js player
    const player = videojs(videoRef.current, {
      controls: true,
      fluid: true,
      responsive: true,
      playbackRates: [0.5, 1, 1.25, 1.5, 2],
      sources: [{
        src: src,
        type: 'video/mp4'
      }],
      poster: poster,
      preload: 'metadata'
    });

    playerRef.current = player;

    // Initialize ads
    player.ready(() => {
      try {
        // Initialize contrib-ads
        if ((player as any).ads) {
          (player as any).ads({
            debug: false,
            timeout: 5000,
            prerollTimeout: 8000
          });
        }

        // Initialize IMA plugin for VAST ads
        if ((player as any).ima) {
          (player as any).ima({
            adTagUrl: `https://s.magsrv.com/v1/vast.php?idzone=5660526&timestamp=${Date.now()}`,
            adsManagerLoadedCallback: () => {
              console.log('IMA ads manager loaded');
            },
            adErrorCallback: (error: any) => {
              console.log('Ad error, proceeding to content:', error);
              player.trigger('nopreroll');
            },
            adsRenderingSettings: {
              restoreCustomPlaybackStateOnAdBreakComplete: true
            }
          });
        }
      } catch (error) {
        console.log('Ad plugins not available, playing without ads:', error);
      }

      // Player event listeners
      player.on('loadstart', () => {
        console.log('Video load started');
        setIsLoading(true);
        setVideoError(false);
      });

      player.on('canplay', () => {
        console.log('Video can play');
        setIsLoading(false);
        setVideoError(false);
        onCanPlay?.();
      });

      player.on('error', () => {
        console.error('Video error');
        setVideoError(true);
        setIsLoading(false);
        onError?.();
      });

      player.on('play', async () => {
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
      });

      // Ad event listeners
      player.on('ads-ad-started', () => {
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

      player.on('ads-ad-ended', () => {
        console.log('Ad ended, content will start');
      });

      player.on('contentloadedmetadata', () => {
        console.log('Content metadata loaded');
      });
    });

    // Cleanup function
    return () => {
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [src, poster, onError, onCanPlay, user, videoId, viewTracked]);

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

      <div data-vjs-player>
        <video
          ref={videoRef}
          className="video-js vjs-default-skin w-full h-full"
          data-setup="{}"
          style={{ width: '100%', height: '100%' }}
          crossOrigin="anonymous"
        />
      </div>
    </div>
  );
};

export default VideoPlayer;