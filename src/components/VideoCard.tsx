import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Eye, ThumbsUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { LazyImage } from '@/components/LazyImage';
import { useBandwidthOptimization } from '@/hooks/useBandwidthOptimization';
import VerificationBadge from './VerificationBadge'; // Added import for VerificationBadge
import { useVideoReaction } from '@/hooks/useVideoReaction'; // Assuming useVideoReaction is in this path

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
  const shouldLoadPreview = true; // Always load previews for better UX

  // --- Hook for dynamic likes/dislikes ---
  const { likes: actualLikes, dislikes: actualDislikes, toggleLike, toggleDislike, isLiked, isDisliked } = useVideoReaction(video.id);
  // --- End Hook ---

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
    if (!shouldLoadPreview()) return;

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


  if (viewMode === 'list') {
    return (
      <Link to={`/video/${video.id}`} className="block">
        <Card className="hover:bg-muted/5 transition-colors">
          <CardContent className="p-4 flex space-x-4">
            <div
              className="relative w-64 bg-muted rounded-lg overflow-hidden flex-shrink-0"
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
                  {getActualLikes()}
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
    );
  }

  return (
    <Link to={`/video/${video.id}`} className="block">
      <Card className="group hover:shadow-lg transition-all duration-200 overflow-hidden w-full">
        <div
          className="relative bg-muted overflow-hidden rounded-lg w-full"
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

          {showPreview && (
            <div className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-xs px-2 py-1 rounded animate-fade-in">
              {video.preview_url ? 'Preview' : `Preview ${Math.floor(currentPreviewTime)}s`}
            </div>
          )}
          {/* Updated thumbnail to show username and verification badge */}
          <div className="absolute bottom-2 left-2 flex items-center space-x-1">
            <span className="text-white text-xs font-medium bg-black/70 px-2 py-1 rounded">
              {video.uploader_username || 'Anonymous'}
            </span>
            {(video.uploader_type === 'individual_creator' || video.uploader_type === 'studio_creator') && (
              <VerificationBadge
                userType={video.uploader_type}
                className="h-5"
                showText={false}
              />
            )}
          </div>
        </div>

        <CardContent className="p-4 space-y-3">
          {/* Title in separate area below thumbnail */}
          <h3 className="font-semibold text-base line-clamp-2 leading-tight">
            {video.title}
          </h3>

          {/* Creator name with verification badge */}
          {video.uploader_username && (
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm font-medium text-white">
                {video.uploader_username}
              </span>
              {(video.uploader_type === 'individual_creator' || video.uploader_type === 'studio_creator') && (
                <VerificationBadge
                  userType={video.uploader_type}
                  showText={false}
                />
              )}
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
  );
};

export default VideoCard;