import React, { useRef, useEffect, useState } from 'react';
import { VideoIcon, Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';
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
  const adContainerRef = useRef<HTMLDivElement>(null);
  const [videoError, setVideoError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [viewTracked, setViewTracked] = useState(false);
  const [adPlayed, setAdPlayed] = useState(false);
  const [showVideo, setShowVideo] = useState(true);
  const [adCountdown, setAdCountdown] = useState(0);
  const [showPlayButton, setShowPlayButton] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
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

  // Play ad before video
  const playAd = () => {
    return new Promise<void>((resolve) => {
      console.log('Playing pre-roll ad...');
      
      setAdCountdown(5);
      const countdownInterval = setInterval(() => {
        setAdCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            setAdPlayed(true);
            resolve();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Track ad impression
      try {
        window.AdProvider?.push({
          "serve": {
            "zoneid": "5660526"
          }
        });
      } catch (error) {
        console.error('Error loading ad:', error);
      }
    });
  };

  // Handle play button click
  const handlePlay = async () => {
    if (!videoRef.current) return;

    setShowPlayButton(false);
    
    if (!adPlayed) {
      // Show ad first
      await playAd();
      
      // Track video view
      if (user?.id && videoId && !viewTracked) {
        try {
          await trackVideoView(videoId, user.id);
          setViewTracked(true);
        } catch (error) {
          console.error('Error tracking video view:', error);
        }
      }
    }

    // Play video
    try {
      await videoRef.current.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing video:', error);
    }
  };

  // Handle pause
  const handlePause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Handle mute toggle
  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  // Handle fullscreen
  const handleFullscreen = () => {
    if (containerRef.current) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    }
  };

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadStart = () => {
      setIsLoading(true);
      setVideoError(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      setVideoError(false);
      onCanPlay?.();
    };

    const handleError = () => {
      setVideoError(true);
      setIsLoading(false);
      onError?.();
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [src, onCanPlay, onError]);

  // Format time helper
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle progress bar click
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newTime = (clickX / width) * duration;
    
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

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
    <div ref={containerRef} className="relative w-full h-full group bg-black" onContextMenu={handleContextMenu}>
      {/* Ad overlay */}
      {!adPlayed && adCountdown > 0 && (
        <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-30">
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
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
          <div className="text-white">Loading...</div>
        </div>
      )}

      {/* Large play button overlay */}
      {showPlayButton && !isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <Button
            data-testid="video-play-button"
            onClick={handlePlay}
            className="w-20 h-20 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border-2 border-white/30"
            variant="ghost"
          >
            <Play className="w-8 h-8 text-white ml-1" fill="white" />
          </Button>
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
        muted={isMuted}
        style={{ width: '100%', height: '100%' }}
      />

      {/* Custom controls */}
      {showVideo && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {/* Progress bar */}
          <div 
            className="w-full h-2 bg-white/20 rounded-full mb-4 cursor-pointer"
            onClick={handleProgressClick}
          >
            <div 
              className="h-full bg-white rounded-full transition-all duration-200"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>

          {/* Control buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                data-testid="video-play-pause-button"
                onClick={isPlaying ? handlePause : handlePlay}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              
              <Button
                data-testid="video-mute-button"
                onClick={handleMuteToggle}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
              
              <span className="text-white text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <Button
              data-testid="video-fullscreen-button"
              onClick={handleFullscreen}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              <Maximize className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;