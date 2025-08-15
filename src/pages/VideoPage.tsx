import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/Header';
import CommentSection from '@/components/CommentSection';
import AdComponent from '@/components/AdComponent';
import VideoPlayer from '@/components/VideoPlayer';
import VideoInfo from '@/components/VideoInfo';
import VideoReactions from '@/components/VideoReactions';
import VideoTags from '@/components/VideoTags';
import VideoDescription from '@/components/VideoDescription';
import RelatedVideos from '@/components/RelatedVideos';
import Recommended from '@/components/Recommended';
import { Card } from '@/components/ui/card';
import { getVideoById, incrementViews } from '@/services/videosService';
import { useRelatedVideos } from '@/hooks/useVideos';
import { useVideoReaction } from '@/hooks/useVideoReactions';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

// Import Playlist and Share related components and hooks
import PlaylistModal from '@/components/PlaylistModal';
import ShareModal from '@/components/ShareModal';
import { useAddToPlaylist } from '@/hooks/usePlaylists';
import { trackVideoView } from '@/services/userStatsService'; // Added trackVideoView

const VideoPage = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  // Mock user object for demonstration purposes. Replace with actual user authentication hook.
  const user = { id: 'user123' }; // Example user object

  // ALL HOOKS MUST BE CALLED FIRST - BEFORE ANY EARLY RETURNS
  const [videoError, setVideoError] = useState(false);

  // Playlist and Share state
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const { data: video, isLoading, error } = useQuery({
    queryKey: ['video', id],
    queryFn: () => getVideoById(id!),
    enabled: !!id,
    retry: false,
  });

  // These hooks must be called unconditionally, even if video is undefined
  const { data: relatedVideos = [] } = useRelatedVideos(
    video?.id || '',
    video?.tags || [],
    15
  );

  // Playlist hook
  const { mutate: addVideoToPlaylist, isPending: playlistLoading, isError: playlistError } = useAddToPlaylist();

  // Video reaction hook
  const { data: reactionData, mutate: reactToVideo, isPending: reactionMutationPending } = useVideoReaction(video?.id || '');

  // useEffect hooks
  useEffect(() => {
    if (video?.id) {
      incrementViews(video.id).catch(() => {});
      // Track video view if user is logged in and video is loaded
      if (user?.id) {
        trackVideoView(video.id, user.id);
      }
    }
  }, [video?.id, user?.id]);

  // NOW we can have early returns after all hooks have been called
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="animate-pulse space-y-6">
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
        <main className="container mx-auto px-4 py-6">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-2">Video Not Found</h1>
            <p className="text-muted-foreground mb-4">{error?.message || 'The video you\'re looking for doesn\'t exist or could not be loaded.'}</p>
            <Link to="/" className="text-primary hover:underline">Go back to homepage</Link>
          </div>
        </main>
      </div>
    );
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: video?.title,
          text: 'Check out this video on HubX',
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  // Handle adding video to playlist
  const handleAddToPlaylist = (playlistId: string) => {
    if (video?.id) {
      addVideoToPlaylist({ playlistId, videoId: video.id });
      setIsPlaylistModalOpen(false);
    }
  };

  // Handle sharing video via modal
  const handleShareVideo = () => {
    if (navigator.share) {
      navigator.share({
        title: video?.title,
        text: 'Check out this video on HubX',
        url: window.location.href,
      }).catch(console.error);
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

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Ad Code in Header - Same as homepage */}
      <AdComponent zoneId="5660534" />

      <main className="container mx-auto px-4 py-6 space-y-8">
        {/* Full Width Video Player */}
        <div className="w-full space-y-6">
          {/* Video Player */}
          <div className="relative">
            <div className="w-full aspect-video bg-black">
              <VideoPlayer
                src={video.video_url}
                poster={video.thumbnail_url}
                onError={handleVideoError}
                onCanPlay={handleVideoCanPlay}
              />
            </div>
            {videoError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 text-white text-lg">
                Failed to load video.
              </div>
            )}
          </div>

          {/* Video Info */}
          <div className="space-y-4">
            <VideoInfo
              title={video.title}
              views={video.views}
              duration={video.duration}
              createdAt={video.created_at}
              onShare={() => setIsShareModalOpen(true)} // Open share modal
              video={video}
              reactionData={reactionData}
              onReaction={handleReaction}
              reactToVideo={reactToVideo}
              isReactionLoading={reactionMutationPending}
              reactionMutationPending={reactionMutationPending}
            />

            {/* Description */}
            <VideoDescription description={video.description} />
          </div>

          {/* Ad Code */}
          <AdComponent zoneId="5660534" />
        </div>

        {/* Related Videos Section */}
        <div className="mt-8">
          <RelatedVideos videos={relatedVideos} currentVideo={video} videoId={video.id} />
        </div>
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