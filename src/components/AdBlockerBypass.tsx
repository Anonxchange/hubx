
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
      // Use the enhanced bypass methods from utils
      const loadBypassAd = async () => {
        try {
          if (!adRef.current) return;

          const { adBlockerDetector } = await import('../utils/adBlockerUtils');
          await adBlockerDetector.bypassAdBlocker(zoneId, adRef.current);

          // Check if content was loaded
          if (adRef.current.children.length === 0) {
            console.warn('Bypass methods failed, showing fallback');
            setShowFallback(true);
          }

        } catch (error) {
          console.error('Bypass ad loading failed:', error);
          setShowFallback(true);
        }
      };

      // Add a small delay to ensure proper detection
      const timer = setTimeout(loadBypassAd, 300);
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
