import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Eye, ThumbsUp, MoreVertical, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import LazyImage from '@/components/LazyImage';
import AdComponent from '@/components/AdComponent';
import VerificationBadge from './VerificationBadge';
import MomentsCarousel from './MomentsCarousel';
import { useBandwidthOptimization } from '@/hooks/useBandwidthOptimization';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Crown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import VideoCard from '@/components/VideoCard';

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
  showPremiumSection?: boolean;
  showTags?: boolean;
  showDate?: boolean;
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

const OptimizedVideoCard: React.FC<{ video: LightVideo; viewMode?: 'grid' | 'list' }> = React.memo(({
  video,
  viewMode = 'grid'
}) => {
  const queryClient = useQueryClient();
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
  const [isAddingToWatchLater, setIsAddingToWatchLater] = useState(false);

  const { data: isInWatchLater, isLoading: isLoadingWatchLater } = useQuery({
    queryKey: ['watchLaterStatus', video.id],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      const { data, error } = await supabase
        .from('watch_later')
        .select('video_id')
        .eq('user_id', user.id)
        .eq('video_id', video.id);
      if (error) {
        console.error('Error checking watch later status:', error);
        return false;
      }
      return data && data.length > 0;
    },
    enabled: !!video.id, // Only run if video.id is available
    staleTime: 60 * 1000, // 1 minute
  });

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

    if (isLoadingWatchLater || isAddingToWatchLater) return;

    setIsAddingToWatchLater(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        console.error('Error getting user:', userError);
        setIsAddingToWatchLater(false);
        return;
      }

      if (!user) {
        alert('Please sign in to use Watch Later');
        setIsAddingToWatchLater(false);
        return;
      }

      if (isInWatchLater) {
        // Remove from watch later
        console.log('Removing from watch later:', video.title);
        const { error } = await supabase
          .from('watch_later')
          .delete()
          .eq('user_id', user.id)
          .eq('video_id', video.id);

        if (error) {
          console.error('Error removing from watch later:', error);
          alert('Failed to remove from Watch Later: ' + error.message);
        } else {
          console.log('Successfully removed from watch later:', video.title);
          queryClient.invalidateQueries({ queryKey: ['watchLaterStatus', video.id] });
          queryClient.invalidateQueries({ queryKey: ['watchLaterVideos'] }); // Invalidate if you have a list of all watch later videos
        }
      } else {
        // Add to watch later
        console.log('Adding to watch later:', video.title);
        const { error } = await supabase
          .from('watch_later')
          .insert({
            user_id: user.id,
            video_id: video.id
          });

        if (error) {
          console.error('Error adding to watch later:', error);
          if (error.code === '23505') {
            alert('Already in Watch Later');
          } else {
            alert('Failed to add to Watch Later: ' + error.message);
          }
        } else {
          console.log('Successfully added to watch later:', video.title);
          queryClient.invalidateQueries({ queryKey: ['watchLaterStatus', video.id] });
          queryClient.invalidateQueries({ queryKey: ['watchLaterVideos'] });
        }
      }
    } catch (error) {
      console.error('Error in OptimizedGrid handleWatchLater:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsAddingToWatchLater(false);
    }
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
          onError={(e) => {
            console.log('Thumbnail failed to load for video:', video.id, video.thumbnail_url);
            // Set fallback image
            e.currentTarget.src = 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=400&h=300&fit=crop';
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
                onError={(e) => {
                  console.log('Thumbnail failed to load for video:', video.id, video.thumbnail_url);
                  // Set fallback image
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=300&h=200&fit=crop';
                }}
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
                    <DropdownMenuItem onClick={handleWatchLater} disabled={isAddingToWatchLater || isLoadingWatchLater}>
                      {isAddingToWatchLater ? (
                        <>
                          <div className="w-3 h-3 mr-2 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                          {isInWatchLater ? 'Removing...' : 'Adding...'}
                        </>
                      ) : isInWatchLater ? (
                        <>
                          <Trash2 className="w-3 h-3 mr-2" />
                          Remove from Watch Later
                        </>
                      ) : (
                        <>
                          <Plus className="w-3 h-3 mr-2" />
                          Add to Watch Later
                        </>
                      )}
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
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  // grid mode
  return (
    <Link
      to={`/video/${video.id}`}
      className="block w-full group hover:bg-muted/5 transition-all duration-200"
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
            onError={(e) => {
              console.log('Thumbnail failed to load for video:', video.id, video.thumbnail_url);
              // Set fallback image
              e.currentTarget.src = 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=400&h=300&fit=crop';
            }}
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
                <DropdownMenuItem onClick={handleWatchLater} disabled={isAddingToWatchLater || isLoadingWatchLater}>
                  {isAddingToWatchLater ? (
                    <>
                      <div className="w-3 h-3 mr-2 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                      {isInWatchLater ? 'Removing...' : 'Adding...'}
                    </>
                  ) : isInWatchLater ? (
                    <>
                      <Trash2 className="w-3 h-3 mr-2" />
                      Remove from Watch Later
                    </>
                  ) : (
                    <>
                      <Plus className="w-3 h-3 mr-2" />
                      Add to Watch Later
                    </>
                  )}
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
    </Link>
  );
});

// Mock hook for useIntersectionObserver
const useIntersectionObserver = (callback: () => void, options?: IntersectionObserverInit) => {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementRef = useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            callback();
          }
        });
      },
      options
    );

    if (elementRef.current) {
      observerRef.current.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observerRef.current?.unobserve(elementRef.current);
      }
      observerRef.current = null;
    };
  }, [callback, options]);

  return elementRef;
};

// Mock component for LazyAdComponent
const LazyAdComponent = ({ zoneId }: { zoneId: string }) => {
  return <AdComponent zoneId={zoneId} className="w-full" />;
};

// Function to fetch premium videos
const fetchPremiumVideos = async (): Promise<LightVideo[]> => {
  const { data, error } = await supabase
    .from('videos')
    .select(`
      *,
      profiles (
        id,
        username,
        full_name,
        avatar_url,
        user_type
      )
    `)
    .eq('is_premium', true)
    .order('created_at', { ascending: false })
    .limit(6);

  if (error) {
    console.error('Error fetching premium videos:', error);
    return [];
  }

  // Transform data to match LightVideo interface
  return (data || []).map(video => ({
    ...video,
    description: video.description || undefined,
    thumbnail_url: video.thumbnail_url || undefined,
    preview_url: video.preview_url || undefined,
    video_url: video.video_url || '',
    duration: video.duration || '0:00',
    views: video.views || 0,
    likes: video.likes || 0,
    tags: video.tags || [],
    uploader_username: video.profiles?.username || 'Creator',
    uploader_name: video.profiles?.full_name || video.profiles?.username || 'Creator',
    uploader_avatar: video.profiles?.avatar_url,
    uploader_type: video.profiles?.user_type || 'user',
    uploader_id: video.profiles?.id
  }));
};

const OptimizedVideoGrid: React.FC<OptimizedVideoGridProps> = ({
  videos,
  viewMode = 'grid',
  showAds = false,
  showMoments = true,
  showPremiumSection = true,
  showTags = true,
  showDate = false
}) => {
  // ALL HOOKS MUST BE AT THE TOP - BEFORE ANY CONDITIONAL LOGIC

  // Fetch premium videos when showPremiumSection is true
  const { data: premiumVideos = [] } = useQuery({
    queryKey: ['premium-videos-grid'],
    queryFn: fetchPremiumVideos,
    enabled: showPremiumSection,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const [visibleCount, setVisibleCount] = useState(60); // Show all fetched videos initially
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Filter out videos with missing essential data first
  const validVideos = videos?.filter(video =>
    video &&
    video.id &&
    video.title &&
    typeof video.views === 'number' &&
    typeof video.likes === 'number'
  ) || [];

  // Process unique videos after validation
  const uniqueVideos = validVideos.filter(
    (video, index, self) => index === self.findIndex((v) => v.id === video.id)
  );

  // Intersection observer for infinite loading
  const loadMoreRef = useIntersectionObserver(
    () => {
      if (visibleCount < uniqueVideos.length && !isLoadingMore) {
        setIsLoadingMore(true);
        // Batch load more videos
        setTimeout(() => {
          setVisibleCount(prev => Math.min(prev + 10, uniqueVideos.length));
          setIsLoadingMore(false);
        }, 100);
      }
    },
    { threshold: 0.1 }
  );

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

  // CONDITIONAL LOGIC AND EARLY RETURNS COME AFTER ALL HOOKS
  // Show videos immediately, auth loading doesn't block video display
  if (!videos || videos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No videos available</p>
      </div>
    );
  }

  const visibleVideos = uniqueVideos.slice(0, visibleCount);

  return (
    <div className="w-full">
      {viewMode === 'list' ? (
        <div className="space-y-4">
          {visibleVideos.map((video, index) => (
            <OptimizedVideoCard
              key={`${video.id}-${index}`}
              video={video}
              viewMode="list"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
            {visibleVideos.map((video, index) => {
              const elements = [];

              // Add the video card
              elements.push(
                <div key={`${video.id}-${index}`}>
                  <OptimizedVideoCard
                    video={video}
                    viewMode="grid"
                    showTags={showTags}
                    showDate={showDate}
                  />
                  {/* Show MomentsCarousel between videos 23-24 (after index 23) */}
                  {showMoments && index === 23 && (
                    <div className="col-span-full my-6">
                      <MomentsCarousel />
                    </div>
                  )}
                  {showAds && index > 0 && (index + 1) % 8 === 0 && (
                    <div className="mt-4">
                      <LazyAdComponent zoneId="5661270" />
                    </div>
                  )}
                </div>
              );

              // Insert premium videos section after video 40 (index 39) - no special styling
              if (showPremiumSection && index === 39 && premiumVideos.length > 0) {
                elements.push(
                  <div key="premium-section" className="col-span-full my-8">
                    <div className="space-y-4">
                      {/* Simple section header without premium styling */}
                      <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-foreground">
                          More Videos
                        </h2>
                        <Link to="/premium">
                          <Button variant="outline" className="group">
                            View more
                            <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </Link>
                      </div>

                      {/* Horizontal scrollable layout */}
                      <div className="relative">
                        <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4">
                          {premiumVideos.map((premiumVideo) => (
                            <div key={`premium-${premiumVideo.id}`} className="flex-shrink-0 w-64 relative">
                              <OptimizedVideoCard
                                video={{
                                  ...premiumVideo,
                                  video_url: premiumVideo.video_url || '',
                                  is_premium: false, // Hide premium indicators to match other videos
                                  tags: premiumVideo.tags?.filter(tag => tag.toLowerCase() !== 'premium') || [], // Remove premium tags
                                  uploader_username: premiumVideo.uploader_username || 'Creator',
                                  uploader_name: premiumVideo.uploader_name || premiumVideo.uploader_username || 'Creator',
                                  uploader_avatar: premiumVideo.uploader_avatar || premiumVideo.thumbnail_url,
                                }}
                                viewMode="grid"
                                showTags={showTags}
                                showDate={showDate}
                              />
                              {/* Crown icon overlay */}
                              <div className="absolute top-2 left-2 z-20">
                                <Crown className="w-4 h-4 text-yellow-400" />
                              </div>
                            </div>
                          ))}
                        </div>
                        {/* Gradient fade on right edge */}
                        <div className="absolute top-0 right-0 h-full w-20 bg-gradient-to-l from-background to-transparent pointer-events-none"></div>
                      </div>
                    </div>
                  </div>
                );
              }

              return elements;
            })}
          </div>
        </div>
      )}

      {/* Load more trigger */}
      {visibleCount < uniqueVideos.length && (
        <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
          {isLoadingMore && (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          )}
        </div>
      )}
    </div>
  );
};

export default OptimizedVideoGrid;