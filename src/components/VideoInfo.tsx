
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
      return `${(views / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
    }
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1).replace(/\.0$/, '')}K`;
    }
    return views.toLocaleString();
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMilliseconds = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24));
    const diffInWeeks = Math.floor(diffInDays / 7);
    const diffInMonths = Math.floor(diffInDays / 30);
    const diffInYears = Math.floor(diffInDays / 365);

    if (diffInYears > 0) {
      return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
    }
    if (diffInMonths > 0) {
      return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
    }
    if (diffInWeeks > 0) {
      return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
    }
    if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
    return 'Today';
  };

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-foreground leading-tight mb-3">
          {title}
        </h1>
        <div className="flex items-center space-x-2 text-muted-foreground">
          <span className="font-medium">
            {formatViews(views)} Views
          </span>
          <span>|</span>
          <span>
            {formatTimeAgo(createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default VideoInfo;
