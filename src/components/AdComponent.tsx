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
  const [hasLoaded, setHasLoaded] = useState(false); // State to track if ad has loaded or timed out

  useEffect(() => {
    if (!zoneId || hasLoaded || isInitialized.current) return;

    // Reduce timeout to prevent blocking page load
    const timeoutId = setTimeout(() => {
      setHasLoaded(true);
    }, 2000); // Reduced from 5000ms to 2000ms

    const loadAd = () => {
      clearTimeout(timeoutId);

      try {
        // Ensure AdProvider array exists
        if (!window.AdProvider) {
          window.AdProvider = [];
        }

        window.AdProvider.push({"serve": {}});
        isInitialized.current = true;
        setHasLoaded(true);
      } catch (error) {
        setHasLoaded(true);
      }
    };

    // Use requestIdleCallback for better performance if available
    if ('requestIdleCallback' in window) {
      requestIdleCallback(loadAd, { timeout: 1000 });
    } else {
      // Fallback with minimal delay
      setTimeout(loadAd, 100);
    }

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