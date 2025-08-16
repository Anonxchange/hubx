import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Share } from 'lucide-react';
import VerificationBadge from './VerificationBadge';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { Post } from '@/services/socialFeedService';

interface CreatorPostCardProps {
  post: Post;
  onLike?: (postId: string, isLiked: boolean) => void;
  showCreatorInfo?: boolean;
}

const CreatorPostCard: React.FC<CreatorPostCardProps> = ({ 
  post, 
  onLike, 
  showCreatorInfo = true 
}) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      {showCreatorInfo && (
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-3">
            <Link to={`/profile/${post.creator?.username}`}>
              <Avatar className="h-10 w-10 hover:ring-2 hover:ring-blue-500 transition-all">
                <AvatarImage 
                  src={post.creator?.profile_picture_url || ''} 
                  alt={post.creator?.username || 'Creator'} 
                />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {(post.creator?.username || 'A')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>

            <div className="flex-1">
              <Link to={`/profile/${post.creator?.username}`}>
                <div className="flex items-center space-x-2 hover:text-blue-500 transition-colors">
                  <h3 className="font-semibold">
                    {post.creator?.full_name || post.creator?.username || 'Anonymous'}
                  </h3>
                  {/* Show TV icon for studio creators, verification badge for individual creators */}
                  {post.creator?.user_type === 'studio_creator' && (
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-purple-500 rounded-full">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6zm4 2v4l3-2-3-2z"/>
                      </svg>
                    </span>
                  )}
                  {post.creator?.user_type === 'individual_creator' && (
                    <VerificationBadge
                      userType="individual_creator"
                      showText={false}
                    />
                  )}
                </div>
              </Link>
              <p className="text-sm text-muted-foreground">
                @{post.creator?.username} • {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        </CardHeader>
      )}

      <CardContent className="space-y-4">
        <p className="text-foreground leading-relaxed">{post.content}</p>

        {/* Media content */}
        {post.media_url && (
          <div className="mt-3 -mx-6">
            {post.media_type === 'image' ? (
              <img 
                src={post.media_url} 
                alt="Post media" 
                className="w-full h-auto object-cover max-h-96"
              />
            ) : (
              <video 
                src={post.media_url} 
                controls 
                className="w-full h-auto max-h-96"
              />
            )}
          </div>
        )}

        {/* Post Actions */}
        <div className="flex items-center space-x-6 pt-2 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onLike?.(post.id, post.isLiked || false)}
            className={`${post.isLiked ? 'text-red-500' : 'text-muted-foreground'} hover:text-red-500`}
          >
            <Heart className={`w-4 h-4 mr-2 ${post.isLiked ? 'fill-current' : ''}`} />
            {post.likes_count || 0}
          </Button>

          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-blue-500">
            <MessageCircle className="w-4 h-4 mr-2" />
            {post.comments_count || 0}
          </Button>

          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-green-500">
            <Share className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreatorPostCard;