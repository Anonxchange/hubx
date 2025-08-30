import React, { useEffect, useRef, useState } from "react";
import { VideoIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { trackVideoView } from "@/services/userStatsService";

declare global {
  interface Window {
    fluidPlayer: any;
    Hls: any;
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

        // Load FluidPlayer + Hls.js if not already loaded
        const loadScripts = async () => {
          const loadScript = (src: string) =>
            new Promise<void>((resolve, reject) => {
              if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
              }
              const script = document.createElement("script");
              script.src = src;
              script.async = true;
              script.onload = () => resolve();
              script.onerror = () => reject(new Error(`Failed to load ${src}`));
              document.body.appendChild(script);
            });

          try {
            await loadScript("https://cdn.fluidplayer.com/v3/current/fluidplayer.min.js");
            await loadScript("https://cdn.jsdelivr.net/npm/hls.js@latest");

            if (window.fluidPlayer && videoRef.current) {
              // If HLS source
              if (src.endsWith(".m3u8") && window.Hls && window.Hls.isSupported()) {
                const hls = new window.Hls();
                hls.loadSource(src);
                hls.attachMedia(videoRef.current);
              }

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
                  primaryColor: "#ff6b35",
                  responsive: true,
                  controlBar: {
                    autoHide: true,
                    autoHideTimeout: 3,
                  },
                  // ⚡ FluidPlayer automatically creates quality selector when multiple HLS renditions exist
                },
                vastOptions: {
                  adList: [
                    {
                      roll: "preRoll",
                      vastTag: "https://syndication.exoclick.com/splash.php?idzone=5660526",
                    },
                  ],
                  skipButtonCaption: "Skip in [seconds]",
                  skipButtonClickCaption: "Skip >>",
                  allowVPAID: true,
                  adClickable: true,
                  adFinishedCallback: () => {
                    console.log("Ad completed, main video starting");
                  },
                },
              });

              (video as any).fluidPlayerInstance = fluidPlayerInstance;
              console.log("FluidPlayer initialized with HLS support ✅");
            }
          } catch (error) {
            console.error("Error setting up player:", error);
            if (videoRef.current) videoRef.current.controls = true;
          }
        };

        loadScripts();
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
          console.log("Cleanup error:", error);
        }
      }
    };
  }, [src, poster, initialized]);

  // Track views
  const handlePlay = async () => {
    if (user) {
      await trackVideoView(user.id, src);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
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
          crossOrigin="anonymous"
          onPlay={handlePlay}
          onError={(e) => {
            console.error("Video error:", e.currentTarget.error);
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
          {src.endsWith(".m3u8") ? (
            <source src={src} type="application/x-mpegURL" />
          ) : (
            <source src={src} type="video/mp4" />
          )}
        </video>
      </div>

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