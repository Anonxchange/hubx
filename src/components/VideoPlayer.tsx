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

  // Load FluidPlayer script once
  useEffect(() => {
    if (
      !document.querySelector<HTMLScriptElement>(
        "script[src='https://cdn.fluidplayer.com/v3/current/fluidplayer.min.js']"
      )
    ) {
      const script = document.createElement("script");
      script.src = "https://cdn.fluidplayer.com/v3/current/fluidplayer.min.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const startPlayback = async () => {
    const video = videoRef.current;
    if (!video || initialized) return;

    video.src = src; // attach only now
    video.load();

    const initPlayer = () => {
      try {
        const fluidPlayerInstance = window.fluidPlayer(video, {
          layoutControls: {
            autoPlay: true, // start immediately once ready
            posterImage: poster || "",
            fillToContainer: true,
            primaryColor: "#ff6b35",
            playbackRates: ["x0.5", "x1", "x1.25", "x1.5", "x2"],
          },
          vastOptions: {
            adList: [
              {
                roll: "preRoll",
                vastTag:
                  "https://syndication.exoclick.com/splash.php?idzone=5660526",
              },
            ],
          },
        });
        (video as any).fluidPlayerInstance = fluidPlayerInstance;
        setInitialized(true);
      } catch (error) {
        console.error("Error initializing FluidPlayer:", error);
        video.controls = true;
      }
    };

    if (window.fluidPlayer) {
      initPlayer();
    } else {
      setTimeout(initPlayer, 400);
    }

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
          style={{
            objectFit: "contain",
            backgroundColor: "#000",
          }}
        />

        {/* Overlay Play Button */}
        {!initialized && (
          <button
            onClick={startPlayback}
            className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/60 transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-20 w-20 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        )}
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