
import React from 'react';
import VideoCard from './VideoCard';

interface Video {
  id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  duration: string;
  views: number;
  likes: number;
  tags: string[];
  created_at: string;
}

interface VideoGridProps {
  videos: Video[];
  viewMode?: 'grid' | 'list';
}

const VideoGrid: React.FC<VideoGridProps> = ({ videos, viewMode = 'grid' }) => {
  if (videos.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">No videos found</h2>
        <p className="text-muted-foreground">Try adjusting your search or filters.</p>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} viewMode="list" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} viewMode="grid" />
      ))}
    </div>
  );
};

export default VideoGrid;
