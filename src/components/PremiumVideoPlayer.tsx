import React, { useEffect, useRef, useState } from "react";
import {
  Crown,
  Star,
  Shield,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  Lock,
  Eye,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { trackVideoView } from "@/services/userStatsService";
import { usePremiumSubscription } from "@/hooks/usePremiumSubscription";
import SubscriptionModal from "@/components/SubscriptionModal";

declare global {
  interface Window {
    fluidPlayer: any;
  }
}

interface PremiumVideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  isPremium?: boolean;
  quality?: "4K" | "8K" | "HD";
  tags?: string[];
  isVR?: boolean;
}

const PremiumVideoPlayer: React.FC<PremiumVideoPlayerProps> = ({
  src,
  poster,
  title,
  isPremium = true,
  quality = "4K",
  tags,
  isVR,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const vrSceneRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { isPremium: hasPremiumSubscription, isLoading: premiumLoading, refreshSubscription } = usePremiumSubscription();
  const [initialized, setInitialized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  
  // VR states
  const [vrMode, setVrMode] = useState(false);
  const [vrSupported, setVrSupported] = useState(false);

  // Detect VR content - more comprehensive detection
  const isVRContent = isVR || (tags && tags.some(tag => {
    const tagLower = tag.toLowerCase();
    return tagLower.includes('vr') || 
           tagLower.includes('virtual reality') || 
           tagLower.includes('360') ||
           tagLower.includes('virtual') ||
           tagLower.includes('vr porn') ||
           tagLower.includes('vr bangers') ||
           tagLower.includes('oculus') ||
           tagLower.includes('headset');
  })) || (title && (
    title.toLowerCase().includes('vr') ||
    title.toLowerCase().includes('virtual reality') ||
    title.toLowerCase().includes('360')
  ));
  
  // Premium access control states
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [previewTimeReached, setPreviewTimeReached] = useState(false);
  const [timeLeft, setTimeLeft] = useState(84); // 1 minute 24 seconds
  const [showPreviewOverlay, setShowPreviewOverlay] = useState(false);
  
  // Trailer mode states
  const [currentTrailerSegment, setCurrentTrailerSegment] = useState(0);
  const [trailerEnded, setTrailerEnded] = useState(false);
  
  const PREVIEW_TIME_LIMIT = 84; // 1 minute 24 seconds in seconds
  
  // Define trailer segments (start and end times in seconds)
  const TRAILER_SEGMENTS = [
    { start: 0, end: 20 },      // 0:00-0:20
    { start: 300, end: 320 },   // 5:00-5:20  
    { start: 720, end: 740 },   // 12:00-12:20
    { start: 1080, end: 1100 }  // 18:00-18:20
  ];

  // Check VR support
  useEffect(() => {
    if (isVRContent) {
      // Check for WebXR, basic VR support, or mobile device
      if ('xr' in navigator || 
          'getVRDisplays' in navigator || 
          /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
          window.DeviceOrientationEvent) {
        setVrSupported(true);
      } else {
        // Always enable VR for VR content even without specific VR hardware
        setVrSupported(true);
      }
    }
  }, [isVRContent]);

  // Load A-Frame for Premium VR
  const loadAFrame = () => {
    return new Promise((resolve) => {
      if (document.querySelector('script[src*="aframe"]')) {
        resolve(true);
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://aframe.io/releases/1.4.0/aframe.min.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  };

  // Initialize Premium VR Scene with enhanced features
  const initializePremiumVRScene = async () => {
    if (!vrSceneRef.current) return;
    
    await loadAFrame();
    
    vrSceneRef.current.innerHTML = `
      <a-scene embedded style="height: 100%; width: 100%;" vr-mode-ui="enabled: true">
        <a-assets>
          <video id="premiumVrVideo" crossorigin="anonymous" playsinline webkit-playsinline>
            <source src="${src}" type="video/mp4">
          </video>
        </a-assets>
        
        <a-videosphere src="#premiumVrVideo" rotation="0 180 0"></a-videosphere>
        
        <a-entity id="cameraWrapper" position="0 1.6 0">
          <a-camera look-controls wasd-controls fov="90">
            <a-cursor
              animation__click="property: scale; startEvents: click; from: 0.1 0.1 0.1; to: 1 1 1; dur: 150"
              animation__fusing="property: scale; startEvents: fusing; from: 1 1 1; to: 0.1 0.1 0.1; dur: 1500"
              raycaster="objects: .clickable"
              geometry="primitive: ring; radiusInner: 0.02; radiusOuter: 0.03"
              material="color: #f59e0b; shader: flat">
            </a-cursor>
          </a-camera>
        </a-entity>
        
        <!-- Premium VR Controls Panel -->
        <a-entity id="premiumVrControls" position="0 1.2 -2">
          <a-box class="clickable" id="vrPlayPause" position="-0.8 0 0" width="0.3" height="0.1" depth="0.1" 
                 color="#f59e0b" text="value: PLAY; color: white; align: center; position: 0 0 0.06"></a-box>
          <a-box class="clickable" id="vrQuality" position="0 0 0" width="0.4" height="0.1" depth="0.1" 
                 color="#8B5CF6" text="value: ${quality}; color: white; align: center; position: 0 0 0.06"></a-box>
          <a-box class="clickable" id="vrVolume" position="0.8 0 0" width="0.3" height="0.1" depth="0.1" 
                 color="#10B981" text="value: VOL; color: white; align: center; position: 0 0 0.06"></a-box>
        </a-entity>
        
        <!-- Premium Badge in VR -->
        <a-text value="👑 PREMIUM VR" position="-1 2.5 -1.5" color="#f59e0b" 
                geometry="primitive: plane; width: 2; height: 0.5" 
                material="color: rgba(0,0,0,0.7)"></a-text>
        
        <a-sky color="#1a1a1a"></a-sky>
      </a-scene>
    `;

    // Setup Premium VR controls
    setTimeout(() => {
      const vrVideo = document.getElementById('premiumVrVideo') as HTMLVideoElement;
      const playPauseBtn = document.getElementById('vrPlayPause');
      
      if (vrVideo && playPauseBtn) {
        playPauseBtn.addEventListener('click', () => {
          if (vrVideo.paused) {
            vrVideo.play();
            playPauseBtn.setAttribute('text', 'value: PAUSE; color: white; align: center; position: 0 0 0.06');
          } else {
            vrVideo.pause();
            playPauseBtn.setAttribute('text', 'value: PLAY; color: white; align: center; position: 0 0 0.06');
          }
        });

        // Apply trailer restrictions in VR mode too
        if (!hasPremiumSubscription && !premiumLoading) {
          vrVideo.addEventListener('timeupdate', () => {
            const currentSegment = TRAILER_SEGMENTS[currentTrailerSegment];
            
            if (currentSegment && vrVideo.currentTime >= currentSegment.end) {
              vrVideo.pause();
              
              if (currentTrailerSegment < TRAILER_SEGMENTS.length - 1) {
                const nextSegment = currentTrailerSegment + 1;
                setCurrentTrailerSegment(nextSegment);
                vrVideo.currentTime = TRAILER_SEGMENTS[nextSegment].start;
                setTimeout(() => vrVideo.play(), 2000);
              } else {
                setTrailerEnded(true);
                setVrMode(false);
                setShowSubscriptionModal(true);
              }
            }
          });
        }
      }
    }, 1000);
  };

  const toggleVRMode = async () => {
    if (!vrMode) {
      setVrMode(true);
      await initializePremiumVRScene();
    } else {
      setVrMode(false);
    }
  };

  // Update duration display when premium status changes
  useEffect(() => {
    if (videoRef.current && initialized) {
      const video = videoRef.current;
      if (!hasPremiumSubscription && !premiumLoading) {
        // Calculate total trailer duration
        const totalTrailerDuration = TRAILER_SEGMENTS.reduce((total, segment) => {
          return total + (segment.end - segment.start);
        }, 0);
        setDuration(totalTrailerDuration);
      } else if (video.duration) {
        // Restore original duration for premium users
        setDuration(video.duration || 0);
      }
    }
  }, [hasPremiumSubscription, premiumLoading, initialized]);

  useEffect(() => {
    const initializePremiumPlayer = () => {
      if (videoRef.current && !initialized) {
        const video = videoRef.current;

        // Load FluidPlayer script if not already loaded
        const existingScript = document.querySelector<HTMLScriptElement>(
          "script[src='https://cdn.fluidplayer.com/v3/current/fluidplayer.min.js']"
        );

        const loadFluidPlayer = () => {
          if (window.fluidPlayer && videoRef.current) {
            try {
              const fluidPlayerInstance = window.fluidPlayer(video, {
                layoutControls: {
                  autoPlay: false,
                  mute: false,
                  fillToContainer: true,
                  playButtonShowing: true,
                  posterImage: poster || "",
                  allowDownload: false,
                  keyboardControl: true,
                  playbackRates: [
                    "x0.25",
                    "x0.5",
                    "x0.75",
                    "x1",
                    "x1.25",
                    "x1.5",
                    "x1.75",
                    "x2",
                    "x2.25",
                    "x2.5",
                  ],
                  controlBar: {
                    autoHide: true,
                    autoHideTimeout: 5,
                    animated: true,
                  },
                  theatre: true,
                  captions: true,
                  primaryColor: "#f59e0b", // Premium gold color
                  responsive: true,
                  logo: {
                    imageUrl: null,
                    position: "top right",
                    clickUrl: null,
                    opacity: 0.8,
                  },
                },
                // Premium = ad-free experience
              });

              // Save instance for cleanup
              (video as any).fluidPlayerInstance = fluidPlayerInstance;
              console.log("Premium FluidPlayer initialized successfully");
            } catch (error) {
              console.error("Error initializing Premium FluidPlayer:", error);
              video.controls = true;
            }
          }
        };

        if (!existingScript) {
          const script = document.createElement("script");
          script.src =
            "https://cdn.fluidplayer.com/v3/current/fluidplayer.min.js";
          script.async = true;
          script.onload = () => setTimeout(loadFluidPlayer, 300);
          script.onerror = () => {
            console.error(
              "Failed to load Premium FluidPlayer script, using native player"
            );
            if (videoRef.current) videoRef.current.controls = true;
          };
          document.body.appendChild(script);
        } else if (window.fluidPlayer) {
          setTimeout(loadFluidPlayer, 300);
        }

        // Add event listeners for premium features
        video.addEventListener("loadedmetadata", () => {
          if (!hasPremiumSubscription && !premiumLoading) {
            // Calculate total trailer duration
            const totalTrailerDuration = TRAILER_SEGMENTS.reduce((total, segment) => {
              return total + (segment.end - segment.start);
            }, 0);
            setDuration(totalTrailerDuration);
            
            // Start at first trailer segment
            video.currentTime = TRAILER_SEGMENTS[0].start;
          } else {
            setDuration(video.duration);
          }
        });

        video.addEventListener("timeupdate", () => {
          const currentTime = video.currentTime;
          setCurrentTime(currentTime);
          
          // Handle trailer segments for non-premium users
          if (!hasPremiumSubscription && !premiumLoading && !trailerEnded) {
            const currentSegment = TRAILER_SEGMENTS[currentTrailerSegment];
            
            if (currentSegment) {
              // Force user back to segment bounds if they're outside
              if (currentTime < currentSegment.start || currentTime >= currentSegment.end) {
                video.pause();
                setIsPlaying(false);
                
                // If we've exceeded the current segment, move to next
                if (currentTime >= currentSegment.end) {
                  if (currentTrailerSegment < TRAILER_SEGMENTS.length - 1) {
                    const nextSegmentIndex = currentTrailerSegment + 1;
                    setCurrentTrailerSegment(nextSegmentIndex);
                    setShowPreviewOverlay(true);
                    
                    setTimeout(() => {
                      if (videoRef.current && !trailerEnded) {
                        videoRef.current.currentTime = TRAILER_SEGMENTS[nextSegmentIndex].start;
                        setShowPreviewOverlay(false);
                        videoRef.current.play();
                        setIsPlaying(true);
                      }
                    }, 2000);
                  } else {
                    // All segments watched
                    setTrailerEnded(true);
                    setShowSubscriptionModal(true);
                  }
                } else {
                  // User went backwards, jump to current segment start
                  video.currentTime = currentSegment.start;
                }
                return;
              }
              
              // Calculate time left in current segment
              const segmentTimeLeft = Math.max(0, currentSegment.end - currentTime);
              setTimeLeft(Math.ceil(segmentTimeLeft));
              
              // Show preview overlay when approaching end
              if (segmentTimeLeft <= 5 && segmentTimeLeft > 0 && !showPreviewOverlay && currentTrailerSegment < TRAILER_SEGMENTS.length - 1) {
                setShowPreviewOverlay(true);
              }
            }
          }
        });

        video.addEventListener("play", () => {
          // Check trailer segments for non-premium users
          if (!hasPremiumSubscription && !premiumLoading) {
            if (trailerEnded) {
              video.pause();
              setIsPlaying(false);
              setShowSubscriptionModal(true);
              return;
            }
            
            const currentSegment = TRAILER_SEGMENTS[currentTrailerSegment];
            if (currentSegment) {
              // Force to segment start if outside bounds
              if (video.currentTime < currentSegment.start || video.currentTime >= currentSegment.end) {
                video.pause();
                video.currentTime = currentSegment.start;
                setTimeout(() => {
                  if (videoRef.current && !trailerEnded) {
                    videoRef.current.play();
                  }
                }, 100);
                return;
              }
            }
          }
          
          setIsPlaying(true);
        });

        // Prevent seeking outside trailer segments for non-premium users
        video.addEventListener("seeking", () => {
          if (!hasPremiumSubscription && !premiumLoading && !trailerEnded) {
            const currentSegment = TRAILER_SEGMENTS[currentTrailerSegment];
            
            if (currentSegment && (video.currentTime < currentSegment.start || video.currentTime >= currentSegment.end)) {
              // Immediately correct the seek position
              video.currentTime = currentSegment.start;
            }
          }
        });

        video.addEventListener("seeked", () => {
          if (!hasPremiumSubscription && !premiumLoading && !trailerEnded) {
            const currentSegment = TRAILER_SEGMENTS[currentTrailerSegment];
            
            if (currentSegment && (video.currentTime < currentSegment.start || video.currentTime >= currentSegment.end)) {
              video.pause();
              video.currentTime = currentSegment.start;
              setIsPlaying(false);
              
              // Show warning that seeking is restricted
              setShowPreviewOverlay(true);
              setTimeout(() => setShowPreviewOverlay(false), 2000);
            }
          }
        });

        // Additional security: prevent any attempts to play outside segments
        video.addEventListener("canplay", () => {
          if (!hasPremiumSubscription && !premiumLoading && !trailerEnded) {
            const currentSegment = TRAILER_SEGMENTS[currentTrailerSegment];
            
            if (currentSegment && (video.currentTime < currentSegment.start || video.currentTime >= currentSegment.end)) {
              video.currentTime = currentSegment.start;
            }
          }
        });

        // Set initial trailer segment for non-premium users
        video.addEventListener("loadstart", () => {
          if (!hasPremiumSubscription && !premiumLoading) {
            setCurrentTrailerSegment(0);
            setTrailerEnded(false);
          }
        });

        // Force initial position after metadata loads
        video.addEventListener("loadeddata", () => {
          if (!hasPremiumSubscription && !premiumLoading) {
            video.currentTime = TRAILER_SEGMENTS[0].start;
          }
        });

        video.addEventListener("pause", () => {
          setIsPlaying(false);
        });

        video.addEventListener("volumechange", () => {
          setIsMuted(video.muted);
          setVolume(video.volume);
        });

        setInitialized(true);
      }
    };

    const timer = setTimeout(initializePremiumPlayer, 100);

    return () => {
      clearTimeout(timer);
      if (videoRef.current) {
        try {
          const player = videoRef.current as any;
          if (player.fluidPlayerInstance) {
            player.fluidPlayerInstance.destroy();
          }
        } catch (error) {
          console.log("Error cleaning up Premium FluidPlayer:", error);
        }
      }
    };
  }, [src, poster]);

  // Track premium views
  const handlePlay = async () => {
    if (user) {
      await trackVideoView(user.id, src);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const formatTimeLeft = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleSubscriptionSuccess = () => {
    setShowSubscriptionModal(false);
    setPreviewTimeReached(false);
    setTrailerEnded(false);
    setCurrentTrailerSegment(0);
    refreshSubscription();
    // Allow continued playback
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  return (
    <div className="relative w-full">
      {/* Premium VR Controls */}
      {isVRContent && vrSupported && (
        <div className="mb-3 p-3 bg-gradient-to-r from-purple-900/20 to-gold-900/20 rounded-lg border border-yellow-400/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown className="w-5 h-5 text-yellow-400" />
              <div>
                <span className="text-sm font-bold text-yellow-400">Premium VR Experience</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">🥽 VR</span>
                  <span className="text-xs bg-gold-100 text-gold-800 px-2 py-1 rounded">{quality}</span>
                  {tags?.includes('360') && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">360°</span>}
                </div>
              </div>
            </div>
            <button
              onClick={toggleVRMode}
              className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center space-x-2 ${
                vrMode 
                  ? 'bg-purple-600 text-white hover:bg-purple-700' 
                  : 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black hover:from-yellow-600 hover:to-yellow-700'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>{vrMode ? 'Exit VR' : 'Enter VR'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Regular Premium Video Player */}
      <video
        ref={videoRef}
        className={`w-full aspect-video rounded-lg ${vrMode ? 'hidden' : 'block'}`}
        poster={poster}
        preload="metadata"
        playsInline
        webkit-playsinline="true"
        crossOrigin="anonymous"
        onPlay={handlePlay}
        onError={(e) => {
          console.error(
            "Premium video playback error:",
            e.currentTarget.error
          );
          if (videoRef.current) videoRef.current.controls = true;
        }}
        style={{
          objectFit: "cover",
          backgroundColor: "#000",
          display: vrMode ? "none" : "block",
          width: "100%",
          height: "auto",
          borderRadius: "0.5rem",
        }}
      >
        <source src={src} type="video/mp4" />
      </video>

      {/* Premium VR Scene Container */}
      {vrMode && (
        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
          <div 
            ref={vrSceneRef}
            className="w-full h-full"
          />
          
          {/* Premium VR Mode Overlay */}
          <div className="absolute top-4 left-4 bg-gradient-to-r from-yellow-500/90 to-orange-500/90 text-black p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              <div>
                <p className="font-bold text-sm">Premium VR Active</p>
                <p className="text-xs opacity-80">
                  {quality} Quality • Use mouse/touch to look around
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Time Indicator removed as requested */}

      {/* Premium Badge removed as requested */}

      {/* Trailer Segment Overlay */}
      {showPreviewOverlay && !hasPremiumSubscription && !trailerEnded && (
        <div className="absolute bottom-20 left-4 right-4 bg-gradient-to-r from-blue-600/90 to-purple-600/90 backdrop-blur-sm text-white p-4 rounded-lg border border-yellow-400/50 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Crown className="w-6 h-6 text-yellow-400 animate-pulse" />
              <div>
                {currentTrailerSegment < TRAILER_SEGMENTS.length - 1 ? (
                  <>
                    <h4 className="font-bold text-sm">Trailer segment ending!</h4>
                    <p className="text-xs text-gray-200">
                      Next preview starts in {timeLeft} seconds
                    </p>
                  </>
                ) : (
                  <>
                    <h4 className="font-bold text-sm">Final trailer segment!</h4>
                    <p className="text-xs text-gray-200">
                      {timeLeft} seconds left - Subscribe for full video
                    </p>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowSubscriptionModal(true)}
              className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg font-bold text-sm transition-all transform hover:scale-105"
            >
              Subscribe Now
            </button>
          </div>
        </div>
      )}

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onSubscriptionSuccess={handleSubscriptionSuccess}
      />

      {/* Trailer Ended Overlay */}
      {trailerEnded && !hasPremiumSubscription && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center rounded-lg">
          <div className="text-center text-white p-8 max-w-md">
            <div className="mb-6">
              <Lock className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Trailer Completed</h3>
              <p className="text-gray-300">
                You've watched all trailer segments ({TRAILER_SEGMENTS.length} clips). 
                Upgrade to Premium to watch the full video and access unlimited content.
              </p>
              <div className="mt-4 text-sm text-gray-400">
                Trailer segments: 0:00-0:20, 5:00-5:20, 12:00-12:20, 18:00-18:20
              </div>
            </div>
            <button
              onClick={() => setShowSubscriptionModal(true)}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black px-8 py-3 rounded-lg font-bold text-lg hover:from-yellow-600 hover:to-yellow-700 transition-all flex items-center space-x-2 mx-auto"
            >
              <Crown className="w-5 h-5" />
              <span>Get Premium Access</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PremiumVideoPlayer;