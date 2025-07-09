import React, { useRef, useEffect } from 'react';
import { VideoIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import videojs from 'video.js';
import 'videojs-contrib-ads';
import 'videojs-vast-vpaid';

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
  const playerRef = useRef<any>(null);
  const [videoError, setVideoError] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    if (!videoRef.current) return;

    const videoElement = videoRef.current;
    
    // Initialize Video.js player
    const player = videojs(videoElement, {
      controls: true,
      responsive: true,
      fluid: true,
      playsinline: true,
      preload: 'metadata',
      poster: poster,
      sources: [{
        src: src,
        type: 'video/mp4'
      }]
    });

    playerRef.current = player;

    // Initialize ads
    player.ready(() => {
      // Type assertion for Video.js plugins
      const playerWithAds = player as any;
      
      playerWithAds.ads({
        timeout: 8000
      });

      // Initialize VAST plugin
      playerWithAds.vastClient({
        adTagUrl: 'https://s.magsrv.com/v1/vast.php?idzone=5660526',
        playAdAlways: true,
        vpaidFlashLoaderPath: '/VPAIDFlash.swf',
        adsCancelTimeout: 60000,
        adsEnabled: true
      });

      console.log('Video.js player with VAST ads initialized');
      setIsLoading(false);
      onCanPlay?.();
    });

    // Handle player events
    player.on('error', () => {
      console.error('Video.js player error');
      setVideoError(true);
      setIsLoading(false);
      onError?.();
    });

    player.on('loadstart', () => {
      console.log('Video loading started');
      setIsLoading(true);
    });

    player.on('canplay', () => {
      console.log('Video can play');
      setIsLoading(false);
    });

    player.on('ads-request', () => {
      console.log('Ad request started');
    });

    player.on('ads-load', () => {
      console.log('Ad loaded');
    });

    player.on('ads-start', () => {
      console.log('Ad started playing');
    });

    player.on('ads-end', () => {
      console.log('Ad finished playing');
    });

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [src, poster, onError, onCanPlay]);

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
      <div data-vjs-player>
        <video
          ref={videoRef}
          className="video-js vjs-default-skin w-full h-full"
          playsInline
          data-setup="{}"
        />
      </div>
    </div>
  );
};

export default VideoPlayer;