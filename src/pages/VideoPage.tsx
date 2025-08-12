
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

const VideoPage = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  // ALL HOOKS MUST BE CALLED FIRST - BEFORE ANY EARLY RETURNS
  const [videoError, setVideoError] = useState(false);

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

  const { userReaction, reactToVideo, isLoading: reactionLoading } = useVideoReaction(video?.id || '');

  // useEffect hooks
  useEffect(() => {
    if (video?.id) {
      incrementViews(video.id).catch(() => {});
    }
  }, [video?.id]);

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Video Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <div className="relative">
              {/* Mobile: Full width without borders */}
              <div className="block md:hidden -mx-4 relative aspect-video bg-black">
                <VideoPlayer
                  src={video.video_url}
                  poster={video.thumbnail_url}
                  onError={handleVideoError}
                  onCanPlay={handleVideoCanPlay}
                />
              </div>

              {/* Desktop: Maintain card styling */}
              <Card className="hidden md:block overflow-hidden">
                <div className="relative aspect-video bg-black">
                  <VideoPlayer
                    src={video.video_url}
                    poster={video.thumbnail_url}
                    onError={handleVideoError}
                    onCanPlay={handleVideoCanPlay}
                  />
                </div>
              </Card>
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
                onShare={handleShare}
                video={video}
              />

              {/* Description */}
              <VideoDescription description={video.description} />
            </div>

            {/* Ad Code Above Comments */}
            <AdComponent zoneId="5660534" />

            {/* Comments */}
            <CommentSection videoId={video.id} />
          </div>

          {/* Sidebar - Related Videos */}
          <div>
            <RelatedVideos videos={relatedVideos} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default VideoPage;
