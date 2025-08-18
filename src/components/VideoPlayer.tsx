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
  onError?: () => void; // Callback for errors
  onCanPlay?: () => void; // Callback when video can play
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, poster, title, onError, onCanPlay }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { user } = useAuth();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let fluidPlayerInstance: any = null;

    const initFluidPlayer = () => {
      if (!window.fluidPlayer || initialized || !videoRef.current) return;

      const video = videoRef.current;

      try {
        // Validate video source URL
        if (!src || src.trim() === '') {
          console.error("Invalid video source URL");
          video.controls = true;
          onError?.();
          return;
        }

        video.src = src;

        fluidPlayerInstance = window.fluidPlayer(video, {
          layoutControls: {
            fillToContainer: true,
            autoPlay: false,
            mute: false,
            allowDownload: false,
            playbackRates: ["x0.5", "x1", "x1.25", "x1.5", "x2"],
            primaryColor: "#3b82f6",
            posterImage: poster || "",
            loop: false,
            logo: {
              imageUrl: null,
              position: "top left",
              clickUrl: null,
              opacity: 0.8,
            },
            playButtonShowing: true,
            keyboardControl: true,
            controlBar: {
              autoHide: true,
              autoHideTimeout: 3,
            },
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
                // Ensure main video plays even if ads fail
                if (video) {
                  video.load();
                }
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

        // Add error event listeners
        video.addEventListener('error', (e) => {
          console.error("Video error event:", e);
          onError?.();
        });

        video.addEventListener('canplay', () => {
          console.log("Video can play event");
          onCanPlay?.();
        });

        video.addEventListener('loadstart', () => {
          console.log("Video load start event");
        });

        setInitialized(true);
        console.log("FluidPlayer initialized successfully");
      } catch (error) {
        console.error("FluidPlayer initialization failed:", error);
        video.controls = true;
        onError?.();
      }
    };

    const initializeVideo = () => {
      if (!videoRef.current) return;
      const video = videoRef.current;

      const existingScript = document.querySelector<HTMLScriptElement>(
        "script[src='https://cdn.fluidplayer.com/v3/current/fluidplayer.min.js']"
      );

      if (!existingScript) {
        const script = document.createElement("script");
        script.src = "https://cdn.fluidplayer.com/v3/current/fluidplayer.min.js";
        script.async = true;
        script.onload = () => {
          console.log("FluidPlayer script loaded");
          setTimeout(initFluidPlayer, 100); // Small delay to ensure script is ready
        };
        script.onerror = () => {
          console.error("Failed to load FluidPlayer script");
          video.controls = true;
          onError?.();
        };
        document.head.appendChild(script);
      } else {
        // Check if FluidPlayer is actually available
        if (window.fluidPlayer) {
          initFluidPlayer();
        } else {
          // Wait a bit and try again
          setTimeout(() => {
            if (window.fluidPlayer) {
              initFluidPlayer();
            } else {
              console.error("FluidPlayer not available, falling back to native controls");
              video.controls = true;
              onError?.();
            }
          }, 500);
        }
      }
    };

    initializeVideo();


    return () => {
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
  }, [src, poster, initialized, onError, onCanPlay]); // Re-initialize if src or poster changes

  // Track views
  const handlePlay = async () => {
    if (user && src) {
      try {
        await trackVideoView(user.id, src);
      } catch (error) {
        console.error("Error tracking video view:", error);
      }
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
          preload="none"
          playsInline
          webkit-playsinline="true"
          crossOrigin="anonymous"
          onPlay={handlePlay}
          onError={(e) => {
            const error = e.currentTarget.error;
            console.error("Video playback error:", {
              code: error?.code,
              message: error?.message,
              src: src
            });
            if (videoRef.current) videoRef.current.controls = true;
            onError?.();
          }}
          onLoadStart={() => {
            console.log("Video load started:", src);
          }}
          onCanPlay={() => {
            console.log("Video can play:", src);
            onCanPlay?.();
          }}
          onLoadedData={() => {
            console.log("Video data loaded:", src);
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