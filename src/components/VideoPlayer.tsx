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
  hlsSrc: string;  // HLS URL
  mp4Src: string;  // MP4 fallback
  poster?: string;
  title?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ hlsSrc, mp4Src, poster, title }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { user } = useAuth();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initializeVideo = () => {
      if (videoRef.current && !initialized) {
        const video = videoRef.current;

        // Load Hls.js
        const loadHls = () => {
          if (window.Hls && videoRef.current) {
            if (window.Hls.isSupported()) {
              const hls = new window.Hls();
              hls.loadSource(hlsSrc);
              hls.attachMedia(videoRef.current);
            }
          }
        };

        // Load FluidPlayer script
        const loadFluidPlayer = () => {
          if (window.fluidPlayer && videoRef.current) {
            const fluidPlayerInstance = window.fluidPlayer(video, {
              layoutControls: {
                fillToContainer: true,
                autoPlay: false,
                mute: false,
                playButtonShowing: true,
                posterImage: poster || "",
                allowDownload: false,
                playbackRateEnabled: true,
                keyboardControl: true,
                controlBar: {
                  autoHide: true,
                  autoHideTimeout: 3,
                },
                primaryColor: "#ff6b35",
                responsive: true,
                mediaControls: {
                  // 👇 Enable quality selector
                  controlElements: ["playpause", "currenttime", "progress", "duration", "volume", "fullscreen", "quality"],
                },
              },
              vastOptions: {
                adList: [
                  {
                    roll: "preRoll",
                    vastTag: "https://syndication.exoclick.com/splash.php?idzone=5660526",
                  },
                ],
              },
            });

            (video as any).fluidPlayerInstance = fluidPlayerInstance;
          }
        };

        // Inject scripts if missing
        const addScript = (src: string, onload?: () => void) => {
          if (!document.querySelector(`script[src="${src}"]`)) {
            const script = document.createElement("script");
            script.src = src;
            script.async = true;
            if (onload) script.onload = onload;
            document.body.appendChild(script);
          } else if (onload) {
            onload();
          }
        };

        addScript("https://cdn.jsdelivr.net/npm/hls.js@latest", loadHls);
        addScript("https://cdn.fluidplayer.com/v3/current/fluidplayer.min.js", loadFluidPlayer);

        setInitialized(true);
      }
    };

    const timer = setTimeout(initializeVideo, 200);

    return () => {
      clearTimeout(timer);
      if (videoRef.current) {
        try {
          const player = (videoRef.current as any).fluidPlayerInstance;
          if (player) player.destroy();
        } catch (error) {
          console.log("Cleanup error:", error);
        }
      }
    };
  }, [hlsSrc, mp4Src, poster, initialized]);

  // Track views
  const handlePlay = async () => {
    if (user) {
      await trackVideoView(user.id, hlsSrc);
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
          webkit-playsinline="true"
          crossOrigin="anonymous"
          onPlay={handlePlay}
        >
          <source src={hlsSrc} type="application/x-mpegURL" />
          <source src={mp4Src} type="video/mp4" />
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