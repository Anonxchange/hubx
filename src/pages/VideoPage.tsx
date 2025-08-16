import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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

const VideoPage = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const user = { id: 'user123' }; // Replace with real auth hook

  const [videoError, setVideoError] = useState(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

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
      if (user?.id) {
        trackVideoView(video.id, user.id);
      }
    }
  }, [video?.id, user?.id]);

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

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Ad right above player */}
      <div className="mb-2">
        <AdComponent zoneId="5660534" />
      </div>

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

      {/* Video Info - super tight margin */}
      <main className="container mx-auto px-4 py-4 space-y-4">
        <VideoInfo
          title={video.title}
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