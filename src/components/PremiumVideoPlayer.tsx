
import React, { useEffect, useRef, useState } from "react";
import { Crown, Star, Shield, Play, Pause, Volume2, VolumeX, Maximize, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { trackVideoView } from "@/services/userStatsService";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
  quality?: '4K' | '8K' | 'HD';
}

const PremiumVideoPlayer: React.FC<PremiumVideoPlayerProps> = ({ 
  src, 
  poster, 
  title, 
  isPremium = true,
  quality = '4K'
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { user } = useAuth();
  const [initialized, setInitialized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

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
                  playbackRates: ["x0.5", "x0.75", "x1", "x1.25", "x1.5", "x2"],
                  controlBar: {
                    autoHide: true,
                    autoHideTimeout: 4,
                  },
                  primaryColor: "#f59e0b", // Premium gold color
                  responsive: true,
                  logo: {
                    imageUrl: null,
                    position: 'top left',
                    clickUrl: null,
                    opacity: 0.8
                  }
                },
                vastOptions: {
                  adList: [
                    {
                      roll: "preRoll",
                      vastTag: "https://syndication.exoclick.com/splash.php?idzone=5660526",
                    },
                  ],
                  skipButtonCaption: "Skip Premium Ad in [seconds]",
                  skipButtonClickCaption: "Skip >>",
                  showProgressbarMarkers: false,
                  allowVPAID: true,
                  maxAllowedVastTagRedirects: 3,
                  vastTimeout: 8000, // Shorter timeout for premium
                  adCTAText: "Visit Premium Partner",
                  adCTATextPosition: "top right",
                  adClickable: true,
                  vastAdvanced: {
                    vastLoadedCallback: () => {
                      console.log("Premium VAST ad loaded successfully");
                    },
                    vastErrorCallback: (error: any) => {
                      console.log("Premium VAST ad error, proceeding to premium video:", error);
                    },
                    noVastVideoCallback: () => {
                      console.log("No premium ad available, playing premium video directly");
                    },
                    adSkippedCallback: () => {
                      console.log("Premium ad was skipped, loading premium video");
                    },
                    adStartedCallback: () => {
                      console.log("Premium ad playback started");
                    },
                  },
                  adFinishedCallback: () => {
                    console.log("Premium ad completed, premium video starting");
                  },
                },
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
          script.src = "https://cdn.fluidplayer.com/v3/current/fluidplayer.min.js";
          script.async = true;
          script.onload = () => setTimeout(loadFluidPlayer, 300);
          script.onerror = () => {
            console.error("Failed to load Premium FluidPlayer script, using native player");
            if (videoRef.current) videoRef.current.controls = true;
          };
          document.body.appendChild(script);
        } else if (window.fluidPlayer) {
          setTimeout(loadFluidPlayer, 300);
        }

        // Add event listeners for premium features
        video.addEventListener('loadedmetadata', () => {
          setDuration(video.duration);
        });

        video.addEventListener('timeupdate', () => {
          setCurrentTime(video.currentTime);
        });

        video.addEventListener('play', () => {
          setIsPlaying(true);
        });

        video.addEventListener('pause', () => {
          setIsPlaying(false);
        });

        video.addEventListener('volumechange', () => {
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
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Premium Player Container */}
      <div className="relative w-full bg-gradient-to-br from-black via-purple-900/20 to-black rounded-xl overflow-hidden border border-yellow-500/30 shadow-2xl shadow-yellow-500/20">
        {/* Premium Header Overlay */}
        <div className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-b from-black/80 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold px-3 py-1">
                <Crown className="w-4 h-4 mr-1" />
                PREMIUM
              </Badge>
              <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold px-2 py-1">
                {quality}
              </Badge>
              <Badge className="bg-green-600/80 text-white font-medium px-2 py-1">
                <Shield className="w-3 h-3 mr-1" />
                AD-FREE
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-400 font-semibold text-sm">VIP QUALITY</span>
            </div>
          </div>
        </div>

        {/* Video Container */}
        <div 
          className="relative w-full bg-black"
          style={{ aspectRatio: "16/9" }}
        >
          {/* Premium Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-purple-500/10 to-orange-500/5 z-10 pointer-events-none"></div>
          
          <video
            ref={videoRef}
            className="w-full h-full"
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
              display: "block",
              maxWidth: "100%",
              maxHeight: "100%",
            }}
          >
            <source src={src} type="video/mp4" />
          </video>

          {/* Premium Corner Watermark */}
          <div className="absolute bottom-4 right-4 z-20 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-sm rounded-lg px-3 py-1 border border-yellow-500/30">
            <div className="flex items-center space-x-1">
              <Crown className="w-3 h-3 text-yellow-400" />
              <span className="text-yellow-400 text-xs font-bold">PREMIUM</span>
            </div>
          </div>
        </div>

        {/* Premium Status Bar */}
        <div className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/90 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-white">
              <div className="flex items-center space-x-2">
                <Crown className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium">Premium Exclusive</span>
              </div>
              <div className="w-1 h-4 bg-yellow-500/50 rounded-full"></div>
              <span className="text-xs text-gray-300">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-400 font-medium">LIVE QUALITY</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Video Info */}
      {title && (
        <div className="mt-4 p-4 bg-gradient-to-r from-black/50 to-purple-900/20 rounded-lg border border-purple-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Crown className="w-6 h-6 text-yellow-400" />
              <div>
                <h3 className="font-bold text-white text-lg">{title}</h3>
                <p className="text-sm text-gray-300">Premium {quality} Quality • Ad-Free Experience</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold">
                <Star className="w-3 h-3 mr-1" />
                VIP
              </Badge>
              <Badge className="bg-purple-600/80 text-white">
                {quality} Ultra HD
              </Badge>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PremiumVideoPlayer;
