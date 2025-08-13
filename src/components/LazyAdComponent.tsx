import React, { useRef } from 'react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

interface LazyAdComponentProps {
  zoneId: string;
  className?: string;
  aspectRatio?: 'video' | 'banner';
}

const LazyAdComponent: React.FC<LazyAdComponentProps> = ({ 
  zoneId, 
  className = "",
  aspectRatio = 'banner'
}) => {
  const isInitialized = useRef(false);
  const { elementRef, hasIntersected } = useIntersectionObserver({ 
    triggerOnce: true,
    rootMargin: '100px'
  });

  React.useEffect(() => {
    if (hasIntersected && !isInitialized.current) {
      const initializeAd = () => {
        try {
          // Check if AdProvider is available
          if (window.AdProvider) {
            console.log(`Lazy loading ad for zone ${zoneId}`);
            window.AdProvider.push({
              "serve": {
                "zoneid": zoneId
              }
            });

            // Track lazy ad impression
            const impressionPixel = new Image();
            impressionPixel.src = `https://s.magsrv.com/v1/track.php?idzone=${zoneId}&type=lazy_impression&timestamp=${Date.now()}`;

            isInitialized.current = true;
          } else {
            console.warn(`AdProvider not available for zone ${zoneId}`);
          }
        } catch (error) {
          console.error(`Error initializing ad for zone ${zoneId}:`, error);
        }
      };

      // Delay to ensure proper loading
      const timer = setTimeout(initializeAd, 200);
      
      return () => {
        clearTimeout(timer);
      };
    }
  }, [hasIntersected, zoneId]);

  const aspectRatioClass = aspectRatio === 'video' ? 'aspect-video' : 'aspect-[728/90]';

  return (
    <div 
      ref={elementRef} 
      className={`w-full flex justify-center ${className}`}
    >
      {hasIntersected ? (
        <div>
          <ins className="eas6a97888e10" data-zoneid={zoneId}></ins>
        </div>
      ) : (
        <div className={`w-full bg-muted/20 rounded ${aspectRatioClass} flex items-center justify-center`}>
          <span className="text-muted-foreground text-sm">Advertisement</span>
        </div>
      )}
    </div>
  );
};

export default LazyAdComponent;