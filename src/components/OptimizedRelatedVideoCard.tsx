import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, ThumbsUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
    <Link to={`/video/${video.id}`} className="block">
      <Card className="group hover:shadow-lg transition-all duration-200 overflow-hidden">
        <div className="relative aspect-video bg-muted overflow-hidden">
          <LazyImage
            src={video.thumbnail_url || 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=300&h=200&fit=crop'}
            alt={video.title}
            width={300}
            height={200}
            className="w-full h-full group-hover:scale-105 transition-all duration-300"
          />
          {video.duration && (
            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
              {video.duration}
            </div>
          )}
        </div>
        
        <CardContent className="p-3 space-y-2">
          <h3 className="font-medium text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors">
            {video.title}
          </h3>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-2">
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
        </CardContent>
      </Card>
    </Link>
  );
};

export default OptimizedRelatedVideoCard;