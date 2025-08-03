import React from 'react';
import { Link } from 'react-router-dom';
import { ThumbsUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Video {
  id: string;
  title: string;
  thumbnail_url: string | null;
  duration: string | null;
  views: number | null;
  likes: number | null;
}

interface RelatedVideoCardProps {
  video: Video;
  viewMode: 'grid' | 'list';
}

const RelatedVideoCard: React.FC<RelatedVideoCardProps> = ({ video, viewMode }) => {
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
          <div className={`relative bg-muted rounded-lg overflow-hidden flex-shrink-0 border border-border ${
            viewMode === 'grid' ? 'aspect-video mb-3' : 'w-24 h-16'
          }`}>
            <img
              src={video.thumbnail_url || 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=200&h=120&fit=crop'}
              alt={video.title}
              className="w-full h-full object-cover"
            />
            {video.duration && (
              <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                {video.duration}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className={`font-medium line-clamp-2 mb-1 ${
              viewMode === 'grid' ? 'text-sm' : 'text-xs'
            }`}>
              {video.title}
            </h4>
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