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
  const { shouldLoadPreview } = useBandwidthOptimization();

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
    if (!url || url.trim() === '') return false;
    return /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(url);
  };
  
  const isVideoPreview = (url: string) => {
    if (!url || url.trim() === '') return false;
    return /\.(mp4|mov|webm)(\?.*)?$/i.test(url);
  };

  const isValidUrl = (url: string) => {
    if (!url || url.trim() === '') return false;
    try {
      // Handle relative URLs and data URLs
      if (url.startsWith('/') || url.startsWith('data:') || url.startsWith('blob:')) {
        return true;
      }
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const startPreview = () => {
    if (!shouldLoadPreview) return;

    hoverTimeoutRef.current = window.setTimeout(() => {
      setShowPreview(true);

      if (videoRef.current) {
        const hasValidPreview = video.preview_url && isValidUrl(video.preview_url);
        const hasValidVideo = video.video_url && isValidUrl(video.video_url);
        
        if (hasValidPreview && isVideoPreview(video.preview_url)) {
          videoRef.current.src = video.preview_url;
          videoRef.current.currentTime = 0;
          videoRef.current.muted = true;
          videoRef.current.play().catch((error) => {
            console.error('Video preview play failed:', error);
            setShowPreview(false);
          });
        } else if (hasValidVideo) {
          videoRef.current.src = video.video_url;
          videoRef.current.currentTime = 10;
          videoRef.current.muted = true;
          videoRef.current.play().catch((error) => {
            console.error('Main video preview play failed:', error);
            setShowPreview(false);
          });

          const previewTimes = [10, 30, 60, 90];
          let timeIndex = 0;

          previewCycleRef.current = window.setInterval(() => {
            timeIndex = (timeIndex + 1) % previewTimes.length;
            const newTime = previewTimes[timeIndex];
            setCurrentPreviewTime(newTime);

            if (videoRef.current) {
              videoRef.current.currentTime = newTime;
            }
          }, 3000);
        } else {
          setShowPreview(false);
        }
      }
    }, isMobile ? 100 : 500);
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
  };

  const handleMouseEnter = () => {
    if (isMobile) return; // Don't handle mouse events on mobile
    setIsHovered(true);
    startPreview();
  };

  const handleMouseLeave = () => {
    if (isMobile) return; // Don't handle mouse events on mobile
    stopPreview();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartTime(Date.now());
    
    // For image/webp previews, show immediately
    if (video.preview_url && isValidUrl(video.preview_url) && isImagePreview(video.preview_url)) {
      setIsHovered(true);
      
      // Auto-hide after 2 seconds to allow clicking
      setTimeout(() => {
        setIsHovered(false);
      }, 2000);
    } else {
      // For video previews, use longer delay
      touchTimeoutRef.current = window.setTimeout(() => {
        setIsHovered(true);
        startPreview();
        
        // Auto-hide preview after 3 seconds on mobile
        setTimeout(() => {
          stopPreview();
        }, 3000);
      }, 300);
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

  const renderPreview = () => {
    if (!showPreview && !isHovered) return null;

    // Show image/gif/webp previews immediately on hover
    if (video.preview_url && isValidUrl(video.preview_url) && isImagePreview(video.preview_url)) {
      return (
        <img
          src={video.preview_url}
          alt={`${video.title} preview`}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 z-10"
          loading="eager"
          style={{ 
            imageRendering: 'auto',
            opacity: isHovered ? 1 : 0 
          }}
          onLoad={() => {
            console.log('WebP/Image preview loaded successfully:', video.preview_url);
          }}
          onError={(e) => {
            console.error('Preview image failed to load:', video.preview_url, e);
            setShowPreview(false);
          }}
        />
      );
    }

    // Show video previews with proper handling
    const hasValidPreview = video.preview_url && isValidUrl(video.preview_url) && isVideoPreview(video.preview_url);
    const hasValidVideo = video.video_url && isValidUrl(video.video_url);
    
    if (showPreview && (hasValidPreview || hasValidVideo)) {
      return (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 z-10"
          muted
          playsInline
          preload="none"
          controls={false}
          onError={(e) => {
            console.error('Preview video failed to load:', video.preview_url || video.video_url, e);
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
              className="relative w-40 bg-muted rounded-lg overflow-hidden flex-shrink-0"
              style={{ 
                aspectRatio: '16/9',
                touchAction: 'manipulation'
              }}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onTouchStart={isMobile ? handleTouchStart : undefined}
              onTouchEnd={isMobile ? handleTouchEnd : undefined}
              style={{ 
                aspectRatio: '16/9',
                touchAction: 'manipulation',
                WebkitTouchCallout: 'none'
              }}
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
  const { loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="text-center py-12">
        <div className="w-8 h-8 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-muted-foreground">Loading...</p>
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