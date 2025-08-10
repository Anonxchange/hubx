
import React, { useEffect, useRef } from 'react';

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

  useEffect(() => {
    const initializeAd = () => {
      if (isInitialized.current) return;
      
      try {
        // Ensure AdProvider array exists
        if (!window.AdProvider) {
          window.AdProvider = [];
        }
        
        console.log(`Initializing ad for zone ${zoneId}`);
        window.AdProvider.push({"serve": {}});
        isInitialized.current = true;
      } catch (error) {
        console.error(`Error initializing ad for zone ${zoneId}:`, error);
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(initializeAd, 500);
    
    return () => {
      clearTimeout(timer);
    };
  }, [zoneId]);

  return (
    <div className={`w-full flex justify-center md:hidden ${className}`} ref={adRef}>
      <div>
        <ins className="eas6a97888e10" data-zoneid={zoneId}></ins>
      </div>
    </div>
  );
};

export default AdComponent;
