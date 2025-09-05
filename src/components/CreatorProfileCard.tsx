import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import VerificationBadge from '@/components/VerificationBadge';
import { CreatorProfile, formatNumber } from '@/services/creatorSearchService';
import { subscribeToCreator, unsubscribeFromCreator, isSubscribedToCreator } from '@/services/socialFeedService';
import { useToast } from '@/hooks/use-toast';

interface CreatorProfileCardProps {
  creator: CreatorProfile;
  onClose?: () => void;
}

const CreatorProfileCard: React.FC<CreatorProfileCardProps> = ({ creator, onClose }) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(creator.subscriberCount);
  const { toast } = useToast();

  useEffect(() => {
    checkSubscriptionStatus();
  }, [creator.id]);

  const checkSubscriptionStatus = async () => {
    try {
      const subscribed = await isSubscribedToCreator(creator.id);
      setIsSubscribed(subscribed);
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  };

  const handleSubscriptionToggle = async () => {
    setIsLoading(true);
    try {
      if (isSubscribed) {
        const success = await unsubscribeFromCreator(creator.id);
        if (success) {
          setIsSubscribed(false);
          setSubscriberCount(prev => Math.max(0, prev - 1));
          toast({
            title: "Unsubscribed",
            description: `You have unsubscribed from ${creator.username || creator.full_name}`,
          });
        }
      } else {
        const success = await subscribeToCreator(creator.id);
        if (success) {
          setIsSubscribed(true);
          setSubscriberCount(prev => prev + 1);
          toast({
            title: "Subscribed",
            description: `You are now subscribed to ${creator.username || creator.full_name}`,
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const displayName = creator.username || creator.full_name || 'Unknown Creator';

  return (
    <div 
      className="bg-gray-900 rounded-lg overflow-hidden mb-4 hover:bg-gray-800 transition-colors cursor-pointer"
      data-testid={`creator-profile-card-${creator.id}`}
      onClick={onClose}
    >
      {/* Banner/Cover Photo */}
      <div className="relative h-32 bg-gradient-to-r from-purple-600 to-blue-600">
        {creator.cover_photo_url && (
          <img 
            src={creator.cover_photo_url} 
            alt={`${displayName} banner`}
            className="w-full h-full object-cover"
          />
        )}
        
        {/* Rank Badge */}
        <div className="absolute top-4 left-4">
          <Badge variant="secondary" className="bg-black bg-opacity-70 text-white">
            Rank: {creator.rank}
          </Badge>
        </div>

        {/* Subscribe Button */}
        <div className="absolute top-4 right-4">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleSubscriptionToggle();
            }}
            variant={isSubscribed ? "secondary" : "default"}
            size="sm"
            disabled={isLoading}
            className={isSubscribed ? "bg-gray-600 hover:bg-gray-700" : "bg-orange-600 hover:bg-orange-700"}
            data-testid={`button-${isSubscribed ? 'unsubscribe' : 'subscribe'}-${creator.id}`}
          >
            {isLoading ? "..." : isSubscribed ? "Subscribed" : "Subscribe"}
          </Button>
        </div>

        {/* Avatar positioned to overlap */}
        <div className="absolute -bottom-8 left-4">
          <Avatar className="w-16 h-16 border-4 border-gray-900">
            <AvatarImage 
              src={creator.avatar_url || undefined} 
              alt={displayName}
            />
            <AvatarFallback className="bg-gray-700 text-white text-lg">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Creator Info */}
      <div className="p-4 pt-12">
        <div className="flex items-center gap-2 mb-2">
          <h3 
            className="text-white font-semibold text-lg"
            data-testid={`text-creator-name-${creator.id}`}
          >
            {displayName}
          </h3>
          <VerificationBadge 
            userType={creator.user_type as 'individual_creator' | 'studio_creator'}
            size="medium"
          />
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-sm text-gray-300">
          <span data-testid={`text-subscribers-${creator.id}`}>
            <span className="font-semibold text-white">{formatNumber(subscriberCount)}</span> Subscribers
          </span>
          <span data-testid={`text-videos-${creator.id}`}>
            <span className="font-semibold text-white">{formatNumber(creator.videoCount)}</span> Videos
          </span>
          <span data-testid={`text-views-${creator.id}`}>
            <span className="font-semibold text-white">{formatNumber(creator.totalViews)}</span> Video Views
          </span>
        </div>

        {/* Bio */}
        {creator.bio && (
          <p className="text-gray-400 text-sm mt-2 line-clamp-2">
            {creator.bio}
          </p>
        )}
      </div>
    </div>
  );
};

export default CreatorProfileCard;