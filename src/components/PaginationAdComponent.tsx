
import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    AdProvider: any[];
  }
}

const PaginationAdComponent: React.FC = () => {
  const adRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;

    const loadAd = async () => {
      try {
        // Initialize AdProvider if not exists
        if (!window.AdProvider) {
          window.AdProvider = [];
        }

        // Load the ad provider script if not already loaded
        if (!document.querySelector('script[src="https://a.magsrv.com/ad-provider.js"]')) {
          const script = document.createElement('script');
          script.async = true;
          script.type = 'application/javascript';
          script.src = 'https://a.magsrv.com/ad-provider.js';
          document.head.appendChild(script);
        }

        // Push ad configuration
        window.AdProvider.push({
          "serve": {}
        });

        isInitialized.current = true;
        console.log('Pagination ad loaded for zone 5660528');
      } catch (error) {
        console.error('Error loading pagination ad:', error);
      }
    };

    // Small delay to ensure proper loading
    const timer = setTimeout(loadAd, 500);
    
    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="hidden md:flex w-full justify-center mt-6" ref={adRef}>
      <div>
        <ins className="eas6a97888e2" data-zoneid="5660528"></ins>
      </div>
    </div>
  );
};

export default PaginationAdComponent;
