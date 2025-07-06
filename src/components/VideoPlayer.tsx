import React, { useRef, useEffect } from 'react';
import { VideoIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import 'videojs-contrib-ads';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  vastUrl?: string;
  onError?: () => void;
  onCanPlay?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  src, 
  poster, 
  vastUrl = 'https://s.magsrv.com/v1/vast.php?idzone=5660526',
  onError, 
  onCanPlay 
}) => {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [videoError, setVideoError] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  useEffect(() => {
    if (!playerRef.current && videoRef.current) {
      const videoElement = document.createElement('video-js');
      videoElement.className = 'vjs-default-skin w-full h-full';
      videoRef.current.appendChild(videoElement);

      try {
        playerRef.current = videojs(videoElement, {
          controls: true,
          responsive: true,
          fluid: true,
          poster: poster,
          preload: 'metadata',
          playsinline: true,
          sources: [{
            src: src,
            type: 'video/mp4'
          }]
        });

        // Initialize the ads plugin
        playerRef.current.ads({
          timeout: 5000
        });

        // Event listeners
        playerRef.current.ready(() => {
          console.log('Player is ready');
          setIsLoading(false);
          setVideoError(false);
          onCanPlay?.();
          
          // Request ads when player is ready
          playerRef.current.trigger('adsready');
        });

        playerRef.current.on('error', (e: any) => {
          console.error('Video error:', e);
          setVideoError(true);
          setIsLoading(false);
          onError?.();
        });

        playerRef.current.on('loadstart', () => {
          console.log('Video load started');
          setIsLoading(true);
          setVideoError(false);
        });

        playerRef.current.on('loadedmetadata', () => {
          console.log('Video metadata loaded');
          setIsLoading(false);
        });

        playerRef.current.on('play', () => {
          console.log('Video started playing');
          setIsLoading(false);
        });

        playerRef.current.on('waiting', () => {
          console.log('Video waiting for data');
          setIsLoading(true);
        });

        playerRef.current.on('playing', () => {
          console.log('Video playing');
          setIsLoading(false);
        });

        // Ads framework events
        playerRef.current.on('readyforpreroll', () => {
          console.log('Ready for preroll ad');
          // Start ad mode
          playerRef.current.ads.startLinearAdMode();
          
          // Create a simple ad overlay
          const adOverlay = document.createElement('div');
          adOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: black;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 18px;
            z-index: 1000;
          `;
          adOverlay.innerHTML = `
            <div style="text-align: center;">
              <div>Advertisement</div>
              <div style="font-size: 14px; margin-top: 10px;">
                <a href="${vastUrl}" target="_blank" style="color: #fff; text-decoration: underline;">
                  Click here for more info
                </a>
              </div>
            </div>
          `;
          
          playerRef.current.el().appendChild(adOverlay);
          
          // Remove ad after 5 seconds and end ad mode
          setTimeout(() => {
            if (adOverlay.parentNode) {
              adOverlay.parentNode.removeChild(adOverlay);
            }
            playerRef.current.ads.endLinearAdMode();
          }, 5000);
        });

        playerRef.current.on('adstart', () => {
          console.log('Ad started');
        });

        playerRef.current.on('adend', () => {
          console.log('Ad ended');
        });

      } catch (error) {
        console.error('Error initializing video player:', error);
        setVideoError(true);
        setIsLoading(false);
        onError?.();
      }
    }

    return () => {
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [src, poster, vastUrl, onError, onCanPlay]);

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
    <div className="relative w-full h-full aspect-video">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white z-10">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 mx-auto border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm">Loading video...</p>
          </div>
        </div>
      )}
      <div ref={videoRef} className="video-js-wrapper w-full h-full" />
    </div>
  );
};

export default VideoPlayer;