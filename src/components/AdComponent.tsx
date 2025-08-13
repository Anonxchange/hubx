import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    AdProvider: any[];
  }
}

interface AdComponentProps {
  zoneId: string;
  className?: string;
}

const AdComponent: React.FC<AdComponentProps> = ({ zoneId, className = "" }) => {
  const adRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (!zoneId || hasLoaded || isInitialized.current) return;

    const timeoutId = setTimeout(() => {
      setHasLoaded(true);
    }, 3000); // Increased timeout for better ad loading

    const loadAd = () => {
      clearTimeout(timeoutId);

      try {
        // Ensure AdProvider array exists
        if (!window.AdProvider) {
          window.AdProvider = [];
        }

        // Proper Exoclick ad serving with zone ID
        window.AdProvider.push({
          "serve": {
            "zoneid": zoneId
          }
        });

        // Track impression
        const impressionPixel = new Image();
        impressionPixel.src = `https://s.magsrv.com/v1/track.php?idzone=${zoneId}&type=impression&timestamp=${Date.now()}`;

        isInitialized.current = true;
        setHasLoaded(true);
        console.log(`AdComponent loaded for zone ${zoneId}`);
      } catch (error) {
        console.error(`Error loading ad for zone ${zoneId}:`, error);
        setHasLoaded(true);
      }
    };

    // Load ad immediately for mobile ads
    setTimeout(loadAd, 500);

  }, [zoneId, hasLoaded]);

  return (
    <div className={`w-full flex justify-center md:hidden ${className}`} ref={adRef}>
      <div>
        {/* The actual ad insertion point */}
        <ins className="eas6a97888e10" data-zoneid={zoneId}></ins>
      </div>
    </div>
  );
};

export default AdComponent;