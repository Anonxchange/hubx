import React from 'react';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import VideoReactions from './VideoReactions';
import VideoTags from './VideoTags';
import VerificationBadge from './VerificationBadge';
import { formatDistanceToNow } from 'date-fns';

interface VideoInfoProps {
  title: string;
  views: number;
  duration?: string;
  createdAt: string;
  onShare: () => void;
  video: {
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
      user_type: 'user' | 'studio_creator' | 'individual_creator';
      profile_picture_url?: string;
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
    title?: string;

    // NEW: tagged creators for Pornhub-style display
    taggedCreators?: Array<{
      id: string;
      username: string;
      full_name?: string;
      avatar_url?: string;
      user_type: 'studio_creator' | 'individual_creator';
      subscriberCount?: number;
      isSubscribed?: boolean;
    }>;
  };
  // Reaction props
  reactionData?: { userReaction: 'like' | 'dislike' | null | undefined; likes: number; dislikes: number };
  onReaction: (reactionType: 'like' | 'dislike') => void;
  reactToVideo: ({ videoId, reactionType }: { videoId: string; reactionType: 'like' | 'dislike' }) => void;
  isReactionLoading?: boolean;
  reactionMutationPending?: boolean;
  showViewsAndDate?: boolean;
  subscriberCount?: number;
  isSubscribed?: boolean;
  onSubscribe?: () => void;
  onProfileClick?: () => void;
  isSubscribing?: boolean;
}

const VideoInfo: React.FC<VideoInfoProps> = ({
  title,
  views,
  createdAt,
  video,
  reactionData,
  onReaction,
  reactToVideo,
  isReactionLoading = false,
  reactionMutationPending = false,
  showViewsAndDate = true,
  subscriberCount = 0,
  isSubscribed = false,
  onSubscribe,
  isSubscribing = false,
}) => {
  const navigate = useNavigate();

  const handleProfileNavigation = () => {
    const uploaderUsername = video?.profiles?.username || video?.uploader_username;
    if (!uploaderUsername) return;
    navigate(`/profile/${uploaderUsername}`);
  };

  const formatViews = (count: number) => {
    if (!count || count < 0) return '0';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
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

  const creatorName =
    video?.profiles?.full_name ||
    video?.profiles?.username ||
    video?.uploader_name ||
    video?.uploader_username ||
    'Unknown Creator';

  return (
    <div className="space-y-3">
      {title && (
        <h1 className="text-xl lg:text-2xl font-bold text-foreground leading-tight mb-3">
          {title}
        </h1>
      )}

      {/* Video Reactions */}
      <VideoReactions
        videoId={video?.id || ''}
        videoTitle={title || video?.title || ''}
        likes={reactionData?.likes || video?.likes || 0}
        dislikes={reactionData?.dislikes || video?.dislikes || 0}
        userReaction={reactionData?.userReaction}
        onReaction={onReaction}
        isLoading={isReactionLoading}
        reactToVideo={reactToVideo}
        reactionData={reactionData}
        isPending={reactionMutationPending}
      />

      {showViewsAndDate && (
        <div className="flex items-center space-x-2 text-muted-foreground">
          <span className="font-medium">{formatViews(views || 0)} Views</span>
          <span>|</span>
          <span>{formatDate(createdAt)}</span>
        </div>
      )}

      {/* Tags */}
      <VideoTags tags={video?.tags || []} />

      {/* Tagged Creators Section */}
      {video?.taggedCreators && video.taggedCreators.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold mb-3">Tagged Creators</h4>
          <div className="flex flex-wrap gap-4">
            {video.taggedCreators.map((creator) => (
              <div key={creator.id} className="flex items-center space-x-3">
                <Avatar
                  className="w-10 h-10 cursor-pointer"
                  onClick={() => navigate(`/profile/${creator.username}`)}
                >
                  <AvatarImage src={creator.avatar_url || '/placeholder.svg'} />
                  <AvatarFallback>
                    {creator.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div
                    className="font-semibold cursor-pointer hover:text-orange-500"
                    onClick={() => navigate(`/profile/${creator.username}`)}
                  >
                    {creator.full_name || creator.username}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {creator.subscriberCount || 0} subscribers
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Uploader Creator Profile Section */}
      {((video.profiles?.user_type === 'individual_creator' ||
        video.profiles?.user_type === 'studio_creator') ||
        (video.uploader_type === 'individual_creator' ||
          video.uploader_type === 'studio_creator')) && (
        <div className="bg-transparent mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <Avatar
              className="w-10 h-10 cursor-pointer"
              onClick={handleProfileNavigation}
            >
              <AvatarImage
                src={
                  video?.profiles?.avatar_url ||
                  video?.profiles?.profile_picture_url ||
                  '/placeholder.svg'
                }
                alt={creatorName}
              />
              <AvatarFallback>{creatorName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3
                  className="font-semibold text-foreground cursor-pointer hover:text-orange-500 transition-colors"
                  onClick={handleProfileNavigation}
                >
                  {creatorName}
                </h3>
                <VerificationBadge
                  userType={video?.profiles?.user_type || video.uploader_type}
                  size="small"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {subscriberCount >= 1000000
                  ? `${(subscriberCount / 1000000).toFixed(1)}M`
                  : subscriberCount >= 1000
                  ? `${(subscriberCount / 1000).toFixed(1)}K`
                  : subscriberCount}{' '}
                subscribers
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className={`${
                isSubscribed
                  ? 'bg-green-600 hover:bg-green-700 text-white border-green-600'
                  : 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500'
              } transition-all`}
              onClick={onSubscribe}
              disabled={isSubscribing}
            >
              {isSubscribing ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Loading...</span>
                </div>
              ) : isSubscribed ? (
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4" />
                  <span>Subscribed</span>
                </div>
              ) : (
                'Subscribe'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoInfo;