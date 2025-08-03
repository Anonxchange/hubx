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
import { Card } from '@/components/ui/card';
import { getVideoById, incrementViews } from '@/services/videosService';
import { useRelatedVideos } from '@/hooks/useVideos';
import { useVideoReaction } from '@/hooks/useVideoReactions';
import { toast } from 'sonner';

const VideoPage = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  
  const [videoError, setVideoError] = useState(false);

  const { data: video, isLoading, error } = useQuery({
    queryKey: ['video', id],
    queryFn: () => getVideoById(id!),
    enabled: !!id,
  });

  const { data: relatedVideos = [] } = useRelatedVideos(
    video?.id || '',
    video?.tags || [],
    15
  );

  const { userReaction, reactToVideo, isLoading: reactionLoading } = useVideoReaction(video?.id || '');

  useEffect(() => {
    if (video?.id) {
      incrementViews(video.id);
      // Invalidate and refetch video to get updated view count
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['video', id] });
      }, 1000);
    }
  }, [video?.id, id, queryClient]);

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
            <p className="text-muted-foreground mb-4">The video you're looking for doesn't exist.</p>
            <Link to="/" className="text-primary hover:underline">Go back to homepage</Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 space-y-8">
        {/* Ad Code */}
        <AdComponent zoneId="5660536" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Video Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <div className="relative">
              {/* Mobile: Full screen without borders */}
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
            </div>

            {/* Video Info */}
            <div className="space-y-4">
              <VideoInfo
                title={video.title}
                views={video.views}
                duration={video.duration}
                createdAt={video.created_at}
                onShare={handleShare}
              />

              {/* Like/Dislike Buttons */}
              <VideoReactions
                likes={video.likes}
                dislikes={video.dislikes}
                userReaction={userReaction as 'like' | 'dislike' | null}
                onReaction={handleReaction}
                isLoading={reactionLoading}
              />

              {/* Tags */}
              <VideoTags tags={video.tags} />

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