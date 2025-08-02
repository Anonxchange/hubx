
import React from 'react';
import { ThumbsUp, ThumbsDown, Heart, Share, Plus, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoReactionsProps {
  likes: number;
  dislikes: number;
  userReaction: 'like' | 'dislike' | null | undefined;
  onReaction: (reactionType: 'like' | 'dislike') => void;
  isLoading: boolean;
}

const VideoReactions: React.FC<VideoReactionsProps> = ({
  likes,
  dislikes,
  userReaction,
  onReaction,
  isLoading
}) => {
  const formatCount = (count: number) => {
    if (count >= 1000) {
      return `${Math.floor(count / 1000)}K`;
    }
    return count.toString();
  };

  return (
    <div className="flex items-center space-x-3">
      {/* Like/Dislike Combined Button */}
      <div className="flex items-center bg-muted/20 rounded-full overflow-hidden">
        <Button
          onClick={() => onReaction('like')}
          variant="ghost"
          size="sm"
          disabled={isLoading}
          className={`rounded-none rounded-l-full px-4 py-2 h-12 ${
            userReaction === 'like' 
              ? 'bg-primary/20 text-primary' 
              : 'hover:bg-muted/30 text-muted-foreground hover:text-foreground'
          }`}
        >
          <ThumbsUp className="w-5 h-5 mr-2" />
          <span className="font-medium">{formatCount(likes || 0)}</span>
        </Button>
        
        <div className="w-px bg-border h-6"></div>
        
        <Button
          onClick={() => onReaction('dislike')}
          variant="ghost"
          size="sm"
          disabled={isLoading}
          className={`rounded-none rounded-r-full px-4 py-2 h-12 ${
            userReaction === 'dislike' 
              ? 'bg-destructive/20 text-destructive' 
              : 'hover:bg-muted/30 text-muted-foreground hover:text-foreground'
          }`}
        >
          <ThumbsDown className="w-5 h-5" />
        </Button>
      </div>

      {/* Heart/Favorite Button */}
      <Button
        variant="ghost"
        size="sm"
        className="rounded-full w-12 h-12 p-0 bg-muted/20 hover:bg-muted/30 text-muted-foreground hover:text-foreground"
      >
        <Heart className="w-5 h-5" />
      </Button>

      {/* Share Button */}
      <Button
        variant="ghost"
        size="sm"
        className="rounded-full w-12 h-12 p-0 bg-muted/20 hover:bg-muted/30 text-muted-foreground hover:text-foreground"
      >
        <Share className="w-5 h-5" />
      </Button>

      {/* Add/Plus Button */}
      <Button
        variant="ghost"
        size="sm"
        className="rounded-full w-12 h-12 p-0 bg-muted/20 hover:bg-muted/30 text-muted-foreground hover:text-foreground"
      >
        <Plus className="w-5 h-5" />
      </Button>

      {/* Flag/Report Button */}
      <Button
        variant="ghost"
        size="sm"
        className="rounded-full w-12 h-12 p-0 bg-muted/20 hover:bg-muted/30 text-muted-foreground hover:text-foreground"
      >
        <Flag className="w-5 h-5" />
      </Button>
    </div>
  );
};

export default VideoReactions;
