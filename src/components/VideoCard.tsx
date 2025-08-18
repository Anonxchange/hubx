import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Eye, ThumbsUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { LazyImage } from '@/components/LazyImage';
import { useBandwidthOptimization } from '@/hooks/useBandwidthOptimization';
import VerificationBadge from './VerificationBadge'; // Added import for VerificationBadge
import { useVideoReaction } from '@/hooks/useVideoReaction'; // Assuming useVideoReaction is in this path
import { supabase } from '@/integrations/supabase/client'; // Imported supabase client

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

const VideoCard: React.FC<VideoCardProps> = ({ video, viewMode = 'grid' }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [currentPreviewTime, setCurrentPreviewTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previewCycleRef = useRef<NodeJS.Timeout | null>(null);
  // Simplified optimization - avoid heavy hook on every card
  const { shouldLoadPreview } = useBandwidthOptimization();

  // --- Hook for dynamic likes/dislikes ---
  const { likes: actualLikes, dislikes: actualDislikes, toggleLike, toggleDislike, isLiked, isDisliked } = useVideoReaction(video.id);
  // --- End Hook ---

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

  const handleMouseEnter = () => {
    setIsHovered(true);

    // Only load previews if bandwidth allows it
    if (!shouldLoadPreview) return;

    // Increased delay to reduce unnecessary bandwidth usage
    hoverTimeoutRef.current = setTimeout(() => {
      setShowPreview(true);

      if (videoRef.current) {
        // Use preview_url if available, otherwise use main video with timestamp
        const previewUrl = video.preview_url && video.preview_url.trim() !== ''
          ? video.preview_url
          : generateBunnyPreviewUrl(video.video_url, 10); // Start at 10 seconds

        videoRef.current.src = previewUrl;
        videoRef.current.currentTime = video.preview_url ? 0 : 10;
        videoRef.current.play().catch((error) => {
          console.error('Video play failed:', error);
        });

        // Cycle through different timestamps for main video previews
        if (!video.preview_url || video.preview_url.trim() === '') {
          const previewTimes = [10, 30, 60, 90]; // Different preview points
          let timeIndex = 0;

          previewCycleRef.current = setInterval(() => {
            timeIndex = (timeIndex + 1) % previewTimes.length;
            const newTime = previewTimes[timeIndex];
            setCurrentPreviewTime(newTime);

            if (videoRef.current) {
              videoRef.current.currentTime = newTime;
            }
          }, 3000); // Change preview every 3 seconds
        }
      }
    }, 2000); // Increased delay to 2 seconds
  };

  const handleMouseLeave = () => {
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

  const getActualLikes = () => {
    return actualLikes;
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
              className="relative w-72 bg-muted rounded-lg overflow-hidden flex-shrink-0 border-2 border-primary/20 shadow-lg"
              style={{ aspectRatio: '16/9' }}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <LazyImage
                src={video.thumbnail_url || 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=300&h=200&fit=crop'}
                alt={video.title}
                width={400}
                height={300}
                className={`w-full h-full object-cover transition-opacity duration-300 ${showPreview ? 'opacity-0' : 'opacity-100'}`}
              />
              {(video.preview_url && video.preview_url.trim() !== '') || showPreview ? (
                <video
                  ref={videoRef}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${showPreview ? 'opacity-100' : 'opacity-0'}`}
                  muted
                  loop={!!video.preview_url}
                  playsInline
                  preload={getVideoPreloadStrategy()}
                />
              ) : null}
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
                <div
                  className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={handleCreatorClick}
                >
                  <Card className="h-6 w-6"> {/* Using Card for avatar container as per original structure, but Avatar is better */}
                    <CardContent className="p-0"> {/* Empty CardContent to ensure styling */}
                      <LazyImage
                        src={creator.avatar}
                        alt={creator.displayName}
                        className="h-6 w-6 rounded-full object-cover"
                        fallbackComponent={
                          <div className="h-6 w-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold">
                            {creator.username.charAt(0).toUpperCase()}
                          </div>
                        }
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
          className="relative bg-muted overflow-hidden rounded-lg w-full border-2 border-primary/20 shadow-lg"
          style={{ aspectRatio: '16/9' }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <LazyImage
            src={video.thumbnail_url || 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=400&h=300&fit=crop'}
            alt={video.title}
            width={400}
            height={300}
            className={`w-full h-full object-cover transition-opacity duration-300 ${showPreview ? 'opacity-0' : 'opacity-100'}`}
          />
          {(video.preview_url && video.preview_url.trim() !== '') || showPreview ? (
            <video
              ref={videoRef}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${showPreview ? 'opacity-100' : 'opacity-0'}`}
              muted
              loop={!!video.preview_url}
              playsInline
              preload={getVideoPreloadStrategy()}
            />
          ) : null}

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
        </div>

        <CardContent className="p-4 space-y-3">
          {/* Title in separate area below thumbnail */}
          <h3 className="font-semibold text-base line-clamp-2 leading-tight">
            {video.title}
          </h3>

          {/* Creator info section - YouTube style */}
          {!loading && (
            <div
              className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleCreatorClick}
            >
              <Card className="h-6 w-6"> {/* Using Card for avatar container */}
                <CardContent className="p-0"> {/* Empty CardContent */}
                  <LazyImage
                    src={creator.avatar}
                    alt={creator.displayName}
                    className="h-6 w-6 rounded-full object-cover"
                    fallbackComponent={
                      <div className="h-6 w-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold">
                        {creator.username.charAt(0).toUpperCase()}
                      </div>
                    }
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