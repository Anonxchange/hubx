import React, { useState, useEffect } from 'react';
import { X, Crown, Eye, ThumbsUp, Clock, Star, Play, UserPlus } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useVideos } from '@/hooks/useVideos';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface RecommendedVideosModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RecommendedVideosModal: React.FC<RecommendedVideosModalProps> = ({ isOpen, onClose }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [subscribedCreators, setSubscribedCreators] = useState<Set<string>>(new Set());
  const [subscribingCreators, setSubscribingCreators] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  // Get trending premium videos with 7-day refresh cycle
  const getTrendingCacheKey = () => {
    const now = new Date();
    const daysSinceEpoch = Math.floor(now.getTime() / (1000 * 60 * 60 * 24));
    const weekNumber = Math.floor(daysSinceEpoch / 7);
    return `trending-premium-${weekNumber}`;
  };

  const { data, isLoading, error } = useVideos(
    currentPage,
    20,
    'premium',
    undefined,
    'trending', // Sort by trending
    true // Premium only
  );

  const { videos = [], totalPages = 0 } = data || {};

  // Filter videos to only show those from the last 7 days if fresh content is available
  const getRecommendedVideos = () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get videos from the last 7 days
    const recentVideos = videos.filter(video => 
      new Date(video.created_at) >= sevenDaysAgo
    );

    // If we have fresh videos from the last 7 days, use them
    // Otherwise, fall back to trending videos from any time period
    return recentVideos.length >= 10 ? recentVideos : videos;
  };

  const recommendedVideos = getRecommendedVideos();

// Load user's subscriptions
  useEffect(() => {
    const loadSubscriptions = async () => {
      if (!user?.id) return;

      try {
        const { data: subscriptions, error } = await supabase
          .from('creator_subscriptions')
          .select('creator_id')
          .eq('subscriber_id', user.id)
          .eq('is_active', true);

        if (error) {
          console.error('Error loading subscriptions:', error);
          return;
        }

        const creatorIds = new Set(subscriptions?.map(sub => sub.creator_id) || []);
        setSubscribedCreators(creatorIds);
      } catch (error) {
        console.error('Error loading subscriptions:', error);
      }
    };

    if (isOpen) {
      loadSubscriptions();
    }
  }, [user?.id, isOpen]);

  const handleSubscribe = async (creatorId: string) => {
    if (!user?.id || !creatorId) return;

    setSubscribingCreators(prev => new Set([...prev, creatorId]));

    try {
      const isCurrentlySubscribed = subscribedCreators.has(creatorId);

      if (isCurrentlySubscribed) {
        // Unsubscribe
        const { error } = await supabase
          .from('creator_subscriptions')
          .update({ is_active: false })
          .eq('subscriber_id', user.id)
          .eq('creator_id', creatorId);

        if (error) throw error;

        setSubscribedCreators(prev => {
          const newSet = new Set(prev);
          newSet.delete(creatorId);
          return newSet;
        });
      } else {
        // Subscribe
        const { error } = await supabase
          .from('creator_subscriptions')
          .upsert({
            subscriber_id: user.id,
            creator_id: creatorId,
            is_active: true,
            subscribed_at: new Date().toISOString()
          });

        if (error) throw error;

        setSubscribedCreators(prev => new Set([...prev, creatorId]));
      }
    } catch (error) {
      console.error('Error managing subscription:', error);
    } finally {
      setSubscribingCreators(prev => {
        const newSet = new Set(prev);
        newSet.delete(creatorId);
        return newSet;
      });
    }
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] bg-black text-white p-0 overflow-hidden rounded-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gradient-to-r from-yellow-600/20 to-orange-600/20">
          <div className="flex items-center space-x-3">
            <Crown className="w-6 h-6 text-yellow-400" />
            <div>
              <h2 className="text-lg font-bold text-yellow-400">Trending Premium Videos</h2>
              <p className="text-sm text-gray-300">
                {recommendedVideos.length > 0 && new Date(recommendedVideos[0]?.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000 
                  ? 'Fresh content from this week' 
                  : 'Top trending premium content'
                }
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(85vh-80px)]">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-800 rounded-lg aspect-video"></div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <Crown className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-2">Error loading recommendations</h3>
              <p className="text-gray-400">Please try again later.</p>
            </div>
          ) : recommendedVideos.length === 0 ? (
            <div className="text-center py-8">
              <Crown className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-2">No trending videos available</h3>
              <p className="text-gray-400">Check back later for new premium content.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendedVideos.map((video) => (
                <div key={video.id} className="group bg-gray-900 rounded-lg overflow-hidden hover:bg-gray-800 transition-colors">
                  <Link to={`/premium/video/${video.id}`} onClick={onClose}>
                    <div className="relative aspect-video">
                      {/* Premium Badge */}
                      <div className="absolute top-2 left-2 z-10">
                        <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold text-xs">
                          <Crown className="w-3 h-3 mr-1" />
                          PREMIUM
                        </Badge>
                      </div>

                      {/* Trending Badge for fresh content */}
                      {new Date(video.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000 && (
                        <div className="absolute top-2 right-2 z-10">
                          <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold text-xs">
                            <Star className="w-3 h-3 mr-1" />
                            NEW
                          </Badge>
                        </div>
                      )}

                      <img
                        src={video.thumbnail_url || 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=400&h=300&fit=crop'}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      {/* Duration */}
                      <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                        {video.duration || '15:30'}
                      </div>

                      {/* Play overlay */}
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="bg-yellow-500/90 text-black p-3 rounded-full">
                          <Play className="w-6 h-6" fill="currentColor" />
                        </div>
                      </div>
                    </div>
                  </Link>

                  <div className="p-3">
                    <Link to={`/premium/video/${video.id}`} onClick={onClose}>
                      <h3 className="font-semibold text-sm line-clamp-2 leading-tight mb-2 hover:text-yellow-400 transition-colors">
                        {video.title}
                      </h3>
                    </Link>

                    {/* Creator info and subscribe button */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {(video.profiles?.avatar_url || video.uploader_avatar) ? (
                          <img
                            src={video.profiles?.avatar_url || video.uploader_avatar}
                            alt={video.uploader_username || "Creator"}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs text-white font-bold">
                            {(video.uploader_username || video.profiles?.username || video.uploader_name || "U").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="text-xs text-gray-300 truncate max-w-[120px]">
                          {video.uploader_username || video.uploader_name || "Premium Creator"}
                        </span>
                      </div>

                      {/* Subscribe button */}
                      {user && video.uploader_id && video.uploader_id !== user.id && (
                        <Button
                          onClick={(e) => {
                            e.preventDefault();
                            handleSubscribe(video.uploader_id);
                          }}
                          disabled={subscribingCreators.has(video.uploader_id)}
                          className={`text-xs px-2 py-1 h-6 ${
                            subscribedCreators.has(video.uploader_id)
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : 'bg-yellow-500 hover:bg-yellow-600 text-black'
                          }`}
                        >
                          {subscribingCreators.has(video.uploader_id) ? (
                            '...'
                          ) : subscribedCreators.has(video.uploader_id) ? (
                            'Subscribed'
                          ) : (
                            <>
                              <UserPlus className="w-3 h-3 mr-1" />
                              Subscribe
                            </>
                          )}
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                      <span className="flex items-center">
                        <Eye className="w-3 h-3 mr-1" />
                        {formatViews(video.views || 0)}
                      </span>
                      <span className="flex items-center">
                        <ThumbsUp className="w-3 h-3 mr-1" />
                        {video.likes || 0}
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatDate(video.created_at)}
                      </span>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {video.tags?.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs border-yellow-500/50 text-yellow-400">
                          {tag}
                        </Badge>
                      ))}
                      {video.tags && video.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs border-gray-500 text-gray-400">
                          +{video.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6 space-x-2">
              <Button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="bg-gray-800 hover:bg-gray-700 text-white"
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="bg-gray-800 hover:bg-gray-700 text-white"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RecommendedVideosModal;