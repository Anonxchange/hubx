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

    let hls: any | null = null;
    let destroyed = false;

    // Add external CSS/JS once
    const addLinkOnce = (href: string) =>
      new Promise<void>((resolve) => {
        if (document.querySelector(`link[href="${href}"]`)) return resolve();
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        link.onload = () => resolve();
        document.head.appendChild(link);
      });

    const addScriptOnce = (src: string) =>
      new Promise<void>((resolve, reject) => {
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) return resolve();
        const s = document.createElement("script");
        s.src = src;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error(`Failed loading ${src}`));
        document.body.appendChild(s);
      });

    // Small helper: create simple quality UI that talks to hls.js
    const attachQualityMenu = (hlsInstance: any) => {
      const levels: Array<{ height?: number; bitrate?: number }> = hlsInstance.levels || [];
      if (!levels || levels.length <= 1) return; // nothing to show

      // Container
      const wrap = document.createElement("div");
      wrap.style.position = "absolute";
      wrap.style.right = "12px";
      wrap.style.bottom = "56px";
      wrap.style.zIndex = "10000";
      wrap.style.background = "rgba(0,0,0,0.65)";
      wrap.style.backdropFilter = "blur(2px)";
      wrap.style.borderRadius = "6px";
      wrap.style.padding = "6px 8px";
      wrap.style.display = "flex";
      wrap.style.alignItems = "center";
      wrap.style.gap = "6px";
      wrap.style.pointerEvents = "auto";

      const label = document.createElement("span");
      label.textContent = "Quality:";
      label.style.fontSize = "12px";
      label.style.color = "#fff";

      const select = document.createElement("select");
      select.style.fontSize = "12px";
      select.style.background = "transparent";
      select.style.color = "#fff";
      select.style.border = "1px solid rgba(255,255,255,0.25)";
      select.style.borderRadius = "4px";
      select.style.padding = "2px 6px";
      select.style.outline = "none";

      // Auto
      const auto = document.createElement("option");
      auto.value = "-1";
      auto.text = "Auto";
      select.appendChild(auto);

      levels.forEach((lvl, idx) => {
        const o = document.createElement("option");
        const h = lvl.height ? `${lvl.height}p` : "";
        const kbps = lvl.bitrate ? `${Math.round(lvl.bitrate / 1000)}kbps` : "";
        o.value = String(idx);
        o.text = h && kbps ? `${h} • ${kbps}` : h || kbps || `Level ${idx}`;
        select.appendChild(o);
      });

      select.onchange = () => {
        const val = parseInt(select.value, 10);
        hlsInstance.currentLevel = val; // -1 = auto
      };

      wrap.appendChild(label);
      wrap.appendChild(select);

      // mount near the video element container
      const container = videoEl.parentElement; // the rounded black wrapper
      if (container) container.appendChild(wrap);

      // cleanup on unmount
      return () => {
        wrap.remove();
      };
    };

    const init = async () => {
      try {
        // Ensure Fluid CSS + scripts
        await addLinkOnce("https://cdn.fluidplayer.com/v3/current/fluidplayer.min.css");
        await addScriptOnce("https://cdn.jsdelivr.net/npm/hls.js@latest");
        await addScriptOnce("https://cdn.fluidplayer.com/v3/current/fluidplayer.min.js");

        if (destroyed) return;

        // Decide playback path
        const supportsNativeHls =
          typeof (videoEl as any).canPlayType === "function" &&
          !!videoEl.canPlayType("application/vnd.apple.mpegURL");

        let removeQualityMenu: (() => void) | undefined;

        if (window.Hls && window.Hls.isSupported()) {
          // Use hls.js (most browsers)
          hls = new window.Hls({
            capLevelToPlayerSize: true,
            startLevel: -1,
            autoStartLoad: true,
          });
          hls.loadSource(hlsSrc);
          hls.attachMedia(videoEl);

          // If manifest parsed, attach the quality menu
          hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
            removeQualityMenu = attachQualityMenu(hls);
          });

          // On fatal error, fall back to MP4
          hls.on(window.Hls.Events.ERROR, (_e: any, data: any) => {
            if (data?.fatal) {
              try {
                hls?.destroy();
              } catch {}
              videoEl.src = mp4Src;
              videoEl.load();
            }
          });
        } else if (supportsNativeHls) {
          // Safari / iOS
          videoEl.src = hlsSrc;
          videoEl.load();
          // Native HLS usually manages qualities automatically; no manual menu here
        } else {
          // Old browsers: fallback to MP4
          videoEl.src = mp4Src;
          videoEl.load();
        }

        // Init Fluid Player AFTER sources are ready (tiny delay helps race conditions)
        setTimeout(() => {
          if (!window.fluidPlayer) return;

          const player = window.fluidPlayer(videoEl.id, {
            layoutControls: {
              fillToContainer: true,
              autoPlay: false,
              mute: false,
              playButtonShowing: true,
              posterImage: poster || "",
              allowDownload: false,
              keyboardControl: true,
              playbackRates: ["x0.5", "x1", "x1.25", "x1.5", "x2"],
              primaryColor: "#ff6b35",
              responsive: true,
              controlBar: {
                autoHide: true,
                autoHideTimeout: 3,
              },
              // Don't force "quality" element (Fluid's built-in) to avoid hiding controls if not available.
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
              allowVPAID: true,
              adClickable: true,
              vastTimeout: 10000,
            },
          });

          (videoEl as any).fluidPlayerInstance = player;
          setInitialized(true);
        }, 150);
      } catch (err) {
        console.error("Player init error:", err);
        // Last-ditch fallback to native controls
        videoEl.controls = true;
        videoEl.src = mp4Src || hlsSrc;
        videoEl.load();
      }
    };

    init();

    // Cleanup
    return () => {
      destroyed = true;
      try {
        const p = (videoEl as any).fluidPlayerInstance;
        if (p) p.destroy();
      } catch {}
      try {
        hls?.destroy();
      } catch {}
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
          onError={(e) => {
            console.error("Video error:", e.currentTarget.error);
            // Expose native controls if anything goes wrong so user can still play
            if (videoRef.current) videoRef.current.controls = true;
          }}
          style={{
            objectFit: "contain",
            backgroundColor: "#000",
            display: "block",
            maxWidth: "100%",
            maxHeight: "100%",
          }}
        >
          {/* Put MP4 first for better fallback on some browsers */}
          <source src={mp4Src} type="video/mp4" />
          <source src={hlsSrc} type="application/x-mpegURL" />
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