import React, { useRef, useEffect, useState } from 'react';
import { VideoIcon, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { trackVideoView } from '@/services/userStatsService';

// Ad provider types
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [videoError, setVideoError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewTracked, setViewTracked] = useState(false);
  const [adPlayed, setAdPlayed] = useState(false);
  const [adCountdown, setAdCountdown] = useState(0);
  const [showPlayButton, setShowPlayButton] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoStarted, setVideoStarted] = useState(false);
  const { user } = useAuth();

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

  // Simple ad countdown
  const startAdCountdown = () => {
    setAdCountdown(5);
    const interval = setInterval(() => {
      setAdCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setAdPlayed(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Inject ad into container
    try {
      window.AdProvider?.push({
        serve: {
          zoneid: 5660526,
          placement: 'ad-container' // must match the div id below
        }
      });
    } catch (error) {
      console.error('Error loading ad:', error);
    }
  };

  // YouTube-style play - one click starts everything
  const handleVideoClick = async () => {
    if (!videoRef.current) return;

    setShowPlayButton(false);
    setVideoStarted(true);

    // Start ad first if not played
    if (!adPlayed) {
      startAdCountdown();

      // Track video view
      if (user?.id && videoId && !viewTracked) {
        try {
          await trackVideoView(videoId, user.id);
          setViewTracked(true);
        } catch (error) {
          console.error('Error tracking video view:', error);
        }
      }
      return;
    }

    // Play/pause video
    try {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        await videoRef.current.play();
      }
    } catch (error) {
      console.error('Error playing video:', error);
    }
  };

  // Auto-play video after ad
  useEffect(() => {
    if (adPlayed && videoStarted && videoRef.current) {
      videoRef.current.play().catch(console.error);
    }
  }, [adPlayed, videoStarted]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleError = () => {
      setVideoError(true);
      onError?.();
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      onCanPlay?.();
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    video.addEventListener('error', handleError);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('error', handleError);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [src, onCanPlay, onError]);

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
    <div
      ref={containerRef}
      className="relative w-full h-full group bg-black cursor-pointer"
      onContextMenu={handleContextMenu}
      onClick={handleVideoClick}
    >
      {/* Ad overlay */}
      {adCountdown > 0 && (
        <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-30">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center w-[80%] max-w-xl">
            <p className="text-white text-lg mb-4">Advertisement</p>
            {/* Exoclick Ad slot */}
            <div
              id="ad-container"
              className="w-full h-40 bg-black flex items-center justify-center mb-4"
            />
            <p className="text-white/80">Video will start in {adCountdown} seconds</p>
            <div className="mt-4 w-full bg-white/20 rounded-full h-2">
              <div
                className="bg-white rounded-full h-2 transition-all duration-1000"
                style={{ width: `${((5 - adCountdown) / 5) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Large play button overlay - like YouTube */}
      {showPlayButton && !videoStarted && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="w-20 h-20 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors shadow-lg">
            <Play className="w-8 h-8 text-white ml-1" fill="white" />
          </div>
        </div>
      )}

      {/* Video element */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        src={src}
        poster={poster}
        preload="metadata"
        playsInline
        muted={false}
        controls={adPlayed && videoStarted}
        style={{ width: '100%', height: '100%' }}
      />

      {/* Simple overlay controls when playing */}
      {isPlaying && adPlayed && (
        <div className="absolute inset-0 group-hover:bg-black/20 transition-colors">
          <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    videoRef.current?.paused ? videoRef.current?.play() : videoRef.current?.pause();
                  }}
                  className="p-2 rounded-full bg-black/50 hover:bg-black/70"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <span className="text-sm">
                  {Math.floor(currentTime / 60)}:
                  {(Math.floor(currentTime) % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;