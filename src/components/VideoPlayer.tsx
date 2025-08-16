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
  const [adCountdown, setAdCountdown] = useState(0);
  const [canSkipAd, setCanSkipAd] = useState(false);

  const [viewTracked, setViewTracked] = useState(false);
  const [vastCache, setVastCache] = useState<{[key: string]: any}>({});
  const { user } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);







  // Handle play button click with lazy loading
  const handlePlayClick = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;

    if (!hasStartedPlaying) {
      setHasStartedPlaying(true);
      video.src = src;
      video.load();

      // Wait for the video to be ready before playing
      video.addEventListener('loadeddata', () => {
        video.play().then(() => {
          setIsPlaying(true);
        }).catch((error) => {
          console.error('Error playing video:', error);
          setVideoError(true);
        });
      }, { once: true });
    } else {
      if (video.paused) {
        video.play().then(() => {
          setIsPlaying(true);
        }).catch((error) => {
          console.error('Error playing video:', error);
          setVideoError(true);
        });
      } else {
        video.pause();
        setIsPlaying(false);
      }
    }
  };

  // Monitor video events - simplified
  useEffect(() => {
    if (!videoRef.current || !hasStartedPlaying) return;

    const video = videoRef.current;

    const handleLoadedData = () => {
      setIsLoading(false);
      if (onCanPlay) onCanPlay();
    };

    const handleError = () => {
      setVideoError(true);
      if (onError) onError();
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('error', handleError);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('error', handleError);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [hasStartedPlaying]);

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

  // Function to get ExoClick video ad directly without VAST parsing
  const fetchVastAd = async () => {
    const cacheKey = 'vast_ad_data';
    const cacheExpiry = 5 * 60 * 1000; // 5 minutes caching

    // Check cache first
    const cached = vastCache[cacheKey];
    if (cached && (Date.now() - cached.timestamp) < cacheExpiry) {
      return cached.data;
    }

    try {
      // Use ExoClick's VAST endpoint for real ad revenue
      const vastUrl = `https://syndication.exoclick.com/ads/?idzone=5660526&type=vast&size=640x480&timestamp=${Date.now()}`;

      // Fetch actual VAST XML from ExoClick
      const response = await fetch(vastUrl);
      const vastXml = await response.text();

      // Parse VAST XML to get video URL
      const parser = new DOMParser();
      const vastDoc = parser.parseFromString(vastXml, 'text/xml');
      const mediaFileUrl = vastDoc.querySelector('MediaFile')?.textContent?.trim();

      if (mediaFileUrl) {
        const adData = {
          adVideoUrl: mediaFileUrl,
          duration: 30000, // Let ExoClick control duration
          skipTime: null // Let ExoClick handle skip timing
        };

        // Cache the result
        setVastCache(prev => ({
          ...prev,
          [cacheKey]: {
            data: adData,
            timestamp: Date.now()
          }
        }));

        console.log('ExoClick VAST ad loaded:', mediaFileUrl);
        return adData;
      } else {
        throw new Error('No media file found in VAST response');
      }

    } catch (error) {
      console.log('ExoClick VAST ad fetch failed, trying direct ad URL');

      // Fallback to working video ad if VAST fails
      const fallbackAdData = {
        adVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        duration: 10000, // 10 seconds for testing
        skipTime: 3000 // 3 second skip
      };

      setVastCache(prev => ({
        ...prev,
        [cacheKey]: {
          data: fallbackAdData,
          timestamp: Date.now()
        }
      }));

      console.log('Using reliable fallback ad for testing');
      return fallbackAdData;
    }
  };

  // Function to play ExoClick video ad without skip capability
  const playVastAd = async () => {
    if (adShown || showingAd) {
      console.log('Ad already shown or currently showing for this video');
      return;
    }

    console.log('Attempting to play ExoClick video ad...');
    setShowingAd(true);
    const vastData = await fetchVastAd();

    if (vastData?.adVideoUrl) {
      console.log('Playing ExoClick video ad:', vastData.adVideoUrl);

      if (adVideoRef.current) {
        adVideoRef.current.src = vastData.adVideoUrl;
        adVideoRef.current.style.display = 'block';
        adVideoRef.current.style.position = 'absolute';
        adVideoRef.current.style.top = '0';
        adVideoRef.current.style.left = '0';
        adVideoRef.current.style.width = '100%';
        adVideoRef.current.style.height = '100%';
        adVideoRef.current.style.zIndex = '30';
        adVideoRef.current.style.backgroundColor = '#000';

        // Configure ad video playback
        adVideoRef.current.controls = false;
        adVideoRef.current.setAttribute('controlsList', 'nodownload noremoteplayback nofullscreen');

        // Set volume and ensure it plays
        adVideoRef.current.volume = 0.8;
        adVideoRef.current.muted = false;
        adVideoRef.current.autoplay = true;

        try {
          console.log('🎬 Playing video ad:', vastData.adVideoUrl);
          await adVideoRef.current.play();
          console.log('✅ Video ad started playing successfully');

          // Let ExoClick handle timing and skip controls naturally
          // Remove custom countdown - ExoClick handles this
          console.log('ExoClick ad playing - revenue tracking active');

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

        } catch (playError) {
          console.error('Error playing ad video:', playError);
          handleAdError();
        }
      }
    } else {
      console.log('No ExoClick ad available, skipping to main video');
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
    }

    // Set preload to metadata for better user experience
    video.preload = 'metadata';

    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
      video.removeEventListener('play', handlePlay);

      if (adVideo) {
        adVideo.removeEventListener('ended', handleAdEnded);
        adVideo.removeEventListener('error', handleAdError);
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
    if (adVideoRef.current) {
      adVideoRef.current.style.display = 'none';
    }
    setShowingAd(false);
    setAdShown(true);
    setAdCountdown(0);
    setCanSkipAd(false);

    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  const handleSkipAd = () => {
    if (canSkipAd) {
      console.log('Ad skipped by user');
      handleAdEnded();
    }
  };

  // Handles errors during ad playback
  const handleAdError = () => {
    console.log('Ad error, skipping to main video');
    if (adVideoRef.current) {
      adVideoRef.current.style.display = 'none';
    }
    setShowingAd(false);
    setAdShown(true);
    setAdCountdown(0);
    setCanSkipAd(false);

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
      {/* Play Overlay for Lazy Loading */}
      {!hasStartedPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white z-40 cursor-pointer" onClick={handlePlayClick}>
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mb-4 mx-auto hover:bg-white/30 transition-colors">
              <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
            <p className="text-lg font-medium">Click to Play</p>
          </div>
        </div>
      )}





      {/* Ad Video Element with Skip Button */}
      <video
        ref={adVideoRef}
        className="absolute top-0 left-0 w-full h-full z-20"
        style={{ display: 'none', backgroundColor: '#000' }}
        controls={false}
        autoPlay
        playsInline
        controlsList="nodownload noremoteplayback nofullscreen"
        onContextMenu={(e) => e.preventDefault()}
        onError={handleAdError}
        onEnded={handleAdEnded}
        disablePictureInPicture
        muted={false}
      />

      {/* Let ExoClick handle ad controls and skip naturally */}
      {showingAd && (
        <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded text-sm z-30">
          Advertisement
        </div>
      )}

      {/* Main Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full"
        poster={hasStartedPlaying ? undefined : poster}
        preload="none"
        playsInline
        controls={hasStartedPlaying}
        controlsList="nodownload"
        style={{ width: '100%', height: '100%', backgroundColor: '#000' }}
        onError={handleVideoError}
        onContextMenu={handleContextMenu}
        onPause={() => setIsPlaying(false)}
      >
        {hasStartedPlaying && (
          <source src={src} type="video/mp4" />
        )}
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