
import React, { useState, useEffect } from 'react';
import { TrendingUp, Flame, Eye, Heart } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import OptimizedVideoGrid from '@/components/OptimizedVideoGrid';
import AdComponent from '@/components/AdComponent';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getVideos } from '@/services/videosService';
import type { Video } from '@/services/videosService';

// Human behavior shuffle algorithm - mimics PornHub's approach
const humanBehaviorShuffle = (videos: Video[]): Video[] => {
  const now = Date.now();
  const hourMs = 60 * 60 * 1000;
  const dayMs = 24 * hourMs;
  const weekMs = 7 * dayMs;

  return videos
    .map(video => {
      const age = now - new Date(video.created_at).getTime();
      
      // Recency scoring (newer content gets higher priority)
      const recencyScore = Math.max(0, 1 - (age / weekMs)) * 0.3;
      
      // Engagement scoring (views + likes ratio)
      const engagementScore = Math.min(1, (video.views + video.likes * 10) / 50000) * 0.4;
      
      // Time-based boost (content performs differently at different times)
      const hour = new Date().getHours();
      const timeBoost = (hour >= 20 || hour <= 2) ? 0.1 : (hour >= 12 && hour <= 14) ? 0.05 : 0;
      
      // Random factor to ensure variety (human unpredictability)
      const randomFactor = Math.random() * 0.2;
      
      // Category diversity boost (prevents same category domination)
      const categoryDiversity = Math.random() * 0.1;

      const trendingScore = recencyScore + engagementScore + timeBoost + randomFactor + categoryDiversity;

      return {
        ...video,
        trendingScore,
        displayReason: getTrendingReason(recencyScore, engagementScore, timeBoost)
      };
    })
    .sort((a, b) => b.trendingScore - a.trendingScore);
};

const getTrendingReason = (recency: number, engagement: number, timeBoost: number): string => {
  if (timeBoost > 0) return 'Hot Right Now';
  if (recency > 0.2) return 'Recently Added';
  if (engagement > 0.3) return 'Most Popular';
  return 'Trending';
};

const TrendingPage = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalVideos, setTotalVideos] = useState(0);

  useEffect(() => {
    const fetchTrendingVideos = async () => {
      try {
        setLoading(true);
        
        // Fetch a larger set of videos to apply our shuffle algorithm
        const result = await getVideos(1, 100, 'trending'); // Get more videos for better shuffling
        const { videos: fetchedVideos, totalCount } = result;
        
        // Apply human behavior shuffle
        const shuffledVideos = humanBehaviorShuffle(fetchedVideos);
        
        // Take top 60 for display
        setVideos(shuffledVideos.slice(0, 60));
        setTotalVideos(totalCount || fetchedVideos.length);
      } catch (error) {
        console.error('Error fetching trending videos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingVideos();
    
    // Refresh trending every 10 minutes to simulate real-time updates
    const interval = setInterval(fetchTrendingVideos, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Hero Section */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <TrendingUp className="h-8 w-8 text-orange-500" />
            <Flame className="h-6 w-6 text-red-500" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
            Trending Now
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Most popular videos with intelligent human behavior shuffle algorithm
          </p>
          <div className="flex justify-center space-x-2 mt-4">
            <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
              <TrendingUp className="h-3 w-3 mr-1" />
              Live Trending
            </Badge>
            <Badge variant="outline">
              <Eye className="h-3 w-3 mr-1" />
              Human Behavior Algorithm
            </Badge>
            <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
              <Heart className="h-3 w-3 mr-1" />
              Auto-Refresh
            </Badge>
          </div>
        </div>

        {/* Homepage Style Ads */}
        <div className="space-y-4">
          {/* Top Ad Banner */}
          <div className="w-full flex justify-center">
            <div className="w-full max-w-4xl">
              <AdComponent zoneId="5660534" />
            </div>
          </div>
        </div>

        {/* Videos Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(12)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-video bg-muted"></div>
                <CardContent className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : videos.length > 0 ? (
          <OptimizedVideoGrid videos={videos} viewMode="grid" showAds={true} />
        ) : null}
      </main>

      <Footer />
    </div>
  );
};

export default TrendingPage;
