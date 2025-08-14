import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { ThumbsUp, ThumbsDown, Heart, Share2, Plus, Flag } from 'lucide-react';
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
}

const VideoReactions: React.FC<VideoReactionsProps> = ({
  videoId,
  videoTitle,
  likes,
  dislikes,
}) => {
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Use the video reaction hook
  const { userReaction, reactToVideo, isLoading } = useVideoReaction(videoId);

  const formatCount = (count: number) => {
    if (count >= 1000) return `${Math.floor(count / 1000)}K`;
    return count?.toString() || '0';
  };

  // Trigger reaction (works for all users)
  const handleReaction = (reactionType: 'like' | 'dislike') => {
    if (!videoId || !reactToVideo) return;
    reactToVideo({ videoId, reactionType });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Check out this video on HubX',
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
          userReaction === 'like'
            ? 'bg-blue-500/20 text-blue-500 hover:bg-blue-500/30'
            : 'bg-muted/20 hover:bg-muted/30 text-muted-foreground hover:text-foreground'
        }`}
        onClick={() => handleReaction('like')}
        disabled={isLoading}
      >
        <ThumbsUp className={`w-5 h-5 ${userReaction === 'like' ? 'fill-current' : ''}`} />
        <span className="text-sm font-medium">{formatCount(likes)}</span>
      </Button>

      {/* Dislike Button */}
      <Button
        variant="ghost"
        size="sm"
        className={`rounded-full gap-2 px-4 ${
          userReaction === 'dislike'
            ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
            : 'bg-muted/20 hover:bg-muted/30 text-muted-foreground hover:text-foreground'
        }`}
        onClick={() => handleReaction('dislike')}
        disabled={isLoading}
      >
        <ThumbsDown className={`w-5 h-5 ${userReaction === 'dislike' ? 'fill-current' : ''}`} />
        <span className="text-sm font-medium">{formatCount(dislikes)}</span>
      </Button>

      {/* Heart/Favorite */}
      <Button
        variant="ghost"
        size="sm"
        className="rounded-full w-10 h-10 p-0 bg-muted/20 hover:bg-muted/30 text-muted-foreground hover:text-foreground"
      >
        <Heart className="w-5 h-5" />
      </Button>

      {/* Share */}
      <Button
        variant="ghost"
        size="sm"
        className="rounded-full w-10 h-10 p-0 bg-muted/20 hover:bg-muted/30 text-muted-foreground hover:text-foreground"
        onClick={handleShare}
      >
        <Share2 className="w-5 h-5" />
      </Button>

      {/* Playlist */}
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
        onClick={() => navigate(`/report/${videoId}`)}
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