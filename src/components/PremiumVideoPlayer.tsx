
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
    <video
      ref={videoRef}
      className="w-full aspect-video"
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
        display: "block",
        width: "100%",
        height: "auto",
      }}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
};

export default PremiumVideoPlayer;
