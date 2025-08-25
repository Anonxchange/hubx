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
    }, 3000);

    const loadAd = async () => {
      clearTimeout(timeoutId);

      try {
        // Standard ad loading (no adblocker detection)
        if (!window.AdProvider) {
          window.AdProvider = [];
        }

        window.AdProvider.push({
          serve: { zoneid: zoneId },
        });

        // Track impression
        const impressionPixel = new Image();
        const randomParam = Math.random().toString(36).substring(7);
        impressionPixel.src = `https://s.magsrv.com/v1/track.php?idzone=${zoneId}&type=impression&timestamp=${Date.now()}&r=${randomParam}`;

        isInitialized.current = true;
        setHasLoaded(true);
        console.log(`AdComponent loaded for zone ${zoneId}`);
      } catch (error) {
        console.error(`Error loading ad for zone ${zoneId}:`, error);
        setHasLoaded(true);
      }
    };

    setTimeout(loadAd, 500);
  }, [zoneId, hasLoaded]);

  return (
    <div className={`w-full flex justify-center md:hidden ${className}`} ref={adRef}>
      <div>
        <ins className="eas6a97888e10" data-zoneid={zoneId}></ins>
      </div>
    </div>
  );
};

export default AdComponent;