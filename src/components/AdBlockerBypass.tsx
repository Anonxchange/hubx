
import React, { useEffect, useState, useRef } from 'react';

interface AdBlockerBypassProps {
  zoneId: string;
  className?: string;
  fallbackContent?: React.ReactNode;
}

const AdBlockerBypass: React.FC<AdBlockerBypassProps> = ({ 
  zoneId, 
  className = "", 
  fallbackContent 
}) => {
  const [adBlockDetected, setAdBlockDetected] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const adRef = useRef<HTMLDivElement>(null);
  const detectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const detectAdBlocker = async () => {
      try {
        // Use the enhanced detection from utils
        const { adBlockerDetector } = await import('../utils/adBlockerUtils');
        let isBlocked = await adBlockerDetector.detectAdBlocker();
        
        // Additional local detection methods
        if (!isBlocked) {
          // Check for blocked elements
          if (detectionRef.current) {
            const rect = detectionRef.current.getBoundingClientRect();
            if (rect.height === 0 || rect.width === 0) {
              console.log('🔍 Local detection: Element blocked by dimensions');
              isBlocked = true;
            }
          }

          // Test ad script loading
          const testScript = document.createElement('script');
          testScript.src = `https://s.magsrv.com/v1/test.php?r=${Math.random()}`;
          
          const scriptBlocked = await new Promise<boolean>((resolve) => {
            const timeout = setTimeout(() => resolve(true), 2000);
            testScript.onload = () => {
              clearTimeout(timeout);
              resolve(false);
            };
            testScript.onerror = () => {
              clearTimeout(timeout);
              resolve(true);
            };
            document.head.appendChild(testScript);
          });
          
          if (scriptBlocked) {
            console.log('🔍 Local detection: Ad script blocked');
            isBlocked = true;
          }
          
          testScript.remove();
        }
        
        setAdBlockDetected(isBlocked);
        console.log(`🔍 Final ad blocker detection result: ${isBlocked ? 'BLOCKED' : 'ALLOWED'}`);
        
      } catch (error) {
        console.warn('Ad block detection failed:', error);
        // Assume blocked if detection fails
        setAdBlockDetected(true);
      }
    };

    // Multiple detection attempts with different timings
    const timers = [
      setTimeout(detectAdBlocker, 500),
      setTimeout(detectAdBlocker, 2000),
      setTimeout(detectAdBlocker, 4000)
    ];
    
    return () => timers.forEach(timer => clearTimeout(timer));
  }, []);

  useEffect(() => {
    if (adBlockDetected) {
      // Try alternative ad serving methods
      const loadAlternativeAd = async () => {
        try {
          if (!adRef.current) return;

          // Clear any existing content
          adRef.current.innerHTML = '';

          // Method 1: Try multiple iframe sources with random parameters
          const iframeSources = [
            `https://s.magsrv.com/v1/iframe.php?idzone=${zoneId}&r=${Math.random()}&t=${Date.now()}`,
            `https://s.magsrv.com/v1/ads.php?idzone=${zoneId}&type=iframe&r=${Math.random()}`,
            `data:text/html;charset=utf-8,<html><body><script>document.write('<iframe src="https://s.magsrv.com/v1/iframe.php?idzone=${zoneId}" width="100%" height="250" frameborder="0"></iframe>');</script></body></html>`
          ];

          let loaded = false;
          for (const src of iframeSources) {
            if (loaded) break;
            
            try {
              const iframe = document.createElement('iframe');
              iframe.src = src;
              iframe.style.cssText = 'width:100%;height:250px;border:none;display:block;';
              iframe.loading = 'lazy';
              iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups');
              
              await new Promise((resolve, reject) => {
                iframe.onload = () => {
                  loaded = true;
                  resolve(true);
                };
                iframe.onerror = reject;
                
                adRef.current?.appendChild(iframe);
                
                // Timeout after 3 seconds
                setTimeout(() => {
                  if (!loaded) {
                    iframe.remove();
                    reject('Timeout');
                  }
                }, 3000);
              });
              
              if (loaded) break;
            } catch (e) {
              console.warn('Iframe method failed:', e);
            }
          }

          // Method 2: Fallback to image ad if iframe fails
          if (!loaded && adRef.current) {
            try {
              const img = document.createElement('img');
              img.src = `https://s.magsrv.com/v1/banner.php?idzone=${zoneId}&type=image&r=${Math.random()}`;
              img.style.cssText = 'max-width:100%;height:auto;display:block;cursor:pointer;';
              img.onclick = () => {
                window.open(`https://s.magsrv.com/v1/click.php?idzone=${zoneId}`, '_blank');
              };
              
              await new Promise((resolve, reject) => {
                img.onload = () => {
                  loaded = true;
                  resolve(true);
                };
                img.onerror = reject;
                
                adRef.current?.appendChild(img);
                
                setTimeout(() => {
                  if (!loaded) {
                    img.remove();
                    reject('Image timeout');
                  }
                }, 3000);
              });
            } catch (e) {
              console.warn('Image ad failed:', e);
            }
          }

          // Method 3: Text-based fallback
          if (!loaded && adRef.current) {
            const textAd = document.createElement('div');
            textAd.innerHTML = `
              <div style="width:100%;height:250px;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);display:flex;align-items:center;justify-content:center;color:white;font-family:Arial,sans-serif;cursor:pointer;border-radius:8px;" onclick="window.open('https://s.magsrv.com/v1/click.php?idzone=${zoneId}', '_blank')">
                <div style="text-align:center;">
                  <div style="font-size:18px;margin-bottom:10px;">Advertisement</div>
                  <div style="font-size:14px;opacity:0.9;">Click to support our content</div>
                </div>
              </div>
            `;
            adRef.current.appendChild(textAd);
            loaded = true;
          }

          if (!loaded) {
            setShowFallback(true);
          }

        } catch (error) {
          console.error('All alternative ad loading methods failed:', error);
          setShowFallback(true);
        }
      };

      // Add a small delay to ensure proper detection
      const timer = setTimeout(loadAlternativeAd, 500);
      return () => clearTimeout(timer);
    }
  }, [adBlockDetected, zoneId]);

  // Invisible fallback - just an empty div
  const InvisibleFallback = () => (
    <div className="w-0 h-0 overflow-hidden opacity-0"></div>
  );

  return (
    <div className={`w-full ${className}`}>
      {/* Hidden detection element */}
      <div 
        ref={detectionRef}
        className="ads banner-ad google-ad"
        style={{ 
          height: '1px', 
          width: '1px', 
          position: 'absolute', 
          left: '-9999px',
          visibility: 'hidden'
        }}
      />
      
      {/* Main ad container - always render, but content changes based on ad blocker */}
      <div ref={adRef} className="ad-container">
        {!adBlockDetected && (
          <div>
            <ins className="eas6a97888e10" data-zoneid={zoneId}></ins>
            {/* Fallback detection - if ad doesn't load after 3 seconds, assume blocked */}
            <div
              ref={(el) => {
                if (el && !adBlockDetected) {
                  setTimeout(() => {
                    const insElement = el.previousElementSibling as HTMLElement;
                    if (insElement && (insElement.offsetHeight === 0 || insElement.offsetWidth === 0 || insElement.innerHTML.trim() === '')) {
                      console.log('🔍 Fallback detection: Ad element is empty, assuming blocked');
                      setAdBlockDetected(true);
                    }
                  }, 3000);
                }
              }}
              style={{ display: 'none' }}
            />
          </div>
        )}
      </div>

      {/* Fallback content only if provided and needed */}
      {(adBlockDetected && showFallback && fallbackContent) && fallbackContent}
    </div>
  );
};

export default AdBlockerBypass;
