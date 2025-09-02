
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, TrendingUp, Crown, Eye, ThumbsUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/Header';
import VideoCard from '@/components/VideoCard';
import OptimizedVideoGrid from '@/components/OptimizedVideoGrid';
import { supabase } from '@/integrations/supabase/client';

const FeaturedVideosPage = () => {
  const navigate = useNavigate();
  const [featuredVideos, setFeaturedVideos] = useState([]);
  const [trendingVideos, setTrendingVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedVideos();
  }, []);

  const fetchFeaturedVideos = async () => {
    setLoading(true);
    try {
      // Fetch featured videos (high view count and likes)
      const { data: featured, error: featuredError } = await supabase
        .from('videos')
        .select('*')
        .gte('views', 1000)
        .order('views', { ascending: false })
        .limit(12);

      if (featuredError) throw featuredError;

      // Fetch trending videos (recent with good engagement)
      const { data: trending, error: trendingError } = await supabase
        .from('videos')
        .select('*')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('likes', { ascending: false })
        .limit(12);

      if (trendingError) throw trendingError;

      setFeaturedVideos(featured || []);
      setTrendingVideos(trending || []);
    } catch (error) {
      console.error('Error fetching featured videos:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mr-4 text-white hover:bg-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center space-x-3">
            <Star className="w-8 h-8 text-yellow-400" />
            <h1 className="text-3xl font-bold">Featured Videos</h1>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Featured Videos</p>
                  <p className="text-2xl font-bold">{featuredVideos.length}</p>
                </div>
                <Crown className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Trending This Week</p>
                  <p className="text-2xl font-bold">{trendingVideos.length}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Views</p>
                  <p className="text-2xl font-bold">
                    {[...featuredVideos, ...trendingVideos]
                      .reduce((sum: number, video: any) => sum + (video.views || 0), 0)
                      .toLocaleString()}
                  </p>
                </div>
                <Eye className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="featured" className="space-y-6">
          <TabsList className="bg-gray-900 border-gray-800">
            <TabsTrigger value="featured" className="flex items-center space-x-2">
              <Crown className="w-4 h-4" />
              <span>Featured</span>
            </TabsTrigger>
            <TabsTrigger value="trending" className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Trending</span>
            </TabsTrigger>
            <TabsTrigger value="top-rated" className="flex items-center space-x-2">
              <ThumbsUp className="w-4 h-4" />
              <span>Top Rated</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="featured">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Crown className="w-5 h-5 text-yellow-400" />
                  <span>Featured Videos</span>
                  <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    {featuredVideos.length} videos
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="text-gray-400 mt-4">Loading featured videos...</p>
                  </div>
                ) : featuredVideos.length > 0 ? (
                  <OptimizedVideoGrid videos={featuredVideos} />
                ) : (
                  <div className="text-center py-12">
                    <Star className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                    <h3 className="text-lg font-semibold mb-2">No featured videos yet</h3>
                    <p className="text-gray-400">Featured videos will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trending">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <span>Trending This Week</span>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    {trendingVideos.length} videos
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="text-gray-400 mt-4">Loading trending videos...</p>
                  </div>
                ) : trendingVideos.length > 0 ? (
                  <OptimizedVideoGrid videos={trendingVideos} />
                ) : (
                  <div className="text-center py-12">
                    <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                    <h3 className="text-lg font-semibold mb-2">No trending videos this week</h3>
                    <p className="text-gray-400">Trending videos will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="top-rated">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ThumbsUp className="w-5 h-5 text-blue-400" />
                  <span>Top Rated Videos</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <ThumbsUp className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
                  <p className="text-gray-400">Top rated videos feature is coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FeaturedVideosPage;
