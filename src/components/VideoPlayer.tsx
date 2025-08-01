import React, { useRef, useEffect } from 'react';
import { VideoIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const adVideoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [videoError, setVideoError] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showingAd, setShowingAd] = React.useState(false);
  const [adShown, setAdShown] = React.useState(false);
  const [showSkipButton, setShowSkipButton] = React.useState(false);
  const [adCountdown, setAdCountdown] = React.useState(5);
  const [viewTracked, setViewTracked] = React.useState(false);

  // Function to track video view with Exoclick
  const trackVideoView = () => {
    if (viewTracked) return;
    
    try {
      // Track with Exoclick - fire impression tracking
      if (window.popMagic && typeof window.popMagic.setAsOpened === 'function') {
        console.log('Tracking video view with Exoclick');
        window.popMagic.setAsOpened();
      }
      
      // Alternative tracking method if available
      if (window.AdProvider && Array.isArray(window.AdProvider)) {
        console.log('Tracking video impression');
        window.AdProvider.push({"serve": {"type": "impression"}});
      }
      
      // Custom tracking event
      const trackingEvent = new CustomEvent('videoViewTracked', {
        detail: { videoSrc: src, timestamp: Date.now() }
      });
      document.dispatchEvent(trackingEvent);
      
      setViewTracked(true);
      console.log('Video view tracked successfully');
    } catch (error) {
      console.error('Error tracking video view:', error);
    }
  };

  // Function to fetch and parse VAST XML
  const fetchVastAd = async () => {
    try {
      console.log('Fetching VAST ad...');
      // Using the working VAST URL from the ad script
      const response = await fetch('https://s.magsrv.com/v1/vast.php?idzone=5660526', {
        mode: 'cors',
        headers: {
          'Accept': 'application/xml, text/xml'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch VAST');
      }
      
      const vastXml = await response.text();
      console.log('VAST XML received:', vastXml.substring(0, 200) + '...');
      
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
      
      return { adVideoUrl, clickThroughUrl };
    } catch (error) {
      console.error('Error fetching VAST:', error);
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
      setViewTracked(false);
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
      trackVideoView();
      
      // Show ad on every video play (like major video platforms)
      if (!adShown) {
        console.log('Showing ad before video');
        video.pause();
        await playVastAd();
      } else {
        console.log('Ad already shown for this video');
      }
    };

    // Track view when video actually starts playing (not just when loaded)
    const handleVideoStart = () => {
      if (!viewTracked) {
        console.log('Video started playing - tracking view');
        trackVideoView();
      }
    };

    // Ad video event handlers
    const handleAdEnded = () => {
      console.log('Ad ended, starting main video');
      if (adVideo) {
        adVideo.style.display = 'none';
      }
      setShowingAd(false);
      setAdShown(true);
      setShowSkipButton(false);
      
      // Cleanup timers
      if ((window as any).adCleanup) {
        (window as any).adCleanup();
      }
      
      if (video) {
        video.play();
      }
    };

    const handleAdError = () => {
      console.log('Ad error, showing placeholder ad');
      if (adVideo) {
        adVideo.style.display = 'none';
      }
      showPlaceholderAd();
    };

    // Add event listeners
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);
    video.addEventListener('play', handlePlay);
    video.addEventListener('playing', handleVideoStart);

    if (adVideo) {
      adVideo.addEventListener('ended', handleAdEnded);
      adVideo.addEventListener('error', handleAdError);
    }

    // Set video source
    video.src = src;
    video.load();

    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('playing', handleVideoStart);
      
      if (adVideo) {
        adVideo.removeEventListener('ended', handleAdEnded);
        adVideo.removeEventListener('error', handleAdError);
      }
    };
  }, [src, onError, onCanPlay, adShown]);

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
    <div ref={containerRef} className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white z-10">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 mx-auto border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm">Loading video...</p>
          </div>
        </div>
      )}
      
      {/* Skip Ad Button */}
      {showingAd && showSkipButton && (
        <div className="absolute top-4 right-4 z-30">
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
        <div className="absolute top-4 right-4 z-30 bg-black/80 text-white px-3 py-1 rounded text-sm">
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
        poster={poster}
        preload="metadata"
        playsInline
        onError={handleVideoError}
        controls
        style={{ width: '100%', height: '100%', backgroundColor: '#000' }}
      >
        <source src={src} type="video/mp4" />
        <source src={src} type="video/webm" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

// Extend window object to include tracking functions
declare global {
  interface Window {
    popMagic?: any;
    AdProvider?: any[];
  }
}

export default VideoPlayer;
