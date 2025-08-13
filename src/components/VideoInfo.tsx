import React from 'react';
import { Clock, VideoIcon, Share, Eye, Calendar } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import VideoReactions from './VideoReactions';
import VideoTags from './VideoTags';
import VerificationBadge from './VerificationBadge';
import { formatDistanceToNow } from 'date-fns';


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
    likes?: number;
    dislikes?: number;
  };
  // Reaction props
  reactionData?: { userReaction: 'like' | 'dislike' | null | undefined; likes: number; dislikes: number };
  onReaction: (reactionType: 'like' | 'dislike') => void;
  reactToVideo: ({ videoId, reactionType }: { videoId: string; reactionType: 'like' | 'dislike' }) => void;
  isReactionLoading: boolean;
  reactionMutationPending: boolean;
}

const VideoInfo: React.FC<VideoInfoProps> = ({
  title,
  views,
  duration,
  createdAt,
  onShare,
  video, // Destructure video object
  reactionData,
  onReaction,
  reactToVideo,
  isReactionLoading,
  reactionMutationPending,
}) => {
  const navigate = useNavigate();

  const handleProfileClick = () => {
    if (!video || !video.uploader_username) return;
    navigate(`/profile/${video.uploader_username}`);
  };
  const formatViews = (count: number) => {
    if (!count || count < 0) return '0';
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown date';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Unknown date';
    }
  };

  return (
    <div className="space-y-3">
      <h1 className="text-xl lg:text-2xl font-bold text-foreground leading-tight mb-3">
        {title || 'Untitled Video'}
      </h1>
      <div className="flex items-center space-x-2 text-muted-foreground">
        <span className="font-medium">
          {formatViews(views || 0)} Views
        </span>
        <span>|</span>
        <span>
          {formatDate(createdAt)}
        </span>
      </div>

      {/* Video Reactions - Like, Dislike, Share, etc. */}
      <VideoReactions
        videoId={video?.id || ''}
        videoTitle={title}
        likes={reactionData?.likes || video?.likes || 0}
        dislikes={reactionData?.dislikes || video?.dislikes || 0}
        userReaction={reactionData?.userReaction}
        onReaction={onReaction}
        isLoading={isReactionLoading}
        reactToVideo={reactToVideo}
        reactionData={reactionData}
        isPending={reactionMutationPending}
      />

      <VideoTags tags={video?.tags || []} />

      {/* Creator Profile Section - Only show for individual_creator and studio_creator */}
      {(video?.uploader_type === 'individual_creator' || video?.uploader_type === 'studio_creator') && (
        <div className="flex items-center space-x-3 py-4 border-y border-border">
          {/* Clickable Avatar - Navigate to profile */}
          <div className="cursor-pointer" onClick={handleProfileClick}>
            <Avatar className="h-12 w-12 hover:ring-2 hover:ring-blue-500 transition-all">
              <AvatarImage src={video?.uploader_avatar || ''} alt={video?.uploader_username || 'Creator'} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {(video?.uploader_username || 'A')[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="flex-1">
            {/* Clickable Username with Verification Badge */}
            <div
              className="flex items-center space-x-2 cursor-pointer hover:text-blue-500 transition-colors"
              onClick={handleProfileClick}
            >
              <h3 className="font-semibold text-lg">{video?.uploader_username || 'Anonymous'}</h3>
              <VerificationBadge
                userType={video.uploader_type}
                showText={false}
              />
            </div>

            {/* Creator Stats */}
            <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
              <span>{formatViews(video?.uploader_total_views || 0)} total views</span>
              <span>{formatViews(video?.uploader_subscribers || 0)} subscribers</span>
              {video?.uploader_type === 'studio_creator' && (
                <span className="text-purple-400">Studio</span>
              )}
              {video?.uploader_type === 'individual_creator' && (
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
      )}
    </div>
  );
};

export default VideoInfo;