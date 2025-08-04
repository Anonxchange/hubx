import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Eye, ThumbsUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { LazyImage } from '@/components/LazyImage';
import LazyAdComponent from '@/components/LazyAdComponent';

interface LightVideo {
  id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  duration: string;
  views: number;
  likes: number;
  tags: string[];
  created_at: string;
  is_premium?: boolean;
}

interface OptimizedVideoGridProps {
  videos: LightVideo[];
  viewMode?: 'grid' | 'list';
  showAds?: boolean;
}

const OptimizedVideoCard: React.FC<{ video: LightVideo; viewMode?: 'grid' | 'list' }> = ({ 
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (viewMode === 'list') {
    return (
      <Link to={`/video/${video.id}`} className="block">
        <Card className="hover:bg-muted/5 transition-colors">
          <CardContent className="p-4 flex space-x-4">
            <div className="relative w-48 h-28 bg-muted rounded overflow-hidden flex-shrink-0">
              <LazyImage
                src={video.thumbnail_url || 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=300&h=200&fit=crop'}
                alt={video.title}
                width={300}
                height={200}
                className="w-full h-full"
              />
              <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
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
                  {video.likes || 0}
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
      <Card className="group hover:shadow-lg transition-all duration-200 overflow-hidden">
        <div className="relative aspect-video bg-muted overflow-hidden">
          <LazyImage
            src={video.thumbnail_url || 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=400&h=300&fit=crop'}
            alt={video.title}
            width={400}
            height={300}
            className="w-full h-full group-hover:scale-105 transition-all duration-300"
          />
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
            {video.duration}
          </div>
        </div>
        
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold line-clamp-2 leading-tight group-hover:text-primary transition-colors">
            {video.title}
          </h3>
          
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-3">
              <span className="flex items-center">
                <Eye className="w-3 h-3 mr-1" />
                {formatViews(video.views)}
              </span>
              <span className="flex items-center">
                <ThumbsUp className="w-3 h-3 mr-1" />
                {video.likes || 0}
              </span>
            </div>
            <span className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
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

const OptimizedVideoGrid: React.FC<OptimizedVideoGridProps> = ({ 
  videos, 
  viewMode = 'grid', 
  showAds = false 
}) => {
  if (videos.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">No videos found</h2>
        <p className="text-muted-foreground">Try adjusting your search or browse different categories.</p>
      </div>
    );
  }

  const gridClass = viewMode === 'grid' 
    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
    : 'space-y-4';

  return (
    <div className={gridClass}>
      {videos.map((video, index) => (
        <React.Fragment key={video.id}>
          <OptimizedVideoCard video={video} viewMode={viewMode} />
          
          {showAds && viewMode === 'grid' && index === 7 && (
            <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4">
              <LazyAdComponent zoneId="5686642" />
            </div>
          )}
          
          {showAds && viewMode === 'grid' && index === 19 && (
            <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4">
              <LazyAdComponent zoneId="5686644" />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default OptimizedVideoGrid;