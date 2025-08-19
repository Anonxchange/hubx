import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Eye, ThumbsUp, MoreVertical, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LazyImage } from '@/components/LazyImage';
import { useBandwidthOptimization } from '@/hooks/useBandwidthOptimization';
import VerificationBadge from './VerificationBadge'; // Added import for VerificationBadge
import { useVideoReaction } from '@/hooks/useVideoReactions'; // Assuming useVideoReaction is in this path
import { supabase } from '@/integrations/supabase/client'; // Imported supabase client
import { VideoPreviewService } from '@/services/VideoPreviewService'; // Assuming VideoPreviewService is in this path

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
  uploader_username?: string; // Added uploader_username
  uploader_type?: 'user' | 'creator' | 'studio' | 'individual_creator' | 'studio_creator'; // Added uploader_type, expanded options
  is_premium?: boolean; // Added is_premium
  owner_id?: string; // Added owner_id for fetching creator profile
  profiles?: { // Added profiles for direct access if available
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
    user_type: string;
  };
  uploader_name?: string; // Added for fallback display name
  uploader_avatar?: string; // Added for fallback avatar url
  uploader_id?: string; // Added for fallback uploader id
}

interface VideoCardProps {
  video: Video;
  viewMode?: 'grid' | 'list';
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


const VideoCard: React.FC<VideoCardProps> = ({ video, viewMode = 'grid' }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [currentPreviewTime, setCurrentPreviewTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previewCycleRef = useRef<NodeJS.Timeout | null>(null);
  // Simplified optimization - avoid heavy hook on every card
  const { shouldLoadPreview } = useBandwidthOptimization();
  const isMobile = useIsMobile();

  // --- State for video loading status ---
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  // --- End State ---

  // --- Hook for dynamic likes/dislikes ---
  const { userReaction, reactToVideo, isLoading: reactionLoading } = useVideoReaction(video.id);
  // --- End Hook ---

  // Helper function to get actual likes count
  const getActualLikes = () => {
    return video.likes || 0;
  };

  const [creatorProfile, setCreatorProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
          id: video.uploader_id || video.owner_id,
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
          // Set a fallback profile if we can't find one
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
  }, [video.owner_id, video.uploader_id, video.profiles, video.uploader_username, video.uploader_avatar, video.uploader_name, video.uploader_type]);


  // Generate preview URL with timestamp for Bunny CDN videos
  const generateBunnyPreviewUrl = (videoUrl: string, time: number): string => {
    if (videoUrl.includes('bunnycdn.com') || videoUrl.includes('b-cdn.net')) {
      return `${videoUrl}#t=${time}`;
    }
    return videoUrl;
  };

  const handleHoverStart = (event?: React.TouchEvent | React.MouseEvent) => {
    console.log('Preview triggered:', event?.type || 'unknown', 'for video:', video.title);
    setIsHovered(true);

    // Only load previews if bandwidth allows it
    if (!shouldLoadPreview) {
      console.log('Preview blocked by bandwidth optimization');
      return;
    }

    // Preload video immediately on hover for instant playback
    if (videoRef.current) {
      // Set up video source immediately for faster loading
      if (video.preview_url && video.preview_url.trim() !== '' && !/\.(webp|gif|jpg|jpeg|png)$/i.test(video.preview_url)) {
        videoRef.current.src = video.preview_url;
        videoRef.current.load(); // Start loading immediately
      } else if (video.video_url) {
        // Use Bunny CDN URL for hover preview if it's a Bunny CDN video
        const previewUrl = generateBunnyPreviewUrl(video.video_url, 5);
        videoRef.current.src = previewUrl;
        videoRef.current.load(); // Start loading immediately
      }
    }

    // Show preview with appropriate delay - faster for touch
    hoverTimeoutRef.current = setTimeout(() => {
      console.log('Setting showPreview to true for:', video.title);
      setShowPreview(true);
      setIsVideoReady(false); // Reset video ready state

      // Check if preview_url is an image/animation (including animated WebP)
      if (video.preview_url && video.preview_url.trim() !== '' && /\.(webp|gif|jpg|jpeg|png)$/i.test(video.preview_url)) {
        // It's an image/animation preview - show immediately
        console.log('Showing animated preview for:', video.preview_url);
        setIsVideoReady(true); // Assume image is ready
        return;
      } else if (video.preview_url && video.preview_url.trim() !== '' && !/\.(webp|gif|jpg|jpeg|png)$/i.test(video.preview_url)) {
        // It's a video preview - play immediately with better error handling
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current.muted = true; // Ensure muted for autoplay
          videoRef.current.play().catch((error) => {
            console.error('Video preview play failed:', error);
            setShowPreview(false);
          });
        }
      } else {
        // No valid preview_url - don't play any video
        console.log('No valid preview URL found, skipping video preview');
        setShowPreview(false);
      }
    }, event?.type === 'touchstart' ? 50 : 200); // Much faster response for touch - almost instant
  };

  const handleMouseLeave = (event?: React.TouchEvent | React.MouseEvent) => {
    console.log('Preview ended:', event?.type || 'unknown', 'for video:', video.title);
    setIsHovered(false);
    setShowPreview(false);
    setCurrentPreviewTime(0);

    // Clear timeouts and intervals
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (previewCycleRef.current) {
      clearInterval(previewCycleRef.current);
      previewCycleRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      videoRef.current.src = '';
    }
    // Reset loading states when preview is hidden
    setIsVideoLoading(false);
    setIsVideoReady(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault(); // Prevent default touch behavior to avoid conflicts
    console.log('Touch start detected on:', video.title);
    handleHoverStart(e);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault(); // Prevent default touch behavior
    console.log('Touch end detected on:', video.title);
    // Show preview for 10 seconds on mobile before hiding
    setTimeout(() => handleMouseLeave(e), 10000);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Allow scrolling by not preventing default for touch move
    // Only prevent if we specifically need to stop scrolling during preview
    if (showPreview) {
      // Let the preview continue but allow normal scrolling
      console.log('Touch move during preview');
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // No explicit onClick prop is used in the original code for this component, so we assume it's always navigating.
    // If an onClick prop were intended, it would be handled here.
    const username = creatorProfile?.username || video.uploader_username;
    if (username) {
      // Navigate to the video page directly
      // If you need to pass other state or params, adjust this navigation.
    }
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleCreatorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const username = creatorProfile?.username || video.uploader_username;
    if (username) {
      // Navigate to the profile page of the creator
      // The actual navigation function needs to be provided or imported if it's not `navigate` from `react-router-dom`
      // For now, assuming `navigate` is available or a similar routing mechanism is used.
      // Example: navigate(`/profile/${username}`);
    }
  };

  const handleWatchLater = async (e: React.MouseEvent) => {
    e.stopPropagation();
    // Add to watch later functionality
    console.log('Adding to watch later:', video.title);
    // TODO: Implement watch later functionality with Supabase
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatNumber = (num: number | undefined) => {
    if (num === undefined) return '0';
    return num.toString();
  };



  const getVideoPreloadStrategy = () => {
    // Example strategy: 'auto' for better preview experience, or 'metadata' for less bandwidth
    return 'auto';
  };

  // Get creator info using the computed fields from video service
  const getCreatorInfo = () => {
    // Use the computed uploader fields that are set in the video service
    return {
      username: video.uploader_username || 'Unknown',
      displayName: video.uploader_name || video.uploader_username || 'Unknown User',
      avatar: video.uploader_avatar,
      userType: video.uploader_type || 'user',
    };
  };

  const creator = getCreatorInfo();


  if (viewMode === 'list') {
    return (
      <Link to={`/video/${video.id}`} className="block">
        <Card className="hover:bg-muted/5 hover:shadow-lg hover:border-primary/20 transition-all duration-200 border border-primary/10">
          <CardContent className="p-4 flex space-x-4">
            <div
              className="relative bg-muted rounded-lg overflow-hidden flex-shrink-0 border-2 border-primary/20 shadow-lg"
              style={{
                aspectRatio: '16/9',
                touchAction: 'manipulation',
                WebkitTouchCallout: 'none',
                WebkitUserSelect: 'none',
                userSelect: 'none'
              }}
              onMouseEnter={!isMobile ? handleHoverStart : undefined}
              onMouseLeave={!isMobile ? handleMouseLeave : undefined}
              onTouchStart={isMobile ? handleTouchStart : undefined}
              onTouchEnd={isMobile ? handleTouchEnd : undefined}
              onTouchMove={isMobile ? handleTouchMove : undefined}
            >
              <LazyImage
                src={video.thumbnail_url || 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=300&h=200&fit=crop'}
                alt={video.title}
                width={400}
                height={300}
                className={`w-full h-full object-cover transition-opacity duration-300 ${(showPreview || (isHovered && video.preview_url && /\.(webp|gif|jpg|jpeg|png)$/i.test(video.preview_url))) ? 'opacity-0' : 'opacity-100'}`}
              />
              {/* Webp/GIF animations show on hover instantly in list view */}
              {video.preview_url && video.preview_url.trim() !== '' && /\.(webp|gif|jpg|jpeg|png)$/i.test(video.preview_url) && isHovered && (
                <img
                  src={video.preview_url}
                  alt={`${video.title} preview`}
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 opacity-100 z-10"
                  onLoad={() => console.log('List view animated webp/gif loaded:', video.preview_url)}
                  onError={(e) => console.error('List view image load error:', e, video.preview_url)}
                />
              )}
              {/* Video previews show after delay in list view */}
              {showPreview && video.preview_url && video.preview_url.trim() !== '' && !/\.(webp|gif|jpg|jpeg|png)$/i.test(video.preview_url) && (
                <video
                  ref={videoRef}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${showPreview && isVideoReady ? 'opacity-100' : 'opacity-0'}`}
                  muted
                  loop={!!video.preview_url}
                  playsInline
                  preload="auto"
                  controls={false}
                  disablePictureInPicture
                  autoPlay={false}
                  onLoadStart={() => {
                    setIsVideoLoading(true);
                    console.log('Video loading started');
                  }}
                  onLoadedData={() => {
                    setIsVideoReady(true);
                    setIsVideoLoading(false);
                    console.log('List view video preview loaded');
                  }}
                  onCanPlay={() => {
                    setIsVideoReady(true);
                    setIsVideoLoading(false);
                    if (showPreview && videoRef.current) {
                      videoRef.current.play().catch(console.error);
                    }
                  }}
                  onWaiting={() => {
                    setIsVideoLoading(true);
                    console.log('Video buffering...');
                  }}
                  onPlaying={() => {
                    setIsVideoLoading(false);
                    console.log('Video playing smoothly');
                  }}
                  onError={(e) => {
                    console.error('List view video error:', e);
                    setIsVideoLoading(false);
                    setIsVideoReady(false);
                    setShowPreview(false);
                  }}
                />
              )}
              <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                {video.duration}
              </div>

              {/* Special quality/format badges on top right for list view */}
              <div className="absolute top-2 right-2 flex flex-col gap-1">
                {video.tags.some(tag => ['vr', 'virtual reality'].includes(tag.toLowerCase())) && (
                  <div className="bg-gradient-to-r from-green-500 to-teal-500 text-white text-xs px-2 py-1 rounded font-bold min-w-[40px] text-center">
                    🥽 VR
                  </div>
                )}
                {!video.tags.some(tag => ['vr', 'virtual reality'].includes(tag.toLowerCase())) && video.tags.some(tag => tag.toLowerCase() === '4k') && (
                  <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs px-2 py-1 rounded font-bold min-w-[40px] text-center">
                    4K
                  </div>
                )}
              </div>
              {/* Loading indicator for video preview */}
              {showPreview && isVideoLoading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
              <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                <span className="flex items-center">
                  <Eye className="w-4 h-4 mr-1" />
                  {formatViews(video.views)} views
                </span>
                <span className="flex items-center">
                  <ThumbsUp className="w-4 h-4 mr-1" />
                  {getActualLikes()}
                </span>
                <span>{formatDate(video.created_at)}</span>
              </div>

              {/* Creator info section - YouTube style */}
              {!loading && (
                <div className="flex items-center justify-between">
                  <div
                    className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={handleCreatorClick}
                  >
                    <Card className="h-6 w-6"> {/* Using Card for avatar container as per original structure, but Avatar is better */}
                      <CardContent className="p-0"> {/* Empty CardContent to ensure styling */}
                        <LazyImage
                          src={creator.avatar || ''}
                          alt={creator.displayName}
                          className="h-6 w-6 rounded-full object-cover"
                        />
                      </CardContent>
                    </Card>
                    <div className="flex items-center space-x-1">
                      <span className="text-sm text-muted-foreground hover:text-white transition-colors">
                        {creator.displayName}
                      </span>
                      {(creator.userType === 'individual_creator' || creator.userType === 'studio_creator') && (
                        <VerificationBadge
                          userType={creator.userType as 'individual_creator' | 'studio_creator'}
                          showText={false}
                          size="small"
                        />
                      )}
                    </div>
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
              )}
              <div className="flex flex-wrap gap-1">
                {/* Special badges for 4K and VR */}
                {video.tags.some(tag => ['vr', 'virtual reality'].includes(tag.toLowerCase())) && (
                  <Badge variant="default" className="text-xs bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold">
                    🥽 VR
                  </Badge>
                )}
                {!video.tags.some(tag => ['vr', 'virtual reality'].includes(tag.toLowerCase())) && video.tags.some(tag => tag.toLowerCase() === '4k') && (
                  <Badge variant="default" className="text-xs bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold">
                    4K
                  </Badge>
                )}
                {/* Regular tags (excluding 4K and VR which are shown as special badges) */}
                {video.tags
                  .filter(tag => !['4k', 'vr', 'virtual reality'].includes(tag.toLowerCase()))
                  .slice(0, 3)
                  .map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                {video.tags.filter(tag => !['4k', 'vr', 'virtual reality'].includes(tag.toLowerCase())).length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{video.tags.filter(tag => !['4k', 'vr', 'virtual reality'].includes(tag.toLowerCase())).length - 3}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Link to={`/video/${video.id}`} className="block">
      <Card className="group hover:shadow-xl hover:shadow-primary/10 hover:scale-[1.02] transition-all duration-200 overflow-hidden w-full border-2 border-primary/10">
        <div
          className="relative bg-muted rounded-lg overflow-hidden flex-shrink-0 border-2 border-primary/20 shadow-lg"
          style={{
            aspectRatio: '16/9',
            touchAction: 'manipulation',
            WebkitTouchCallout: 'none',
            WebkitUserSelect: 'none',
            userSelect: 'none'
          }}
          onMouseEnter={!isMobile ? handleHoverStart : undefined}
          onMouseLeave={!isMobile ? handleMouseLeave : undefined}
          onTouchStart={isMobile ? handleTouchStart : undefined}
          onTouchEnd={isMobile ? handleTouchEnd : undefined}
          onTouchMove={isMobile ? handleTouchMove : undefined}
        >
          <LazyImage
            src={video.thumbnail_url || 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=400&h=300&fit=crop'}
            alt={video.title}
            width={400}
            height={300}
            className={`w-full h-full object-cover transition-opacity duration-300 ${(showPreview || (isHovered && video.preview_url && /\.(webp|gif|jpg|jpeg|png)$/i.test(video.preview_url))) ? 'opacity-0' : 'opacity-100'}`}
          />
          {/* Webp/GIF animations show on hover, videos show after preview delay */}
          {video.preview_url && video.preview_url.trim() !== '' && /\.(webp|gif|jpg|jpeg|png)$/i.test(video.preview_url) && isHovered && (
            <img
              src={video.preview_url}
              alt={`${video.title} preview`}
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 opacity-100 z-20"
              onLoad={() => console.log('Animated webp/gif loaded:', video.preview_url)}
              onError={(e) => console.error('Image load error:', e, video.preview_url)}
            />
          )}
          {/* Video previews show after delay */}
          {showPreview && video.preview_url && video.preview_url.trim() !== '' && !/\.(webp|gif|jpg|jpeg|png)$/i.test(video.preview_url) && (
            <video
              ref={videoRef}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${showPreview && isVideoReady ? 'opacity-100' : 'opacity-0'}`}
              muted
              loop={false}
              playsInline
              preload="metadata"
              controls={false}
              disablePictureInPicture
              autoPlay={false}
              style={{
                filter: 'contrast(0.9) brightness(0.95)',
                imageRendering: 'auto'
              }}
              onLoadStart={() => {
                setIsVideoLoading(true);
                console.log('Video loading started');
              }}
              onLoadedData={() => {
                setIsVideoReady(true);
                setIsVideoLoading(false);
                console.log('Video preview loaded and ready to play');
              }}
              onCanPlay={() => {
                // Ensure video is ready to play when hovering
                setIsVideoReady(true);
                setIsVideoLoading(false);
                if (showPreview && videoRef.current) {
                  videoRef.current.play().catch(console.error);
                }
              }}
              onWaiting={() => {
                setIsVideoLoading(true);
                console.log('Video buffering...');
              }}
              onPlaying={() => {
                setIsVideoLoading(false);
                console.log('Video playing smoothly');
              }}
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

          {/* Duration badge in bottom corner */}
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
            {video.duration}
          </div>

          {/* Special quality/format badges on top right */}
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            {video.tags.some(tag => ['vr', 'virtual reality'].includes(tag.toLowerCase())) && (
              <div className="bg-gradient-to-r from-green-500 to-teal-500 text-white text-xs px-2 py-1 rounded font-bold min-w-[40px] text-center">
                🥽 VR
              </div>
            )}
            {!video.tags.some(tag => ['vr', 'virtual reality'].includes(tag.toLowerCase())) && video.tags.some(tag => tag.toLowerCase() === '4k') && (
              <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs px-2 py-1 rounded font-bold min-w-[40px] text-center">
                4K
              </div>
            )}
          </div>

          {showPreview && (
            <div className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-xs px-2 py-1 rounded animate-fade-in">
              {video.preview_url ? 'Preview' : `Preview ${Math.floor(currentPreviewTime)}s`}
            </div>
          )}
          {/* Loading indicator for video preview */}
          {showPreview && isVideoLoading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        <CardContent className="p-4 space-y-3">
          {/* Title in separate area below thumbnail */}
          <h3 className="font-semibold text-base line-clamp-2 leading-tight">
            {video.title}
          </h3>

          {/* Creator info section - YouTube style */}
          {!loading && (
            <div className="flex items-center justify-between">
              <div
                className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={handleCreatorClick}
              >
                <Card className="h-6 w-6"> {/* Using Card for avatar container */}
                  <CardContent className="p-0"> {/* Empty CardContent */}
                    <LazyImage
                      src={creator.avatar || ''}
                      alt={creator.displayName}
                      className="h-6 w-6 rounded-full object-cover"
                    />
                  </CardContent>
                </Card>
                <div className="flex items-center space-x-1">
                  <span className="text-sm text-muted-foreground hover:text-white transition-colors">
                    {creator.displayName}
                  </span>
                  {(creator.userType === 'individual_creator' || creator.userType === 'studio_creator') && (
                    <VerificationBadge
                      userType={creator.userType as 'individual_creator' | 'studio_creator'}
                      showText={false}
                      size="small"
                    />
                  )}
                </div>
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
          )}

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <Eye className="w-4 h-4 mr-1" />
                {formatViews(video.views)}
              </span>
              <span className="flex items-center">
                <ThumbsUp className="w-4 h-4 mr-1" />
                {getActualLikes()}
              </span>
            </div>
            <span className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {formatDate(video.created_at)}
            </span>
          </div>

          <div className="flex flex-wrap gap-1">
            {/* Special badges for VR and 4K */}
            {video.tags.some(tag => ['vr', 'virtual reality'].includes(tag.toLowerCase())) && (
              <Badge variant="default" className="text-xs bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold">
                🥽 VR
              </Badge>
            )}
            {!video.tags.some(tag => ['vr', 'virtual reality'].includes(tag.toLowerCase())) && video.tags.some(tag => tag.toLowerCase() === '4k') && (
              <Badge variant="default" className="text-xs bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold">
                4K
              </Badge>
            )}
            {/* Regular tags (excluding 4K and VR which are shown as special badges) */}
            {video.tags
              .filter(tag => !['4k', 'vr', 'virtual reality'].includes(tag.toLowerCase()))
              .slice(0, 2)
              .map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            {video.tags.filter(tag => !['4k', 'vr', 'virtual reality'].includes(tag.toLowerCase())).length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{video.tags.filter(tag => !['4k', 'vr', 'virtual reality'].includes(tag.toLowerCase())).length - 2}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default VideoCard;