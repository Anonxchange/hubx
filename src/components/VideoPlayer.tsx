
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const initializeVideo = async () => {
      if (!videoRef.current || initialized || !isMounted) return;
      
      const video = videoRef.current;
      setIsLoading(true);

      try {
        // Check if FluidPlayer script exists
        const existingScript = document.querySelector(
          "script[src='https://cdn.fluidplayer.com/v3/current/fluidplayer.min.js']"
        );

        const loadFluidPlayer = () => {
          if (!isMounted || !videoRef.current) return;
          
          if (window.fluidPlayer) {
            try {
              // Clean up any existing player first
              const existingPlayer = (video as any).fluidPlayerInstance;
              if (existingPlayer && typeof existingPlayer.destroy === 'function') {
                existingPlayer.destroy();
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
                  controlBar: {
                    autoHide: true,
                    autoHideTimeout: 3,
                  },
                  primaryColor: "#ff6b35",
                  responsive: true,
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
                      console.log("VAST ad error, proceeding to main video:", error);
                    },
                    noVastVideoCallback: () => {
                      console.log("No VAST ad available, playing main video directly");
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

              (video as any).fluidPlayerInstance = fluidPlayerInstance;
              setInitialized(true);
              setIsLoading(false);
              console.log("FluidPlayer initialized successfully");
            } catch (error) {
              console.error("Error initializing FluidPlayer:", error);
              if (videoRef.current) {
                videoRef.current.controls = true;
                setIsLoading(false);
              }
            }
          } else {
            // Fallback to native player
            if (videoRef.current) {
              videoRef.current.controls = true;
              setIsLoading(false);
            }
          }
        };

        if (!existingScript) {
          const script = document.createElement("script");
          script.src = "https://cdn.fluidplayer.com/v3/current/fluidplayer.min.js";
          script.async = true;
          
          script.onload = () => {
            if (isMounted) {
              setTimeout(loadFluidPlayer, 100);
            }
          };
          
          script.onerror = () => {
            console.error("Failed to load FluidPlayer script, using native player");
            if (isMounted && videoRef.current) {
              videoRef.current.controls = true;
              setIsLoading(false);
            }
          };
          
          document.head.appendChild(script);
        } else if (window.fluidPlayer) {
          loadFluidPlayer();
        } else {
          // Script exists but FluidPlayer not loaded yet, wait and retry
          let retries = 0;
          const retryInterval = setInterval(() => {
            if (retries >= 5 || !isMounted) {
              clearInterval(retryInterval);
              if (isMounted && videoRef.current) {
                videoRef.current.controls = true;
                setIsLoading(false);
              }
              return;
            }
            
            if (window.fluidPlayer) {
              clearInterval(retryInterval);
              loadFluidPlayer();
            }
            retries++;
          }, 200);
        }
      } catch (error) {
        console.error("Error in video initialization:", error);
        if (isMounted && videoRef.current) {
          videoRef.current.controls = true;
          setIsLoading(false);
        }
      }
    };

    initializeVideo();

    return () => {
      isMounted = false;
      
      if (videoRef.current) {
        try {
          const player = videoRef.current as any;
          if (player.fluidPlayerInstance && typeof player.fluidPlayerInstance.destroy === 'function') {
            player.fluidPlayerInstance.destroy();
            delete player.fluidPlayerInstance;
          }
        } catch (error) {
          console.log("Error cleaning up FluidPlayer:", error);
        }
      }
    };
  }, [src, poster]);

  // Track views
  const handlePlay = async () => {
    if (user) {
      try {
        await trackVideoView(user.id, src);
      } catch (error) {
        console.error("Error tracking video view:", error);
      }
    }
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error("Video playback error:", e.currentTarget.error);
    if (videoRef.current) {
      videoRef.current.controls = true;
    }
    setIsLoading(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Responsive container */}
      <div
        className="relative w-full bg-black rounded-lg overflow-hidden"
        style={{ aspectRatio: "16/9" }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        <video
          ref={videoRef}
          className="w-full h-full"
          poster={poster}
          preload="metadata"
          playsInline
          webkit-playsinline="true"
          crossOrigin="anonymous"
          onPlay={handlePlay}
          onError={handleVideoError}
          onLoadStart={() => setIsLoading(true)}
          onCanPlay={() => setIsLoading(false)}
          style={{
            objectFit: "contain",
            backgroundColor: "#000",
            display: "block",
            maxWidth: "100%",
            maxHeight: "100%",
          }}
        >
          <source src={src} type="video/mp4" />
          Your browser does not support the video tag.
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
