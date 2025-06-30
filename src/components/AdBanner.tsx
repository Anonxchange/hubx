
import React, { useEffect, useRef } from 'react';

interface AdBannerProps {
  admpid: string;
  className?: string;
}

const AdBanner: React.FC<AdBannerProps> = ({ admpid, className = '' }) => {
  const adRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    if (scriptLoadedRef.current) return;

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://js.mbidadm.com/static/scripts.js';
    script.setAttribute('data-admpid', admpid);
    
    script.onload = () => {
      scriptLoadedRef.current = true;
    };
    
    script.onerror = () => {
      console.warn('Failed to load ad script');
    };

    if (adRef.current) {
      adRef.current.appendChild(script);
    }

    return () => {
      if (adRef.current && script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [admpid]);

  return (
    <div 
      ref={adRef}
      className={`w-full flex justify-center items-center min-h-[90px] ${className}`}
      style={{ maxWidth: '100%' }}
    >
      {/* Ad content will be injected here */}
    </div>
  );
};

export default AdBanner;
