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

  // Premium access control states
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [currentTrailerSegment, setCurrentTrailerSegment] = useState(0);
  const [trailerEnded, setTrailerEnded] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);

  // Define trailer segments (start and end times in seconds)
  const TRAILER_SEGMENTS = [
    { start: 0, end: 20 },      // 0:00-0:20
    { start: 300, end: 320 },   // 5:00-5:20  
    { start: 720, end: 740 },   // 12:00-12:20
    { start: 1080, end: 1100 }  // 18:00-18:20
  ];

  // Trailer enforcement system for non-premium users
  const enforceTrailerRestrictions = (video: HTMLVideoElement) => {
    // Only skip enforcement if user has confirmed premium subscription
    if (hasPremiumSubscription) {
      return;
    }

    const currentSegment = TRAILER_SEGMENTS[currentTrailerSegment];
    const currentTime = video.currentTime;

    // If trailer ended, show modal and prevent playback
    if (trailerEnded) {
      video.pause();
      setIsPlaying(false);
      setShowSubscriptionModal(true);
      return;
    }

    // Only enforce if we have a valid current segment
    if (!currentSegment) return;

    // If we've exceeded the current segment end time
    if (currentTime >= currentSegment.end) {
      video.pause();
      setIsPlaying(false);

      // Move to next segment or end trailer
      if (currentTrailerSegment < TRAILER_SEGMENTS.length - 1) {
        const nextSegmentIndex = currentTrailerSegment + 1;
        const nextSegment = TRAILER_SEGMENTS[nextSegmentIndex];
        
        setCurrentTrailerSegment(nextSegmentIndex);
        
        // Jump to next segment start and immediately play
        video.currentTime = nextSegment.start;
        
        // Small delay to let video seek, then auto-play next segment
        setTimeout(() => {
          if (!trailerEnded && videoRef.current && !hasPremiumSubscription) {
            videoRef.current.play().catch(console.error);
            setIsPlaying(true);
          }
        }, 200);
      } else {
        // No more segments, end trailer
        setTrailerEnded(true);
        setShowSubscriptionModal(true);
      }
    } 
    // If user seeks before segment start, force back to start
    else if (currentTime < currentSegment.start) {
      video.currentTime = currentSegment.start;
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
            // Apply restrictions but don't prevent play if within segment
            enforceTrailerRestrictions(vrVideo);
          }

          if (vrVideo.paused) {
            vrVideo.play().catch(console.error);
            playPauseBtn.setAttribute('text', 'value: PAUSE; color: white; align: center; position: 0 0 0.06');
          } else {
            vrVideo.pause();
            playPauseBtn.setAttribute('text', 'value: PLAY; color: white; align: center; position: 0 0 0.06');
          }
        });

        // Apply trailer restrictions in VR mode only for non-premium users
        if (!hasPremiumSubscription && !premiumLoading) {
          const vrEnforceInterval = setInterval(() => {
            if (!trailerEnded && !hasPremiumSubscription) {
              enforceTrailerRestrictions(vrVideo);
            }
          }, 1000);

          (vrVideo as any).vrEnforceInterval = vrEnforceInterval;
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
          if (video.controlsList && typeof video.controlsList.add === 'function') {
            try {
              video.controlsList.add('nodownload', 'nofullscreen', 'noremoteplayback');
            } catch (e) {
              console.log('controlsList not supported:', e);
            }
          }

          // Set initial state
          setCurrentTrailerSegment(0);
          setTrailerEnded(false);

          // Wait for video to load before setting time and auto-playing
          if (video.readyState >= 1) {
            video.currentTime = TRAILER_SEGMENTS[0].start;
            // Auto-play the first trailer segment quickly
            setTimeout(() => {
              if (!hasPremiumSubscription) {
                video.play().catch(console.error);
              }
            }, 100);
          } else {
            video.addEventListener('loadedmetadata', () => {
              video.currentTime = TRAILER_SEGMENTS[0].start;
              // Auto-play the first trailer segment after metadata loads
              setTimeout(() => {
                if (!hasPremiumSubscription) {
                  video.play().catch(console.error);
                }
              }, 100);
            }, { once: true });
          }

          // Monitor video time every 1000ms (less aggressive)
          const enforceInterval = setInterval(() => {
            if (video && !video.paused && !trailerEnded && !hasPremiumSubscription) {
              enforceTrailerRestrictions(video);
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
          (video as any).enforceInterval = enforceInterval;
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
            const totalTrailerDuration = TRAILER_SEGMENTS.reduce((total, segment) => {
              return total + (segment.end - segment.start);
            }, 0);
            setDuration(totalTrailerDuration);
            // Set to first segment start after metadata loads
            video.currentTime = TRAILER_SEGMENTS[0].start;
          } else {
            setDuration(video.duration);
          }
        });

        video.addEventListener("timeupdate", () => {
          setCurrentTime(video.currentTime);

          // Only apply trailer logic for non-premium users
          if (!hasPremiumSubscription && !premiumLoading) {
            const currentSegment = TRAILER_SEGMENTS[currentTrailerSegment];
            if (currentSegment) {
              const segmentTimeLeft = Math.max(0, currentSegment.end - video.currentTime);
              setTimeLeft(Math.ceil(segmentTimeLeft));
            }
          }
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
    setCurrentTrailerSegment(0);
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

      {/* Regular Premium Video Player */}
      <video
        ref={videoRef}
        src={src}
        className={`w-full aspect-video rounded-lg ${vrMode ? 'hidden' : 'block'}`}
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

      {/* Non-Premium Status Bar */}
      {!hasPremiumSubscription && !trailerEnded && (
        <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-sm text-white p-3 rounded-lg border border-yellow-400/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Lock className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="font-semibold text-sm">Trailer Mode</p>
                <p className="text-xs text-gray-300">
                  Segment {currentTrailerSegment + 1} of {TRAILER_SEGMENTS.length} • {formatTimeLeft(timeLeft)} left
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowSubscriptionModal(true)}
              className="bg-yellow-500 hover:bg-yellow-600 text-black px-3 py-1.5 rounded font-bold text-xs transition-all"
            >
              Upgrade
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PremiumVideoPlayer;