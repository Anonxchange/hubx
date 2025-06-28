
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Share, Clock, Video as VideoIcon } from 'lucide-react';
import Header from '@/components/Header';
import CommentSection from '@/components/CommentSection';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const VideoPage = () => {
  const { id } = useParams<{ id: string }>();
  const [views, setViews] = useState(1234567);

  // Mock video data
  const video = {
    id: id,
    title: 'Amazing Video Content - Full Experience',
    description: 'This is a detailed description of the video content. It includes information about what viewers can expect, the quality of the content, and any relevant details that enhance the viewing experience.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=800&h=450&fit=crop',
    duration: '12:34',
    tags: ['Premium', 'HD', 'Popular', 'Featured'],
    uploadDate: '2024-01-15',
    uploader: 'HubX Studios'
  };

  useEffect(() => {
    // Increment view count when video loads
    setViews(prev => prev + 1);
  }, [id]);

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
          title: video.title,
          text: 'Check out this video on HubX',
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      // You could show a toast notification here
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 space-y-8">
        {/* Back Button */}
        <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Video Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <Card className="overflow-hidden">
              <div className="relative aspect-video bg-black">
                <video
                  className="w-full h-full"
                  controls
                  poster={video.thumbnail}
                  preload="metadata"
                >
                  <source src={video.videoUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
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
                      {formatViews(views)} views
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {video.duration}
                    </span>
                    <span>Uploaded {formatDate(video.uploadDate)}</span>
                  </div>
                </div>
                
                <Button onClick={handleShare} variant="outline" size="sm">
                  <Share className="w-4 h-4 mr-2" />
                  Share
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
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {video.description}
                  </p>
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      By {video.uploader}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Comments */}
            <CommentSection videoId={video.id || '1'} />
          </div>

          {/* Sidebar - Related Videos */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Related Videos</h3>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Link key={i} to={`/video/${i + 10}`} className="block">
                  <Card className="hover:bg-muted/5 transition-colors">
                    <CardContent className="p-3">
                      <div className="flex space-x-3">
                        <div className="relative w-24 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
                          <img
                            src={`https://images.unsplash.com/photo-${1640000000000 + i}?w=100&h=60&fit=crop`}
                            alt={`Related video ${i}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                            {Math.floor(Math.random() * 20) + 5}:{String(Math.floor(Math.random() * 60)).padStart(2, '0')}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-2 mb-1">
                            Related Video Title {i}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {Math.floor(Math.random() * 1000)}K views
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VideoPage;
