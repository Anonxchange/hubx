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
}

const PremiumVideoPlayer: React.FC<PremiumVideoPlayerProps> = ({
  src,
  poster,
  title,
  isPremium = true,
  quality = "4K",
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { user } = useAuth();
  const { isPremium: hasPremiumSubscription, isLoading: premiumLoading, refreshSubscription } = usePremiumSubscription();
  const [initialized, setInitialized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  
  // Premium access control states
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [previewTimeReached, setPreviewTimeReached] = useState(false);
  const [timeLeft, setTimeLeft] = useState(84); // 1 minute 24 seconds
  const [showPreviewOverlay, setShowPreviewOverlay] = useState(false);
  
  const PREVIEW_TIME_LIMIT = 84; // 1 minute 24 seconds in seconds

  // Update duration display when premium status changes
  useEffect(() => {
    if (videoRef.current && initialized) {
      const video = videoRef.current;
      if (!hasPremiumSubscription && !premiumLoading) {
        setDuration(PREVIEW_TIME_LIMIT);
      } else if (video.duration) {
        setDuration(video.duration);
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
          // For non-premium users, show only preview duration (1:24)
          if (!hasPremiumSubscription && !premiumLoading) {
            setDuration(PREVIEW_TIME_LIMIT);
          } else {
            setDuration(video.duration);
          }
        });

        video.addEventListener("timeupdate", () => {
          const currentTime = video.currentTime;
          setCurrentTime(currentTime);
          
          // Check preview time limit for non-premium users
          if (!hasPremiumSubscription && !premiumLoading) {
            const remaining = Math.max(0, PREVIEW_TIME_LIMIT - currentTime);
            setTimeLeft(Math.ceil(remaining));
            
            // Show preview overlay when 10 seconds left
            if (remaining <= 10 && remaining > 0 && !showPreviewOverlay) {
              setShowPreviewOverlay(true);
            }
            
            // Enforce strict time limit - pause and show modal
            if (currentTime >= PREVIEW_TIME_LIMIT) {
              video.pause();
              video.currentTime = PREVIEW_TIME_LIMIT; // Force video back to limit
              setIsPlaying(false);
              setPreviewTimeReached(true);
              setShowPreviewOverlay(false);
              setShowSubscriptionModal(true);
            }
          }
        });

        video.addEventListener("play", () => {
          // Check if non-premium user is trying to play beyond preview time
          if (!hasPremiumSubscription && !premiumLoading && video.currentTime >= PREVIEW_TIME_LIMIT) {
            video.pause();
            video.currentTime = PREVIEW_TIME_LIMIT; // Reset to limit
            setIsPlaying(false);
            setPreviewTimeReached(true);
            setShowSubscriptionModal(true);
            return;
          }
          
          setIsPlaying(true);
        });

        // Prevent seeking beyond preview limit for non-premium users
        video.addEventListener("seeking", () => {
          if (!hasPremiumSubscription && !premiumLoading && video.currentTime >= PREVIEW_TIME_LIMIT) {
            video.currentTime = PREVIEW_TIME_LIMIT - 1;
            video.pause();
            setIsPlaying(false);
            setShowSubscriptionModal(true);
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
    refreshSubscription();
    // Allow continued playback
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  return (
    <div className="relative w-full">
      <video
        ref={videoRef}
        className="w-full aspect-video rounded-lg"
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
          display: "block",
          width: "100%",
          height: "auto",
          borderRadius: "0.5rem", // keep rounded clean
        }}
      >
        <source src={src} type="video/mp4" />
      </video>

      {/* Preview Time Indicator removed as requested */}

      {/* Premium Badge removed as requested */}

      {/* Preview Warning Overlay */}
      {showPreviewOverlay && !hasPremiumSubscription && !previewTimeReached && (
        <div className="absolute bottom-20 left-4 right-4 bg-gradient-to-r from-red-600/90 to-purple-600/90 backdrop-blur-sm text-white p-4 rounded-lg border border-yellow-400/50 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Crown className="w-6 h-6 text-yellow-400 animate-pulse" />
              <div>
                <h4 className="font-bold text-sm">Preview ending soon!</h4>
                <p className="text-xs text-gray-200">
                  {timeLeft} seconds left - Subscribe for unlimited access
                </p>
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

      {/* Preview Time Reached Overlay */}
      {previewTimeReached && !hasPremiumSubscription && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center rounded-lg">
          <div className="text-center text-white p-8 max-w-md">
            <div className="mb-6">
              <Lock className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Premium Content</h3>
              <p className="text-gray-300">
                You've watched the free preview ({formatTime(PREVIEW_TIME_LIMIT)}). 
                Upgrade to Premium to continue watching this full video and access unlimited content.
              </p>
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