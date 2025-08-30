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
  hlsSrc: string; // HLS URL
  mp4Src: string; // MP4 fallback
  poster?: string;
  title?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  hlsSrc,
  mp4Src,
  poster,
  title,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { user } = useAuth();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || initialized) return;

    // --- Load scripts helper ---
    const addScript = (src: string) =>
      new Promise<void>((resolve) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve();
          return;
        }
        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        document.body.appendChild(script);
      });

    const initPlayer = async () => {
      // Load Hls + FluidPlayer
      await addScript("https://cdn.jsdelivr.net/npm/hls.js@latest");
      await addScript("https://cdn.fluidplayer.com/v3/current/fluidplayer.min.js");

      // HLS attach
      if (window.Hls && window.Hls.isSupported()) {
        const hls = new window.Hls();
        hls.loadSource(hlsSrc);
        hls.attachMedia(videoEl);
      }

      // Init FluidPlayer (IMPORTANT: use video ID string not element)
      const player = window.fluidPlayer(videoEl.id, {
        layoutControls: {
          fillToContainer: true,
          autoPlay: false,
          mute: false,
          playButtonShowing: true,
          posterImage: poster || "",
          allowDownload: false,
          playbackRateEnabled: true,
          keyboardControl: true,
          primaryColor: "#ff6b35",
          responsive: true,
          controlBar: {
            autoHide: true,
            autoHideTimeout: 3,
          },
          mediaControls: {
            controlElements: [
              "playpause",
              "currenttime",
              "progress",
              "duration",
              "volume",
              "fullscreen",
              "quality", // 👈 Quality button
            ],
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

      (videoEl as any).fluidPlayerInstance = player;
      setInitialized(true);
    };

    initPlayer();

    // Cleanup
    return () => {
      if (videoEl) {
        const player = (videoEl as any).fluidPlayerInstance;
        if (player) player.destroy();
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
          id="hubx-player"
          ref={videoRef}
          className="w-full h-full"
          poster={poster}
          preload="none"
          playsInline
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