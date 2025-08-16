import React from 'react';
import { Clock, VideoIcon, Share, Eye, Calendar } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
    owner_id: string;
    tags: string[];
    likes?: number;
    dislikes?: number;
    profiles?: {
      id: string;
      username: string;
      avatar_url?: string;
      full_name?: string;
      user_type: string;
    };
    // Computed fields for backward compatibility
    uploader_avatar?: string;
    uploader_username?: string;
    uploader_type?: 'user' | 'studio_creator' | 'individual_creator';
    uploader_id?: string;
    uploader_subscribers?: number;
    uploader_total_views?: number;
    uploader_name?: string;
    video_count?: number;
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
    const uploaderUsername = video?.profiles?.username || video?.uploader_username;
    if (!uploaderUsername) return;
    navigate(`/profile/${uploaderUsername}`);
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

      {/* Creator Profile Section - Exact Pornhub Layout */}
      {((video.profiles?.user_type === 'individual_creator' || video.profiles?.user_type === 'studio_creator') || 
        (video.uploader_type === 'individual_creator' || video.uploader_type === 'studio_creator')) && (
        <div className="bg-transparent mb-6">
          {/* Creator Info Row */}
          <div className="flex items-center gap-3 mb-4">
            <Avatar 
              className="h-12 w-12 cursor-pointer"
              onClick={handleProfileClick}
            >
              <AvatarImage src={video.profiles?.avatar_url || video.uploader_avatar} />
              <AvatarFallback className="bg-gray-600 text-white text-sm">
                {(video.profiles?.full_name || video.profiles?.username || video.uploader_name || video.uploader_username)?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 
                  className="font-semibold text-white text-base cursor-pointer hover:text-orange-400 transition-colors"
                  onClick={handleProfileClick}
                >
                  {video.profiles?.full_name || video.profiles?.username || video.uploader_name || video.uploader_username}
                </h3>
                <VerificationBadge userType={video.profiles?.user_type || video.uploader_type} />
              </div>
              
              <p className="text-sm text-gray-400">
                {video.video_count || 0} Videos | {formatViews(video.uploader_subscribers || 0)} Subscribers
              </p>
            </div>
          </div>

          {/* Subscribe Button - Full Width */}
          <Button
            variant="outline"
            className="w-full bg-transparent border border-gray-600 text-white hover:bg-gray-800 hover:border-gray-500 py-3 font-medium text-sm mb-2"
            onClick={handleProfileClick}
          >
            Subscribe
          </Button>

          {/* View More Button */}
          <div className="text-center">
            <Button
              variant="ghost"
              className="text-gray-400 hover:text-white text-sm font-medium p-2"
              onClick={handleProfileClick}
            >
              VIEW MORE
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoInfo;