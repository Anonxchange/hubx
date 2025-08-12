import React from 'react';
import { Clock, VideoIcon, Share } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import VideoReactions from './VideoReactions';
import VideoTags from './VideoTags';
import VerificationBadge from './VerificationBadge';

interface VideoInfoProps {
  title: string;
  views: number;
  duration: string;
  createdAt: string;
  onShare: () => void;
  video: { // Assuming video object contains uploader details
    id: string;
    uploader_avatar?: string;
    uploader_username?: string;
    uploader_type?: 'user' | 'studio_creator' | 'individual_creator';
    uploader_id?: string;
    uploader_subscribers?: number;
    uploader_total_views?: number;
    tags: string[];
  };
}

const VideoInfo: React.FC<VideoInfoProps> = ({
  title,
  views,
  duration,
  createdAt,
  onShare,
  video, // Destructure video object
}) => {
  const navigate = useNavigate();

  const handleProfileClick = () => {
    navigate(`/profile/${video.uploader_username}`);
  };
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

      <VideoReactions videoId={video.id} />

      {/* Creator Profile Section */}
      <div className="flex items-center space-x-3 py-4 border-y border-border">
        {/* Clickable Avatar - Navigate to profile */}
        <div className="cursor-pointer" onClick={handleProfileClick}>
          <Avatar className="h-12 w-12 hover:ring-2 hover:ring-blue-500 transition-all">
            <AvatarImage src={video.uploader_avatar || ''} alt={video.uploader_username || 'Creator'} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              {(video.uploader_username || 'A')[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
        
        <div className="flex-1">
          {/* Clickable Username with Verification Badge */}
          <div 
            className="flex items-center space-x-2 cursor-pointer hover:text-blue-500 transition-colors"
            onClick={handleProfileClick}
          >
            <h3 className="font-semibold text-lg">{video.uploader_username || 'Anonymous'}</h3>
            {(video.uploader_type === 'individual_creator' || video.uploader_type === 'studio_creator') && (
              <VerificationBadge
                userType={video.uploader_type}
                showText={false}
              />
            )}
          </div>
          
          {/* Creator Stats */}
          <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
            <span>{formatViews(video.uploader_total_views || 0)} total views</span>
            <span>{formatViews(video.uploader_subscribers || 0)} subscribers</span>
            {video.uploader_type === 'studio_creator' && (
              <span className="text-purple-400">Studio</span>
            )}
            {video.uploader_type === 'individual_creator' && (
              <span className="text-orange-400">Creator</span>
            )}
          </div>
        </div>
        
        {/* Subscribe Button */}
        <Button 
          variant="default" 
          size="sm"
          className="bg-orange-500 hover:bg-orange-600 text-white px-6"
        >
          Subscribe
        </Button>
      </div>

      <VideoTags tags={video.tags} />
    </div>
  );
};

export default VideoInfo;