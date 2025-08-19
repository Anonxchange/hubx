import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ThumbsUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { LazyImage } from '@/components/LazyImage';
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
  uploader_type?: string;
  profiles?: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
    user_type: string;
  };
  preview_url?: string;
  video_url?: string;
}

interface RelatedVideoCardProps {
  video: Video;
  viewMode: 'grid' | 'list';
}

// Hook to detect if the device is mobile
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent;
    const mobile = /\b(android|iphone|ipad|ipod|windows phone|blackberry|opera mini|iemobile|mobile|tablet)\b/i.test(userAgent);
    setIsMobile(mobile);
  }, []);

  return isMobile;
};

const RelatedVideoCard: React.FC<RelatedVideoCardProps> = ({ video, viewMode }) => {
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

  // Generate computed preview URL based on video properties
  const computedPreviewUrl = React.useMemo(() => {
    if (video.preview_url) {
      // If preview_url is already provided and seems like a direct image/video URL
      if (/\.(webp|gif|jpg|jpeg|png|mp4|webm)$/i.test(video.preview_url)) {
        return video.preview_url;
      }
      // Handle cases where preview_url might be a base for generating the actual URL
      // Example: if preview_url is a timestamp or part of a CDN URL structure
      // This is a placeholder and might need adjustment based on actual data
      if (video.preview_url.includes('bunnycdn.com') || video.preview_url.includes('b-cdn.net')) {
        // Assuming previews are typically at 2 seconds for Bunny CDN videos
        return `${video.preview_url}#t=2`;
      }
    }
    // Fallback to thumbnail if no specific preview URL is available or usable
    return video.thumbnail_url || 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=200&h=120&fit=crop';
  }, [video.preview_url, video.thumbnail_url]);


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
          avatar_url: video.uploader_avatar,
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
          console.log('Profile not found for ID:', targetId);
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
  }, [video.owner_id, video.profiles, video.uploader_username, video.uploader_avatar, video.uploader_name, video.uploader_type]);

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
    setIsHovered(true);

    // Only load previews if bandwidth allows it
    if (!shouldLoadPreview) {
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
        setShowPreview(true);
        setIsVideoReady(true);
      } else if (isVideoPreview()) {
        // Video preview - start playing
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
    e.preventDefault();
    handleHoverStart(e);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
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

  return (
    <Link to={`/video/${video.id}`} className="block">
      <Card className="hover:bg-muted/5 transition-colors">
        <CardContent className={`p-3 ${viewMode === 'list' ? 'flex space-x-3' : ''}`}>
          <div 
            className={`relative bg-muted rounded-lg overflow-hidden flex-shrink-0 border border-border ${
              viewMode === 'grid' ? 'aspect-video mb-3' : 'w-24 h-16'
            }`}
            onMouseEnter={!isMobile ? handleHoverStart : undefined}
            onMouseLeave={!isMobile ? handleMouseLeave : undefined}
            onTouchStart={isMobile ? handleTouchStart : undefined}
            onTouchEnd={isMobile ? handleTouchEnd : undefined}
          >
            <LazyImage
              src={video.thumbnail_url || 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=200&h=120&fit=crop'}
              alt={video.title}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                (showPreview || (isHovered && isImagePreview())) ? 'opacity-0' : 'opacity-100'
              }`}
            />

            {/* Animated preview (WebP/GIF) */}
            {isImagePreview() && isHovered && (
              <img
                src={computedPreviewUrl!}
                alt={`${video.title} preview`}
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 opacity-100 z-10"
                onLoad={() => console.log('Image preview loaded:', computedPreviewUrl)}
                onError={(e) => console.error('Image load error:', e, computedPreviewUrl)}
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

            {video.duration && (
              <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
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

          <div className="flex-1 min-w-0">
            <h4 className={`font-medium line-clamp-2 mb-1 ${
              viewMode === 'grid' ? 'text-sm' : 'text-xs'
            }`}>
              {video.title}
            </h4>

            {/* Creator info with profile picture */}
            {!loading && creatorProfile && (
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-4 h-4 rounded-full overflow-hidden bg-muted flex-shrink-0">
                  <LazyImage
                    src={creatorProfile.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face'}
                    alt={creatorProfile.full_name || creatorProfile.username}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-xs text-muted-foreground truncate">
                  {creatorProfile.full_name || creatorProfile.username}
                </span>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              {formatViews(video.views || 0)} views
            </p>

            {viewMode === 'grid' && (
              <div className="flex items-center space-x-1 mt-1">
                <ThumbsUp className="w-3 h-3" />
                <span className="text-xs">{video.likes || 0}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default RelatedVideoCard;