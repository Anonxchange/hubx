
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { TrendingUp, MapPin } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import OptimizedVideoGrid from '@/components/OptimizedVideoGrid';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getHottestByCountry, getUserCountry } from '@/services/videosService';
import type { Video } from '@/services/videosService';

const HottestPage = () => {
  const { country } = useParams<{ country: string }>();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [actualCountry, setActualCountry] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get user's actual country
        const userCountry = await getUserCountry();
        setActualCountry(userCountry);
        
        // Use country from URL or user's actual country
        const targetCountry = country || userCountry;
        const result = await getHottestByCountry(targetCountry);
        
        setVideos(result.videos || []);
      } catch (error) {
        console.error('Error fetching hottest videos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [country]);

  const displayCountry = country?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || actualCountry;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Hero Section */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <TrendingUp className="h-8 w-8 text-red-500" />
            <MapPin className="h-6 w-6 text-blue-500" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
            Hottest in {displayCountry}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Trending videos in your region with smart shuffle algorithm
          </p>
          <div className="flex justify-center space-x-2 mt-4">
            <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
              <TrendingUp className="h-3 w-3 mr-1" />
              Trending Now
            </Badge>
            <Badge variant="outline">
              Smart Shuffle Enabled
            </Badge>
          </div>
        </div>

        {/* Stats */}
        {!loading && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 rounded-lg p-6 border border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-red-600 dark:text-red-400" />
                <span className="font-medium text-red-700 dark:text-red-300">
                  {videos.length} trending videos found in {displayCountry}
                </span>
              </div>
              <Badge variant="outline" className="border-red-300 text-red-700 dark:border-red-700 dark:text-red-300">
                Auto-refreshed
              </Badge>
            </div>
          </div>
        )}

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

export default HottestPage;
