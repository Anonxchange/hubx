import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Eye, ThumbsUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const hoverTimeoutRef = useRef<number | null>(null);
  const previewCycleRef = useRef<number | null>(null);
  const { shouldLoadPreview } = useBandwidthOptimization();

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (!shouldLoadPreview) return;

    hoverTimeoutRef.current = window.setTimeout(() => {
      setShowPreview(true);

      if (videoRef.current) {
        if (video.preview_url && video.preview_url.trim() !== '') {
          const isImagePreview = /\.(webp|jpg|jpeg|png)$/i.test(video.preview_url);
          if (!isImagePreview) {
            videoRef.current.src = video.preview_url;
            videoRef.current.currentTime = 0;
            videoRef.current.play().catch((error) => {
              console.error('Video preview play failed:', error);
              if (video.video_url) {
                videoRef.current.src = video.video_url;
                videoRef.current.currentTime = 10;
                videoRef.current.play().catch(() => {});
              }
            });
          }
        } else if (video.video_url) {
          videoRef.current.src = video.video_url;
          videoRef.current.currentTime = 10;
          videoRef.current.play().catch((error) => {
            console.error('Main video preview play failed:', error);
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
        }
      }
    }, 500);
  };

  const handleMouseLeave = () => {
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

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      videoRef.current.src = '';
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

  if (viewMode === 'list') {
    return (
      <Link to={`/video/${video.id}`} className="block w-full">
        <Card className="hover:bg-muted/5 transition-colors">
          <CardContent className="p-3 flex space-x-3">
            {/* thumbnail + preview */}
            <div
              className="relative w-40 bg-muted rounded-lg overflow-hidden flex-shrink-0"
              style={{ aspectRatio: '16/9' }}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
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
              {showPreview && video.preview_url && /\.(webp|jpg|jpeg|png)$/i.test(video.preview_url) && (
                <img
                  src={video.preview_url}
                  alt={`${video.title} preview`}
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
                  loading="lazy"
                />
              )}
              {showPreview && (!video.preview_url || !/\.(webp|jpg|jpeg|png)$/i.test(video.preview_url)) && (
                <video
                  ref={videoRef}
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
                  muted
                  playsInline
                  preload="metadata"
                />
              )}
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
              {video.uploader_username && (
                <div className="flex items-center space-x-2">
                  {video.uploader_profile_picture ? (
                    <LazyImage
                      src={video.uploader_profile_picture}
                      alt={video.uploader_username}
                      width={24}
                      height={24}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs text-white">
                      {video.uploader_username[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm text-muted-foreground font-medium">{video.uploader_username}</span>
                  {(video.uploader_type === 'individual_creator' || video.uploader_type === 'studio_creator') && (
                    <VerificationBadge userType={video.uploader_type} showText={false} size="small" />
                  )}
                </div>
              )}
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

  return (
    <Link to={`/video/${video.id}`} className="block w-full">
      <div
        className="group hover:bg-muted/5 transition-all duration-200 w-full"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className="relative bg-muted overflow-hidden rounded-xl w-full"
          style={{ aspectRatio: '16/9', height: 'auto' }}
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
          {showPreview && (!video.preview_url || !/\.(webp|jpg|jpeg|png)$/i.test(video.preview_url)) && (
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
              muted
              playsInline
              preload="metadata"
            />
          )}
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
            {video.duration}
          </div>
        </div>
        <div className="pt-3 space-y-2">
          <h3 className="font-semibold text-sm line-clamp-2 leading-tight text-foreground">{video.title}</h3>
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
        <React.Fragment key={`video-fragment-${video.id}`}>
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
        </React.Fragment>
      ))}
    </div>
  );
};

export default OptimizedVideoGrid;