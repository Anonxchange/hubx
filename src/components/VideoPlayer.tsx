import React, { useRef, useEffect, useState } from 'react';
import { VideoIcon, Settings, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBandwidthOptimization } from '@/hooks/useBandwidthOptimization';
import { useAuth } from '@/contexts/AuthContext';
import { trackVideoView } from '@/services/userStatsService';


interface VideoQuality {
  label: string;
  height: number;
  bandwidth: number;
  url: string;
}

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
  const [showSkipButton, setShowSkipButton] = useState(false);
  const [adCountdown, setAdCountdown] = useState(5);
  const [viewTracked, setViewTracked] = useState(false); // State to track if view has been logged
  const [vastCache, setVastCache] = useState<{[key: string]: any}>({});
  const { user } = useAuth(); // Get user from AuthContext

  // ABR and Quality Selection State
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState<VideoQuality | null>(null);
  const [availableQualities, setAvailableQualities] = useState<VideoQuality[]>([]);
  const [isAutoQuality, setIsAutoQuality] = useState(true);
  const [connectionSpeed, setConnectionSpeed] = useState<number>(0);
  const [bufferHealth, setBufferHealth] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);

  const { getVideoPreloadStrategy } = useBandwidthOptimization();

  // Initialize video qualities lazily - only when needed
  const initializeQualities = () => {
    if (availableQualities.length > 0) return;

    const qualities: VideoQuality[] = [
      {
        label: "720p",
        height: 720,
        bandwidth: 2500000,
        url: src
      },
      {
        label: "480p",
        height: 480,
        bandwidth: 1000000,
        url: src.replace('.mp4', '_480p.mp4')
      },
      {
        label: "360p",
        height: 360,
        bandwidth: 500000,
        url: src.replace('.mp4', '_360p.mp4')
      }
    ];

    setAvailableQualities(qualities);
    setSelectedQuality(qualities[0]); // Default to 720p
    setIsAutoQuality(false);
  };

  // Lightweight connection estimation - no network requests
  const estimateConnectionSpeed = () => {
    if (connectionSpeed > 0) return;

    // Use Network Information API if available
    const connection = (navigator as any).connection;
    if (connection) {
      const downlink = connection.downlink || 2; // Mbps
      setConnectionSpeed(downlink * 1000000); // Convert to bps
    } else {
      setConnectionSpeed(2000000); // Default to 2 Mbps
    }
  };

  // Auto quality selection based on connection speed and buffer health
  const selectOptimalQuality = () => {
    if (!isAutoQuality || availableQualities.length === 0) return;

    let optimalQuality = availableQualities[availableQualities.length - 1]; // Start with lowest quality

    // Select based on connection speed
    if (connectionSpeed > 4000000) { // > 4 Mbps
      optimalQuality = availableQualities.find(q => q.height === 1080) || optimalQuality;
    } else if (connectionSpeed > 2000000) { // > 2 Mbps
      optimalQuality = availableQualities.find(q => q.height === 720) || optimalQuality;
    } else if (connectionSpeed > 800000) { // > 800 Kbps
      optimalQuality = availableQualities.find(q => q.height === 480) || optimalQuality;
    }

    // Adjust based on buffer health
    if (bufferHealth < 5 && selectedQuality && selectedQuality.height > 480) {
      // Step down quality if buffer is low
      const currentIndex = availableQualities.findIndex(q => q.height === selectedQuality.height);
      if (currentIndex < availableQualities.length - 1) {
        optimalQuality = availableQualities[currentIndex + 1];
      }
    }

    if (optimalQuality && optimalQuality !== selectedQuality) {
      console.log(`Auto-switching to ${optimalQuality.label}`);
      setSelectedQuality(optimalQuality);
    }
  };

  // Monitor buffer health
  const monitorBufferHealth = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const buffered = video.buffered;
    const currentTime = video.currentTime;

    if (buffered.length > 0) {
      // Find the buffer range that contains current time
      for (let i = 0; i < buffered.length; i++) {
        if (currentTime >= buffered.start(i) && currentTime <= buffered.end(i)) {
          const bufferAhead = buffered.end(i) - currentTime;
          setBufferHealth(bufferAhead);
          break;
        }
      }
    }
  };

  // Handle quality change
  const handleQualityChange = (quality: VideoQuality) => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const currentTime = video.currentTime;
    const wasPlaying = !video.paused;

    setSelectedQuality(quality);
    setIsAutoQuality(quality.label === "Auto");
    setShowQualityMenu(false);

    // Don't load new source until user starts playing (bandwidth saving)
    if (hasStartedPlaying) {
      video.src = quality.url;
      video.currentTime = currentTime;

      if (wasPlaying) {
        video.play().catch(console.error);
      }
    }
  };

  // Handle play button click with lazy loading
  const handlePlayClick = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;

    if (!hasStartedPlaying) {
      // Initialize qualities and connection estimate
      initializeQualities();
      estimateConnectionSpeed();

      setHasStartedPlaying(true);
      video.src = src; // Use original source
      video.load();
    }

    if (video.paused) {
      video.play().then(() => {
        setIsPlaying(true);
      }).catch(console.error);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  // Monitor video events for ABR - optimized with throttling
  useEffect(() => {
    if (!videoRef.current || !hasStartedPlaying) return;

    const video = videoRef.current;
    let timeUpdateThrottle: NodeJS.Timeout;

    const handleTimeUpdate = () => {
      // Throttle time update events to reduce CPU usage
      if (!timeUpdateThrottle) {
        timeUpdateThrottle = setTimeout(() => {
          monitorBufferHealth();
          selectOptimalQuality();
          timeUpdateThrottle = null as any;
        }, 2000); // Check every 2 seconds instead of constantly
      }
    };

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

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('error', handleError);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    // Monitor buffer health every 3 seconds instead of every second
    const bufferInterval = setInterval(monitorBufferHealth, 3000);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('error', handleError);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      clearInterval(bufferInterval);
      if (timeUpdateThrottle) clearTimeout(timeUpdateThrottle);
    };
  }, [hasStartedPlaying, selectedQuality, isAutoQuality]);

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

  // Function to fetch and parse VAST XML with caching - optimized
  const fetchVastAd = async () => {
    const cacheKey = 'vast_ad_data';
    const cacheExpiry = 15 * 60 * 1000; // 15 minutes for better caching

    // Check cache first
    const cached = vastCache[cacheKey];
    if (cached && (Date.now() - cached.timestamp) < cacheExpiry) {
      return cached.data;
    }

    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

      const response = await fetch('https://s.magsrv.com/v1/vast.php?idzone=5660526', {
        mode: 'cors',
        headers: {
          'Accept': 'application/xml, text/xml'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Failed to fetch VAST');
      }

      const vastXml = await response.text();

      // Parse VAST XML to extract media file
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(vastXml, 'text/xml');

      // Look for MediaFile elements
      const mediaFiles = xmlDoc.getElementsByTagName('MediaFile');
      let adVideoUrl = null;

      for (let i = 0; i < mediaFiles.length; i++) {
        const mediaFile = mediaFiles[i];
        const type = mediaFile.getAttribute('type');
        if (type && (type.includes('mp4') || type.includes('video'))) {
          adVideoUrl = mediaFile.textContent?.trim();
          break;
        }
      }

      // Also check for ClickThrough URL
      const clickThrough = xmlDoc.getElementsByTagName('ClickThrough')[0];
      const clickThroughUrl = clickThrough ? clickThrough.textContent?.trim() : null;

      const result = { adVideoUrl, clickThroughUrl };

      // Cache the result
      setVastCache(prev => ({
        ...prev,
        [cacheKey]: {
          data: result,
          timestamp: Date.now()
        }
      }));

      return result;
    } catch (error) {
      console.error('Error fetching VAST (using fallback):', error);
      return null;
    }
  };

  // Function to play VAST ad - ALWAYS PLAYS ON EVERY VIDEO
  const playVastAd = async () => {
    if (adShown) {
      console.log('Ad already shown for this video');
      return;
    }

    console.log('Attempting to play VAST ad...');
    const vastData = await fetchVastAd();

    if (vastData?.adVideoUrl) {
      console.log('Playing VAST video ad:', vastData.adVideoUrl);
      setShowingAd(true);
      setShowSkipButton(false);
      setAdCountdown(5);

      // Start skip button countdown
      const skipTimer = setTimeout(() => {
        setShowSkipButton(true);
      }, 5000);

      // Update countdown every second
      const countdownInterval = setInterval(() => {
        setAdCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      if (adVideoRef.current) {
        adVideoRef.current.src = vastData.adVideoUrl;
        adVideoRef.current.style.display = 'block';

        // Add click handler if click-through URL exists
        if (vastData.clickThroughUrl) {
          adVideoRef.current.style.cursor = 'pointer';
          adVideoRef.current.onclick = () => {
            window.open(vastData.clickThroughUrl, '_blank');
          };
        }

        try {
          await adVideoRef.current.play();
        } catch (playError) {
          console.error('Error playing ad video:', playError);
          clearTimeout(skipTimer);
          clearInterval(countdownInterval);
          setShowingAd(false);
          setAdShown(true);
          setShowSkipButton(false);
          // Fallback to placeholder ad
          showPlaceholderAd();
        }
      }

      // Cleanup function
      const cleanup = () => {
        clearTimeout(skipTimer);
        clearInterval(countdownInterval);
      };

      // Store cleanup function for later use
      (window as any).adCleanup = cleanup;

    } else {
      console.log('No valid ad video found, showing placeholder ad');
      // Show placeholder ad overlay
      showPlaceholderAd();
    }
  };

  // Function to show placeholder ad when VAST fails
  const showPlaceholderAd = () => {
    setShowingAd(true);
    setShowSkipButton(false);
    setAdCountdown(5);

    const adOverlay = document.createElement('div');
    adOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(45deg, #8b5cf6, #a855f7);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 18px;
      font-weight: bold;
      z-index: 1000;
      cursor: pointer;
    `;

    let countdown = 5;
    const updateOverlay = () => {
      adOverlay.innerHTML = `
        <div style="text-align: center;">
          <div style="margin-bottom: 15px;">Advertisement</div>
          <div style="font-size: 14px; opacity: 0.8;">${countdown > 0 ? `Video starts in ${countdown} seconds` : 'You can skip this ad'}</div>
          <div style="margin-top: 15px; font-size: 12px; opacity: 0.6;">Click to visit advertiser</div>
        </div>
      `;
    };

    updateOverlay();

    adOverlay.onclick = () => {
      window.open('https://s.magsrv.com/v1/vast.php?idzone=5660526', '_blank');
    };

    console.log('Showing placeholder ad');

    if (containerRef.current) {
      containerRef.current.appendChild(adOverlay);
    }

    const countdownInterval = setInterval(() => {
      countdown--;
      setAdCountdown(countdown);
      updateOverlay();

      if (countdown <= 0) {
        setShowSkipButton(true);
      }

      if (countdown <= -5) { // Auto-skip after 5 seconds of skip availability
        clearInterval(countdownInterval);
        if (containerRef.current && adOverlay.parentNode) {
          containerRef.current.removeChild(adOverlay);
        }
        setShowingAd(false);
        setAdShown(true);
        setShowSkipButton(false);
      }
    }, 1000);
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

      // Track video view when it starts playing
      if (!viewTracked && user?.id && videoId) {
        console.log(`Tracking video view for videoId: ${videoId}, userId: ${user.id}`);
        await trackVideoView(videoId, user.id);
        setViewTracked(true);
      }

      // Track with Exoclick when video starts playing
      trackVideoViewExoclick();

      // Show ad on every video play (like major video platforms)
      if (!adShown) {
        console.log('Showing ad before video');
        video.pause();
        await playVastAd();
      } else {
        console.log('Ad already shown for this video');
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

    // Don't load video until user interaction - save bandwidth and loading time
    video.preload = 'none';

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

  const skipAd = () => {
    console.log('Skipping ad');

    // Cleanup timers
    if ((window as any).adCleanup) {
      (window as any).adCleanup();
    }

    // Hide ad video if playing
    if (adVideoRef.current) {
      adVideoRef.current.pause();
      adVideoRef.current.style.display = 'none';
    }

    // Remove any placeholder overlays
    const overlays = containerRef.current?.querySelectorAll('div[style*="position: absolute"]');
    overlays?.forEach(overlay => {
      if (overlay.parentNode === containerRef.current) {
        containerRef.current?.removeChild(overlay);
      }
    });

    setShowingAd(false);
    setAdShown(true);
    setShowSkipButton(false);

    // Start main video
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  // Handles the end of the ad video
  const handleAdEnded = () => {
    console.log('Ad ended, starting main video');
    if (adVideoRef.current) {
      adVideoRef.current.style.display = 'none';
    }
    setShowingAd(false);
    setAdShown(true);
    setShowSkipButton(false);

    // Cleanup timers
    if ((window as any).adCleanup) {
      (window as any).adCleanup();
    }

    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  // Handles errors during ad playback
  const handleAdError = () => {
    console.log('Ad error, showing placeholder ad');
    if (adVideoRef.current) {
      adVideoRef.current.style.display = 'none';
    }
    showPlaceholderAd();
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
            <p className="text-sm text-white/80 mt-1">{selectedQuality?.label} Quality</p>
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && hasStartedPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white z-30">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 mx-auto border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm">Loading {selectedQuality?.label}...</p>
          </div>
        </div>
      )}

      {/* Quality Selector */}
      {hasStartedPlaying && (
        <div className="absolute top-4 right-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="relative">
            <Button
              onClick={() => setShowQualityMenu(!showQualityMenu)}
              size="sm"
              variant="secondary"
              className="bg-black/80 text-white hover:bg-black/90 border-white/20"
            >
              <Settings className="w-4 h-4 mr-1" />
              {selectedQuality?.label || "720p"}
            </Button>

            {showQualityMenu && (
              <div className="absolute top-full right-0 mt-2 bg-black/90 rounded-md shadow-lg border border-white/20 min-w-32">
                {availableQualities.map((quality) => (
                  <button
                    key={quality.label}
                    onClick={() => handleQualityChange(quality)}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-white/20 transition-colors first:rounded-t-md last:rounded-b-md ${
                      selectedQuality?.label === quality.label ? 'bg-white/20 text-white' : 'text-white/80'
                    }`}
                  >
                    {quality.label}
                    {quality.label === "Auto" && isAutoQuality && " (Auto)"}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Connection Speed Indicator */}
      {hasStartedPlaying && connectionSpeed > 0 && (
        <div className="absolute top-4 left-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-black/80 text-white px-2 py-1 rounded text-xs">
            {(connectionSpeed / 1000000).toFixed(1)} Mbps
            {bufferHealth > 0 && ` • ${bufferHealth.toFixed(1)}s buffer`}
          </div>
        </div>
      )}

      {/* Skip Ad Button */}
      {showingAd && showSkipButton && (
        <div className="absolute top-4 right-4 z-40">
          <Button
            onClick={skipAd}
            size="sm"
            className="bg-black/80 text-white hover:bg-black/90 border-white/20"
          >
            Skip Ad
          </Button>
        </div>
      )}

      {/* Ad Countdown */}
      {showingAd && !showSkipButton && adCountdown > 0 && (
        <div className="absolute top-4 right-4 z-40 bg-black/80 text-white px-3 py-1 rounded text-sm">
          Skip in {adCountdown}s
        </div>
      )}

      {/* Ad Video Element */}
      <video
        ref={adVideoRef}
        className="absolute top-0 left-0 w-full h-full z-20"
        style={{ display: 'none', backgroundColor: '#000' }}
        controls={false}
        autoPlay
        playsInline
      />

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
        {hasStartedPlaying && selectedQuality && (
          <source src={selectedQuality.url} type="video/mp4" />
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
    AdProvider?: any[];
  }
}

export default VideoPlayer;