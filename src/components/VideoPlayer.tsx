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
  const playerInstance = useRef<any>(null);

  useEffect(() => {
    const initPlayer = () => {
      if (videoRef.current && window.fluidPlayer && !initialized) {
        try {
          // Init FluidPlayer
          playerInstance.current = window.fluidPlayer(videoRef.current, {
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

              // Safety callbacks
              adFinishedCallback: () => {
                console.log("Ad finished, resuming main video...");
                if (videoRef.current) {
                  videoRef.current.controls = true;
                  videoRef.current.play().catch(() => {
                    console.log("User gesture required to start video");
                  });
                }
              },
              noVastVideoCallback: () => {
                console.log("No ad, play main video directly");
                if (videoRef.current) {
                  videoRef.current.controls = true;
                }
              },
              vastErrorCallback: (err: any) => {
                console.warn("VAST error, fallback to main video:", err);
                if (videoRef.current) {
                  videoRef.current.controls = true;
                }
              },
            },
          });

          console.log("FluidPlayer initialized ✅");
          setInitialized(true);
        } catch (error) {
          console.error("Error initializing FluidPlayer:", error);
          if (videoRef.current) videoRef.current.controls = true;
        }
      }
    };

    // Load script if needed
    const existingScript = document.querySelector<HTMLScriptElement>(
      "script[src='https://cdn.fluidplayer.com/v3/current/fluidplayer.min.js']"
    );
    if (!existingScript) {
      const script = document.createElement("script");
      script.src =
        "https://cdn.fluidplayer.com/v3/current/fluidplayer.min.js";
      script.async = true;
      script.onload = initPlayer;
      document.body.appendChild(script);
    } else {
      initPlayer();
    }

    return () => {
      if (playerInstance.current) {
        try {
          playerInstance.current.destroy();
          playerInstance.current = null;
        } catch (e) {
          console.log("Error cleaning FluidPlayer:", e);
        }
      }
    };
  }, [src, poster]);

  // Track video views
  const handlePlay = async () => {
    if (user) {
      await trackVideoView(user.id, src);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Video container */}
      <div
        className="relative w-full bg-black rounded-lg overflow-hidden"
        style={{ aspectRatio: "16/9" }}
      >
        <video
          ref={videoRef}
          className="w-full h-full"
          src={src}
          poster={poster}
          preload="metadata"
          playsInline
          crossOrigin="anonymous"
          onPlay={handlePlay}
          style={{
            objectFit: "contain",
            backgroundColor: "#000",
            display: "block",
          }}
        />
      </div>

      {/* Video info */}
      <div className="flex justify-between items-center mt-3 px-2">
        <div className="flex items-center gap-2">
          <VideoIcon className="w-5 h-5 text-red-500" />
          <span className="font-medium text-foreground">
            {title || "Untitled Video"}
          </span>
        </div>
        <Button variant="outline" size="sm">
          Save
        </Button>
      </div>
    </div>
  );
};

export default VideoPlayer;