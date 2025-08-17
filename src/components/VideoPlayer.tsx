import React, { useEffect, useRef, useState } from "react";
import { VideoIcon } from "lucide-react";
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

  useEffect(() => {
    const initializeVideo = () => {
      if (videoRef.current && !initialized) {
        const video = videoRef.current;

        // Try to load FluidPlayer
        const existingScript = document.querySelector<HTMLScriptElement>(
          "script[src='https://cdn.fluidplayer.com/v3/current/fluidplayer.min.js']"
        );

        const loadFluidPlayer = () => {
          if (window.fluidPlayer && videoRef.current) {
            try {
              // Initialize FluidPlayer
              const fluidPlayerInstance = window.fluidPlayer(video, {
                layoutControls: {
                  autoPlay: false,
                  mute: false,
                  fillToContainer: true,
                  playButtonShowing: true,
                  posterImage: poster || "",
                  allowDownload: false,
                  keyboardControl: true,
                  playbackRates: ["x0.5", "x1", "x1.25", "x1.5", "x2"],
                  controlBar: {
                    autoHide: true,
                    autoHideTimeout: 3,
                  },
                  primaryColor: "#ff6b35",
                  responsive: true,
                },
                vastOptions: {
                  adList: [
                    {
                      roll: "preRoll",
                      vastTag:
                        "https://syndication.exoclick.com/splash.php?idzone=5660526",
                      adText: "Advertisement",
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
              // fallback to native
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

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Responsive container */}
      <div
        className="relative w-full bg-black rounded-lg overflow-hidden"
        style={{ aspectRatio: "16/9" }}
      >
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
            console.error("Video playback error:", e.currentTarget.error);
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
          {/* ✅ Let FluidPlayer pick up the source from here */}
          <source src={src} type="video/mp4" />
        </video>
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