import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/Header';
import AdComponent from '@/components/AdComponent';
import VideoPlayer from '@/components/VideoPlayer';
import VideoInfo from '@/components/VideoInfo';
import VideoDescription from '@/components/VideoDescription';
import RelatedVideos from '@/components/RelatedVideos';
import { getVideoById, incrementViews } from '@/services/videosService';
import { useRelatedVideos } from '@/hooks/useVideos';
import { useVideoReaction } from '@/hooks/useVideoReactions';
import { toast } from 'sonner';
import PlaylistModal from '@/components/PlaylistModal';
import ShareModal from '@/components/ShareModal';
import { useAddToPlaylist } from '@/hooks/usePlaylists';
import { trackVideoView } from '@/services/userStatsService';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const VideoPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [videoError, setVideoError] = useState(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  const { data: video, isLoading, error } = useQuery({
    queryKey: ['video', id],
    queryFn: () => getVideoById(id!),
    enabled: !!id,
    retry: false,
  });

  const { data: relatedVideos = [] } = useRelatedVideos(
    video?.id || '',
    video?.tags || [],
    15
  );

  const { mutate: addVideoToPlaylist } = useAddToPlaylist();
  const { data: reactionData, mutate: reactToVideo, isPending: reactionMutationPending } =
    useVideoReaction(video?.id || '');

  useEffect(() => {
    if (video?.id) {
      incrementViews(video.id).catch(() => {});
      // Only track for authenticated users with valid UUIDs (must be a real UUID format)
      const isValidUUID = user?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(user.id);
      if (isValidUUID) {
        trackVideoView(video.id, user.id).catch(err => {
          console.log("Video tracking error:", err);
        });
      }
    }
  }, [video?.id, user?.id]);

  // Fetch real subscriber count and subscription status
  useEffect(() => {
    const fetchSubscriberData = async () => {
      if (!video?.owner_id) return;

      try {
        // Get subscriber count
        const { count } = await supabase
          .from('subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('creator_id', video.owner_id);

        setSubscriberCount(count || 0);

        // Check if current user is subscribed
        if (user?.id) {
          const { data: subscription } = await supabase
            .from('subscriptions')
            .select('id')
            .eq('subscriber_id', user.id)
            .eq('creator_id', video.owner_id)
            .single();

          setIsSubscribed(!!subscription);
        }
      } catch (error) {
        console.error('Error fetching subscriber data:', error);
      }
    };

    fetchSubscriberData();
  }, [video?.owner_id, user?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-4">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-24"></div>
            <div className="aspect-video bg-muted rounded-lg"></div>
            <div className="h-8 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-4">
          <div className="text-center py-8">
            <h1 className="text-2xl font-bold mb-2">Video Not Found</h1>
            <p className="text-muted-foreground mb-4">
              {error?.message || "The video you're looking for doesn't exist or could not be loaded."}
            </p>
            <Link to="/" className="text-primary hover:underline">
              Go back to homepage
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const handleAddToPlaylist = (playlistId: string) => {
    if (video?.id) {
      addVideoToPlaylist({ playlistId, videoId: video.id });
      setIsPlaylistModalOpen(false);
    }
  };

  const handleShareVideo = () => {
    if (navigator.share) {
      navigator
        .share({
          title: video?.title,
          text: 'Check out this video on HubX',
          url: window.location.href,
        })
        .catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
    setIsShareModalOpen(false);
  };

  const handleReaction = (reactionType: 'like' | 'dislike') => {
    if (video?.id) {
      reactToVideo({ videoId: video.id, reactionType });
    }
  };

  const handleVideoError = () => {
    setVideoError(true);
    toast.error('Video failed to load. Please try refreshing the page.');
  };

  const handleVideoCanPlay = () => {
    setVideoError(false);
  };

  const handleSubscribe = async () => {
    if (!user) {
      alert('Please login to subscribe to creators');
      navigate('/auth');
      return;
    }

    if (!video?.owner_id) return;

    setIsSubscribing(true);

    try {
      if (isSubscribed) {
        // Unsubscribe
        const { error } = await supabase
          .from('subscriptions')
          .delete()
          .eq('subscriber_id', user.id)
          .eq('creator_id', video.owner_id);

        if (error) {
          console.error('Error unsubscribing:', error);
          alert('Failed to unsubscribe. Please try again.');
          return;
        }

        setIsSubscribed(false);
        setSubscriberCount(prev => prev - 1);
      } else {
        // Subscribe
        const { error } = await supabase
          .from('subscriptions')
          .insert({
            subscriber_id: user.id,
            creator_id: video.owner_id,
            created_at: new Date().toISOString()
          });

        if (error) {
          console.error('Error subscribing:', error);
          alert('Failed to subscribe. Please try again.');
          return;
        }

        setIsSubscribed(true);
        setSubscriberCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleProfileClick = () => {
    if (video?.profiles?.username) {
      navigate(`/profile/${video.profiles.username}`);
    } else if (video?.owner_id) {
      navigate(`/profile/${video.owner_id}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Ad right above player */}
      <div className="mb-2">
        <AdComponent zoneId="5660534" />
      </div>

      {/* Video Title above player */}
      <main className="container mx-auto px-4 pt-4">
        <h1 className="text-xl lg:text-2xl font-bold text-foreground leading-tight mb-4">
          {video.title || 'Untitled Video'}
        </h1>
      </main>

      {/* Full-width video player - YouTube size */}
      <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
        <div className="relative w-full">
          <div className="w-full bg-black" style={{ height: 'min(calc(100vw * 9/16), 720px)' }}>
            <VideoPlayer
              src={video.video_url}
              poster={video.thumbnail_url}
              onError={handleVideoError}
              onCanPlay={handleVideoCanPlay}
              videoId={video.id}
              videoTitle={video.title}
            />
          </div>
          {videoError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 text-white text-lg">
              Failed to load video.
            </div>
          )}
        </div>
      </div>

      {/* Video Info without title - super tight margin */}
      <main className="container mx-auto px-4 py-4 space-y-4">
        <VideoInfo
          title=""
          views={video.views}
          duration={video.duration}
          createdAt={video.created_at}
          onShare={() => setIsShareModalOpen(true)}
          video={video}
          reactionData={reactionData}
          onReaction={handleReaction}
          reactToVideo={reactToVideo}
          isReactionLoading={reactionMutationPending}
          reactionMutationPending={reactionMutationPending}
          showViewsAndDate={true}
          subscriberCount={subscriberCount}
          isSubscribed={isSubscribed}
          onSubscribe={handleSubscribe}
          onProfileClick={handleProfileClick}
          isSubscribing={isSubscribing}
        />

        <VideoDescription description={video.description} />

        {/* Second ad - closer to content */}
        <div className="my-3">
          <AdComponent zoneId="5660534" />
        </div>

        {/* Related videos */}
        <RelatedVideos
          videos={relatedVideos}
          currentVideo={video}
          videoId={video.id}
        />
      </main>

      {/* Playlist Modal */}
      <PlaylistModal
        isOpen={isPlaylistModalOpen}
        onClose={() => setIsPlaylistModalOpen(false)}
        onAdd={handleAddToPlaylist}
        video={video}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onShare={handleShareVideo}
        video={video}
      />
    </div>
  );
};

export default VideoPage;