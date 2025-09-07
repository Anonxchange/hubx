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
    let retryCount = 0;
    let retryTimer: NodeJS.Timeout;

    const loadFluidPlayer = () => {
      if (window.fluidPlayer && videoRef.current) {
        try {
          const video = videoRef.current;
          const isHLS = src.includes(".m3u8");

          const hlsConfig = isHLS
            ? {
                hls: {
                  overrideNative: true,
                },
                modules: {
                  configureHls: (options: any) => ({
                    ...options,
                    startLevel: 0, // Start lowest quality
                    maxMaxBufferLength: 30,
                  }),
                  onAfterInitHls: (hls: any) => {
                    hls.startLevel = 0;
                  },
                },
              }
            : {};

          const fluidPlayerInstance = window.fluidPlayer(video, {
            layoutControls: {
              autoPlay: false,
              mute: false,
              fillToContainer: true,
              playButtonShowing: true,
              posterImage: poster || "",
              allowDownload: false,
              keyboardControl: true,
              playbackRates: ["x0.5", "x0.75", "x1", "x1.25", "x1.5", "x1.75", "x2"],
              showQualitySelector: true,
              showSpeedControlMenu: true,
              controlBar: {
                autoHide: true,
                autoHideTimeout: 3,
                animated: true,
              },
              primaryColor: "#ff6b35",
              responsive: true,
              theatre: true,
              fullscreenEnabled: true,
              persistentSettings: {
                volume: true,
                quality: true,
                speed: true,
                theatre: true,
              },
            },
            ...hlsConfig,
            vastOptions: {
              adList: [
                {
                  roll: "preRoll",
                  vastTag: "https://syndication.exoclick.com/splash.php?idzone=5660526",
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
                vastLoadedCallback: () => console.log("VAST ad loaded successfully"),
                vastErrorCallback: (error: any) =>
                  console.log("VAST ad error, proceeding to main video:", error),
                noVastVideoCallback: () =>
                  console.log("No VAST ad available, playing main video directly"),
                adSkippedCallback: () => console.log("Ad was skipped, loading main video"),
                adStartedCallback: () => console.log("Ad playback started"),
              },
              adFinishedCallback: () => console.log("Ad completed, main video starting"),
            },
          });

          (video as any).fluidPlayerInstance = fluidPlayerInstance;
          console.log("FluidPlayer initialized successfully");
        } catch (error) {
          console.error("Error initializing FluidPlayer:", error);
          if (videoRef.current) videoRef.current.controls = true;
        }
      } else if (retryCount < 3) {
        retryCount++;
        retryTimer = setTimeout(loadFluidPlayer, 500);
      } else {
        console.error("Failed to load FluidPlayer after retries");
        if (videoRef.current) videoRef.current.controls = true;
      }
    };

    if (!initialized) {
      const existingScript = document.querySelector<HTMLScriptElement>(
        "script[src='https://cdn.fluidplayer.com/v3/current/fluidplayer.min.js']"
      );

      if (!existingScript) {
        const script = document.createElement("script");
        script.src = "https://cdn.fluidplayer.com/v3/current/fluidplayer.min.js";
        script.async = true;
        script.onload = () => setTimeout(loadFluidPlayer, 300);
        script.onerror = () => {
          console.error("Failed to load FluidPlayer script, using native player");
          if (videoRef.current) videoRef.current.controls = true;
        };
        document.body.appendChild(script);
      } else if (window.fluidPlayer) {
        setTimeout(loadFluidPlayer, 300);
      }

      setInitialized(true);
    }

    return () => {
      clearTimeout(retryTimer);
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
  }, [src, poster, initialized]);

  const handlePlay = async () => {
    if (user) {
      await trackVideoView(user.id, src);
    }
  };

  const isHLS = src.includes(".m3u8");

  return (
    <div className="w-full h-full">
      <div
        className="relative w-full bg-black group"
        style={{ aspectRatio: "16/9", height: "100%", minHeight: "100%" }}
      >
        <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-black/60 via-black/30 to-transparent z-10 pointer-events-none" />

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
            console.error("Video playback error:", e.currentTarget.error);
            if (videoRef.current) videoRef.current.controls = true;
          }}
          style={{
            backgroundColor: "#000",
            display: "block",
            objectFit: "cover",
            objectPosition: "center",
            width: "100%",
            height: "100%",
            minHeight: "100%",
          }}
        >
          {isHLS ? (
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