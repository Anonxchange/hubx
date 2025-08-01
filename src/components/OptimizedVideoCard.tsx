import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Eye, ThumbsUp, Wifi } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface Video {
  id: string;
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  preview_url?: string;
  duration: string;
  views: number;
  likes: number;
  tags: string[];
  created_at: string;
}

interface VideoCardProps {
  video: Video;
  viewMode?: 'grid' | 'list';
}

const OptimizedVideoCard: React.FC<VideoCardProps> = ({ video, viewMode = 'grid' }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [connectionSpeed, setConnectionSpeed] = useState<'slow' | 'medium' | 'fast'>('medium');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Detect connection speed and disable previews on slow connections
  useEffect(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const effectiveType = connection?.effectiveType;
      
      switch (effectiveType) {
        case 'slow-2g':
        case '2g':
          setConnectionSpeed('slow');
          break;
        case '3g':
          setConnectionSpeed('medium');
          break;
        case '4g':
        default:
          setConnectionSpeed('fast');
          break;
      }
    }
  }, []);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!cardRef.current) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { 
        threshold: 0.1,
        rootMargin: '50px' // Load 50px before entering viewport
      }
    );
    
    observer.observe(cardRef.current);
    
    return () => observer.disconnect();
  }, []);

  // Optimized thumbnail URL with size parameters
  const getOptimizedThumbnail = (url?: string, width = 400, height = 300): string => {
    if (!url) return `https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=${width}&h=${height}&fit=crop&auto=format&q=75`;
    
    // For Bunny CDN or similar services
    if (url.includes('bunnycdn.com') || url.includes('b-cdn.net')) {
      return `${url}?width=${width}&height=${height}&quality=75`;
    }
    
    // For other CDNs, append optimization parameters if supported
    return url;
  };

  const shouldShowPreview = (): boolean => {
    // Only show previews on fast connections and when intersecting
    return connectionSpeed === 'fast' && isIntersecting && !!(video.preview_url || video.video_url);
  };

  const handleMouseEnter = () => {
    if (!shouldShowPreview()) return;
    
    setIsHovered(true);
    
    // Increased delay to prevent unnecessary loads on quick hovers
    hoverTimeoutRef.current = setTimeout(() => {
      if (isHovered && shouldShowPreview()) {
        setShowPreview(true);
        loadPreview();
      }
    }, 1200); // Increased delay
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowPreview(false);
    setPreviewLoaded(false);
    
    // Clear timeouts
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
        previewTimeoutRef.current = null;
      }
      
      // Stop and clear video
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
        videoRef.current.removeAttribute('src');
        videoRef.current.load();
      }
  };

  const loadPreview = () => {
    if (!videoRef.current || previewLoaded) return;
    
    // Use preview URL if available, otherwise use main video with optimized loading
    const previewUrl = video.preview_url && video.preview_url.trim() !== '' 
      ? video.preview_url 
      : video.video_url;
    
    videoRef.current.src = previewUrl;
    
    // For main video previews, start at a specific time to avoid loading the entire video
    if (!video.preview_url || video.preview_url.trim() === '') {
      videoRef.current.currentTime = 10; // Start at 10 seconds
    }
    
    videoRef.current.play().then(() => {
      setPreviewLoaded(true);
    }).catch((error) => {
      console.error('Preview play failed:', error);
    });
  };

  // Optimized format functions
  const formatViews = (views: number): string => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // List view rendering
  if (viewMode === 'list') {
    return (
      <div ref={cardRef}>
        <Link to={`/video/${video.id}`} className="block">
          <Card className="hover:bg-muted/5 transition-colors">
            <CardContent className="p-4 flex space-x-4">
              <div 
                className="relative w-48 h-28 bg-muted rounded overflow-hidden flex-shrink-0"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                {/* Lazy loaded thumbnail */}
                {isIntersecting && (
                  <img
                    src={getOptimizedThumbnail(video.thumbnail_url, 192, 112)}
                    alt={video.title}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${showPreview ? 'opacity-0' : 'opacity-100'}`}
                    loading="lazy"
                    decoding="async"
                  />
                )}
                
                {/* Preview video (only on fast connections) */}
                {shouldShowPreview() && showPreview && (
                  <video
                    ref={videoRef}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${showPreview ? 'opacity-100' : 'opacity-0'}`}
                    muted
                    loop={!!video.preview_url}
                    playsInline
                    preload="none"
                  />
                )}
                
                <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                  {video.duration}
                </div>
                
                {/* Connection indicator */}
                {connectionSpeed === 'slow' && (
                  <div className="absolute top-1 left-1">
                    <Wifi className="h-3 w-3 text-orange-400" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 space-y-2">
                <h3 className="font-semibold text-lg line-clamp-2 leading-tight">
                  {video.title}
                </h3>
                {video.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {video.description}
                  </p>
                )}
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span className="flex items-center">
                    <Eye className="w-4 h-4 mr-1" />
                    {formatViews(video.views)} views
                  </span>
                  <span className="flex items-center">
                    <ThumbsUp className="w-4 h-4 mr-1" />
                    {video.likes || 0}
                  </span>
                  <span>{formatDate(video.created_at)}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {video.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {video.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{video.tags.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    );
  }

  // Grid view rendering
  return (
    <div ref={cardRef}>
      <Link to={`/video/${video.id}`} className="block">
        <Card className="group hover:shadow-lg transition-all duration-200 overflow-hidden">
          <div 
            className="relative aspect-video bg-muted overflow-hidden"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {/* Lazy loaded thumbnail */}
            {isIntersecting && (
              <img
                src={getOptimizedThumbnail(video.thumbnail_url, 400, 225)}
                alt={video.title}
                className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-300 ${showPreview ? 'opacity-0' : 'opacity-100'}`}
                loading="lazy"
                decoding="async"
              />
            )}
            
            {/* Preview video (only on fast connections) */}
            {shouldShowPreview() && showPreview && (
              <video
                ref={videoRef}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${showPreview ? 'opacity-100' : 'opacity-0'}`}
                muted
                loop={!!video.preview_url}
                playsInline
                preload="none"
              />
            )}
            
            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
              {video.duration}
            </div>
            
            {/* Connection speed indicator */}
            {connectionSpeed === 'slow' && (
              <div className="absolute top-2 left-2">
                <Wifi className="h-4 w-4 text-orange-400" />
              </div>
            )}
            
            {/* Preview indicator */}
            {showPreview && previewLoaded && (
              <div className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-xs px-2 py-1 rounded animate-fade-in">
                {video.preview_url ? 'Preview' : 'Quick Preview'}
              </div>
            )}
          </div>
          
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold line-clamp-2 leading-tight group-hover:text-primary transition-colors">
              {video.title}
            </h3>
            
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center space-x-3">
                <span className="flex items-center">
                  <Eye className="w-3 h-3 mr-1" />
                  {formatViews(video.views)}
                </span>
                <span className="flex items-center">
                  <ThumbsUp className="w-3 h-3 mr-1" />
                  {video.likes || 0}
                </span>
              </div>
              <span className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {formatDate(video.created_at)}
              </span>
            </div>
            
            <div className="flex flex-wrap gap-1">
              {video.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {video.tags.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{video.tags.length - 2}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
};

export default OptimizedVideoCard;
