
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Crown, Star, Shield, Eye, Clock, ThumbsUp } from 'lucide-react';
import PremiumHeader from '@/components/PremiumHeader';
import PremiumFooter from '@/components/PremiumFooter';
import PremiumVideoPlayer from '@/components/PremiumVideoPlayer';
import { getVideoById, incrementViews } from '@/services/videosService';
import { useRelatedVideos } from '@/hooks/useVideos';
import { useVideoReaction } from '@/hooks/useVideoReactions';
import { trackVideoView } from '@/services/userStatsService';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PremiumVideoCard from '@/components/PremiumVideoCard';

const PremiumVideoPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [videoError, setVideoError] = useState(false);

  const { data: video, isLoading, error } = useQuery({
    queryKey: ['premium-video', id],
    queryFn: () => getVideoById(id!),
    enabled: !!id,
    retry: false,
  });

  const { data: relatedVideos = [] } = useRelatedVideos(
    video?.id || '',
    video?.tags || [],
    12
  );

  const { data: reactionData, mutate: reactToVideo, isPending: reactionMutationPending } =
    useVideoReaction(video?.id || '');

  useEffect(() => {
    if (video?.id) {
      incrementViews(video.id).catch(() => {});
      const isValidUUID = user?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(user.id);
      if (isValidUUID) {
        trackVideoView(video.id, user.id).catch(err => {
          console.log("Premium video tracking error:", err);
        });
      }
    }
  }, [video?.id, user?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-purple-900/20 to-black text-white">
        <PremiumHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-purple-500/20 rounded w-24"></div>
            <div className="aspect-video bg-purple-500/20 rounded-lg"></div>
            <div className="h-8 bg-purple-500/20 rounded w-3/4"></div>
            <div className="h-4 bg-purple-500/20 rounded w-1/2"></div>
          </div>
        </main>
        <PremiumFooter />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-purple-900/20 to-black text-white">
        <PremiumHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-8">
            <Crown className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2 text-white">Premium Video Not Found</h1>
            <p className="text-gray-400 mb-4">
              {error?.message || "The premium video you're looking for doesn't exist or could not be loaded."}
            </p>
            <Link to="/premium" className="text-yellow-400 hover:text-yellow-300 transition-colors">
              Go back to Premium
            </Link>
          </div>
        </main>
        <PremiumFooter />
      </div>
    );
  }

  const handleVideoError = () => {
    setVideoError(true);
  };

  const handleVideoCanPlay = () => {
    setVideoError(false);
  };

  const handleReaction = (reactionType: 'like' | 'dislike') => {
    if (video?.id) {
      reactToVideo({ videoId: video.id, reactionType });
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
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-900/20 to-black text-white">
      <PremiumHeader />

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Back Navigation */}
        <div className="flex items-center justify-between">
          <Link
            to="/premium"
            className="flex items-center space-x-2 text-yellow-400 hover:text-yellow-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Premium</span>
          </Link>
          <div className="flex items-center space-x-2">
            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold">
              <Crown className="w-4 h-4 mr-1" />
              PREMIUM
            </Badge>
            <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
              4K Ultra HD
            </Badge>
          </div>
        </div>

        {/* Premium Video Player */}
        <div className="space-y-6">
          <div className="relative">
            <PremiumVideoPlayer
              src={video.video_url}
              poster={video.thumbnail_url}
              title={video.title}
              isPremium={true}
              quality="4K"
            />
            {videoError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 text-white text-lg rounded-xl">
                Failed to load premium video.
              </div>
            )}
          </div>

          {/* Video Title and Info */}
          <div className="space-y-4">
            <h1 className="text-2xl lg:text-3xl font-bold text-white leading-tight">
              {video.title}
            </h1>

            {/* Video Stats and Actions */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex items-center space-x-6 text-gray-300">
                <span className="flex items-center">
                  <Eye className="w-4 h-4 mr-2" />
                  {formatViews(video.views)} views
                </span>
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  {video.duration}
                </span>
                <span className="flex items-center">
                  <Shield className="w-4 h-4 mr-2 text-green-400" />
                  {formatDate(video.created_at)}
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <Button
                  variant={reactionData?.userReaction === 'like' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleReaction('like')}
                  disabled={reactionMutationPending}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 border-green-500/50"
                >
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  {reactionData?.likes || 0}
                </Button>
                <Button
                  variant={reactionData?.userReaction === 'dislike' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleReaction('dislike')}
                  disabled={reactionMutationPending}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <ThumbsUp className="w-4 h-4 mr-2 rotate-180" />
                  {reactionData?.dislikes || 0}
                </Button>
              </div>
            </div>

            {/* Tags */}
            {video.tags && video.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {video.tags.map((tag) => (
                  <Badge key={tag} className="bg-purple-600/50 text-purple-100 border-purple-500/30">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Description */}
            {video.description && (
              <Card className="bg-gradient-to-br from-black/80 to-purple-900/20 border-purple-500/20">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                    <Star className="w-5 h-5 text-yellow-400 mr-2" />
                    Premium Description
                  </h3>
                  <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {video.description}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Related Premium Videos */}
        {relatedVideos.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <Crown className="w-6 h-6 text-yellow-400 mr-2" />
                More Premium Content
              </h2>
              <Link 
                to="/premium" 
                className="text-yellow-400 hover:text-yellow-300 transition-colors text-sm"
              >
                View All Premium
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {relatedVideos.slice(0, 8).map((relatedVideo) => (
                <PremiumVideoCard key={relatedVideo.id} video={relatedVideo} />
              ))}
            </div>
          </div>
        )}
      </main>

      <PremiumFooter />
    </div>
  );
};

export default PremiumVideoPage;
