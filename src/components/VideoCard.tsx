import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Eye, ThumbsUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { LazyImage } from '@/components/LazyImage';
import { useBandwidthOptimization } from '@/hooks/useBandwidthOptimization';

interface Video {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url?: string;
  preview_url?: string;
  duration: string;
  views: number;
  likes: number;
}

interface VideoCardProps {
  video: Video;
}

const VideoCard: React.FC<VideoCardProps> = ({ video }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
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
      }
    }, 2000);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowPreview(false);

    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    if (previewCycleRef.current) {
      clearInterval(previewCycleRef.current);
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = '';
    }
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  return (
    <Link to={`/video/${video.id}`} className="block">
      <Card className="group hover:shadow-lg transition-all duration-200 overflow-hidden bg-transparent border-none">
        {/* Thumbnail */}
        <div
          className="relative w-full h-[150px] bg-muted overflow-hidden rounded-md"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <LazyImage
            src={video.thumbnail_url || '/fallback-thumbnail.jpg'}
            alt={video.title}
            width={400}
            height={300}
            className={`w-full h-full object-cover transition-all duration-300 ${
              showPreview ? 'opacity-0' : 'opacity-100'
            }`}
          />
          {showPreview && (
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover opacity-100"
              muted
              playsInline
              preload={getVideoPreloadStrategy()}
            />
          )}
          <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 py-0.5 rounded">
            {video.duration}
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-2 space-y-1">
          <h3 className="font-medium text-xs text-white line-clamp-2 leading-tight">
            {video.title}
          </h3>
          <div className="flex items-center space-x-3 text-[11px] text-muted-foreground">
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