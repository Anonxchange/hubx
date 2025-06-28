
import React from 'react';
import VideoCard from './VideoCard';
import { Video } from '@/services/videosService';

interface VideoGridProps {
  title?: string;
  videos: Video[];
  showTitle?: boolean;
  isLoading?: boolean;
}

const VideoGrid: React.FC<VideoGridProps> = ({ 
  title = "Recently Uploaded", 
  videos = [],
  showTitle = true,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className="space-y-6">
        {showTitle && (
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
          {Array.from({ length: 14 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="aspect-video bg-muted rounded-lg mb-3"></div>
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-3 bg-muted rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="space-y-6">
        {showTitle && (
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          </div>
        )}
        <div className="text-center py-12">
          <p className="text-muted-foreground">No videos found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showTitle && (
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>{videos.length} videos</span>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
        {videos.map((video, index) => (
          <div key={video.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
            <VideoCard
              id={video.id}
              title={video.title}
              thumbnail={video.thumbnail_url || 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=400&h=225&fit=crop'}
              duration={video.duration}
              tags={video.tags}
              views={video.views}
              uploadDate={video.created_at}
              previewUrl={video.preview_url}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoGrid;
