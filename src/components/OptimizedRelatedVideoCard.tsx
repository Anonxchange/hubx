import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, ThumbsUp } from 'lucide-react';
import { LazyImage } from '@/components/LazyImage';
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

  const videoRef = useRef<HTMLVideoElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { shouldLoadPreview } = useBandwidthOptimization();
  const isMobile = useIsMobile();
  const navigate = useNavigate(); // Hook to enable navigation

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

  // Generate preview URL with timestamp for Bunny CDN videos
  const generateBunnyPreviewUrl = (videoUrl: string, time: number): string => {
    if (videoUrl.includes('bunnycdn.com') || videoUrl.includes('b-cdn.net')) {
      return `${videoUrl}#t=${time}`;
    }
    return videoUrl;
  };

  // Check if we have a valid preview URL
  const hasValidPreviewUrl = () => {
    return video.preview_url && 
           typeof video.preview_url === 'string' && 
           video.preview_url.trim() !== '' &&
           video.preview_url !== 'undefined' &&
           video.preview_url !== 'null';
  };

  // Check if the preview URL is an image/animation
  const isImagePreview = () => {
    return hasValidPreviewUrl() && /\.(webp|gif|jpg|jpeg|png)$/i.test(video.preview_url!);
  };

  // Check if the preview URL is a video
  const isVideoPreview = () => {
    return hasValidPreviewUrl() && !/\.(webp|gif|jpg|jpeg|png)$/i.test(video.preview_url!);
  };

  const handleHoverStart = (event?: React.TouchEvent | React.MouseEvent) => {
    console.log('OptimizedRelatedVideoCard: Preview triggered for:', video.title);
    console.log('Preview URL:', video.preview_url, 'Type:', typeof video.preview_url);
    setIsHovered(true);

    // Only load previews if bandwidth allows it
    if (!shouldLoadPreview) {
      console.log('Preview blocked by bandwidth optimization');
      return;
    }

    // Only preload video if we have a valid preview URL
    if (videoRef.current && isVideoPreview()) {
      videoRef.current.src = video.preview_url!;
      videoRef.current.load();
    }

    // Show preview with appropriate delay
    hoverTimeoutRef.current = setTimeout(() => {
      if (isImagePreview()) {
        // Image/animation preview - show immediately
        console.log('Showing image preview for:', video.preview_url);
        setShowPreview(true);
        setIsVideoReady(true);
      } else if (isVideoPreview()) {
        // Video preview - start playing
        console.log('Starting video preview for:', video.preview_url);
        setShowPreview(true);
        setIsVideoReady(false);
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current.muted = true;
          videoRef.current.play().catch((error) => {
            console.error('Video preview play failed:', error);
            setShowPreview(false);
          });
        }
      } else {
        // No preview URL available - don't play any video
        console.log('No preview URL available for:', video.title, '- skipping video preview');
        setShowPreview(false);
      }
    }, event?.type === 'touchstart' ? 50 : 200);
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
    e.preventDefault();
    handleHoverStart(e);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    console.log('Touch end event triggered on mobile');
    e.preventDefault();
    setTimeout(() => handleMouseLeave(e), 3000);
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    }
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
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

          {/* Animated preview (WebP/GIF) */}
          {isImagePreview() && isHovered && (
            <img
              src={video.preview_url!}
              alt={`${video.title} preview`}
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 opacity-100 z-10"
              onLoad={() => console.log('Image preview loaded:', video.preview_url)}
              onError={(e) => console.error('Image load error:', e, video.preview_url)}
            />
          )}

          {/* Video preview */}
          {showPreview && isVideoPreview() && (
            <video
              ref={videoRef}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                showPreview && isVideoReady ? 'opacity-100' : 'opacity-0'
              }`}
              muted
              loop
              playsInline
              preload="metadata"
              controls={false}
              disablePictureInPicture
              autoPlay={false}
              onLoadStart={() => setIsVideoLoading(true)}
              onLoadedData={() => {
                setIsVideoReady(true);
                setIsVideoLoading(false);
              }}
              onCanPlay={() => {
                setIsVideoReady(true);
                setIsVideoLoading(false);
                if (showPreview && videoRef.current) {
                  videoRef.current.play().catch(console.error);
                }
              }}
              onWaiting={() => setIsVideoLoading(true)}
              onPlaying={() => setIsVideoLoading(false)}
              onError={(e) => {
                console.error('Video preview error:', e);
                setIsVideoLoading(false);
                setIsVideoReady(false);
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
        </div>
      </div>
    </div>
  );
};

export default OptimizedRelatedVideoCard;