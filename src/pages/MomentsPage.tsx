import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Heart, MessageCircle, Share, Bookmark, MoreVertical, Volume2, VolumeX } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getMoments } from '@/services/videosService';
import { useVideoReaction } from '@/hooks/useVideoReactions';
import { useAuth } from '@/contexts/AuthContext';
import { trackVideoView } from '@/services/userStatsService';

interface MomentVideo {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url?: string;
  duration: string;
  views: number;
  likes: number;
  dislikes: number;
  tags: string[];
  created_at: string;
  description?: string;
  is_moment?: boolean;  // Make sure this is included if using TypeScript
}

const MomentsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const startMomentId = searchParams.get('start');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [trackedViews, setTrackedViews] = useState<Set<string>>(new Set());
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch videos and filter only those where is_moment is true
  const { data: videosData, isLoading, error } = useQuery({
    queryKey: ['moments'],
    queryFn: () => getMoments(1, 50), // Use dedicated moments function
    staleTime: 1000 * 60 * 2, // Consider data fresh for 2 minutes
    cacheTime: 1000 * 60 * 10, // Cache for 10 minutes
    refetchOnWindowFocus: false, // Reduce unnecessary refetches
    refetchOnMount: true,
    refetchInterval: false, // Disable auto-refetch to save resources
  });

  // Debug logging
  console.log('Moments data:', videosData);
  console.log('Moments loading:', isLoading);
  console.log('Moments error:', error);

  // Get all moment videos
  const videos = videosData?.videos || [];

  // Set initial index based on start parameter
  useEffect(() => {
    if (startMomentId && videos.length > 0) {
      const startIndex = videos.findIndex(video => video.id === startMomentId);
      if (startIndex !== -1) {
        setCurrentIndex(startIndex);
        const container = containerRef.current;
        if (container) {
          container.scrollTo({
            top: startIndex * container.clientHeight,
            behavior: 'auto',
          });
        }
      }
    }
  }, [startMomentId, videos]);

  const { userReaction, reactToVideo } = useVideoReaction(videos[currentIndex]?.id || '');

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isScrolling = false;
    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      if (isScrolling) return;

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const scrollTop = container.scrollTop;
        const containerHeight = container.clientHeight;
        const newIndex = Math.round(scrollTop / containerHeight);

        if (newIndex !== currentIndex && newIndex >= 0 && newIndex < videos.length) {
          setCurrentIndex(newIndex);

          videoRefs.current.forEach((video, index) => {
            if (video) {
              if (index === newIndex) {
                video.currentTime = 0;
                if (isPlaying) video.play().catch(console.error);
              } else {
                video.pause();
              }
            }
          });
        }
        isScrolling = false;
      }, 150);

      isScrolling = true;
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [currentIndex, isPlaying, videos.length]);

  useEffect(() => {
    const currentVideo = videoRefs.current[currentIndex];
    if (currentVideo && isPlaying) {
      currentVideo.currentTime = 0;
      currentVideo.play().catch(console.error);
    }
  }, [currentIndex, isPlaying]);

  const handleVideoEnd = (index: number) => {
    if (index < videos.length - 1) {
      const container = containerRef.current;
      if (container) {
        container.scrollTo({
          top: (index + 1) * container.clientHeight,
          behavior: 'smooth',
        });
      }
    }
  };

  const togglePlayPause = () => {
    const currentVideo = videoRefs.current[currentIndex];
    if (currentVideo) {
      if (isPlaying) {
        currentVideo.pause();
        setIsPlaying(false);
      } else {
        currentVideo.play().catch(console.error);
        setIsPlaying(true);
      }
    }
  };

  const toggleMute = () => {
    videoRefs.current.forEach(video => {
      if (video) {
        video.muted = !isMuted;
      }
    });
    setIsMuted(!isMuted);
  };

  const handleVideoPlay = async (videoId: string) => {
    if (user && !trackedViews.has(videoId)) {
      try {
        await trackVideoView(user.id, videoId);
        setTrackedViews(prev => new Set(prev).add(videoId));
      } catch (error) {
        console.error('Error tracking video view:', error);
      }
    }
  };

  const handleReaction = (reactionType: 'like' | 'dislike') => {
    if (videos[currentIndex]?.id) {
      reactToVideo({ videoId: videos[currentIndex].id, reactionType });
    }
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-white text-lg">Loading Moments...</div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white">
        <h2 className="text-xl font-semibold mb-2">No Moments Available</h2>
        <p className="text-gray-400 mb-4">Check back later for new content</p>
        <Button onClick={() => navigate('/')} variant="outline" className="text-white border-white">
          Go Home
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div className="text-white font-semibold text-lg">
            Moments
            <Badge variant="secondary" className="ml-2 text-xs">
              BETA
            </Badge>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
          <MoreVertical className="w-5 h-5" />
        </Button>
      </div>

      {/* Video Container */}
      <div
        ref={containerRef}
        className="h-full overflow-y-auto snap-y snap-mandatory scrollbar-none"
        style={{ scrollBehavior: 'smooth' }}
      >
        {videos.map((video, index) => (
          <div key={video.id} className="relative w-full h-screen snap-start flex items-center justify-center">
            {/* Video */}
            <video
              ref={el => (videoRefs.current[index] = el)}
              className="absolute inset-0 w-full h-full object-cover"
              src={video.video_url}
              poster={video.thumbnail_url}
              loop
              muted={isMuted}
              playsInline
              onEnded={() => handleVideoEnd(index)}
              onPlay={() => handleVideoPlay(video.id)}
              onClick={togglePlayPause}
              style={{ 
                cursor: 'pointer',
                objectFit: 'cover',
                objectPosition: 'center'
              }}
            />

            {/* Overlay Content */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Play/Pause overlay */}
              {!isPlaying && index === currentIndex && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                    <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Bottom gradient */}
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/80 to-transparent" />

              {/* Right side actions */}
              <div className="absolute right-4 bottom-32 flex flex-col space-y-4 pointer-events-auto">
                {/* Profile */}
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{video.title.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">+</span>
                  </div>
                </div>

                {/* Like */}
                <div className="flex flex-col items-center space-y-1">
                  <Button
                    onClick={() => handleReaction('like')}
                    variant="ghost"
                    size="icon"
                    className={`w-12 h-12 rounded-full hover:bg-white/20 ${
                      userReaction === 'like' ? 'text-red-500' : 'text-white'
                    }`}
                  >
                    <Heart className={`w-7 h-7 ${userReaction === 'like' ? 'fill-current' : ''}`} />
                  </Button>
                  <span className="text-white text-xs font-medium">{formatCount(video.likes)}</span>
                </div>

                {/* Comment */}
                <div className="flex flex-col items-center space-y-1">
                  <Button variant="ghost" size="icon" className="w-12 h-12 rounded-full text-white hover:bg-white/20">
                    <MessageCircle className="w-7 h-7" />
                  </Button>
                  <span className="text-white text-xs font-medium">0</span>
                </div>

                {/* Share */}
                <div className="flex flex-col items-center space-y-1">
                  <Button variant="ghost" size="icon" className="w-12 h-12 rounded-full text-white hover:bg-white/20">
                    <Share className="w-7 h-7" />
                  </Button>
                  <span className="text-white text-xs font-medium">Share</span>
                </div>

                {/* Bookmark */}
                <div className="flex flex-col items-center space-y-1">
                  <Button variant="ghost" size="icon" className="w-12 h-12 rounded-full text-white hover:bg-white/20">
                    <Bookmark className="w-7 h-7" />
                  </Button>
                </div>

                {/* Sound toggle */}
                <div className="flex flex-col items-center space-y-1">
                  <Button
                    onClick={toggleMute}
                    variant="ghost"
                    size="icon"
                    className="w-12 h-12 rounded-full text-white hover:bg-white/20"
                  >
                    {isMuted ? <VolumeX className="w-7 h-7" /> : <Volume2 className="w-7 h-7" />}
                  </Button>
                </div>
              </div>

              {/* Bottom info */}
              <div className="absolute bottom-4 left-4 right-20 pointer-events-auto">
                <div className="space-y-3">
                  {/* Username */}
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-semibold">
                      @{video.title.replace(/\s+/g, '').toLowerCase().slice(0, 12)}
                    </span>
                    <div className="w-1 h-1 bg-white/60 rounded-full" />
                    <span className="text-white/80 text-sm">{formatCount(video.views)} views</span>
                  </div>

                  {/* Description */}
                  <p className="text-white text-sm leading-relaxed line-clamp-3">{video.description || video.title}</p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {video.tags.slice(0, 3).map((tag, tagIndex) => (
                      <Link
                        key={tagIndex}
                        to={`/category/${tag}`}
                        className="text-white/90 text-sm hover:text-primary"
                      >
                        #{tag}
                      </Link>
                    ))}
                  </div>

                  
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      
    </div>
  );
};

export default MomentsPage;