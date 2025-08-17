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
    // Load FluidPlayer script once
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
          },
        });
        setInitialized(true);
      }
    }
  }, [poster, initialized]);

  // Track video view for stats
  const handlePlay = async () => {
    if (user) {
      await trackVideoView(user.id, src);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="relative bg-black rounded-md overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full"
          src={src}
          poster={poster}
          preload="metadata"
          playsInline
          onPlay={handlePlay}
        />
      </div>

      {/* Example custom overlay (reuse your style) */}
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