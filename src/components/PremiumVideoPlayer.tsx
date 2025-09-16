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
import { AspectRatio } from "@/components/ui/aspect-ratio";

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

  // Detect VR content
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

  // 2-minute preview per video, 4-minute total limit
  const PREVIEW_DURATION = 120; // 120 seconds (2 minutes) per video preview
  const TOTAL_PREVIEW_LIMIT = 240; // 4 minutes total across all premium videos

  // Premium access control states
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [trailerEnded, setTrailerEnded] = useState(false);
  const [previewTimeLeft, setPreviewTimeLeft] = useState(PREVIEW_DURATION);
  const [previewStartTime, setPreviewStartTime] = useState(Date.now());
  const [totalPreviewUsed, setTotalPreviewUsed] = useState(0);
  const [modalShown, setModalShown] = useState(false);

  // Get total preview time used across all videos
  const getTotalPreviewUsed = (): number => {
    try {
      const stored = localStorage.getItem('totalPreviewUsed');
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  };

  // Save total preview time used
  const saveTotalPreviewUsed = (seconds: number) => {
    try {
      localStorage.setItem('totalPreviewUsed', seconds.toString());
      setTotalPreviewUsed(seconds);
    } catch {
      // Continue silently if localStorage fails
    }
  };

  // 1-minute preview timer with 5-second warning and global 4-minute limit
  const enforcePreviewLimit = () => {
    if (hasPremiumSubscription || trailerEnded) {
      return;
    }

    const now = Date.now();
    const elapsed = Math.floor((now - previewStartTime) / 1000);
    const currentTotalUsed = getTotalPreviewUsed();
    const timeLeft = Math.max(0, PREVIEW_DURATION - elapsed);
    const totalTimeLeft = Math.max(0, TOTAL_PREVIEW_LIMIT - currentTotalUsed - elapsed);
    
    setPreviewTimeLeft(timeLeft);

    // Check if total 4-minute limit is reached
    if (currentTotalUsed + elapsed >= TOTAL_PREVIEW_LIMIT) {
      const video = videoRef.current;
      if (video) {
        video.pause();
        setIsPlaying(false);
      }
      setTrailerEnded(true);
      saveTotalPreviewUsed(TOTAL_PREVIEW_LIMIT);
      console.log('4-minute total preview limit reached, video paused');
      return;
    }

    // If preview time is up for this video, pause and save progress
    if (elapsed >= PREVIEW_DURATION) {
      const video = videoRef.current;
      if (video) {
        video.pause();
        setIsPlaying(false);
      }
      setTrailerEnded(true);
      saveTotalPreviewUsed(currentTotalUsed + elapsed);
      console.log('1-minute preview completed, video paused');
    }
  };

  // Check VR support
  useEffect(() => {
    if (isVRContent) {
      if ('xr' in navigator || 
          'getVRDisplays' in navigator || 
          /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
          window.DeviceOrientationEvent) {
        setVrSupported(true);
      } else {
        setVrSupported(true);
      }
    }
  }, [isVRContent]);

  // Initialize total preview tracking
  useEffect(() => {
    // Reset localStorage for testing - remove this line in production
    localStorage.removeItem('totalPreviewUsed');
    
    const currentTotal = getTotalPreviewUsed();
    setTotalPreviewUsed(currentTotal);
    
    // If user has already used 4 minutes, just end the trailer (no auto-modal)
    if (!hasPremiumSubscription && currentTotal >= TOTAL_PREVIEW_LIMIT) {
      setTrailerEnded(true);
    }
  }, []);

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

  // Initialize Premium VR Scene
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

    // Setup Premium VR controls with trailer restrictions
    setTimeout(() => {
      const vrVideo = document.getElementById('premiumVrVideo') as HTMLVideoElement;
      const playPauseBtn = document.getElementById('vrPlayPause');

      if (vrVideo && playPauseBtn) {
        playPauseBtn.addEventListener('click', () => {
          // Only enforce restrictions for non-premium users
          if (!hasPremiumSubscription && !premiumLoading) {
            if (trailerEnded) {
              setShowSubscriptionModal(true);
              return;
            }
            // Apply restrictions for VR mode
            if (!hasPremiumSubscription) {
              enforcePreviewLimit();
            }
          }

          if (vrVideo.paused) {
            vrVideo.play().catch(console.error);
            playPauseBtn.setAttribute('text', 'value: PAUSE; color: white; align: center; position: 0 0 0.06');
          } else {
            vrVideo.pause();
            playPauseBtn.setAttribute('text', 'value: PLAY; color: white; align: center; position: 0 0 0.06');
          }
        });

        // Apply highlight scene restrictions in VR mode only for non-premium users
        if (!hasPremiumSubscription && !premiumLoading) {
          const vrPreviewInterval = setInterval(() => {
            if (!trailerEnded && !hasPremiumSubscription) {
              enforcePreviewLimit();
            }
          }, 1000);

          (vrVideo as any).vrPreviewInterval = vrPreviewInterval;
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

  useEffect(() => {
    const initializePremiumPlayer = () => {
      if (videoRef.current && !initialized) {
        const video = videoRef.current;

        // For non-premium users, set up trailer restrictions
        // Allow trailer setup even while premium loading to prevent blocking
        if (!hasPremiumSubscription) {
          // Remove default controls but allow video to load
          video.controls = false;
          
          // Safely add controlsList restrictions if supported
          try {
            const videoElement = video as any;
            if (videoElement.controlsList && typeof videoElement.controlsList.add === 'function') {
              videoElement.controlsList.add('nodownload', 'nofullscreen', 'noremoteplayback');
            }
          } catch (e) {
            console.log('controlsList not supported:', e);
          }

          // Set initial state for simple preview
          setTrailerEnded(false);
          setPreviewTimeLeft(PREVIEW_DURATION);
          setPreviewStartTime(Date.now());

          // Start from beginning of video
          const startPreview = () => {
            video.currentTime = 0; // Always start from beginning
            setPreviewStartTime(Date.now());
            console.log('Starting 1-minute preview from beginning');
            setTimeout(() => {
              if (!hasPremiumSubscription && !trailerEnded) {
                video.play().catch(console.error);
                setIsPlaying(true);
              }
            }, 100);
          };

          // Wait for video to be ready
          if (video.readyState >= 1) {
            startPreview();
          } else {
            video.addEventListener('loadedmetadata', startPreview, { once: true });
          }

          // Monitor preview timer every 1000ms
          const previewInterval = setInterval(() => {
            if (!hasPremiumSubscription && !trailerEnded) {
              enforcePreviewLimit();
            }
          }, 1000);

          // Disable context menu and keyboard shortcuts
          video.addEventListener('contextmenu', (e) => e.preventDefault());
          video.addEventListener('keydown', (e) => {
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'Home', 'End', 'f', 'F'].includes(e.key)) {
              e.preventDefault();
            }
          });

          // Store cleanup references
          (video as any).previewInterval = previewInterval;
        } else if (hasPremiumSubscription && !premiumLoading) {
          // Premium user - load full FluidPlayer
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
                    playbackRates: ["x0.25", "x0.5", "x0.75", "x1", "x1.25", "x1.5", "x1.75", "x2", "x2.25", "x2.5"],
                    controlBar: {
                      autoHide: true,
                      autoHideTimeout: 5,
                      animated: true,
                    },
                    theatre: true,
                    captions: true,
                    primaryColor: "#f59e0b",
                    responsive: true,
                  },
                });

                (video as any).fluidPlayerInstance = fluidPlayerInstance;
              } catch (error) {
                console.error("Error initializing Premium FluidPlayer:", error);
                video.controls = true;
              }
            }
          };

          if (!existingScript) {
            const script = document.createElement("script");
            script.src = "https://cdn.fluidplayer.com/v3/current/fluidplayer.min.js";
            script.async = true;
            script.onload = () => setTimeout(loadFluidPlayer, 300);
            script.onerror = () => {
              if (videoRef.current) videoRef.current.controls = true;
            };
            document.body.appendChild(script);
          } else if (window.fluidPlayer) {
            setTimeout(loadFluidPlayer, 300);
          }
        }

        // Common event listeners
        video.addEventListener("loadedmetadata", () => {
          if (!hasPremiumSubscription && !premiumLoading) {
            setDuration(PREVIEW_DURATION);
            // Start from beginning for simple preview
            video.currentTime = 0;
          } else {
            setDuration(video.duration);
          }
        });

        video.addEventListener("timeupdate", () => {
          setCurrentTime(video.currentTime);
        });

        video.addEventListener("play", () => setIsPlaying(true));
        video.addEventListener("pause", () => setIsPlaying(false));
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
          const video = videoRef.current as any;
          if (video.fluidPlayerInstance) {
            video.fluidPlayerInstance.destroy();
          }
          if (video.enforceInterval) {
            clearInterval(video.enforceInterval);
          }
          if (video.vrEnforceInterval) {
            clearInterval(video.vrEnforceInterval);
          }
        } catch (error) {
          console.log("Error cleaning up player:", error);
        }
      }
    };
  }, [src, poster, hasPremiumSubscription, premiumLoading]);

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
    setTrailerEnded(false);
    refreshSubscription();
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

      {/* YouTube-Style Premium Video Player with 16:9 Aspect Ratio */}
      <div className={vrMode ? 'hidden' : 'block'}>
        <AspectRatio ratio={16 / 9}>
          <video
            ref={(el) => {
              if (videoRef) {
                (videoRef as any).current = el;
              }
            }}
            src={src}
            className="w-full h-full rounded-lg"
            poster={poster}
            preload="metadata"
            playsInline
            webkit-playsinline="true"
            crossOrigin="anonymous"
            onPlay={handlePlay}
            onError={(e) => {
              console.error("Premium video playback error:", e.currentTarget.error);
              if (videoRef.current) videoRef.current.controls = true;
            }}
            style={{
              objectFit: "contain",
              backgroundColor: "#000",
              width: "100%",
              height: "100%",
            }}
          >
            <source src={src} type="video/mp4" />
          </video>
        </AspectRatio>
      </div>

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


      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />

      {/* Countdown Overlay - Shows during last 10 seconds */}
      {!hasPremiumSubscription && !trailerEnded && isPlaying && previewTimeLeft <= 10 && previewTimeLeft > 0 && (
        <div className="absolute top-4 right-4 bg-black/90 text-white px-3 py-2 rounded-lg flex items-center space-x-2 z-10">
          <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-black text-sm font-bold">
            {previewTimeLeft}
          </div>
          <span className="text-sm font-medium">
            Preview ends
          </span>
        </div>
      )}

      {/* Total Preview Time Left Warning */}
      {!hasPremiumSubscription && !trailerEnded && (getTotalPreviewUsed() + Math.floor((Date.now() - previewStartTime) / 1000)) >= (TOTAL_PREVIEW_LIMIT - 60) && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-red-600/95 text-white px-6 py-3 rounded-lg text-center z-10">
          <div className="flex items-center space-x-2 mb-1">
            <Crown className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-bold">Total Preview Limit Almost Reached</span>
          </div>
          <p className="text-xs">
            {Math.max(0, Math.floor((TOTAL_PREVIEW_LIMIT - getTotalPreviewUsed() - Math.floor((Date.now() - previewStartTime) / 1000)) / 60))} minutes remaining across all videos
          </p>
        </div>
      )}

      {/* Simple overlay when preview ends - just shows upgrade button */}
      {trailerEnded && !hasPremiumSubscription && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
          <button
            onClick={() => setShowSubscriptionModal(true)}
            className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-3 rounded-lg font-bold text-base transition-all flex items-center space-x-2"
          >
            <Crown className="w-5 h-5" />
            <span>Upgrade to Premium</span>
          </button>
        </div>
      )}


    </div>
  );
};

export default PremiumVideoPlayer;