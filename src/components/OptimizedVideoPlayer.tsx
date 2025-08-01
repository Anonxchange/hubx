import React, { useRef, useEffect, useState } from 'react';
import { VideoIcon, Settings, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  onError?: () => void;
  onCanPlay?: () => void;
}

interface QualityOption {
  label: string;
  value: string;
  bandwidth: number; // in kbps
}

const OptimizedVideoPlayer: React.FC<VideoPlayerProps> = ({ 
  src, 
  poster, 
  onError, 
  onCanPlay 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const adVideoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Existing state
  const [videoError, setVideoError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showingAd, setShowingAd] = useState(false);
  const [adShown, setAdShown] = useState(false);
  const [showSkipButton, setShowSkipButton] = useState(false);
  const [adCountdown, setAdCountdown] = useState(5);
  const [viewTracked, setViewTracked] = useState(false);
  
  // New optimization state
  const [currentQuality, setCurrentQuality] = useState('auto');
  const [connectionSpeed, setConnectionSpeed] = useState<'slow' | 'medium' | 'fast'>('medium');
  const [dataUsage, setDataUsage] = useState(0);

  // Quality options with different bitrates
  const qualityOptions: QualityOption[] = [
    { label: 'Auto', value: 'auto', bandwidth: 0 },
    { label: '240p', value: '240p', bandwidth: 300 },
    { label: '360p', value: '360p', bandwidth: 500 },
    { label: '480p', value: '480p', bandwidth: 1000 },
    { label: '720p', value: '720p', bandwidth: 2500 },
    { label: '1080p', value: '1080p', bandwidth: 5000 },
  ];

  // Network detection and adaptive quality
  useEffect(() => {
    const detectConnectionSpeed = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        const effectiveType = connection?.effectiveType;
        
        switch (effectiveType) {
          case 'slow-2g':
          case '2g':
            setConnectionSpeed('slow');
            setCurrentQuality('240p');
            break;
          case '3g':
            setConnectionSpeed('medium');
            setCurrentQuality('360p');
            break;
          case '4g':
          default:
            setConnectionSpeed('fast');
            setCurrentQuality('720p');
            break;
        }
      }
    };

    detectConnectionSpeed();
    
    // Listen for connection changes
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection?.addEventListener('change', detectConnectionSpeed);
      
      return () => {
        connection?.removeEventListener('change', detectConnectionSpeed);
      };
    }
  }, []);

  // Generate quality-specific video URLs
  const getQualityUrl = (baseUrl: string, quality: string): string => {
    if (quality === 'auto') return baseUrl;
    
    // For Bunny CDN or similar services that support quality parameters
    if (baseUrl.includes('bunnycdn.com') || baseUrl.includes('b-cdn.net')) {
      return `${baseUrl}?quality=${quality}`;
    }
    
    return baseUrl;
  };

  // Data usage tracking
  const trackDataUsage = () => {
    if (videoRef.current && currentQuality !== 'auto') {
      const quality = qualityOptions.find(q => q.value === currentQuality);
      if (quality) {
        const duration = videoRef.current.currentTime;
        const estimatedUsage = (quality.bandwidth * duration) / 8 / 1024; // MB
        setDataUsage(prev => prev + estimatedUsage);
      }
    }
  };

  // Preload optimization based on connection
  const getPreloadStrategy = (): 'none' | 'metadata' | 'auto' => {
    switch (connectionSpeed) {
      case 'slow': return 'none';
      case 'medium': return 'metadata';
      case 'fast': return 'metadata';
      default: return 'metadata';
    }
  };

  // Existing tracking function (optimized)
  const trackVideoView = () => {
    if (viewTracked) return;
    
    try {
      if (window.popMagic && typeof window.popMagic.setAsOpened === 'function') {
        console.log('Tracking video view with Exoclick');
        window.popMagic.setAsOpened();
      }
      
      if (window.AdProvider && Array.isArray(window.AdProvider)) {
        console.log('Tracking video impression');
        window.AdProvider.push({"serve": {"type": "impression"}});
      }
      
      const trackingEvent = new CustomEvent('videoViewTracked', {
        detail: { 
          videoSrc: src, 
          timestamp: Date.now(),
          quality: currentQuality,
          connectionSpeed 
        }
      });
      document.dispatchEvent(trackingEvent);
      
      setViewTracked(true);
      console.log('Video view tracked successfully');
    } catch (error) {
      console.error('Error tracking video view:', error);
    }
  };

  // Optimized VAST ad fetching with timeout
  const fetchVastAd = async () => {
    try {
      console.log('Fetching VAST ad...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout
      
      const response = await fetch('https://s.magsrv.com/v1/vast.php?idzone=5660526', {
        mode: 'cors',
        headers: { 'Accept': 'application/xml, text/xml' },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error('Failed to fetch VAST');
      
      const vastXml = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(vastXml, 'text/xml');
      
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
      
      const clickThrough = xmlDoc.getElementsByTagName('ClickThrough')[0];
      const clickThroughUrl = clickThrough ? clickThrough.textContent?.trim() : null;
      
      return { adVideoUrl, clickThroughUrl };
    } catch (error) {
      console.error('Error fetching VAST:', error);
      return null;
    }
  };

  // Quality change handler
  const handleQualityChange = (quality: string) => {
    if (!videoRef.current) return;
    
    const currentTime = videoRef.current.currentTime;
    const wasPlaying = !videoRef.current.paused;
    
    setCurrentQuality(quality);
    const newUrl = getQualityUrl(src, quality);
    
    videoRef.current.src = newUrl;
    videoRef.current.load();
    
    const handleLoadedData = () => {
      if (videoRef.current) {
        videoRef.current.currentTime = currentTime;
        if (wasPlaying) {
          videoRef.current.play();
        }
        videoRef.current.removeEventListener('loadeddata', handleLoadedData);
      }
    };
    
    videoRef.current.addEventListener('loadeddata', handleLoadedData);
  };

  // Existing ad functions (optimized)
  const playVastAd = async () => {
    if (adShown) return;
    
    console.log('Attempting to play VAST ad...');
    const vastData = await fetchVastAd();
    
    if (vastData?.adVideoUrl) {
      setShowingAd(true);
      setShowSkipButton(false);
      setAdCountdown(5);
      
      const skipTimer = setTimeout(() => setShowSkipButton(true), 5000);
      const countdownInterval = setInterval(() => {
        setAdCountdown(prev => prev <= 1 ? 0 : prev - 1);
      }, 1000);
      
      if (adVideoRef.current) {
        adVideoRef.current.src = vastData.adVideoUrl;
        adVideoRef.current.style.display = 'block';
        
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
          showPlaceholderAd();
        }
      }
      
      (window as any).adCleanup = () => {
        clearTimeout(skipTimer);
        clearInterval(countdownInterval);
      };
    } else {
      showPlaceholderAd();
    }
  };

  const showPlaceholderAd = () => {
    setShowingAd(true);
    setShowSkipButton(false);
    setAdCountdown(5);
    
    const adOverlay = document.createElement('div');
    adOverlay.style.cssText = `
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      background: linear-gradient(45deg, #8b5cf6, #a855f7);
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 18px; font-weight: bold; z-index: 1000; cursor: pointer;
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
    adOverlay.onclick = () => window.open('https://s.magsrv.com/v1/vast.php?idzone=5660526', '_blank');
    
    if (containerRef.current) {
      containerRef.current.appendChild(adOverlay);
    }
    
    const countdownInterval = setInterval(() => {
      countdown--;
      setAdCountdown(countdown);
      updateOverlay();
      
      if (countdown <= 0) setShowSkipButton(true);
      if (countdown <= -5) {
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

  const skipAd = () => {
    if ((window as any).adCleanup) {
      (window as any).adCleanup();
    }
    
    if (adVideoRef.current) {
      adVideoRef.current.pause();
      adVideoRef.current.style.display = 'none';
    }
    
    const overlays = containerRef.current?.querySelectorAll('div[style*="position: absolute"]');
    overlays?.forEach(overlay => {
      if (overlay.parentNode === containerRef.current) {
        containerRef.current?.removeChild(overlay);
      }
    });
    
    setShowingAd(false);
    setAdShown(true);
    setShowSkipButton(false);
    
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  // Reset state when video changes
  useEffect(() => {
    if (src) {
      setAdShown(false);
      setViewTracked(false);
      setDataUsage(0);
    }
  }, [src]);

  // Main video effect with optimization
  useEffect(() => {
    const video = videoRef.current;
    const adVideo = adVideoRef.current;
    if (!video || !src) return;

    const handleLoadStart = () => {
      setIsLoading(true);
      setVideoError(false);
    };

    const handleCanPlay = () => {
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
      trackVideoView();
      if (!adShown) {
        video.pause();
        await playVastAd();
      }
    };

    const handleProgress = () => {
      trackDataUsage();
    };

    const handleAdEnded = () => {
      if (adVideo) adVideo.style.display = 'none';
      setShowingAd(false);
      setAdShown(true);
      setShowSkipButton(false);
      if ((window as any).adCleanup) (window as any).adCleanup();
      if (video) video.play();
    };

    const handleAdError = () => {
      if (adVideo) adVideo.style.display = 'none';
      showPlaceholderAd();
    };

    // Add event listeners
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);
    video.addEventListener('play', handlePlay);
    video.addEventListener('progress', handleProgress);

    if (adVideo) {
      adVideo.addEventListener('ended', handleAdEnded);
      adVideo.addEventListener('error', handleAdError);
    }

    // Set optimized video source
    const optimizedUrl = getQualityUrl(src, currentQuality);
    video.src = optimizedUrl;
    video.load();

    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('progress', handleProgress);
      
      if (adVideo) {
        adVideo.removeEventListener('ended', handleAdEnded);
        adVideo.removeEventListener('error', handleAdError);
      }
    };
  }, [src, currentQuality, onError, onCanPlay, adShown]);

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
    <div ref={containerRef} className="relative w-full h-full group">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white z-10">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 mx-auto border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm">Loading video...</p>
          </div>
        </div>
      )}
      
      {/* Quality Menu */}
      <div className="absolute top-4 left-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center space-x-2">
          <div className="bg-black/80 rounded px-2 py-1 flex items-center space-x-2">
            {connectionSpeed === 'slow' ? (
              <WifiOff className="h-4 w-4 text-red-400" />
            ) : (
              <Wifi className="h-4 w-4 text-green-400" />
            )}
            <span className="text-white text-xs">
              {connectionSpeed} connection
            </span>
          </div>
          
          <Select value={currentQuality} onValueChange={handleQualityChange}>
            <SelectTrigger className="w-20 h-8 bg-black/80 border-white/20 text-white text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {qualityOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Data Usage Indicator */}
      {dataUsage > 0 && (
        <div className="absolute bottom-4 left-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-black/80 text-white text-xs px-2 py-1 rounded">
            Data used: {dataUsage.toFixed(1)} MB
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
        preload="none"
      />
      
      {/* Main Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full"
        poster={poster}
        preload={getPreloadStrategy()}
        playsInline
        controls
        style={{ width: '100%', height: '100%', backgroundColor: '#000' }}
      >
        <source src={getQualityUrl(src, currentQuality)} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

declare global {
  interface Window {
    popMagic?: any;
    AdProvider?: any[];
  }
}

export default OptimizedVideoPlayer;
