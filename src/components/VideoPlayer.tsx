import React, { useEffect, useRef, useState } from "react";
import { VideoIcon, Eye } from "lucide-react";
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
  tags?: string[];
  isVR?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, poster, title, tags, isVR }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const vrSceneRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [initialized, setInitialized] = useState(false);
  const [vrMode, setVrMode] = useState(false);
  const [vrSupported, setVrSupported] = useState(false);

  // Detect VR content
  const isVRContent = isVR || (tags && tags.some(tag => 
    tag.toLowerCase().includes('vr') || 
    tag.toLowerCase().includes('virtual reality') || 
    tag.toLowerCase().includes('360')
  ));

  // Check VR support
  useEffect(() => {
    if (isVRContent) {
      // Check for WebXR or basic VR support
      if ('xr' in navigator || 'getVRDisplays' in navigator || /Mobi|Android/i.test(navigator.userAgent)) {
        setVrSupported(true);
      }
    }
  }, [isVRContent]);

  // Load A-Frame for VR mode
  const loadAFrame = () => {
    return new Promise((resolve) => {
      if (document.querySelector('script[src*="aframe"]')) {
        resolve(true);
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://aframe.io/releases/1.4.0/aframe.min.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  };

  // Initialize VR Scene
  const initializeVRScene = async () => {
    if (!vrSceneRef.current) return;
    
    await loadAFrame();
    
    vrSceneRef.current.innerHTML = `
      <a-scene embedded style="height: 100%; width: 100%;" vr-mode-ui="enabled: true">
        <a-assets>
          <video id="vrVideo" crossorigin="anonymous" playsinline webkit-playsinline>
            <source src="${src}" type="video/mp4">
          </video>
        </a-assets>
        
        <a-videosphere src="#vrVideo" rotation="0 180 0"></a-videosphere>
        
        <a-entity id="cameraWrapper" position="0 1.6 0">
          <a-camera look-controls wasd-controls>
            <a-cursor
              animation__click="property: scale; startEvents: click; from: 0.1 0.1 0.1; to: 1 1 1; dur: 150"
              animation__fusing="property: scale; startEvents: fusing; from: 1 1 1; to: 0.1 0.1 0.1; dur: 1500"
              raycaster="objects: .clickable"
              geometry="primitive: ring; radiusInner: 0.02; radiusOuter: 0.03"
              material="color: white; shader: flat">
            </a-cursor>
          </a-camera>
        </a-entity>
        
        <!-- VR Controls -->
        <a-entity id="vrControls" position="0 1.2 -1.5">
          <a-box class="clickable" id="playPause" position="0 0 0" width="0.3" height="0.1" depth="0.1" 
                 color="#4CAF50" text="value: PLAY/PAUSE; color: white; align: center; position: 0 0 0.06"></a-box>
        </a-entity>
        
        <a-sky color="#000000"></a-sky>
      </a-scene>
    `;

    // Setup VR video controls
    setTimeout(() => {
      const vrVideo = document.getElementById('vrVideo') as HTMLVideoElement;
      const playPauseBtn = document.getElementById('playPause');
      
      if (vrVideo && playPauseBtn) {
        playPauseBtn.addEventListener('click', () => {
          if (vrVideo.paused) {
            vrVideo.play();
          } else {
            vrVideo.pause();
          }
        });
      }
    }, 1000);
  };

  const toggleVRMode = async () => {
    if (!vrMode) {
      setVrMode(true);
      await initializeVRScene();
    } else {
      setVrMode(false);
    }
  };

  useEffect(() => {
    const initializeVideo = () => {
      if (videoRef.current && !initialized) {
        const video = videoRef.current;

        // Load FluidPlayer script if not already loaded
        const existingScript = document.querySelector<HTMLScriptElement>(
          "script[src='https://cdn.fluidplayer.com/v3/current/fluidplayer.min.js']"
        );

        const loadFluidPlayer = () => {
          if (window.fluidPlayer && videoRef.current) {
            try {
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
                      vastTag:
                        "https://syndication.exoclick.com/splash.php?idzone=5660526",
                      // Removed adText to disable custom banner
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
                      console.log(
                        "VAST ad error, proceeding to main video:",
                        error
                      );
                    },
                    noVastVideoCallback: () => {
                      console.log(
                        "No VAST ad available, playing main video directly"
                      );
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

              // Save instance for cleanup
              (video as any).fluidPlayerInstance = fluidPlayerInstance;
              console.log("FluidPlayer initialized successfully");
            } catch (error) {
              console.error("Error initializing FluidPlayer:", error);
              video.controls = true;
            }
          }
        };

        if (!existingScript) {
          const script = document.createElement("script");
          script.src =
            "https://cdn.fluidplayer.com/v3/current/fluidplayer.min.js";
          script.async = true;
          script.onload = () => setTimeout(loadFluidPlayer, 300);
          script.onerror = () => {
            console.error(
              "Failed to load FluidPlayer script, using native player"
            );
            if (videoRef.current) videoRef.current.controls = true;
          };
          document.body.appendChild(script);
        } else if (window.fluidPlayer) {
          setTimeout(loadFluidPlayer, 300);
        }

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
      {/* VR Controls */}
      {isVRContent && vrSupported && (
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-purple-600">🥽 VR Content</span>
            {tags?.includes('360') && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">360°</span>}
          </div>
          <button
            onClick={toggleVRMode}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              vrMode 
                ? 'bg-purple-600 text-white hover:bg-purple-700' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            <Eye className="w-4 h-4 inline mr-2" />
            {vrMode ? 'Exit VR' : 'VR Mode'}
          </button>
        </div>
      )}

      {/* Responsive container */}
      <div
        className="relative w-full bg-black rounded-lg overflow-hidden"
        style={{ aspectRatio: "16/9" }}
      >
        {/* Regular Video Player */}
        <video
          ref={videoRef}
          className={`w-full h-full ${vrMode ? 'hidden' : 'block'}`}
          poster={poster}
          preload="none"
          playsInline
          webkit-playsinline="true"
          crossOrigin="anonymous"
          onPlay={handlePlay}
          onError={(e) => {
            console.error("Video playbook error:", e.currentTarget.error);
            if (videoRef.current) videoRef.current.controls = true;
          }}
          style={{
            objectFit: "contain",
            backgroundColor: "#000",
            display: vrMode ? "none" : "block",
            maxWidth: "100%",
            maxHeight: "100%",
          }}
        >
          <source src={src} type="video/mp4" />
        </video>

        {/* VR Scene Container */}
        {vrMode && (
          <div 
            ref={vrSceneRef}
            className="w-full h-full"
            style={{ aspectRatio: "16/9" }}
          />
        )}

        {/* VR Mode Instructions */}
        {vrMode && (
          <div className="absolute top-4 left-4 bg-black/70 text-white p-2 rounded text-sm">
            <p>🥽 VR Mode Active</p>
            <p className="text-xs text-gray-300 mt-1">
              Use mouse/touch to look around • Click controls to interact
            </p>
          </div>
        )}
      </div>

      {/* Video info */}
      {title && (
        <div className="flex justify-between items-center mt-3 px-2">
          <div className="flex items-center gap-2">
            <VideoIcon className="w-5 h-5 text-red-500" />
            <span className="font-medium text-foreground">{title}</span>
            {isVRContent && (
              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded ml-2">
                VR Compatible
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
