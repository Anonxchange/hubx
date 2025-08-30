import React, { useEffect, useRef, useState } from "react";
import { VideoIcon, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { trackVideoView } from "@/services/userStatsService";

declare global {
  interface Window {
    fluidPlayer: any;
  }
}

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, poster, title }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { user } = useAuth();
  const [initialized, setInitialized] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [currentQuality, setCurrentQuality] = useState('480p');
  const [availableQualities] = useState(['Auto', '1080p', '720p', '480p', '240p']);

  useEffect(() => {
    const initializeVideo = () => {
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
                  playbackRates: ["x0.5", "x0.75", "x1", "x1.25", "x1.5", "x1.75", "x2"],
                  controlBar: {
                    autoHide: true,
                    autoHideTimeout: 3,
                    animated: true,
                  },
                  primaryColor: "#ff6b35",
                  responsive: true,
                  theatre: true,
                  fullscreenEnabled: true,
                },
                vastOptions: {
                  adList: [
                    {
                      roll: "preRoll",
                      vastTag:
                        "https://syndication.exoclick.com/splash.php?idzone=5660526",
                      // Removed adText to disable custom banner
                    },
                  ],
                  skipButtonCaption: "Skip in [seconds]",
                  skipButtonClickCaption: "Skip >>",
                  showProgressbarMarkers: false,
                  allowVPAID: true,
                  maxAllowedVastTagRedirects: 3,
                  vastTimeout: 10000,
                  adCTAText: "Visit Site",
                  adCTATextPosition: "top left",
                  adClickable: true,
                  vastAdvanced: {
                    vastLoadedCallback: () => {
                      console.log("VAST ad loaded successfully");
                    },
                    vastErrorCallback: (error: any) => {
                      console.log(
                        "VAST ad error, proceeding to main video:",
                        error
                      );
                    },
                    noVastVideoCallback: () => {
                      console.log(
                        "No VAST ad available, playing main video directly"
                      );
                    },
                    adSkippedCallback: () => {
                      console.log("Ad was skipped, loading main video");
                    },
                    adStartedCallback: () => {
                      console.log("Ad playback started");
                    },
                  },
                  adFinishedCallback: () => {
                    console.log("Ad completed, main video starting");
                  },
                },
              });

              // Save instance for cleanup
              (video as any).fluidPlayerInstance = fluidPlayerInstance;
              console.log("FluidPlayer initialized successfully");
            } catch (error) {
              console.error("Error initializing FluidPlayer:", error);
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
              "Failed to load FluidPlayer script, using native player"
            );
            if (videoRef.current) videoRef.current.controls = true;
          };
          document.body.appendChild(script);
        } else if (window.fluidPlayer) {
          setTimeout(loadFluidPlayer, 300);
        }

        setInitialized(true);
      }
    };

    const timer = setTimeout(initializeVideo, 100);

    return () => {
      clearTimeout(timer);
      if (videoRef.current) {
        try {
          const player = videoRef.current as any;
          if (player.fluidPlayerInstance) {
            player.fluidPlayerInstance.destroy();
          }
        } catch (error) {
          console.log("Error cleaning up FluidPlayer:", error);
        }
      }
    };
  }, [src, poster]);

  // Track views
  const handlePlay = async () => {
    if (user) {
      await trackVideoView(user.id, src);
    }
  };

  const getVideoSrc = (quality: string) => {
    if (quality === 'Auto') return src;
    return src.replace(/\.mp4$/, `_${quality.toLowerCase()}.mp4`);
  };

  const handleQualityChange = (quality: string) => {
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      const isPlaying = !videoRef.current.paused;
      
      videoRef.current.src = getVideoSrc(quality);
      videoRef.current.currentTime = currentTime;
      
      if (isPlaying) {
        videoRef.current.play();
      }
    }
    setCurrentQuality(quality);
    setShowQualityMenu(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Responsive container */}
      <div
        className="relative w-full bg-black rounded-lg overflow-hidden group"
        style={{ aspectRatio: "16/9" }}
      >
        <video
          ref={videoRef}
          className="w-full h-full"
          poster={poster}
          preload="none"
          playsInline
          webkit-playsinline="true"
          crossOrigin="anonymous"
          onPlay={handlePlay}
          onError={(e) => {
            console.error("Video playbook error:", e.currentTarget.error);
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
        
        {/* Custom Quality Selector */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="relative">
            <button
              onClick={() => setShowQualityMenu(!showQualityMenu)}
              className="flex items-center gap-1 bg-black/70 text-white px-3 py-2 rounded-lg text-sm hover:bg-black/90 transition-colors backdrop-blur-sm"
              title="Quality Settings"
            >
              <Settings className="w-4 h-4" />
              <span>{currentQuality}</span>
            </button>
            
            {showQualityMenu && (
              <div className="absolute top-full mt-2 right-0 bg-black/90 backdrop-blur-sm rounded-lg border border-white/20 min-w-[120px] overflow-hidden z-50">
                {availableQualities.map((quality) => (
                  <button
                    key={quality}
                    onClick={() => handleQualityChange(quality)}
                    className={`w-full text-left px-4 py-2 text-sm text-white hover:bg-white/20 transition-colors ${
                      currentQuality === quality ? 'bg-orange-500/50' : ''
                    }`}
                  >
                    {quality}
                    {currentQuality === quality && (
                      <span className="float-right text-orange-400">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Video info */}
      {title && (
        <div className="flex justify-between items-center mt-3 px-2">
          <div className="flex items-center gap-2">
            <VideoIcon className="w-5 h-5 text-red-500" />
            <span className="font-medium text-foreground">{title}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer; 