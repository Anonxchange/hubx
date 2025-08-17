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
      initPlayer();
    }

    function initPlayer() {
      if (videoRef.current && window.fluidPlayer && !initialized) {
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
            adFinishedCallback: () => {
              // Ensure main video continues after ad
              if (videoRef.current && videoRef.current.paused) {
                videoRef.current.play().catch(() => {});
              }
            },
          },
        });
        setInitialized(true);
      }
    }
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
          className="absolute top-0 left-0 w-full h-full"
          src={src}
          poster={poster}
          preload="metadata"
          playsInline
          onPlay={handlePlay}
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