import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Eye, ThumbsUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { LazyImage } from '@/components/LazyImage';
import AdComponent from '@/components/AdComponent';
import { useAuth } from '@/contexts/AuthContext';

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
      <Link to={`/video/${video.id}`} className="block w-full">
        <Card className="hover:bg-muted/5 transition-colors">
          <CardContent className="p-3 flex space-x-3">
            <div className="relative w-40 bg-muted rounded-lg overflow-hidden flex-shrink-0" style={{ aspectRatio: '16/9' }}>
              <LazyImage
                src={video.thumbnail_url || 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=300&h=200&fit=crop'}
                alt={video.title}
                width={400}
                height={300}
                className="w-full h-full object-cover"
              />
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
    <Link to={`/video/${video.id}`} className="block w-full">
      <div className="group hover:bg-muted/5 transition-all duration-200 w-full">
        <div className="relative bg-muted overflow-hidden rounded-xl w-full" style={{ aspectRatio: '16/9', height: 'auto' }}>
          <LazyImage
            src={video.thumbnail_url || 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=400&h=300&fit=crop'}
            alt={video.title}
            width={400}
            height={300}
            className="w-full h-full object-cover"
          />

          {/* Permanent dark gradient overlay at bottom - purely aesthetic */}
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />

          {/* Duration badge */}
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
        </div>

        <div className="pt-3 space-y-2">
          {/* Title in separate area below thumbnail */}
          <h3 className="font-semibold text-sm line-clamp-2 leading-tight text-foreground">
            {video.title}
          </h3>

          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            <span className="flex items-center">
              <Eye className="w-3 h-3 mr-1" />
              {formatViews(video.views)}
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

const OptimizedVideoGrid: React.FC<OptimizedVideoGridProps> = ({
  videos,
  viewMode = 'grid',
  showAds = false
}) => {
  const { loading: authLoading } = useAuth();

  // Show loading state during auth verification to prevent content flash
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

  // Remove duplicates based on video ID
  const uniqueVideos = videos.filter((video, index, self) => 
    index === self.findIndex(v => v.id === video.id)
  );

  const gridClass = viewMode === 'grid'
    ? 'w-full max-w-none'
    : 'space-y-3';

  return (
    <div 
      className={gridClass} 
      style={{
        display: viewMode === 'grid' ? 'grid' : 'block',
        gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(300px, 1fr))' : undefined,
        gap: viewMode === 'grid' ? '16px' : undefined,
        width: '100vw',
        maxWidth: '100vw',
        margin: '0 -16px',
        padding: '0 16px'
      }}
    >
      {uniqueVideos.map((video, index) => (
        <div key={`video-${video.id}-${index}`} className="w-full">
          <OptimizedVideoCard video={video} viewMode={viewMode} />

          {showAds && viewMode === 'grid' && index === 7 && (
            <div className="col-span-full md:hidden mt-6">
              <AdComponent zoneId="5686642" />
            </div>
          )}

          {showAds && viewMode === 'grid' && index === 19 && (
            <div className="col-span-full md:hidden mt-6">
              <AdComponent zoneId="5661270" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default OptimizedVideoGrid;