import React from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
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
  return (
    <div className="flex items-center space-x-4">
      <Button
        onClick={() => onReaction('like')}
        variant={userReaction === 'like' ? 'default' : 'outline'}
        size="sm"
        disabled={isLoading}
        className="flex items-center space-x-2"
      >
        <ThumbsUp className="w-4 h-4" />
        <span>{likes || 0}</span>
      </Button>
      
      <Button
        onClick={() => onReaction('dislike')}
        variant={userReaction === 'dislike' ? 'default' : 'outline'}
        size="sm"
        disabled={isLoading}
        className="flex items-center space-x-2"
      >
        <ThumbsDown className="w-4 h-4" />
        <span>{dislikes || 0}</span>
      </Button>
    </div>
  );
};

export default VideoReactions;