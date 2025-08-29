
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Clock, Eye, User } from 'lucide-react';
import LazyImage from './LazyImage';
import { Badge } from './ui/badge';

interface FastVideoCardProps {
  video: {
    id: string;
    title: string;
    thumbnail_url?: string;
    duration: string;
    views: number;
    uploader_username?: string;
    uploader_name?: string;
    uploader_avatar?: string;
    tags: string[];
    is_premium?: boolean;
    is_moment?: boolean;
  };
  index?: number;
}

const FastVideoCard: React.FC<FastVideoCardProps> = ({ video, index = 0 }) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = useCallback(() => {
    navigate(`/video/${video.id}`);
  }, [navigate, video.id]);

  const formatViews = useCallback((views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  }, []);

  const formatDuration = useCallback((duration: string) => {
    if (!duration) return '0:00';
    const parts = duration.split(':');
    if (parts.length === 2) return duration;
    if (parts.length === 3) {
      const hours = parseInt(parts[0]);
      return hours > 0 ? duration : `${parts[1]}:${parts[2]}`;
    }
    return duration;
  }, []);

  return (
    <div
      className="group cursor-pointer transform transition-all duration-200 hover:scale-[1.02]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-video bg-gray-200 rounded-xl overflow-hidden">
        <LazyImage
          src={video.thumbnail_url || '/placeholder.svg'}
          alt={video.title}
          className="w-full h-full"
          priority={index < 4} // Prioritize first 4 images
          width={320}
          height={180}
        />
        
        {/* Play Overlay */}
        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-200 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          <Play className="w-12 h-12 text-white fill-white" />
        </div>

        {/* Duration */}
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
          {formatDuration(video.duration)}
        </div>

        {/* Premium/Moment Badge */}
        {video.is_premium && (
          <Badge className="absolute top-2 left-2 bg-yellow-500 text-black">
            Premium
          </Badge>
        )}
        {video.is_moment && (
          <Badge className="absolute top-2 left-2 bg-purple-500 text-white">
            Moment
          </Badge>
        )}
      </div>

      {/* Video Info */}
      <div className="pt-3 space-y-2">
        <h3 className="font-medium text-sm leading-tight line-clamp-2 text-foreground group-hover:text-primary transition-colors">
          {video.title}
        </h3>
        
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <User className="w-3 h-3" />
            <span className="truncate max-w-24">
              {video.uploader_username || video.uploader_name || 'Anonymous'}
            </span>
          </div>
          <span>•</span>
          <div className="flex items-center space-x-1">
            <Eye className="w-3 h-3" />
            <span>{formatViews(video.views)} views</span>
          </div>
        </div>

        {/* Tags */}
        {video.tags && video.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {video.tags.slice(0, 2).map((tag, tagIndex) => (
              <span
                key={tagIndex}
                className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(FastVideoCard);
