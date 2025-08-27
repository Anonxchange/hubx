import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Eye, ThumbsUp, MoreVertical, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LazyImage } from '@/components/LazyImage';
import AdComponent from '@/components/AdComponent';
import { useAuth } from '@/contexts/AuthContext';
import VerificationBadge from './VerificationBadge';
import MomentsCarousel from './MomentsCarousel';
import { useBandwidthOptimization } from '@/hooks/useBandwidthOptimization';

// Define LightVideo interface here
interface LightVideo {
  id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  preview_url?: string;
  video_url?: string;
  duration: string;
  views: number;
  likes: number;
  tags: string[];
  created_at: string;
  is_premium?: boolean;
  uploader_username?: string;
  uploader_type?: 'user' | 'creator' | 'studio' | 'individual_creator' | 'studio_creator';
  uploader_profile_picture?: string;
  uploader_avatar?: string;
  uploader_name?: string;
  uploader_id?: string;
  owner_id?: string;
  is_moment?: boolean;
}

interface OptimizedVideoGridProps {
  videos: LightVideo[];
  viewMode?: 'grid' | 'list';
  showAds?: boolean;
  showMoments?: boolean;
}

// Global state to track active preview - only one video can preview at a time
let activePreviewCard: string | null = null;
const setActivePreviewCard = (cardId: string | null) => {
  activePreviewCard = cardId;
  // Dispatch event to notify other cards to stop their previews
  if (cardId) {
    window.dispatchEvent(new CustomEvent('activePreviewChanged', { detail: { activeCardId: cardId } }));
  }
};

const OptimizedVideoCard: React.FC<{ video: LightVideo; viewMode?: 'grid' | 'list' }> = ({
  video,
  viewMode = 'grid'
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [currentPreviewTime, setCurrentPreviewTime] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [touchStartTime, setTouchStartTime] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hoverTimeoutRef = useRef<number | null>(null);
  const previewCycleRef = useRef<number | null>(null);
  const touchTimeoutRef = useRef<number | null>(null);
  const cardId = useRef(`optimized-video-card-${video.id}-${Math.random()}`).current;
  const { shouldLoadPreview } = useBandwidthOptimization();

  // Listen for global stop preview events
  React.useEffect(() => {
    const handleActivePreviewChange = (event: CustomEvent) => {
      if (event.detail.activeCardId !== cardId) {
        stopPreview();
      }
    };

    window.addEventListener('activePreviewChanged', handleActivePreviewChange as EventListener);
    return () => {
      window.removeEventListener('activePreviewChanged', handleActivePreviewChange as EventListener);
      stopPreview(); // Cleanup on unmount
    };
  }, [cardId]);

  // Detect mobile device
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const handleWatchLater = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    console.log('Adding to watch later:', video.title);
  };

  const isImagePreview = (url: string) => {
    if (!url || url.trim() === '') {
      console.log('DEBUG: Empty or null URL for image preview check');
      return false;
    }
    const isImage = /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(url);
    console.log('DEBUG: isImagePreview check:', { url, isImage });
    return isImage;
  };

  const isVideoPreview = (url: string) => {
    if (!url || url.trim() === '') return false;
    return /\.(mp4|mov|webm)(\?.*)?$/i.test(url);
  };

  const isValidUrl = (url: string) => {
    if (!url || url.trim() === '') {
      console.log('DEBUG: URL is empty or null:', url);
      return false;
    }
    
    // Handle relative URLs, data URLs, and blob URLs
    if (url.startsWith('/') || url.startsWith('data:') || url.startsWith('blob:')) {
      console.log('DEBUG: Valid relative/data/blob URL:', url);
      return true;
    }
    
    // Handle HTTP/HTTPS URLs
    if (url.startsWith('http://') || url.startsWith('https://')) {
      try {
        new URL(url);
        console.log('DEBUG: Valid HTTP URL:', url);
        return true;
      } catch (e) {
        console.log('DEBUG: Invalid HTTP URL:', url, e);
        return false;
      }
    }
    
    // Handle URLs without protocol (assume https)
    if (url.includes('.') && !url.includes(' ')) {
      try {
        new URL('https://' + url);
        console.log('DEBUG: Valid URL without protocol:', url);
        return true;
      } catch (e) {
        console.log('DEBUG: Invalid URL even with https prefix:', url, e);
        return false;
      }
    }
    
    console.log('DEBUG: URL validation failed for:', url);
    return false;
  };

  const startPreview = () => {
    if (!shouldLoadPreview) return;

    // Stop any currently active preview immediately
    if (activePreviewCard && activePreviewCard !== cardId) {
      setActivePreviewCard(null);
    }

    // ONLY show image previews (WebP, GIF) - NO video previews
    if (computedPreviewUrl && isValidUrl(computedPreviewUrl) && isImagePreview(computedPreviewUrl)) {
      console.log('DEBUG: Image preview - showing immediately');
      setActivePreviewCard(cardId);
      setShowPreview(true);
      return;
    }

    // No video previews allowed - skip if not an image
    console.log('DEBUG: No WebP/image preview available - skipping preview');
    return;
  };

  const stopPreview = () => {
    setIsHovered(false);
    setShowPreview(false);
    setCurrentPreviewTime(0);

    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (previewCycleRef.current) {
      clearInterval(previewCycleRef.current);
      previewCycleRef.current = null;
    }
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
      touchTimeoutRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      videoRef.current.src = '';
    }

    // Clear active preview if it's this card
    if (activePreviewCard === cardId) {
      setActivePreviewCard(null);
    }
  };

  const handleMouseEnter = () => {
    if (isMobile) return; // Don't handle mouse events on mobile
    setIsHovered(true);
    
    // Only start preview if we have a valid image preview URL
    if (computedPreviewUrl && isValidUrl(computedPreviewUrl) && isImagePreview(computedPreviewUrl)) {
      startPreview();
    }
  };

  const handleMouseLeave = () => {
    if (isMobile) return; // Don't handle mouse events on mobile
    stopPreview();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartTime(Date.now());

    // Stop any other active previews first
    if (activePreviewCard && activePreviewCard !== cardId) {
      setActivePreviewCard(null);
    }

    // ONLY show WebP/image previews on touch
    if (computedPreviewUrl && isValidUrl(computedPreviewUrl) && isImagePreview(computedPreviewUrl)) {
      setActivePreviewCard(cardId);
      setIsHovered(true);
      setShowPreview(true);

      // Auto-hide after 8 seconds to allow clicking
      setTimeout(() => {
        if (activePreviewCard === cardId) {
          stopPreview();
        }
      }, 8000);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndTime = Date.now();
    const touchDuration = touchStartTime ? touchEndTime - touchStartTime : 0;

    // Clear the preview timeout for quick taps
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
      touchTimeoutRef.current = null;
    }

    // If it's a quick tap (less than 200ms), allow immediate navigation
    if (touchDuration < 200) {
      if (!(video.preview_url && isImagePreview(video.preview_url))) {
        stopPreview();
      }
      return;
    }

    // Prevent default only for longer touches to show preview
    if (touchDuration >= 200) {
      e.preventDefault();
    }
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

  // Cache preview URL computation
  const computedPreviewUrl = React.useMemo(() => {
    if (video.preview_url && video.preview_url.trim() !== '') {
      return video.preview_url;
    }
    
    // Try to generate preview URL from Bunny Stream video URL
    if (video.video_url && video.video_url.includes('vz-a3bd9097-45c.b-cdn.net')) {
      // Extract video ID from HLS URL like: https://vz-a3bd9097-45c.b-cdn.net/04c24b96-ad5f-4c61-ab1b-990f186dc4ce/playlist.m3u8
      const match = video.video_url.match(/vz-a3bd9097-45c\.b-cdn\.net\/([a-f0-9\-]+)/i);
      if (match && match[1]) {
        const videoId = match[1];
        return `https://vz-a3bd9097-45c.b-cdn.net/${videoId}/preview.webp`;
      }
    }
    
    return null;
  }, [video.preview_url, video.video_url]);

  const renderPreview = () => {
    // ONLY show WebP/image/gif previews - NO video previews
    if ((isHovered || showPreview) && computedPreviewUrl && isValidUrl(computedPreviewUrl) && isImagePreview(computedPreviewUrl)) {
      return (
        <img
          src={computedPreviewUrl}
          alt={`${video.title} preview`}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-200 z-10"
          loading="lazy"
          decoding="async"
          style={{ 
            imageRendering: 'auto',
            opacity: 1
          }}
          onError={() => {
            // Silently fail if preview doesn't exist
            setShowPreview(false);
          }}
        />
      );
    }

    return null;
  };

  if (viewMode === 'list') {
    return (
      <Link to={`/video/${video.id}`} className="block w-full">
        <Card className="hover:bg-muted/5 transition-colors">
          <CardContent className="p-3 flex space-x-3">
            {/* thumbnail + preview */}
            <div
              className="relative bg-muted rounded-lg overflow-hidden flex-shrink-0"
              style={{ 
                aspectRatio: '16/9',
                touchAction: 'manipulation',
                WebkitTouchCallout: 'none'
              }}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onTouchStart={isMobile ? handleTouchStart : undefined}
              onTouchEnd={isMobile ? handleTouchEnd : undefined}
            >
              <LazyImage
                src={
                  video.thumbnail_url ||
                  'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=300&h=200&fit=crop'
                }
                alt={video.title}
                width={400}
                height={300}
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  showPreview ? 'opacity-0' : 'opacity-100'
                }`}
              />
              {renderPreview()}
              <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                {video.duration}
              </div>
            </div>
            {/* details */}
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold text-lg line-clamp-2 leading-tight">{video.title}</h3>
              {video.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{video.description}</p>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {video.uploader_avatar ? (
                    <LazyImage
                      src={video.uploader_avatar}
                      alt={video.uploader_name || video.uploader_username || 'Unknown User'}
                      width={24}
                      height={24}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-xs text-white font-bold">
                      {(video.uploader_name || video.uploader_username || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm text-muted-foreground font-medium">
                    {video.uploader_name || video.uploader_username || 'Unknown User'}
                  </span>
                  {(video.uploader_type === 'individual_creator' || video.uploader_type === 'studio_creator') && (
                    <VerificationBadge userType={video.uploader_type} showText={false} size="small" />
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="p-1 rounded-full hover:bg-muted transition-colors"
                      onClick={handleActionClick}
                    >
                      <MoreVertical className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleWatchLater}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add to Watch Later
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
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
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  // grid mode
  return (
    <Link to={`/video/${video.id}`} className="block w-full">
      <div
        className="group hover:bg-muted/5 transition-all duration-200 w-full"
      >
        <div
          className="relative bg-muted overflow-hidden rounded-xl w-full"
          style={{ 
            aspectRatio: '16/9', 
            height: 'auto',
            touchAction: 'manipulation'
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onTouchStart={isMobile ? handleTouchStart : undefined}
          onTouchEnd={isMobile ? handleTouchEnd : undefined}
        >
          <LazyImage
            src={
              video.thumbnail_url ||
              'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=400&h=300&fit=crop'
            }
            alt={video.title}
            width={400}
            height={300}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              showPreview ? 'opacity-0' : 'opacity-100'
            }`}
          />
          {renderPreview()}
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
            {video.duration}
          </div>

          {/* Special quality/format badges */}
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            {video.tags.some(tag => ['vr', 'virtual reality'].includes(tag.toLowerCase())) && (
              <div className="bg-gradient-to-r from-green-500 to-teal-500 text-white text-xs px-2 py-1 rounded font-bold min-w-[40px] text-center">
                🥽 VR
              </div>
            )}
            {!video.tags.some(tag => ['vr', 'virtual reality'].includes(tag.toLowerCase())) &&
              video.tags.some(tag => tag.toLowerCase() === '4k') && (
              <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs px-2 py-1 rounded font-bold min-w-[40px] text-center">
                4K
              </div>
            )}
          </div>
        </div>
        <div className="pt-3 space-y-2">
          <h3 className="font-semibold text-sm line-clamp-2 leading-tight text-foreground">{video.title}</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {video.uploader_avatar ? (
                <LazyImage
                  src={video.uploader_avatar}
                  alt={video.uploader_name || video.uploader_username || 'Unknown User'}
                  width={20}
                  height={20}
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-xs text-white font-bold">
                  {(video.uploader_name || video.uploader_username || 'U')[0].toUpperCase()}
                </div>
              )}
              <span className="text-xs text-muted-foreground">
                {video.uploader_name || video.uploader_username || 'Unknown User'}
              </span>
              {(video.uploader_type === 'individual_creator' || video.uploader_type === 'studio_creator') && (
                <VerificationBadge userType={video.uploader_type} showText={false} size="small" />
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-1 rounded-full hover:bg-muted transition-colors"
                  onClick={handleActionClick}
                >
                  <MoreVertical className="w-3 h-3 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleWatchLater}>
                  <Plus className="w-3 h-3 mr-2" />
                  Add to Watch Later
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            <span className="flex items-center">
              <Eye className="w-3 h-3 mr-1" />
              {formatViews(video.views)} views
            </span>
            <span className="flex items-center">
              <ThumbsUp className="w-3 h-3 mr-1" />
              {video.likes || 0}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

const OptimizedVideoGrid: React.FC<OptimizedVideoGridProps> = ({
  videos,
  viewMode = 'grid',
  showAds = false,
  showMoments = false
}) => {
  // Remove auth loading dependency to speed up initial render

  // Skeleton loading component
  const SkeletonCard = () => (
    <div className="animate-pulse">
      <div className="bg-muted rounded-xl w-full" style={{ aspectRatio: '16/9' }}></div>
      <div className="pt-3 space-y-2">
        <div className="h-4 bg-muted rounded w-3/4"></div>
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 bg-muted rounded-full"></div>
          <div className="h-3 bg-muted rounded w-1/3"></div>
        </div>
        <div className="h-3 bg-muted rounded w-1/2"></div>
      </div>
    </div>
  );

  // Show videos immediately, auth loading doesn't block video display
  if (!videos || videos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No videos available</p>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">No videos found</h2>
        <p className="text-muted-foreground">Try adjusting your search or browse different categories.</p>
      </div>
    );
  }

  const uniqueVideos = videos.filter(
    (video, index, self) => index === self.findIndex((v) => v.id === video.id)
  );

  return (
    <div
      className={viewMode === 'grid' ? 'w-full max-w-none' : 'space-y-3'}
      style={{
        display: viewMode === 'grid' ? 'grid' : 'block',
        gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(320px, 1fr))' : undefined,
        gap: viewMode === 'grid' ? '20px' : undefined
      }}
    >
      {uniqueVideos.map((video, index) => (
        <div key={`video-fragment-${video.id}`}>
          {!video.is_moment && (
            <>
              <OptimizedVideoCard video={video} viewMode={viewMode} />
              {showMoments && index === 22 && (
                <div className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4">
                  <MomentsCarousel />
                </div>
              )}
              {showAds && (index + 1) % 12 === 0 && (
                <div className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4">
                  <AdComponent zoneId="5661270" className="w-full" />
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default OptimizedVideoGrid;