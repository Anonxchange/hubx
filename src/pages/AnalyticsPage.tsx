import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart, Eye, Heart, TrendingUp, Clock, Users, DollarSign, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { getUserStats } from '@/services/userStatsService';
import Header from '@/components/Header';

const AnalyticsPage = () => {
  const navigate = useNavigate();
  const { user, userType } = useAuth();
  const [analytics, setAnalytics] = useState({
    totalViews: 0,
    totalLikes: 0,
    totalVideos: 0,
    subscribers: 0,
    avgViewTime: 0,
    engagement: 0,
    topVideo: null
  });
  const [recentViews, setRecentViews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAnalyticsData();
    }
  }, [user]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Get user stats
      const stats = await getUserStats(user.id);
      
      // Get creator's videos with analytics
      const { data: videos, error: videosError } = await supabase
        .from('videos')
        .select('id, title, views, likes, created_at')
        .eq('owner_id', user.id)
        .order('views', { ascending: false });

      if (videosError) {
        console.error('Error fetching videos:', videosError);
      }

      // Get recent video views
      const { data: viewsData, error: viewsError } = await supabase
        .from('video_views')
        .select(`
          viewed_at,
          videos (title, views, likes)
        `)
        .order('viewed_at', { ascending: false })
        .limit(10);

      if (viewsError && viewsError.code !== 'PGRST116') {
        console.error('Error fetching video views:', viewsError);
      }

      // Calculate engagement rate
      const totalInteractions = stats.totalViews > 0 ? ((videos?.reduce((sum, v) => sum + (v.likes || 0), 0) || 0) / stats.totalViews * 100) : 0;

      setAnalytics({
        totalViews: stats.totalViews,
        totalLikes: videos?.reduce((sum, v) => sum + (v.likes || 0), 0) || 0,
        totalVideos: videos?.length || 0,
        subscribers: stats.subscribers,
        avgViewTime: stats.watchTimeMinutes / (stats.videosWatched || 1),
        engagement: totalInteractions,
        topVideo: videos?.[0] || null
      });

      setRecentViews(viewsData || []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || (userType !== 'individual_creator' && userType !== 'studio_creator')) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Card className="bg-gray-900 border-gray-800 text-white max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-red-400">Access Restricted</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Only creators can access analytics. Become a creator to view detailed performance metrics!</p>
            <Button className="w-full mt-4" onClick={() => navigate('/become-model')}>
              Become a Creator
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <BarChart className="w-12 h-12 mx-auto mb-4 text-blue-400 animate-pulse" />
              <p className="text-lg">Loading analytics...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
          <div className="flex items-center space-x-2">
            <BarChart className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Views</p>
                  <p className="text-2xl font-bold text-blue-400">{analytics.totalViews.toLocaleString()}</p>
                </div>
                <Eye className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Likes</p>
                  <p className="text-2xl font-bold text-red-400">{analytics.totalLikes.toLocaleString()}</p>
                </div>
                <Heart className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Videos</p>
                  <p className="text-2xl font-bold text-purple-400">{analytics.totalVideos}</p>
                </div>
                <BarChart className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Engagement</p>
                  <p className="text-2xl font-bold text-green-400">{analytics.engagement.toFixed(1)}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-gray-900 border-gray-800">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="audience">Audience</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5" />
                    <span>Performance Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Average View Time</span>
                    <span className="font-semibold">{analytics.avgViewTime.toFixed(1)} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Subscribers</span>
                    <span className="font-semibold">{analytics.subscribers.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Engagement Rate</span>
                    <span className="font-semibold text-green-400">{analytics.engagement.toFixed(1)}%</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Eye className="w-5 h-5" />
                    <span>Top Performing Video</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics.topVideo ? (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-white">{analytics.topVideo.title}</h4>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-blue-400">{analytics.topVideo.views?.toLocaleString()} views</span>
                        <span className="text-red-400">{analytics.topVideo.likes?.toLocaleString()} likes</span>
                      </div>
                      <p className="text-xs text-gray-400">
                        Published {new Date(analytics.topVideo.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-400">No videos found</p>
                      <Button className="mt-4" onClick={() => navigate('/upload')}>
                        Upload Your First Video
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="videos">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Video Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <h3 className="text-lg font-semibold mb-2">Video Analytics Coming Soon</h3>
                  <p className="text-gray-400">Detailed video performance metrics will be displayed here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audience">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Audience Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <h3 className="text-lg font-semibold mb-2">Audience Analytics Coming Soon</h3>
                  <p className="text-gray-400">Demographics and audience behavior data will be shown here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Revenue Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <h3 className="text-lg font-semibold mb-2">Revenue Data</h3>
                  <p className="text-gray-400 mb-4">
                    For detailed earnings information, visit your earnings dashboard
                  </p>
                  <Button onClick={() => navigate('/earnings')}>
                    View Earnings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AnalyticsPage;