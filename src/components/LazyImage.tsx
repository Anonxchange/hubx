import React, { useState, useCallback } from 'react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useBandwidthOptimization } from '@/hooks/useBandwidthOptimization';

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { elementRef, hasIntersected } = useIntersectionObserver({ 
    triggerOnce: true,
    threshold: 0.1,
    rootMargin: '50px',
    skip: priority
  });
  const { getOptimizedImageUrl } = useBandwidthOptimization();

  const optimizedSrc = React.useMemo(() => 
    getOptimizedImageUrl(src, width, height), 
    [src, width, height, getOptimizedImageUrl]
  );

  const shouldLoad = priority || hasIntersected;
  const placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkxvYWRpbmcuLi48L3RleHQ+PC9zdmc+';

  return (
    <div ref={elementRef} className={`relative overflow-hidden ${className}`}>
      {/* Placeholder */}
      <img
        src={placeholder}
        alt=""
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          imageLoaded ? 'opacity-0' : 'opacity-100'
        }`}
        style={{ filter: 'blur(5px)' }}
      />

      {/* Actual Image */}
      {shouldLoad && (
        <img
          src={imageError ? placeholder : optimizedSrc}
          alt={alt}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${
            imageLoaded && !imageError ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImageError(true);
            setImageLoaded(true);
          }}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          width={width}
          height={height}
        />
      )}
    </div>
  );
};

export default LazyImage;