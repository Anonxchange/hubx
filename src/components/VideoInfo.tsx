import React from 'react';
import { Clock, VideoIcon, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoInfoProps {
  title: string;
  views: number;
  duration: string;
  createdAt: string;
  onShare: () => void;
}

const VideoInfo: React.FC<VideoInfoProps> = ({
  title,
  views,
  duration,
  createdAt,
  onShare
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
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <h1 className="text-2xl lg:text-3xl font-bold mb-2">{title}</h1>
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <span className="flex items-center">
            <VideoIcon className="w-4 h-4 mr-1" />
            {formatViews(views)} views
          </span>
          <span className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            {duration}
          </span>
          <span>Uploaded {formatDate(createdAt)}</span>
        </div>
      </div>
      
      <Button onClick={onShare} variant="outline" size="sm">
        <Share className="w-4 h-4 mr-2" />
        Share
      </Button>
    </div>
  );
};

export default VideoInfo;