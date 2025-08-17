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
    const initializeVideo = () => {
      if (videoRef.current && !initialized) {
        const video = videoRef.current;
        
        // Set basic video properties first
        video.controls = false; // Will be enabled after FluidPlayer or on fallback
        video.style.width = "100%";
        video.style.height = "100%";
        video.style.objectFit = "contain";
        
        // Set video source initially
        video.src = src;
        video.load();
        
        // Try to load FluidPlayer if available
        const existingScript = document.querySelector<HTMLScriptElement>(
          "script[src='https://cdn.fluidplayer.com/v3/current/fluidplayer.min.js']"
        );

        const loadFluidPlayer = () => {
          if (window.fluidPlayer && videoRef.current) {
            try {
              // Set up video element for FluidPlayer
              video.controls = false;
              video.preload = "metadata";
              
              // Initialize FluidPlayer with improved configuration
              const fluidPlayerInstance = window.fluidPlayer(video, {
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
                  primaryColor: "#ff6b35",
                  responsive: true,
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
                      // Ensure ad fits container properly
                      if (videoRef.current) {
                        videoRef.current.style.objectFit = "contain";
                      }
                    },
                    vastErrorCallback: (error: any) => {
                      console.log("VAST ad error, proceeding to main video:", error);
                      // Let FluidPlayer handle the error gracefully
                    },
                    noVastVideoCallback: () => {
                      console.log("No VAST ad available, playing main video directly");
                      // FluidPlayer will automatically play main video
                    },
                    adSkippedCallback: () => {
                      console.log("Ad was skipped, loading main video");
                      // FluidPlayer automatically transitions to main video
                    },
                    adStartedCallback: () => {
                      console.log("Ad playback started");
                      // Ensure proper scaling during ad playback
                      if (videoRef.current) {
                        videoRef.current.style.objectFit = "contain";
                      }
                    },
                  },
                  adFinishedCallback: () => {
                    console.log("Ad completed, main video starting");
                    // Ensure main video plays with proper scaling
                    setTimeout(() => {
                      if (videoRef.current) {
                        videoRef.current.style.objectFit = "contain";
                      }
                    }, 100);
                  },
                },
              });
              
              // Store the FluidPlayer instance for cleanup
              (video as any).fluidPlayerInstance = fluidPlayerInstance;
              
              console.log("FluidPlayer initialized successfully");
            } catch (error) {
              console.error("Error initializing FluidPlayer:", error);
              // Fallback to native video player
              video.controls = true;
              console.log("Using native video player as fallback");
            }
          }
        };

        if (!existingScript) {
          const script = document.createElement("script");
          script.src = "https://cdn.fluidplayer.com/v3/current/fluidplayer.min.js";
          script.async = true;
          script.onload = () => {
            setTimeout(loadFluidPlayer, 300);
          };
          script.onerror = () => {
            console.error("Failed to load FluidPlayer script, using native player");
            // Use native video player as fallback
            if (videoRef.current) {
              videoRef.current.controls = true;
            }
          };
          document.body.appendChild(script);
        } else if (window.fluidPlayer) {
          setTimeout(loadFluidPlayer, 300);
        }
        
        setInitialized(true);
      }
    };

    // Initialize after a short delay to ensure DOM is ready
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
          console.log("Error cleaning up FluidPlayer:", error);
        }
      }
    };
  }, [src, poster]);

  // Track views
  const handlePlay = async () => {
    if (user) {
      await trackVideoView(user.id, src);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Responsive video container with consistent 16:9 aspect ratio */}
      <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
        <video
          ref={videoRef}
          className="w-full h-full"
          poster={poster}
          preload="metadata"
          playsInline
          webkit-playsinline="true"
          crossOrigin="anonymous"
          onPlay={handlePlay}
          onError={(e) => {
            console.error("Video playback error:", e.currentTarget.error);
            const error = e.currentTarget.error;
            if (error) {
              console.error("Error details:", {
                code: error.code,
                message: error.message
              });
            }
            // Show native controls on error
            if (videoRef.current) {
              videoRef.current.controls = true;
            }
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
          onLoadedData={() => {
            console.log("Video data loaded successfully");
          }}
          onResize={() => {
            // Ensure proper scaling when video dimensions change
            if (videoRef.current) {
              videoRef.current.style.objectFit = "contain";
            }
          }}
          style={{
            objectFit: 'contain',
            backgroundColor: '#000',
            display: 'block',
            maxWidth: '100%',
            maxHeight: '100%'
          }}
        />
      </div>

      {/* Video info below */}
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