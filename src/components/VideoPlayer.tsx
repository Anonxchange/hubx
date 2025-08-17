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
      script.onload = () => setTimeout(initPlayer, 200);
      script.onerror = () => {
        console.error("Failed to load FluidPlayer script");
        // Fallback to native video player
        if (videoRef.current) {
          videoRef.current.controls = true;
        }
      };
      document.body.appendChild(script);
    } else {
      // Ensure DOM and script are ready
      setTimeout(initPlayer, 200);
    }

    function initPlayer() {
      if (videoRef.current && window.fluidPlayer && !initialized) {
        try {
          // Ensure video element is ready
          const video = videoRef.current;
          video.style.width = "100%";
          video.style.height = "100%";
          
          window.fluidPlayer(video, {
            layoutControls: {
              autoPlay: false,
              mute: false,
              fillToContainer: true,
              playButtonShowing: true,
              posterImage: poster || "",
              allowDownload: false,
              keyboardControl: true,
              playbackRates: ['x0.5', 'x1', 'x1.25', 'x1.5', 'x2'],
              controlBar: {
                autoHide: true,
                autoHideTimeout: 3,
              },
            },
            vastOptions: {
              adList: [
                {
                  roll: "preRoll",
                  vastTag: "https://syndication.exoclick.com/splash.php?idzone=5660526",
                  adText: "Advertisement",
                },
              ],
              skipButtonCaption: "Skip in [seconds]",
              skipButtonClickCaption: "Skip >>",
              showProgressbarMarkers: true,
              allowVPAID: true,
              maxAllowedVastTagRedirects: 3,
              vastTimeout: 8000,
              adCTAText: "Visit Site",
              adCTATextPosition: "top left",
              vastAdvanced: {
                vastLoadedCallback: () => {
                  console.log("VAST ad loaded successfully");
                },
                vastErrorCallback: (error: any) => {
                  console.log("VAST ad error, proceeding to main video:", error);
                  // Force play main video if ad fails
                  setTimeout(() => {
                    if (videoRef.current && videoRef.current.paused) {
                      videoRef.current.play().catch(console.error);
                    }
                  }, 500);
                },
              },
              adFinishedCallback: () => {
                console.log("Ad finished, starting main video");
                // Ensure main video plays after ad
                setTimeout(() => {
                  if (videoRef.current && videoRef.current.paused) {
                    videoRef.current.play().catch(console.error);
                  }
                }, 100);
              },
            },
          });
          
          setInitialized(true);
          console.log("FluidPlayer initialized successfully");
        } catch (error) {
          console.error("Error initializing FluidPlayer:", error);
          // Fallback to basic video player
          if (videoRef.current) {
            videoRef.current.controls = true;
            videoRef.current.style.width = "100%";
            videoRef.current.style.height = "100%";
          }
        }
      } else if (!window.fluidPlayer) {
        console.error("FluidPlayer not available, using fallback");
        // Fallback to native video player
        if (videoRef.current) {
          videoRef.current.controls = true;
          videoRef.current.style.width = "100%";
          videoRef.current.style.height = "100%";
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
      {/* Responsive video container with consistent 16:9 aspect ratio */}
      <div className="relative w-full bg-black rounded-md overflow-hidden" style={{ aspectRatio: '16/9' }}>
        <video
          ref={videoRef}
          className="absolute top-0 left-0 w-full h-full"
          src={src}
          poster={poster}
          preload="metadata"
          playsInline
          crossOrigin="anonymous"
          onPlay={handlePlay}
          onError={(e) => {
            console.error("Video playback error:", e.currentTarget.error);
            // Try to reload video on error
            setTimeout(() => {
              if (videoRef.current) {
                videoRef.current.load();
              }
            }, 1000);
          }}
          onLoadStart={() => {
            console.log("Video loading started for:", src);
          }}
          onCanPlay={() => {
            console.log("Video can start playing");
          }}
          onLoadedMetadata={() => {
            console.log("Video metadata loaded");
          }}
          onWaiting={() => {
            console.log("Video buffering...");
          }}
          style={{
            objectFit: 'contain',
            backgroundColor: '#000'
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