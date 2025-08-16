import React, { useRef, useEffect, useState } from 'react';
import { VideoIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { trackVideoView } from '@/services/userStatsService';




interface VideoPlayerProps {
  src: string;
  poster?: string;
  onError?: () => void;
  onCanPlay?: () => void;
  videoId?: string; // Added videoId prop
  videoTitle?: string; // Added videoTitle prop for reactions
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  onError,
  onCanPlay,
  videoId, // Destructure videoId
  videoTitle // Destructure videoTitle
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const adVideoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [videoError, setVideoError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showingAd, setShowingAd] = useState(false);
  const [adShown, setAdShown] = useState(false);
  // Skip state handled by VAST ad itself

  const [viewTracked, setViewTracked] = useState(false);
  const [vastCache, setVastCache] = useState<{[key: string]: any}>({});
  const { user } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);

  // Disable right-click to prevent download
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  // Function to track video view with Exoclick
  const trackVideoViewExoclick = () => {
    if (viewTracked) return;

    try {
      // Track impression with Exoclick using proper method
      if (window.AdProvider && Array.isArray(window.AdProvider)) {
        console.log('Tracking video view with Exoclick');
        window.AdProvider.push({
          "serve": {
            "type": "impression",
            "zoneid": "5660526"
          }
        });
      }

      // Fire custom tracking pixel for additional tracking
      const trackingPixel = new Image();
      trackingPixel.src = `https://s.magsrv.com/v1/track.php?idzone=5660526&type=view&timestamp=${Date.now()}`;

      // Custom tracking event
      const trackingEvent = new CustomEvent('videoViewTracked', {
        detail: { videoSrc: src, timestamp: Date.now(), zoneId: '5660526' }
      });
      document.dispatchEvent(trackingEvent);

      setViewTracked(true);
      console.log('Video view tracked successfully with Exoclick');
    } catch (error) {
      console.error('Error tracking video view:', error);
    }
  };

  // Function to create and display VAST ad with native interactivity
  const displayVastAd = async () => {
    const cacheKey = 'vast_ad_data';
    const cacheExpiry = 5 * 60 * 1000; // 5 minutes caching

    // Check cache first
    const cached = vastCache[cacheKey];
    if (cached && (Date.now() - cached.timestamp) < cacheExpiry) {
      return cached.data;
    }

    try {
      // Use your real VAST endpoint
      const vastUrl = `https://s.magsrv.com/v1/vast.php?idzone=5660526&timestamp=${Date.now()}`;

      // Create iframe for VAST ad to maintain native functionality
      const adContainer = document.createElement('div');
      adContainer.style.position = 'absolute';
      adContainer.style.top = '0';
      adContainer.style.left = '0';
      adContainer.style.width = '100%';
      adContainer.style.height = '100%';
      adContainer.style.zIndex = '25';
      adContainer.style.backgroundColor = '#000';

      // Create iframe for proper VAST rendering
      const adFrame = document.createElement('iframe');
      adFrame.style.width = '100%';
      adFrame.style.height = '100%';
      adFrame.style.border = 'none';
      adFrame.style.backgroundColor = '#000';
      
      // Load VAST ad in iframe for native behavior
      adFrame.src = `data:text/html,<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { margin: 0; padding: 0; background: #000; }
    video { width: 100%; height: 100vh; object-fit: contain; }
  </style>
</head>
<body>
  <video id="vastVideo" autoplay controls muted="false" style="width:100%;height:100%;">
    <source src="${vastUrl}" type="video/mp4">
  </video>
  <script>
    const video = document.getElementById('vastVideo');
    
    // Handle ad completion
    video.addEventListener('ended', () => {
      parent.postMessage({type: 'adEnded'}, '*');
    });
    
    // Handle ad error
    video.addEventListener('error', () => {
      parent.postMessage({type: 'adError'}, '*');
    });
    
    // Track ad start
    video.addEventListener('loadeddata', () => {
      parent.postMessage({type: 'adStarted'}, '*');
    });

    // Unmute the video for proper ad playback
    video.muted = false;
    video.volume = 1.0;
  </script>
</body>
</html>`;

      adContainer.appendChild(adFrame);
      
      // Listen for messages from iframe
      const messageHandler = (event) => {
        if (event.data?.type === 'adEnded') {
          handleAdEnded();
          window.removeEventListener('message', messageHandler);
        } else if (event.data?.type === 'adError') {
          handleAdError();
          window.removeEventListener('message', messageHandler);
        }
      };
      
      window.addEventListener('message', messageHandler);

      // Cache the result
      setVastCache(prev => ({
        ...prev,
        [cacheKey]: {
          data: { adContainer, adFrame },
          timestamp: Date.now()
        }
      }));

      console.log('VAST ad iframe created for native display');
      return { adContainer, adFrame };

    } catch (error) {
      console.log('VAST ad creation failed:', error);
      return null;
    }
  };

  // Let VAST ad handle its own timing and skip functionality
  const handleAdTimeUpdate = () => {
    // Minimal tracking - let ad network handle skip timing
    console.log('Ad playing...');
  };

  // Function to play VAST ad with native interactions
  const playVastAd = async () => {
    if (adShown || showingAd) {
      console.log('Ad already shown or currently showing for this video');
      return;
    }

    console.log('Attempting to display VAST ad with native interactions...');
    setShowingAd(true);
    
    const vastData = await displayVastAd();

    if (vastData?.adContainer && containerRef.current) {
      console.log('Displaying VAST ad with native controls');

      // Add the ad container to the video player
      containerRef.current.appendChild(vastData.adContainer);

      // Track impression for revenue
      if (window.AdProvider && Array.isArray(window.AdProvider)) {
        window.AdProvider.push({
          "serve": {
            "type": "video_impression",
            "zoneid": "5660526"
          }
        });
      }

      // Track ad impression
      if (window.AdProvider && Array.isArray(window.AdProvider)) {
        window.AdProvider.push({
          "serve": {
            "type": "impression",
            "zoneid": "5660526"
          }
        });
      }

      console.log('✅ VAST ad displayed with native functionality');

    } else {
      console.log('No ad available from VAST endpoint, proceeding to main video');
      handleAdError();
    }
  };



  // Reset ad state when video source changes - FRESH START EVERY VIDEO
  useEffect(() => {
    if (src) {
      setAdShown(false);
      setViewTracked(false); // Reset view tracked status
      console.log('New video loaded, ad state reset');
    }
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    const adVideo = adVideoRef.current;
    if (!video || !src) return;

    console.log('Loading video:', src);

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

    const handleError = (e: Event) => {
      console.error('Video error:', e);
      setVideoError(true);
      setIsLoading(false);
      onError?.();
    };

    const handlePlay = async () => {
      console.log('Video play triggered - Ad shown:', adShown);

      // Track video view when it starts playing (only for authenticated users)
      if (!viewTracked && user?.id && videoId) {
        try {
          console.log(`Tracking video view for videoId: ${videoId}, userId: ${user.id}`);
          await trackVideoView(videoId, user.id);
          setViewTracked(true);
        } catch (error) {
          console.error('Error tracking video view:', error);
          // Don't block video playback if tracking fails
        }
      }

      // Track with Exoclick when video starts playing
      trackVideoViewExoclick();

      // Show ad only once per video and only on first play attempt
      if (!adShown && !showingAd) {
        console.log('Showing ad before video');
        video.pause();
        await playVastAd();
      } else {
        console.log('Ad already shown or currently showing for this video');
      }
    };

    // Add event listeners
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);
    video.addEventListener('play', handlePlay);

    if (adVideo) {
      adVideo.addEventListener('ended', handleAdEnded);
      adVideo.addEventListener('error', handleAdError);
      adVideo.addEventListener('timeupdate', handleAdTimeUpdate);
    }

    return () => {
      // Pause videos when component unmounts to prevent background playback
      if (video) {
        video.pause();
        video.currentTime = 0;
      }
      if (adVideo) {
        adVideo.pause();
        adVideo.currentTime = 0;
      }

      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
      video.removeEventListener('play', handlePlay);

      if (adVideo) {
        adVideo.removeEventListener('ended', handleAdEnded);
        adVideo.removeEventListener('error', handleAdError);
        adVideo.removeEventListener('timeupdate', handleAdTimeUpdate);
      }
    };
  }, [src, onError, onCanPlay, adShown, viewTracked, user, videoId]); // Added dependencies

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error('Video element error:', e);
    setVideoError(true);
    setIsLoading(false);
    onError?.();
  };



  // Handles the end of the ad video
  const handleAdEnded = () => {
    console.log('Ad ended, starting main video');
    
    // Clean up iframe-based ad
    if (containerRef.current) {
      const adContainer = containerRef.current.querySelector('div[style*="z-index: 25"]');
      if (adContainer) {
        adContainer.remove();
      }
    }
    
    // Fallback cleanup for video element ads
    if (adVideoRef.current) {
      adVideoRef.current.style.display = 'none';
    }
    
    setShowingAd(false);
    setAdShown(true);

    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  // Handles errors during ad playback
  const handleAdError = () => {
    console.log('Ad error, skipping to main video');
    
    // Clean up iframe-based ad
    if (containerRef.current) {
      const adContainer = containerRef.current.querySelector('div[style*="z-index: 25"]');
      if (adContainer) {
        adContainer.remove();
      }
    }
    
    // Fallback cleanup for video element ads
    if (adVideoRef.current) {
      adVideoRef.current.style.display = 'none';
    }
    
    setShowingAd(false);
    setAdShown(true);

    if (videoRef.current) {
      videoRef.current.play();
    }
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
    <div ref={containerRef} className="relative w-full h-full group" onContextMenu={handleContextMenu}>





      {/* Ad Video Element - No native controls, let VAST ad handle interactions */}
      <video
        ref={adVideoRef}
        className="absolute top-0 left-0 w-full h-full z-20"
        style={{ display: 'none', backgroundColor: '#000' }}
        autoPlay
        playsInline
        onContextMenu={(e) => e.preventDefault()}
        onError={handleAdError}
        onEnded={handleAdEnded}
        disablePictureInPicture
        muted={false}
        onTimeUpdate={handleAdTimeUpdate}
      />

      {/* No custom ad overlay - let VAST ad handle all native controls */}

      {/* Main Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full"
        src={src}
        poster={poster}
        preload="metadata"
        playsInline
        controls
        controlsList="nodownload"
        style={{ width: '100%', height: '100%', backgroundColor: '#000' }}
        onError={handleVideoError}
        onContextMenu={handleContextMenu}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      >
        Your browser does not support the video tag.
      </video>

      {/* Video Reactions are handled in VideoPage, not here */}
    </div>
  );
};

// Extend window object to include all tracking functions used by both components
declare global {
  interface Window {
    popMagic?: any;
    AdProvider: any[];
  }
}

export default VideoPlayer;