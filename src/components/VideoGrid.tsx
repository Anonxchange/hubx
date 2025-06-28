
import React from 'react';
import VideoCard from './VideoCard';

// Mock data for demonstration
const mockVideos = [
  {
    id: '1',
    title: 'Beautiful Sunset Adventure',
    thumbnail: 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=400&h=225&fit=crop',
    duration: '12:34',
    tags: ['Nature', 'Adventure', 'Sunset'],
    views: 1234567,
    uploadDate: '2024-01-15',
    previewUrl: undefined
  },
  {
    id: '2',
    title: 'Tech Review: Latest Gadgets',
    thumbnail: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=225&fit=crop',
    duration: '8:45',
    tags: ['Tech', 'Review', 'Gadgets'],
    views: 567890,
    uploadDate: '2024-01-14',
    previewUrl: undefined
  },
  {
    id: '3',
    title: 'Cooking Masterclass Series',
    thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=225&fit=crop',
    duration: '15:22',
    tags: ['Cooking', 'Food', 'Tutorial'],
    views: 890123,
    uploadDate: '2024-01-13',
    previewUrl: undefined
  },
  {
    id: '4',
    title: 'Gaming Highlights Compilation',
    thumbnail: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=400&h=225&fit=crop',
    duration: '6:18',
    tags: ['Gaming', 'Highlights', 'Entertainment'],
    views: 234567,
    uploadDate: '2024-01-12',
    previewUrl: undefined
  },
  {
    id: '5',
    title: 'Fitness Workout Routine',
    thumbnail: 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=400&h=225&fit=crop',
    duration: '25:10',
    tags: ['Fitness', 'Workout', 'Health'],
    views: 345678,
    uploadDate: '2024-01-11',
    previewUrl: undefined
  },
  {
    id: '6',
    title: 'Travel Vlog: Exotic Destinations',
    thumbnail: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=225&fit=crop',
    duration: '18:47',
    tags: ['Travel', 'Vlog', 'Adventure'],
    views: 789012,
    uploadDate: '2024-01-10',
    previewUrl: undefined
  },
];

interface VideoGridProps {
  title?: string;
  videos?: typeof mockVideos;
  showTitle?: boolean;
}

const VideoGrid: React.FC<VideoGridProps> = ({ 
  title = "Recently Uploaded", 
  videos = mockVideos,
  showTitle = true
}) => {
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
            <VideoCard {...video} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoGrid;
