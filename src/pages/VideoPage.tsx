import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Share, Clock, Video as VideoIcon, ThumbsUp, ThumbsDown, Grid3X3, List } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/Header';
import CommentSection from '@/components/CommentSection';
import AdComponent from '@/components/AdComponent';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { getVideoById, incrementViews } from '@/services/videosService';
import { useRelatedVideos } from '@/hooks/useVideos';
import { useVideoReaction } from '@/hooks/useVideoReactions';
import { toast } from 'sonner';

const VideoPage = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
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

  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    }
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

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
        {/* Back Button */}
        <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        {/* Ad Code Below Back to Home */}
        <AdComponent zoneId="5660536" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Video Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <Card className="overflow-hidden">
              <div className="relative aspect-video bg-black">
                {videoError ? (
                  <div className="w-full h-full flex items-center justify-center text-white bg-gray-900">
                    <div className="text-center space-y-4">
                      <VideoIcon className="w-16 h-16 mx-auto opacity-50" />
                      <div>
                        <p className="text-lg font-medium">Video Error</p>
                        <p className="text-sm opacity-75">Unable to load video. Please try refreshing the page.</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => window.location.reload()}
                        >
                          Refresh Page
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <video
                    className="w-full h-full"
                    controls
                    poster={video.thumbnail_url || 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=800&h=450&fit=crop'}
                    preload="metadata"
                    playsInline
                    onError={handleVideoError}
                    onCanPlay={handleVideoCanPlay}
                  >
                    <source src={video.video_url} type="video/mp4" />
                    <source src={video.video_url} type="video/webm" />
                    <source src={video.video_url} type="video/ogg" />
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
            </Card>

            {/* Video Info */}
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-2xl lg:text-3xl font-bold mb-2">{video.title}</h1>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span className="flex items-center">
                      <VideoIcon className="w-4 h-4 mr-1" />
                      {formatViews(video.views)} views
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {video.duration}
                    </span>
                    <span>Uploaded {formatDate(video.created_at)}</span>
                  </div>
                </div>
                
                <Button onClick={handleShare} variant="outline" size="sm">
                  <Share className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>

              {/* Like/Dislike Buttons */}
              <div className="flex items-center space-x-4">
                <Button
                  onClick={() => handleReaction('like')}
                  variant={userReaction === 'like' ? 'default' : 'outline'}
                  size="sm"
                  disabled={reactionLoading}
                  className="flex items-center space-x-2"
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>{video.likes || 0}</span>
                </Button>
                
                <Button
                  onClick={() => handleReaction('dislike')}
                  variant={userReaction === 'dislike' ? 'default' : 'outline'}
                  size="sm"
                  disabled={reactionLoading}
                  className="flex items-center space-x-2"
                >
                  <ThumbsDown className="w-4 h-4" />
                  <span>{video.dislikes || 0}</span>
                </Button>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {video.tags.map((tag) => (
                  <Link key={tag} to={`/category/${tag.toLowerCase()}`}>
                    <Badge 
                      variant="secondary" 
                      className="hover:bg-primary/20 transition-colors cursor-pointer"
                    >
                      {tag}
                    </Badge>
                  </Link>
                ))}
              </div>

              {/* Description */}
              {video.description && (
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {video.description}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Ad Code Above Comments */}
            <AdComponent zoneId="5660536" />

            {/* Comments */}
            <CommentSection videoId={video.id} />
          </div>

          {/* Sidebar - Related Videos */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Related Videos</h3>
              <div className="flex items-center space-x-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-4' : 'space-y-3'}>
              {relatedVideos.map((relatedVideo) => (
                <Link key={relatedVideo.id} to={`/video/${relatedVideo.id}`} className="block">
                  <Card className="hover:bg-muted/5 transition-colors">
                    <CardContent className={`p-3 ${viewMode === 'list' ? 'flex space-x-3' : ''}`}>
                      <div className={`relative bg-muted rounded overflow-hidden flex-shrink-0 ${
                        viewMode === 'grid' ? 'aspect-video mb-3' : 'w-24 h-16'
                      }`}>
                        <img
                          src={relatedVideo.thumbnail_url || 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=200&h=120&fit=crop'}
                          alt={relatedVideo.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                          {relatedVideo.duration}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-medium line-clamp-2 mb-1 ${
                          viewMode === 'grid' ? 'text-sm' : 'text-xs'
                        }`}>
                          {relatedVideo.title}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {formatViews(relatedVideo.views)} views
                        </p>
                        {viewMode === 'grid' && (
                          <div className="flex items-center space-x-1 mt-1">
                            <ThumbsUp className="w-3 h-3" />
                            <span className="text-xs">{relatedVideo.likes || 0}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
              
              {relatedVideos.length === 0 && (
                <p className="text-muted-foreground text-sm">No related videos found</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VideoPage;
