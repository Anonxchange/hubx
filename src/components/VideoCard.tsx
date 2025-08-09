import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Eye, ThumbsUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { LazyImage } from '@/components/LazyImage';
import { useBandwidthOptimization } from '@/hooks/useBandwidthOptimization';

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
  const { shouldLoadPreview, getVideoPreloadStrategy } = useBandwidthOptimization();

  const generateBunnyPreviewUrl = (videoUrl: string, time: number): string => {
    if (videoUrl.includes('bunnycdn.com') || videoUrl.includes('b-cdn.net')) {
      return `${videoUrl}#t=${time}`;
    }
    return videoUrl;
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (!shouldLoadPreview()) return;

    hoverTimeoutRef.current = setTimeout(() => {
      setShowPreview(true);

      if (videoRef.current) {
        const previewUrl =
          video.preview_url && video.preview_url.trim() !== ''
            ? video.preview_url
            : generateBunnyPreviewUrl(video.video_url, 10);

        videoRef.current.src = previewUrl;
        videoRef.current.currentTime = video.preview_url ? 0 : 10;
        videoRef.current.play().catch((error) => {
          console.error('Video play failed:', error);
        });

        if (!video.preview_url || video.preview_url.trim() === '') {
          const previewTimes = [10, 30, 60, 90];
          let timeIndex = 0;

          previewCycleRef.current = setInterval(() => {
            timeIndex = (timeIndex + 1) % previewTimes.length;
            const newTime = previewTimes[timeIndex];
            setCurrentPreviewTime(newTime);

            if (videoRef.current) {
              videoRef.current.currentTime = newTime;
            }
          }, 3000);
        }
      }
    }, 2000);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Link to={`/video/${video.id}`} className="block">
      <Card className="group hover:shadow-lg transition-all duration-200 overflow-hidden bg-transparent border-none">
        <div
          className="relative w-full h-[200px] bg-muted overflow-hidden rounded-md"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <LazyImage
            src={
              video.thumbnail_url && video.thumbnail_url.trim() !== ''
                ? video.thumbnail_url
                : '/fallback-thumbnail.jpg'
            }
            alt={video.title}
            width={400}
            height={300}
            className={`w-full h-full object-cover transition-all duration-300 ${
              showPreview ? 'opacity-0' : 'opacity-100'
            }`}
          />
          {(video.preview_url && video.preview_url.trim() !== '') || showPreview ? (
            <video
              ref={videoRef}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                showPreview ? 'opacity-100' : 'opacity-0'
              }`}
              muted
              loop={!!video.preview_url}
              playsInline
              preload={getVideoPreloadStrategy()}
            />
          ) : null}
          <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
            {video.duration}
          </div>
        </div>

        <CardContent className="p-2 space-y-1">
          <h3 className="font-medium text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors">
            {video.title}
          </h3>

          <div className="flex items-center space-x-3 text-xs text-muted-foreground">
            <span className="flex items-center">
              <ThumbsUp className="w-3 h-3 mr-1" />
              {video.likes || 0}%
            </span>
            <span className="flex items-center">
              <Eye className="w-3 h-3 mr-1" />
              {formatViews(video.views)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default VideoCard;