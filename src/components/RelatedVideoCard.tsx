
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

  const handleHoverStart = (event?: React.TouchEvent | React.MouseEvent) => {
    setIsHovered(true);

    // Only load previews if bandwidth allows it
    if (!shouldLoadPreview) {
      return;
    }

    // Preload video immediately on hover for instant playback
    if (videoRef.current) {
      if (video.preview_url && video.preview_url.trim() !== '' && !/\.(webp|gif|jpg|jpeg|png)$/i.test(video.preview_url)) {
        videoRef.current.src = video.preview_url;
        videoRef.current.load();
      } else if (video.video_url) {
        const previewUrl = generateBunnyPreviewUrl(video.video_url, 5);
        videoRef.current.src = previewUrl;
        videoRef.current.load();
      }
    }

    // Show preview with appropriate delay
    hoverTimeoutRef.current = setTimeout(() => {
      setShowPreview(true);
      setIsVideoReady(false);

      // Check if preview_url is an image/animation
      if (video.preview_url && video.preview_url.trim() !== '' && /\.(webp|gif|jpg|jpeg|png)$/i.test(video.preview_url)) {
        setIsVideoReady(true);
        return;
      } else if (video.preview_url && video.preview_url.trim() !== '' && !/\.(webp|gif|jpg|jpeg|png)$/i.test(video.preview_url)) {
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current.muted = true;
          videoRef.current.play().catch((error) => {
            console.error('Video preview play failed:', error);
            setShowPreview(false);
          });
        }
      } else {
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
                (showPreview || (isHovered && video.preview_url && /\.(webp|gif|jpg|jpeg|png)$/i.test(video.preview_url))) ? 'opacity-0' : 'opacity-100'
              }`}
            />
            
            {/* Animated preview (WebP/GIF) */}
            {video.preview_url && video.preview_url.trim() !== '' && /\.(webp|gif|jpg|jpeg|png)$/i.test(video.preview_url) && isHovered && (
              <img
                src={video.preview_url}
                alt={`${video.title} preview`}
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 opacity-100 z-10"
                onError={(e) => console.error('Image load error:', e, video.preview_url)}
              />
            )}
            
            {/* Animated preview (WebP/GIF) */}
            {video.preview_url && video.preview_url.trim() !== '' && /\.(webp|gif|jpg|jpeg|png)$/i.test(video.preview_url) && isHovered && (
              <img
                src={video.preview_url}
                alt={`${video.title} preview`}
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 opacity-100 z-10"
                onError={(e) => console.error('Image load error:', e, video.preview_url)}
              />
            )}

            {/* Video preview */}
            {showPreview && video.preview_url && video.preview_url.trim() !== '' && !/\.(webp|gif|jpg|jpeg|png)$/i.test(video.preview_url) && (
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
