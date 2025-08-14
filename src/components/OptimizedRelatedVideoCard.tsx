import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, ThumbsUp } from 'lucide-react';
import { LazyImage } from '@/components/LazyImage';

interface Video {
  id: string;
  title: string;
  thumbnail_url: string | null;
  duration: string | null;
  views: number | null;
  likes: number | null;
}

interface OptimizedRelatedVideoCardProps {
  video: Video;
  viewMode?: 'grid' | 'list';
}

const OptimizedRelatedVideoCard: React.FC<OptimizedRelatedVideoCardProps> = ({ 
  video, 
  viewMode = 'grid' 
}) => {
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
    <Link to={`/video/${video.id}`} className="block w-full">
      <div className="group hover:bg-muted/5 transition-all duration-200 w-full">
        <div className="relative bg-muted overflow-hidden rounded-xl w-full" style={{ aspectRatio: '16/10', height: 'auto' }}>
          <LazyImage
            src={video.thumbnail_url || 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=300&h=200&fit=crop'}
            alt={video.title}
            width={300}
            height={200}
            className="w-full h-full object-cover"
          />

          {/* Permanent dark gradient overlay at bottom - purely aesthetic */}
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />

          {/* Duration badge */}
          {video.duration && (
            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
              {video.duration}
            </div>
          )}
        </div>

        <div className="pt-2 space-y-1">
          {/* Title in separate area below thumbnail */}
          <h3 className="font-semibold text-sm line-clamp-2 leading-tight text-foreground">
            {video.title}
          </h3>

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
    </Link>
  );
};

export default OptimizedRelatedVideoCard;