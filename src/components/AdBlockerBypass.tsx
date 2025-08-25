
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
        const isBlocked = await adBlockerDetector.detectAdBlocker();
        setAdBlockDetected(isBlocked);
        
        // Additional local detection methods
        if (!isBlocked) {
          // Check for blocked elements
          if (detectionRef.current) {
            const rect = detectionRef.current.getBoundingClientRect();
            if (rect.height === 0 || rect.width === 0) {
              setAdBlockDetected(true);
            }
          }

          // Monitor for blocked network requests
          const originalFetch = window.fetch;
          let networkBlocked = false;
          
          window.fetch = function(...args) {
            const url = args[0];
            if (typeof url === 'string' && (url.includes('ads') || url.includes('banner'))) {
              networkBlocked = true;
              setAdBlockDetected(true);
            }
            return originalFetch.apply(this, args);
          };
        }
      } catch (error) {
        console.warn('Ad block detection failed:', error);
        // Assume blocked if detection fails
        setAdBlockDetected(true);
      }
    };

    // Multiple detection attempts with different timings
    const timers = [
      setTimeout(detectAdBlocker, 500),
      setTimeout(detectAdBlocker, 1500),
      setTimeout(detectAdBlocker, 3000)
    ];
    
    return () => timers.forEach(timer => clearTimeout(timer));
  }, []);

  useEffect(() => {
    if (adBlockDetected) {
      // Try alternative ad serving methods
      const loadAlternativeAd = () => {
        try {
          // Method 1: Dynamic script injection with obfuscated names
          const script = document.createElement('script');
          script.src = `https://s.magsrv.com/v1/ads.php?idzone=${zoneId}&type=js&timestamp=${Date.now()}`;
          script.async = true;
          script.onerror = () => setShowFallback(true);
          document.head.appendChild(script);

          // Method 2: Direct iframe injection
          const iframe = document.createElement('iframe');
          iframe.src = `https://s.magsrv.com/v1/iframe.php?idzone=${zoneId}`;
          iframe.style.width = '100%';
          iframe.style.height = '250px';
          iframe.style.border = 'none';
          iframe.style.display = 'block';
          
          if (adRef.current) {
            adRef.current.appendChild(iframe);
          }

          // Method 3: Image-based fallback
          setTimeout(() => {
            const img = document.createElement('img');
            img.src = `https://s.magsrv.com/v1/banner.php?idzone=${zoneId}&type=image`;
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            img.onerror = () => setShowFallback(true);
            
            if (adRef.current && !adRef.current.hasChildNodes()) {
              adRef.current.appendChild(img);
            }
          }, 1000);

        } catch (error) {
          console.error('Alternative ad loading failed:', error);
          setShowFallback(true);
        }
      };

      loadAlternativeAd();
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
      
      {/* Main ad container */}
      <div ref={adRef} className="ad-container">
        {!adBlockDetected && (
          <div>
            <ins className="eas6a97888e10" data-zoneid={zoneId}></ins>
          </div>
        )}
      </div>

      {/* Invisible fallback content */}
      {(adBlockDetected && showFallback) && (
        fallbackContent || <InvisibleFallback />
      )}
    </div>
  );
};

export default AdBlockerBypass;
