import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Heart, Share, Plus, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PlaylistModal from './PlaylistModal';
import ShareModal from './ShareModal';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useVideoReaction } from '@/hooks/useVideoReactions';

interface VideoReactionsProps {
  videoId: string;
  videoTitle: string;
  likes: number;
  dislikes: number;
  userReaction?: 'like' | 'dislike' | null;
}

const VideoReactions: React.FC<VideoReactionsProps> = ({
  videoId,
  videoTitle,
  likes,
  dislikes,
  userReaction,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Hook to handle reactions and live updates
  const { data: reactionData, mutate: reactToVideo, isPending } = useVideoReaction(videoId);

  const currentLikes = reactionData?.likes ?? likes;
  const currentDislikes = reactionData?.dislikes ?? dislikes;
  const currentUserReaction = reactionData?.userReaction ?? userReaction;

  const formatCount = (count: number) => {
    if (count >= 1000) return `${Math.floor(count / 1000)}K`;
    return count?.toString() || '0';
  };

  const handleReaction = (reactionType: 'like' | 'dislike') => {
    if (!user) {
      toast.error('Please log in to react to videos');
      navigate('/auth');
      return;
    }
    reactToVideo({ videoId, reactionType });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: videoTitle,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const handlePlaylistClick = () => {
    if (!user) {
      toast.error('Please log in to create and manage playlists');
      navigate('/auth');
      return;
    }
    setIsPlaylistModalOpen(true);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Like Button */}
      <Button
        variant="ghost"
        size="sm"
        className={`rounded-full gap-2 px-4 ${
          currentUserReaction === 'like'
            ? 'bg-blue-500/20 text-blue-500 hover:bg-blue-500/30'
            : 'bg-muted/20 hover:bg-muted/30 text-muted-foreground hover:text-foreground'
        }`}
        onClick={() => handleReaction('like')}
        disabled={isPending}
      >
        <ThumbsUp className={`w-5 h-5 ${currentUserReaction === 'like' ? 'fill-current' : ''}`} />
        <span className="text-sm font-medium">{formatCount(currentLikes)}</span>
      </Button>

      {/* Dislike Button */}
      <Button
        variant="ghost"
        size="sm"
        className={`rounded-full gap-2 px-4 ${
          currentUserReaction === 'dislike'
            ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
            : 'bg-muted/20 hover:bg-muted/30 text-muted-foreground hover:text-foreground'
        }`}
        onClick={() => handleReaction('dislike')}
        disabled={isPending}
      >
        <ThumbsDown className={`w-5 h-5 ${currentUserReaction === 'dislike' ? 'fill-current' : ''}`} />
        <span className="text-sm font-medium">{formatCount(currentDislikes)}</span>
      </Button>

      {/* Heart/Favorite */}
      <Button
        variant="ghost"
        size="sm"
        className="rounded-full w-10 h-10 p-0 bg-muted/20 hover:bg-muted/30 text-muted-foreground hover:text-foreground"
      >
        <Heart className="w-5 h-5" />
      </Button>

      {/* Share Button */}
      <Button
        variant="ghost"
        size="sm"
        className="rounded-full w-10 h-10 p-0 bg-muted/20 hover:bg-muted/30 text-muted-foreground hover:text-foreground"
        onClick={() => setIsShareModalOpen(true)}
      >
        <Share className="w-5 h-5" />
      </Button>

      {/* Add to Playlist */}
      <Button
        variant="ghost"
        size="sm"
        className="rounded-full w-10 h-10 p-0 bg-muted/20 hover:bg-muted/30 text-muted-foreground hover:text-foreground"
        onClick={handlePlaylistClick}
      >
        <Plus className="w-5 h-5" />
      </Button>

      {/* Report */}
      <Button
        variant="ghost"
        size="sm"
        className="rounded-full w-10 h-10 p-0 bg-muted/20 hover:bg-muted/30 text-muted-foreground hover:text-foreground"
        onClick={() => toast.info('Report functionality coming soon')}
      >
        <Flag className="w-5 h-5" />
      </Button>

      {/* Playlist Modal */}
      {user && (
        <PlaylistModal
          videoId={videoId}
          open={isPlaylistModalOpen}
          onOpenChange={setIsPlaylistModalOpen}
        />
      )}

      {/* Share Modal */}
      <ShareModal
        videoId={videoId}
        videoTitle={videoTitle}
        open={isShareModalOpen}
        onOpenChange={setIsShareModalOpen}
      />
    </div>
  );
};

export default VideoReactions;