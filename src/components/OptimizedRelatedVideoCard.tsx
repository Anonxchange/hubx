import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, ThumbsUp, MoreVertical, Plus, Clock } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import LazyImage from '@/components/LazyImage';
import VerificationBadge from './VerificationBadge';
import { useBandwidthOptimization } from '@/hooks/useBandwidthOptimization';
import { supabase } from '@/integrations/supabase/client';

interface Video {
  id: string;
  title: string;
  thumbnail_url: string | null;
  duration: string | null;
  views: number | null;
  likes: number | null;
  owner_id?: string;
  uploader_username?: string;
  uploader_name?: string;
  uploader_avatar?: string;
  uploader_type?: 'user' | 'creator' | 'studio' | 'individual_creator' | 'studio_creator';
  uploader_profile_picture?: string;
  profiles?: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
    user_type: string;
  };
  preview_url?: string;
  video_url?: string;
  is_premium?: boolean; // Added to check for premium videos
}

interface OptimizedRelatedVideoCardProps {
  video: Video;
  viewMode?: 'grid' | 'list';
}

// Import the proper mobile hook
import { useIsMobile } from '@/hooks/use-mobile';

const OptimizedRelatedVideoCard: React.FC<OptimizedRelatedVideoCardProps> = ({
  video,
  viewMode = 'grid'
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [creatorProfile, setCreatorProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isInWatchLater, setIsInWatchLater] = useState(false);
  const [isAddingToWatchLater, setIsAddingToWatchLater] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { shouldLoadPreview } = useBandwidthOptimization();
  const isMobile = useIsMobile();
  const navigate = useNavigate(); // Hook to enable navigation

  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    }
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  // Fetch creator profile information
  useEffect(() => {
    const fetchCreatorProfile = async () => {
      setLoading(true);

      // Use the data already provided in the video object if available
      if (video.profiles) {
        setCreatorProfile({
          id: video.profiles.id,
          username: video.profiles.username,
          full_name: video.profiles.full_name || video.profiles.username,
          avatar_url: video.profiles.avatar_url,
          user_type: video.profiles.user_type
        });
        setLoading(false);
        return;
      }

      // If we have uploader info directly
      if (video.uploader_username) {
        setCreatorProfile({
          id: video.owner_id,
          username: video.uploader_username,
          full_name: video.uploader_name || video.uploader_username,
          avatar_url: video.uploader_avatar || video.uploader_profile_picture,
          user_type: video.uploader_type || 'user'
        });
        setLoading(false);
        return;
      }

      // Try to fetch from owner_id
      const targetId = video.owner_id;
      if (!targetId) {
        setCreatorProfile({
          id: 'unknown',
          username: 'Unknown User',
          full_name: 'Unknown User',
          avatar_url: null,
          user_type: 'user'
        });
        setLoading(false);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, user_type')
          .eq('id', targetId)
          .single();

        if (error || !profile) {
          setCreatorProfile({
            id: targetId,
            username: 'Unknown User',
            full_name: 'Unknown User',
            avatar_url: null,
            user_type: 'user'
          });
        } else {
          setCreatorProfile(profile);
        }
      } catch (error) {
        console.error('Error fetching creator profile:', error);
        setCreatorProfile({
          id: targetId,
          username: 'Unknown User',
          full_name: 'Unknown User',
          avatar_url: null,
          user_type: 'user'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCreatorProfile();
  }, [video.owner_id, video.profiles, video.uploader_username, video.uploader_avatar, video.uploader_name, video.uploader_type, video.uploader_profile_picture]);

  // Fetch watch later status
  useEffect(() => {
    const checkWatchLaterStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsInWatchLater(false);
          return;
        }

        const { data, error } = await supabase
          .from('watch_later')
          .select('id')
          .eq('user_id', user.id)
          .eq('video_id', video.id)
          .maybeSingle();

        if (error) {
          console.error('Error checking watch later status:', error);
          setIsInWatchLater(false);
        } else {
          setIsInWatchLater(!!data);
        }
      } catch (error) {
        console.error('Error checking watch later status:', error);
        setIsInWatchLater(false);
      }
    };
    checkWatchLaterStatus();
  }, [video.id]);

  const handleWatchLater = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isAddingToWatchLater) {
      return;
    }

    setIsAddingToWatchLater(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        console.error('Error getting user:', userError);
        return;
      }

      if (!user) {
        alert('Please sign in to use Watch Later');
        return;
      }

      if (isInWatchLater) {
        // Remove from watch later
        const { error } = await supabase
          .from('watch_later')
          .delete()
          .eq('user_id', user.id)
          .eq('video_id', video.id);

        if (error) {
          console.error('Error removing from watch later:', error);
          alert('Failed to remove from Watch Later');
        } else {
          setIsInWatchLater(false);
          alert('Removed from Watch Later');
        }
      } else {
        // Add to watch later
        const { error } = await supabase
          .from('watch_later')
          .insert({
            user_id: user.id,
            video_id: video.id
          });

        if (error) {
          console.error('Error adding to watch later:', error);
          if (error.code === '23505') {
            setIsInWatchLater(true);
            alert('Already in Watch Later');
          } else {
            alert('Failed to add to Watch Later: ' + error.message);
          }
        } else {
          setIsInWatchLater(true);
          alert('Added to Watch Later!');
        }
      }
    } catch (error) {
      console.error('Error in handleWatchLater:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsAddingToWatchLater(false);
    }
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Generate preview URL with timestamp for Bunny CDN videos
  const generateBunnyPreviewUrl = (videoUrl: string, time: number): string => {
    if (videoUrl.includes('bunnycdn.com') || videoUrl.includes('b-cdn.net')) {
      return `${videoUrl}#t=${time}`;
    }
    return videoUrl;
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


  const handleHoverStart = (event?: React.TouchEvent | React.MouseEvent) => {
    console.log('OptimizedRelatedVideoCard: Preview triggered for:', video.title);
    console.log('Original Preview URL:', video.preview_url, 'Computed Preview URL:', computedPreviewUrl);
    setIsHovered(true);

    // Only load previews if bandwidth allows it
    if (!shouldLoadPreview) {
      console.log('Preview blocked by bandwidth optimization');
      return;
    }

    // ONLY show WebP/image previews - NO video previews
    if (computedPreviewUrl && isValidUrl(computedPreviewUrl) && isImagePreview(computedPreviewUrl)) {
      console.log('DEBUG: Image preview - showing immediately');
      setShowPreview(true);
      setIsVideoReady(true);
      return;
    }

    // No video previews allowed - skip if not an image
    console.log('No preview options available for:', video.title);
    return;
  };

  const handleMouseLeave = (event?: React.TouchEvent | React.MouseEvent) => {
    setIsHovered(false);
    setShowPreview(false);

    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      videoRef.current.src = '';
    }

    setIsVideoLoading(false);
    setIsVideoReady(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    console.log('Touch start event triggered on mobile');
    
    // Check if this is a WebP/image preview - show immediately
    if (computedPreviewUrl && isValidUrl(computedPreviewUrl) && isImagePreview(computedPreviewUrl)) {
      console.log('WebP preview detected on touch for:', video.title);
      setIsHovered(true);
      setShowPreview(true);
      setIsVideoReady(true);

      // Auto-hide after 8 seconds to allow clicking
      setTimeout(() => {
        handleMouseLeave();
      }, 8000);
    } else {
      handleHoverStart(e);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    console.log('Touch end event triggered on mobile');
    // For WebP previews, don't auto-hide immediately on touch end
    if (!(computedPreviewUrl && isImagePreview(computedPreviewUrl))) {
      // For other content, shorter time
      setTimeout(() => handleMouseLeave(e), 3000);
    }
  };

  // Define the click handler for navigation
  const handleClick = () => {
    // Route to premium video page if it's a premium video
    if (video.is_premium) {
      navigate(`/premium/video/${video.id}`);
    } else {
      navigate(`/video/${video.id}`);
    }
  };

  return (
    <div onClick={handleClick} className="block w-full cursor-pointer"> {/* Changed Link to div and added onClick handler */}
      <div className="group hover:bg-muted/5 transition-all duration-200 w-full">
        <div
            className="relative bg-muted overflow-hidden rounded-xl w-full"
            style={{
              aspectRatio: '16/9',
              height: 'auto',
              touchAction: 'manipulation',
              WebkitTouchCallout: 'none',
              WebkitUserSelect: 'none',
              userSelect: 'none'
            }}
            onMouseEnter={handleHoverStart}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
          <LazyImage
            src={video.thumbnail_url || 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=300&h=200&fit=crop'}
            alt={video.title}
            width={300}
            height={200}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              (showPreview || (isHovered && isImagePreview())) ? 'opacity-0' : 'opacity-100'
            }`}
          />

          {/* ONLY show WebP/image/gif previews - NO video previews */}
          {(isHovered || showPreview) && computedPreviewUrl && isValidUrl(computedPreviewUrl) && isImagePreview(computedPreviewUrl) && (
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
          )}

          {/* Permanent dark gradient overlay at bottom - purely aesthetic */}
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />

          {/* Duration badge */}
          {video.duration && (
            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
              {video.duration}
            </div>
          )}

          {/* Loading indicator */}
          {showPreview && isVideoLoading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        <div className="pt-2 space-y-2">
          {/* Title in separate area below thumbnail */}
          <h3 className="font-semibold text-sm line-clamp-2 leading-tight text-foreground">
            {video.title}
          </h3>

          {/* Creator name with profile picture and verification badge */}
          {!loading && creatorProfile && (
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 rounded-full overflow-hidden bg-muted flex-shrink-0">
                <LazyImage
                  src={creatorProfile.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face'}
                  alt={creatorProfile.full_name || creatorProfile.username}
                  width={20}
                  height={20}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xs text-muted-foreground font-medium truncate">
                {creatorProfile.full_name || creatorProfile.username}
              </span>
              {(creatorProfile.user_type === 'individual_creator' || creatorProfile.user_type === 'studio_creator') && (
                <VerificationBadge
                  userType={creatorProfile.user_type}
                  showText={false}
                  size="small"
                />
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 text-xs text-muted-foreground">
              <span className="flex items-center">
                <Eye className="w-3 h-3 mr-1" />
                {formatViews(video.views || 0)}
              </span>
              <span className="flex items-center">
                <ThumbsUp className="w-3 h-3 mr-1" />
                {video.likes || 0}
              </span>
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
                <DropdownMenuItem onClick={handleWatchLater} disabled={isAddingToWatchLater}>
                  {isAddingToWatchLater ? (
                    <>
                      <div className="w-3 h-3 mr-2 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                      {isInWatchLater ? 'Removing...' : 'Adding...'}
                    </>
                  ) : isInWatchLater ? (
                    <>
                      <Clock className="w-3 h-3 mr-2" />
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
        </div>
      </div>
    </div>
  );
};

export default OptimizedRelatedVideoCard;