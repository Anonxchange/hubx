import React, { useEffect, useRef, useState } from "react";
import { VideoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    const existingScript = document.querySelector<HTMLScriptElement>(
      "script[src='https://cdn.fluidplayer.com/v3/current/fluidplayer.min.js']"
    );

    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://cdn.fluidplayer.com/v3/current/fluidplayer.min.js";
      script.async = true;
      script.onload = initPlayer;
      document.body.appendChild(script);
    } else {
      // Small delay to ensure DOM is ready
      setTimeout(initPlayer, 100);
    }

    function initPlayer() {
      if (videoRef.current && window.fluidPlayer && !initialized) {
        try {
          window.fluidPlayer(videoRef.current, {
            layoutControls: {
              autoPlay: false,
              mute: false,
              fillToContainer: true,
              playButtonShowing: true,
              posterImage: poster || "",
              allowDownload: false,
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
                  adText: "Advertisement",
                },
              ],
              skipButtonCaption: "Skip in [seconds]",
              skipButtonClickCaption: "Skip >>",
              showProgressbarMarkers: true,
              allowVPAID: true,
              maxAllowedVastTagRedirects: 3,
              vastTimeout: 5000,
              adCTAText: "Visit Site",
              adCTATextPosition: "top left",
              vastAdvanced: {
                vastLoadedCallback: () => {
                  console.log("VAST ad loaded");
                },
                vastErrorCallback: () => {
                  console.log("VAST ad error, continuing to main video");
                  if (videoRef.current) {
                    videoRef.current.play().catch(() => {});
                  }
                },
              },
              adFinishedCallback: () => {
                // Ensure main video continues after ad
                if (videoRef.current && videoRef.current.paused) {
                  videoRef.current.play().catch(() => {});
                }
              },
            },
          });
          setInitialized(true);
        } catch (error) {
          console.error("Error initializing FluidPlayer:", error);
          // Fallback to basic video player
          if (videoRef.current) {
            videoRef.current.controls = true;
          }
        }
      }
    }

    // Cleanup function
    return () => {
      if (videoRef.current && window.fluidPlayer) {
        try {
          // Destroy FluidPlayer instance if it exists
          const player = videoRef.current as any;
          if (player.fluidPlayerInstance) {
            player.fluidPlayerInstance.destroy();
          }
        } catch (error) {
          console.log("Error cleaning up FluidPlayer:", error);
        }
      }
    };
  }, [poster, initialized]);

  // Track views
  const handlePlay = async () => {
    if (user) {
      await trackVideoView(user.id, src);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Keep player 16:9 to avoid ad resizing jump */}
      <div className="relative pt-[56.25%] bg-black rounded-md overflow-hidden">
        <video
          ref={videoRef}
          className="absolute top-0 left-0 w-full h-full object-contain"
          src={src}
          poster={poster}
          preload="metadata"
          playsInline
          crossOrigin="anonymous"
          onPlay={handlePlay}
          onError={(e) => {
            console.error("Video playback error:", e);
          }}
          onLoadStart={() => {
            console.log("Video loading started");
          }}
          onCanPlay={() => {
            console.log("Video can start playing");
          }}
        />
      </div>

      {/* Overlay controls below video */}
      <div className="flex justify-between items-center mt-3 px-2">
        <div className="flex items-center gap-2">
          <VideoIcon className="w-5 h-5 text-red-500" />
          <span className="font-medium">{title || "Untitled Video"}</span>
        </div>
        <Button variant="outline" size="sm">
          Save
        </Button>
      </div>
    </div>
  );
};

export default VideoPlayer;